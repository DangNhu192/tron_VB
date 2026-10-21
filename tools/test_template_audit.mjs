import fs from 'fs';
import {
  buildSampleDataRow,
  generateSampleExcelFromTemplate,
  generateSampleDocxFromTemplate,
  generateGoogleSheetTemplate
} from '../js/services/excel-service.js';
import { extractTableDataFromDocx } from '../js/core/docx-xml.js';
import { checkTemplateBraces } from '../js/ui/modals.js';

console.log("=== KIEM TRA TOAN DIEN CHUC NANG RA SOAT MAU & TAO DU LIEU ===");

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
global.Blob = class {
  constructor(parts, opts) {
    this.parts = parts;
    this.type = opts?.type;
  }
};
global.URL = {
  createObjectURL: (blob) => 'blob:mock-url',
  revokeObjectURL: (url) => {}
};
try {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      clipboard: {
        writeText: async (text) => {
          global.copiedClipboardText = text;
          return true;
        }
      }
    },
    writable: true,
    configurable: true
  });
} catch(e) {
  globalThis.navigator.clipboard = {
    writeText: async (text) => {
      global.copiedClipboardText = text;
      return true;
    }
  };
}
global.chrome = {
  runtime: {
    sendMessage: (msg, cb) => {
      global.lastRuntimeMessage = msg;
      if (msg.action === 'autodocCreateGoogleSheet') {
        global.openedUrl = 'https://sheet.new';
        if (cb) cb({ success: true, tabId: 101 });
      }
    }
  },
  tabs: {
    create: ({ url }, cb) => {
      global.openedUrl = url;
      if (cb) cb({ id: 101, url });
    }
  }
};

let downloadedFiles = [];
global.document = {
  body: {
    appendChild: () => {},
    removeChild: () => {}
  },
  execCommand: (cmd) => true,
  createElement: (tag) => {
    if (tag === 'a') {
      return {
        href: '',
        download: '',
        click() {
          downloadedFiles.push(this.download);
        }
      };
    }
    if (tag === 'textarea') {
      return {
        value: '',
        style: {},
        setAttribute() {},
        select() {},
        setSelectionRange() {}
      };
    }
    return { style: {} };
  }
};

// TEST 1: buildSampleDataRow
console.log("\n[TEST 1] Kiem tra sinh dong du lieu mau thong minh...");
const headers = ['STT', 'Check DL', 'HO_TEN', 'SO_VB', 'NGAY_BAN_HANH', 'CHUC_VU', 'NOI_O', 'TIEN_LUONG'];
const sampleRow = buildSampleDataRow(headers);
console.log("Headers:", headers);
console.log("Sample Row:", sampleRow);
if (sampleRow[0] === '1' && sampleRow[1] === 'TRUE' && sampleRow[2] === 'Nguyễn Văn A' && sampleRow[3] === '123/UBND-VP') {
  console.log("=> PASS TEST 1: Sinh dong mau thong minh chinh xac!");
} else {
  console.error("=> FAIL TEST 1!");
  process.exit(1);
}

// TEST 2: checkTemplateBraces
console.log("\n[TEST 2] Kiem tra bat loi cu phap ngoac nhon trong mau Word...");
const textWithErrors = "Kính gửi {TEN_CO_SO}, căn cứ quyết định {{SO_QUYET_DINH}} ngày {NGAY và {{NGAY_CAP}}";
const warnings = checkTemplateBraces(textWithErrors);
console.log("Phat hien canh bao:", warnings.length);
warnings.forEach(w => console.log(` - [${w.title}]: ${w.msg}`));

// Test loại trừ GUID hệ thống (ví dụ: {909E8E84-426E-40DD-AFC4-6F175D3DCCD1})
const textWithGuid = "Văn bản chuẩn {{SO_VB}} có chứa GUID Word {909E8E84-426E-40DD-AFC4-6F175D3DCCD1} và mã {PAGE}";
const guidWarnings = checkTemplateBraces(textWithGuid);
if (guidWarnings.length === 0 && warnings.length > 0) {
  console.log("=> PASS TEST 2: Nhận diện biến lỗi {..} chính xác và BỎ QUA thành công mã GUID / mã trường Word!");
} else {
  console.error("=> FAIL TEST 2: Chưa xử lý đúng bộ lọc GUID hoặc không bắt được lỗi!");
  process.exit(1);
}

// TEST 3: generateSampleExcelFromTemplate
console.log("\n[TEST 3] Kiem tra tao file Excel mau (.xlsx)...");
const varList = ['TEN_DOANH_NGHIEP', 'SO_GIAY_PHEP', 'NGAY_HET_HAN', 'DIA_CHI'];
generateSampleExcelFromTemplate(varList, { templateName: 'Mau_Thong_Bao.docx' });
console.log("File Excel da tai:", downloadedFiles[downloadedFiles.length - 1]);
if (downloadedFiles[downloadedFiles.length - 1].startsWith('Du_Lieu_Mau_Mau_Thong_Bao') && downloadedFiles[downloadedFiles.length - 1].endsWith('.xlsx')) {
  console.log("=> PASS TEST 3: Xuat file Excel mau thanh cong!");
} else {
  console.error("=> FAIL TEST 3!");
  process.exit(1);
}

// TEST 4: generateSampleDocxFromTemplate
console.log("\n[TEST 4] Kiem tra tao file Word bang mau (.docx)...");
generateSampleDocxFromTemplate(varList, { templateName: 'Mau_Thong_Bao.docx' });
console.log("File Word da tai:", downloadedFiles[downloadedFiles.length - 1]);
if (downloadedFiles[downloadedFiles.length - 1].startsWith('Bang_Du_Lieu_Mau_Mau_Thong_Bao') && downloadedFiles[downloadedFiles.length - 1].endsWith('.docx')) {
  console.log("=> PASS TEST 4: Xuat file Word bang mau thanh cong!");
} else {
  console.error("=> FAIL TEST 4!");
  process.exit(1);
}

// TEST 5: generateGoogleSheetTemplate
console.log("\n[TEST 5] Kiem tra tao Google Sheet moi (Clipboard TSV + sheet.new)...");
await generateGoogleSheetTemplate(varList);
console.log("URL da mo:", global.openedUrl);
console.log("Noi dung clipboard TSV:\n" + global.copiedClipboardText);
if (global.openedUrl === 'https://sheet.new' && global.copiedClipboardText.includes('STT\tCheck DL\tTEN_DOANH_NGHIEP')) {
  console.log("=> PASS TEST 5: Sao chep clipboard va mo Google Sheet thanh cong!");
} else {
  console.error("=> FAIL TEST 5!");
  process.exit(1);
}

console.log("\n=======================================================");
console.log("=== TAT CA CAC TEST RA SOAT MAU DEU HOAN HAO 100%! ===");
console.log("=======================================================\n");
