import fs from 'fs';
import path from 'path';

console.log("=== KIEM TRA TOAN DIEN AUTODOC PRO v2.0 ===");

const requiredFiles = [
  'manifest.json',
  'background.js',
  'worker.js',
  'app.html',
  'sidepanel.html',
  'css/app.css',
  'js/app.js',
  'js/core/constants.js',
  'js/core/charset.js',
  'js/core/docx-xml.js',
  'js/core/storage.js',
  'js/services/excel-service.js',
  'js/services/google-sheets.js',
  'js/services/file-system.js',
  'js/services/worker-client.js',
  'js/ui/toast.js',
  'js/ui/theme.js',
  'js/ui/preview-table.js',
  'js/ui/modals.js'
];

let allExist = true;
for (const f of requiredFiles) {
  if (fs.existsSync(f)) {
    const size = fs.statSync(f).size;
    console.log(`[PASS] ${f} (${size} bytes)`);
  } else {
    console.error(`[FAIL] Thieu file: ${f}`);
    allExist = false;
  }
}

if (!allExist) {
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
console.log(`Manifest Version: ${manifest.manifest_version}, Extension Version: ${manifest.version}`);
if (manifest.version !== '2.0') {
  console.error(`[FAIL] Phiên bản extension phải là 2.0, hiện là ${manifest.version}`);
  process.exit(1);
}
if (!manifest.permissions.includes('sidePanel')) {
  console.error('[FAIL] manifest.json thieu permission sidePanel');
  process.exit(1);
}
if (!manifest.side_panel || manifest.side_panel.default_path !== 'sidepanel.html') {
  console.error('[FAIL] manifest.json thieu side_panel.default_path');
  process.exit(1);
}
console.log('[PASS] manifest.json cau hinh sidePanel chinh xac.');

import { 
  vniToUnicode, 
  tcvn3ToUnicode, 
  detectTextEncoding, 
  removeVietnameseTones, 
  sanitizeFilename 
} from '../js/core/charset.js';

const testVni = "Co\u00e4ng ho\u00f8a xa\u00f5 ho\u00e4i";
const convertedVni = vniToUnicode(testVni);
console.log(`VNI Convert: "${testVni}" -> "${convertedVni}"`);

const noTones = removeVietnameseTones("Nguyen Van A - Giay Phep Moi Truong");
console.log(`Remove tones: ${noTones}`);
if (noTones !== "Nguyen_Van_A_Giay_Phep_Moi_Truong") {
  console.error("[FAIL] removeVietnameseTones khong khop");
  process.exit(1);
}

const sanitized = sanitizeFilename("Bao cao: Dot 1 / Nam 2026?*");
console.log(`Sanitize filename: ${sanitized}`);
if (sanitized.includes(":") || sanitized.includes("/") || sanitized.includes("?")) {
  console.error("[FAIL] sanitizeFilename khong loai bo ky tu cam");
  process.exit(1);
}

console.log("\n=== TAT CA CAC BUOC KIEM TRA DEU THANH CONG! ===");
