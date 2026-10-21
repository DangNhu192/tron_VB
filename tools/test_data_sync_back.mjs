import fs from 'fs';
import {
  isDataModified,
  buildUpdatedExcelBuffer,
  buildUpdatedDocxTableBuffer
} from '../js/services/excel-service.js';
import { extractTableDataFromDocx } from '../js/core/docx-xml.js';

console.log("=== KIEM TRA CHUC NANG LUU NGUOC DU LIEU VE NGUON GOC ===");

// Setup environment mocks
const xlsxCode = fs.readFileSync('libs/xlsx.full.min.js', 'utf8');
const pizzipCode = fs.readFileSync('libs/pizzip.min.js', 'utf8');
const xmldomCode = fs.readFileSync('libs/xmldom.min.js', 'utf8');

const ctx = { window: {} };
const runXlsx = new Function('window', xlsxCode + '; return window.XLSX;');
const XLSX = runXlsx(ctx.window);

const runPizZip = new Function('window', pizzipCode + '; return window.PizZip;');
const PizZip = runPizZip(ctx.window);

const runXmlDom = new Function('window', xmldomCode + '; return window.DOMParser;');
const DOMParser = runXmlDom(ctx.window);

global.window = { XLSX, PizZip, DOMParser };
global.XLSX = XLSX;
global.PizZip = PizZip;
global.DOMParser = DOMParser;

// TEST 1: isDataModified
console.log("\n[TEST 1] Kiem tra phat hien chinh sua / them moi / xoa du lieu (isDataModified)...");
const originalData = [
  { STT: '1', Check_DL: 'TRUE', HO_TEN: 'Nguyễn Văn A', SO_TIEN: '1,000,000' },
  { STT: '2', Check_DL: 'TRUE', HO_TEN: 'Trần Thị B', SO_TIEN: '2,000,000' }
];

// Khong sua
const sameData = [
  { STT: '1', Check_DL: 'TRUE', HO_TEN: 'Nguyễn Văn A', SO_TIEN: '1,000,000' },
  { STT: '2', Check_DL: 'TRUE', HO_TEN: 'Trần Thị B', SO_TIEN: '2,000,000' }
];
if (isDataModified(originalData, sameData) === false) {
  console.log("  ✓ Du lieu giong nhau: nhan dien false chinh xac.");
} else {
  console.error("  ✗ Fail: du lieu giong nhau bao true.");
  process.exit(1);
}

// Co sua 1 o
const editedCellData = [
  { STT: '1', Check_DL: 'TRUE', HO_TEN: 'Nguyễn Văn A', SO_TIEN: '1,500,000' },
  { STT: '2', Check_DL: 'TRUE', HO_TEN: 'Trần Thị B', SO_TIEN: '2,000,000' }
];
if (isDataModified(originalData, editedCellData) === true) {
  console.log("  ✓ Sua noi dung o: nhan dien true chinh xac.");
} else {
  console.error("  ✗ Fail: sua o khong nhan dien.");
  process.exit(1);
}

// Them dong moi
const addedRowData = [
  ...originalData,
  { STT: '3', Check_DL: 'TRUE', HO_TEN: 'Lê Văn C', SO_TIEN: '3,000,000' }
];
if (isDataModified(originalData, addedRowData) === true) {
  console.log("  ✓ Them dong moi: nhan dien true chinh xac.");
} else {
  console.error("  ✗ Fail: them dong khong nhan dien.");
  process.exit(1);
}

// Xoa dong
const deletedRowData = [originalData[0]];
if (isDataModified(originalData, deletedRowData) === true) {
  console.log("  ✓ Xoa bot dong: nhan dien true chinh xac.");
} else {
  console.error("  ✗ Fail: xoa dong khong nhan dien.");
  process.exit(1);
}
console.log("=> PASS TEST 1!");

// TEST 2: buildUpdatedExcelBuffer
console.log("\n[TEST 2] Kiem tra dong goi lai file Excel cap nhat (buildUpdatedExcelBuffer)...");
const headers = ['STT', 'Check_DL', 'HO_TEN', 'SO_TIEN'];
const excelBuffer = buildUpdatedExcelBuffer(null, 'BangDuLieu', headers, addedRowData);
if (excelBuffer && (excelBuffer.byteLength > 0 || excelBuffer.length > 0)) {
  const zip = new PizZip(excelBuffer);
  const sheetXml = zip.file('xl/worksheets/sheet1.xml')?.asText() || '';
  if (sheetXml.includes('Lê Văn C') && sheetXml.includes('Nguyễn Văn A') && sheetXml.includes('3,000,000')) {
    console.log("  ✓ Excel buffer XML hop le, chua day du du lieu tieng Viet: 'Lê Văn C', 'Nguyễn Văn A', '3,000,000'.");
    console.log("=> PASS TEST 2!");
  } else {
    console.error("  ✗ Fail: doc noi dung Excel cap nhat khong dung.", sheetXml);
    process.exit(1);
  }
} else {
  console.error("  ✗ Fail: excelBuffer rong.");
  process.exit(1);
}

// TEST 3: buildUpdatedDocxTableBuffer
console.log("\n[TEST 3] Kiem tra dong goi lai bang Word cap nhat (buildUpdatedDocxTableBuffer)...");
const docxBuffer = buildUpdatedDocxTableBuffer(headers, addedRowData, 'BANG DU LIEU DA CAP NHAT');
if (docxBuffer && (docxBuffer.byteLength > 0 || docxBuffer.length > 0)) {
  const parsedDocxRows = extractTableDataFromDocx(docxBuffer);
  if (parsedDocxRows.length === 3 && parsedDocxRows[2].HO_TEN === 'Lê Văn C') {
    console.log(`  ✓ Word buffer hop le, trich xuat duoc ${parsedDocxRows.length} dong tu bang Word, dong moi: "${parsedDocxRows[2].HO_TEN}".`);
    console.log("=> PASS TEST 3!");
  } else {
    console.error("  ✗ Fail: trich xuat bang Word cap nhat khong dung.", parsedDocxRows);
    process.exit(1);
  }
} else {
  console.error("  ✗ Fail: docxBuffer rong.");
  process.exit(1);
}

console.log("\n=======================================================");
console.log("=== TAT CA TEST DONG BO LUU NGUOC DU LIEU DEU PASS! ===");
console.log("=======================================================\n");
