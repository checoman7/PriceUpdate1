import * as XLSX from "xlsx";
import * as fs from "fs";

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
    .filter((value: undefined) => value !== undefined);
  return columnData;
}

export function createCsvFile(data: string[], filePath: string): void {
  // Simplemente escribir las líneas directamente al archivo
  // Ya que ahora los datos vienen formateados correctamente desde example.spec.ts
  const csvContent = data.join("\n");
  fs.writeFileSync(filePath, csvContent);

  // Log para verificar que se escribió correctamente
  console.log(`File saved successfully at: ${filePath}`);
  console.log(`Total rows written: ${data.length}`);
}
