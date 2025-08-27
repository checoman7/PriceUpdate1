import { test } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { readExcelColumn, createCsvFile } from "../utils/ExcelUtils";

interface ProductData {
  sku: string;
  productName: string;
  price: string;
  listPrice: string;
  weight: string;
  calculatedPrice: string;
}

test("Extraer Precios", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const productsArray: ProductData[] = [];
  const SKUS = await readExcelColumn("data/breaks-ifi-40.csv", "SKU");

  await loginPage.navigateToLogin();
  await loginPage.login(
    process.env.LOGIN_EMAIL || "",
    process.env.LOGIN_PASSWORD || ""
  );

  for (const sku of SKUS) {
    console.log(`Processing SKU: ${sku}`);
    try {
      await page.goto(`https://shop.tvh.com/en-us/products/TSA/${sku}`, {
        waitUntil: "networkidle",
      });

      // Esperar a que la página cargue completamente
      await page.waitForLoadState("domcontentloaded");

      // Obtener precio con mejor manejo de errores
      let price = "N/A";
      try {
        const priceElement = await page.waitForSelector(
          "//div[@class='tss-1v9lp4-ProductDetailPageInfoLayout-prices']//span/span/span",
          { timeout: 15000, state: "visible" }
        );
        price = (await priceElement.textContent()) || "N/A";
      } catch (e) {
        console.log(`No price found for SKU: ${sku}`);
      }

      // Obtener nombre del producto con mejor manejo de errores
      let productName = "N/A";
      try {
        const productNameElement = await page.waitForSelector(
          "//*[@class='tss-rmzp3j-ProductDetailPageInfoLayout-productNumber']/following-sibling::div",
          { timeout: 10000, state: "visible" }
        );
        productName = (await productNameElement.textContent())?.trim() || "N/A";
      } catch (e) {
        console.log(`No product name found for SKU: ${sku}`);
      }

      // Obtener list price con mejor manejo de errores
      let listPrice = "N/A";
      try {
        const listPriceElement = await page.waitForSelector(
          "//*[contains(text(),'List price')]",
          { timeout: 10000, state: "visible" }
        );
        const listPriceText = (await listPriceElement.textContent()) || "";
        if (listPriceText.includes("$")) {
          listPrice = `$${listPriceText.split("$")[1].trim()}`;
        }
      } catch (e) {
        console.log(`No list price found for SKU: ${sku}`);
      }

      // Obtener peso con mejor manejo de errores
      let weight = "N/A";
      try {
        const weightElement = await page.waitForSelector(
          "//span[text()='Weight (lbs)']/../..//span[not(contains(text(), 'Weight (lbs)'))]",
          { timeout: 10000, state: "visible" }
        );
        weight = (await weightElement.textContent())?.trim() || "N/A";
      } catch (e) {
        console.log(`No weight found for SKU: ${sku}`);
      }

      // Calcular precio con mejor manejo de errores
      let calculatedPrice = "N/A";
      if (price !== "N/A") {
        const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
        if (!isNaN(numericPrice)) {
          calculatedPrice = `$${(numericPrice * 1.7).toFixed(2)}`;
        }
      }

      // Agregar producto al array
      productsArray.push({
        sku,
        productName,
        price,
        listPrice,
        weight,
        calculatedPrice,
      });

      console.log(`Successfully processed SKU: ${sku}`);
    } catch (error) {
      console.error(`Error processing SKU ${sku}:`, error);
      productsArray.push({
        sku,
        productName: "N/A",
        price: "N/A",
        listPrice: "N/A",
        weight: "N/A",
        calculatedPrice: "N/A",
      });
    }
  }

  // Guardar resultados en CSV con manejo de caracteres especiales
  const headers = [
    "SKU",
    "Product Name",
    "Price",
    "List Price",
    "Weight",
    "Calculated Price (1.7x)",
  ];
  const rows = productsArray.map((item) =>
    [
      item.sku,
      `"${item.productName.replace(/"/g, '""')}"`, // Escapar comillas en nombres de productos
      item.price,
      item.listPrice,
      item.weight,
      item.calculatedPrice,
    ].join(",")
  );

  createCsvFile([headers.join(","), ...rows], "data/prices.csv");

  // Imprimir resumen
  console.log("\n=== Processing Summary ===");
  console.log(`Total items processed: ${productsArray.length}`);
  console.log(`Total SKUs in input: ${SKUS.length}`);
});
