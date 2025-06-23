import * as XLSX from "xlsx"; // Necesitas instalar la librería 'xlsx' usando el comando: npm install xlsx
import * as fs from "fs"; // Asegúrate de tener el módulo 'fs' disponible

export function readExcelColumn(filePath: string, columnName: string): any[] {
  const workbook = XLSX.readFile(filePath, { codepage: 65001 });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data: any = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const columnIndex = data[0].indexOf(columnName);
  if (columnIndex === -1) {
    throw new Error(`Column ${columnName} not found`);
  }

  const columnData = data
    .slice(1)
    .map((row: any[]) => row[columnIndex])
    .filter((value: undefined) => value !== undefined); // Filtrar valores indefinidos
  return columnData;
}

// BEGIN: abpxx6d04wxr

export function createCsvFile(data: string[], filePath: string): void {
  const formattedData = data.map((item) => {
    const [skuPart, pricePart] = item.split(", ");
    const sku = skuPart.split(": ")[1];
    const price = pricePart.split(": ")[1];
    return `${sku},${price}`; // Formato CSV
  });

  const csvContent = ["SKU,Price", ...formattedData].join("\n"); // Encabezados y contenido
  fs.writeFileSync(filePath, csvContent); // Escribir en archivo CSV
}
