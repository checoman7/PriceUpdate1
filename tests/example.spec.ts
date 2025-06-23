import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { readExcelColumn, createCsvFile } from "../utils/ExcelUtils";

const pricesArray: { sku: string; price: string | null }[] = []; // Global array to store SKU and price

test("has title", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigateToLogin();
  let SKUS = await readExcelColumn("data/breaks-ifi.csv", "SKU");

  const email = process.env.LOGIN_EMAIL || "";
  const password = process.env.LOGIN_PASSWORD || "";

  await loginPage.login(email || "", password || ""); // Provide default empty string if undefined
  for (const sku of SKUS) {
    let errorMessageVisible = false;
    let price: string | null = null;

    // Try to find the product first
    await page.goto(`https://shop.tvh.com/en-us/products/TSA/${sku}`);
    price = await page
      .locator(
        "//div[@class='tss-1v9lp4-ProductDetailPageInfoLayout-prices']//span/span/span"
      )
      .waitFor({ state: "visible", timeout: 15000 }) // Wait for up to 15 seconds
      .then(() =>
        page
          .locator(
            "//div[@class='tss-1v9lp4-ProductDetailPageInfoLayout-prices']//span/span/span"
          )
          .textContent()
      )
      .catch(() => null); // Return null if the locator is not found
    // If price is not found, check for error message
    if (!price) {
      console.log(`SKU: ${sku} not found, skipping to next.`);
    }

    if (price) {
      // Log the SKU and price
      pricesArray.push({ sku, price }); // Push SKU and price to the global array
    }
  }
  createCsvFile(
    pricesArray.map((item) => `SKU: ${item.sku}, Price: ${item.price}`),
    "data/prices.xlsx"
  );
});
