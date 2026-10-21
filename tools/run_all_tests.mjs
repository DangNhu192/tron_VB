import { execSync } from 'child_process';

const testSuites = [
  { name: 'XLSX Unicode Source Preservation', script: 'tools/test_xlsx_text.mjs' },
  { name: 'File Structure & Charset Verification', script: 'tools/verify_all.mjs' },
  { name: 'Unicode Normalization Regression', script: 'tools/test_unicode_normalization.mjs' },
  { name: 'JS Syntax & Libs Integrity Check', script: 'tools/audit_syntax.mjs' },
  { name: 'Web Worker & All 4 Export Modes', script: 'tools/test_worker_vm.js' },
  { name: 'Template Audit & Sample Generators', script: 'tools/test_template_audit.mjs' },
  { name: 'Data Modification & Sync Back to Source', script: 'tools/test_data_sync_back.mjs' },
  { name: 'Word DOCX Generation & XML Table Parsing', script: 'tools/test_docx_gen.mjs' },
  { name: 'HTML & DOM ID Consistency Audit', script: 'tools/check_dom_ids.mjs' }
];

console.log('================================================================');
console.log('   BÁO CÁO KIỂM THỬ TOÀN DIỆN AUTODOC PRO v2.0 CHROME EXTENSION');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

for (const suite of testSuites) {
  process.stdout.write(`Đang kiểm tra: ${suite.name}... `);
  try {
    execSync(`node "${suite.script}"`, { stdio: 'pipe' });
    console.log('[PASS ✓]');
    passCount++;
  } catch (err) {
    console.log('[FAIL ✗]');
    console.error('Chi tiết lỗi:', err.stdout ? err.stdout.toString() : err.message);
    failCount++;
  }
}

console.log('\n================================================================');
console.log(`TỔNG KẾT: ${passCount}/${testSuites.length} BỘ KIỂM THỬ VƯỢT QUA.`);
if (failCount === 0) {
  console.log('KẾT QUẢ: Các bộ kiểm thử tự động đã chạy đều đạt.');
} else {
  console.log(`CẢNH BÁO: Còn ${failCount} bài test thất bại.`);
}
console.log('================================================================');
process.exitCode = failCount ? 1 : 0;
