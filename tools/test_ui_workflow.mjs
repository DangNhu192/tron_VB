import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { readCsvInSheetTab } from '../js/services/sheet-transport.js';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch {
  const bundled = process.env.CODEX_NODE_MODULES || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
  playwright = require(path.join(bundled, 'playwright'));
}
const root = process.cwd();
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
  try { res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await playwright.chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1366, height: 960 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.addInitScript(() => {
    const Native = window.Worker;
    window.Worker = class extends Native {
      postMessage(payload) { window.lastExportJob = structuredClone(payload); super.postMessage(payload); }
    };
  });
  let chooserCount = 0;
  let chooserDone;
  page.on('filechooser', chooser => { chooserCount++; chooserDone = chooser.setFiles([]).catch(() => {}); });
  const expectOnePicker = async action => {
    const before = chooserCount;
    await Promise.all([page.waitForEvent('filechooser'), action()]);
    await chooserDone;
    await page.evaluate(() => new Promise(requestAnimationFrame));
    assert.equal(chooserCount - before, 1, 'Exactly one picker per action');
  };
  await page.goto(`${base}/app.html`);
  await page.locator('.file-drop[role="button"]').first().waitFor({ state: 'attached' });
  await page.locator('[data-view="viewWorkspace"]').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#viewTemplates').evaluate(el => el.classList.contains('active')), true, 'Arrow keys switch navigation tabs');
  await page.keyboard.press('ArrowLeft');
  await page.locator('#srcUploadBtn').click();
  for (const id of ['docTemplateDropZone', 'excelDropZone']) {
    await expectOnePicker(() => page.locator(`#${id}`).click());
  }
  await page.locator('#excelDropZone').focus();
  await expectOnePicker(() => page.keyboard.press('Enter'));
  await page.locator('[data-view="viewData"]').click();
  await page.locator('#dataSrcLocalBtn').click();
  await page.evaluate(() => { window.showOpenFilePicker = async () => { throw new DOMException('Cancelled', 'AbortError'); }; });
  const beforeCancel = chooserCount;
  await page.locator('#dataLocalPickBtn').click();
  await page.waitForFunction(() => !document.getElementById('dataLocalPickBtn').disabled);
  assert.equal(chooserCount, beforeCancel, 'Cancel must not open another picker');
  await page.evaluate(() => { window.showOpenFilePicker = undefined; });
  await expectOnePicker(() => page.locator('#dataLocalPickBtn').click());

  await page.locator('[data-view="viewWorkspace"]').click();
  const fixtures = await page.evaluate(() => {
    const zip = new PizZip();
    zip.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{{Họ tên}}</w:t></w:r></w:p><w:sectPr/></w:body></w:document>');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Họ tên'], ['Nguyễn Văn Bé'], ['Nguyễn Thị Hồng'], ['Lê Quốc Hùng']]), 'Dữ liệu');
    return { docx: [...zip.generate({ type: 'uint8array' })], xlsx: [...new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx', bookSST: true }))] };
  });
  await page.locator('#docTemplate').setInputFiles({ name: 'Mau.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from(fixtures.docx) });
  await page.locator('#excelData').setInputFiles({ name: 'DuLieu.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(fixtures.xlsx) });
  await page.waitForFunction(() => window.dataContext?.fullData?.length === 3);
  await page.locator('#processBtn').click();
  await page.locator('#dataPreviewModal.is-open').waitFor();
  assert.equal(await page.locator('#selectAllPreviewRows').count(), 1, 'No duplicate select-all ID');
  await page.locator('.preview-row[data-row-idx="2"] .preview-input').evaluate(input => {
    const data = new DataTransfer();
    data.setData('text/plain', '  Lê Quốc Hùng  \n');
    input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  assert.equal(await page.locator('.preview-row[data-row-idx="2"] .preview-input').inputValue(), '  Lê Quốc Hùng  ', 'Paste preserves original spaces');
  await page.locator('.preview-row[data-row-idx="0"] .row-select-checkbox').uncheck();
  await page.locator('#previewSearchInput').fill('Thị Hồng');
  await page.waitForFunction(() => document.querySelectorAll('.preview-row').length === 1);
  const singleInput = page.locator('.preview-row .preview-input');
  await singleInput.fill('Nguyễn Thị Hồng đã sửa');
  await page.locator('#previewSearchInput').fill('');
  await page.waitForFunction(() => document.querySelectorAll('.preview-row').length === 3);
  assert.equal(await page.locator('.preview-row[data-row-idx="0"] .row-select-checkbox').isChecked(), false, 'Selection persists through filtering');
  assert.equal(await page.locator('#selectAllPreviewRows').evaluate(el => el.indeterminate), true, 'Select-all displays partial selection');
  assert.equal(await page.locator('.preview-row[data-row-idx="1"] .preview-input').inputValue(), 'Nguyễn Thị Hồng đã sửa', 'Edits use live state');
  await page.locator('#previewSearchInput').fill('đã sửa');
  await page.locator('.btn-export-single').click();
  await page.waitForFunction(() => window.lastExportJob?.editedData?.length === 1);
  assert.equal(await page.evaluate(() => window.lastExportJob.editedData[0]['Họ tên']), 'Nguyễn Thị Hồng đã sửa', 'Single export uses original row index after filtering');
  const libraryCopies = () => page.evaluate(async () => Object.values(await (await import('/js/core/storage.js')).DataManager.list()));
  assert.equal((await libraryCopies()).length, 0, 'Export does not save or overwrite a data source');
  await page.locator('#savePreviewCopyBtn').click();
  await page.waitForFunction(async () => Object.keys(await (await import('/js/core/storage.js')).DataManager.list()).length === 1);
  await page.waitForFunction(() => !document.getElementById('savePreviewCopyBtn').disabled);
  await page.locator('#savePreviewCopyBtn').click();
  await page.waitForFunction(() => !document.getElementById('savePreviewCopyBtn').disabled);
  const copies = await libraryCopies();
  assert.equal(copies.length, 1, 'Saving the same preview updates one copy instead of creating duplicates');
  assert.equal(copies[0].data.length, 3, 'Saved copy includes all preview rows, not just filtered rows');
  assert.equal(copies[0].data[1]['Họ tên'], 'Nguyễn Thị Hồng đã sửa');
  await page.locator('#previewSearchInput').fill('không tìm thấy');
  await page.waitForFunction(() => document.querySelector('#confirmExportBtn').disabled);
  assert.ok(await page.locator('.table-empty').isVisible(), 'Empty state is actionable');
  await page.locator('#closePreviewBtn').focus();
  await page.waitForFunction(() => !document.getElementById('processBtn').disabled);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.getElementById('dataPreviewModal').contains(document.activeElement)), true, 'Tab focus stays inside preview');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#dataPreviewModal').evaluate(el => el.classList.contains('is-open')), false, 'Escape closes preview');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'processBtn', 'Closing dialog restores focus');

  // Google Sheets integration: validate link metadata, fresh reads and safe reloads.
  let sheetVersion = 1;
  let sheetError = false;
  let sheetRequests = 0;
  let privateSessionReady = false;
  await page.context().route('https://docs.google.com/**', async route => {
    const url = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': base, 'access-control-allow-credentials': 'true' };
    if (url.pathname.endsWith('/htmlview') || url.pathname.endsWith('/edit')) {
      await route.fulfill({ status: 200, contentType: 'text/html', headers, body: '<title>Sheet kiểm thử - Google Sheets</title>' });
      return;
    }
    sheetRequests++;
    const authenticatedTab = privateSessionReady && route.request().frame().url().startsWith('https://docs.google.com/');
    if (authenticatedTab) assert.ok((await route.request().allHeaders()).cookie?.includes('autodoc_test_session=authorized'));
    await route.fulfill({ status: authenticatedTab ? 200 : sheetError || sheetRequests === 1 ? 403 : 200,
      contentType: 'text/csv; charset=utf-8', headers,
      body: `Họ tên,Mã,Check DL\nDữ liệu mới ${sheetVersion},00123,TRUE` });
  });
  await page.locator('[data-view="viewData"]').click();
  await page.locator('#dataSrcLinkBtn').click();
  await page.locator('#dataLibNameInput').fill('Sheet trực tiếp kiểm thử');
  await page.locator('#dataLinkInput').fill('https://docs.google.com/spreadsheets/d/live_test_sheet/edit#gid=42');
  await page.locator('#dataLinkImportBtn').click();
  await page.waitForFunction(async () => Object.values(await (await import('/js/core/storage.js')).DataManager.list()).some(item => item.type === 'google_sheets'));
  const liveSource = (await libraryCopies()).find(item => item.type === 'google_sheets');
  assert.equal(liveSource.data ?? null, null, 'Only Sheet link metadata is persisted');
  sheetVersion = 2;
  await page.locator('[data-view="viewWorkspace"]').click();
  await page.locator('#dataSourceLinkBtn').click();
  await page.locator('#dataLibSelect').selectOption(liveSource.id);
  await page.locator('#processBtn').click();
  await page.locator('#dataPreviewModal.is-open').waitFor();
  assert.equal(await page.locator('.preview-input[data-col="Họ tên"]').inputValue(), 'Dữ liệu mới 2', 'Opening preview rereads the remote Sheet');
  assert.ok(await page.locator('#reloadSheetPreviewBtn').isVisible());
  sheetVersion = 3;
  await page.locator('#reloadSheetPreviewBtn').click();
  await page.waitForFunction(() => document.querySelector('.preview-input[data-col="Họ tên"]').value === 'Dữ liệu mới 3');
  assert.ok((await page.locator('#sheetFreshness').textContent()).includes('Đọc từ Google Sheets lúc'));
  await page.locator('.preview-input[data-col="Họ tên"]').fill('Chỉnh sửa chưa lưu');
  const beforeBlockedReload = sheetRequests;
  await page.locator('#reloadSheetPreviewBtn').click();
  assert.equal(sheetRequests, beforeBlockedReload, 'Unsaved local edits block a destructive reload');
  await page.locator('#savePreviewCopyBtn').click();
  await page.waitForFunction(() => !document.getElementById('savePreviewCopyBtn').disabled);
  sheetVersion = 4;
  await page.locator('#reloadSheetPreviewBtn').click();
  await page.waitForFunction(() => document.querySelector('.preview-input[data-col="Họ tên"]').value === 'Dữ liệu mới 4');
  sheetError = true;
  await page.locator('#reloadSheetPreviewBtn').click();
  await page.waitForFunction(() => !document.getElementById('reloadSheetPreviewBtn').disabled);
  assert.equal(await page.locator('.preview-input[data-col="Họ tên"]').inputValue(), 'Dữ liệu mới 4', 'Failed refresh preserves the current preview');
  const sessionPage = await page.context().newPage();
  await page.context().addCookies([{ name: 'autodoc_test_session', value: 'authorized', domain: 'docs.google.com', path: '/', secure: true, sameSite: 'Lax' }]);
  await sessionPage.goto('https://docs.google.com/spreadsheets/u/2/d/live_test_sheet/edit');
  await page.exposeFunction('__readSheetSession', sheet => sessionPage.evaluate(readCsvInSheetTab, sheet));
  await page.evaluate(() => {
    window.chrome ||= {};
    window.chrome.tabs = { query: async () => [{ id: 77, active: true, url: 'https://docs.google.com/spreadsheets/u/2/d/live_test_sheet/edit' }] };
    window.chrome.scripting = { executeScript: async options => [{ result: await window.__readSheetSession(options.args[0]) }] };
  });
  privateSessionReady = true;
  sheetVersion = 5;
  await page.locator('#reloadSheetPreviewBtn').click();
  await page.waitForFunction(() => document.querySelector('.preview-input[data-col="Họ tên"]').value === 'Dữ liệu mới 5');
  await sessionPage.close();
  await page.evaluate(() => { delete window.chrome.scripting; delete window.chrome.tabs; });
  await page.keyboard.press('Escape');

  fs.mkdirSync('outputs/ui-review', { recursive: true });
  for (const [file, width] of [['app.html', 1366], ['app.html', 768], ['sidepanel.html', 400], ['sidepanel.html', 320]]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto(`${base}/${file}`);
    await page.locator('.file-drop[role="button"]').first().waitFor({ state: 'attached' });
    for (const view of ['viewWorkspace', 'viewTemplates', 'viewData', 'viewSettings']) {
      await page.locator(`[data-view="${view}"]`).click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      assert.equal(overflow, false, `${file}/${width}/${view}: no page overflow`);
    }
    await page.locator('[data-view="viewWorkspace"]').click();
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.screenshot({ path: `outputs/ui-review/${file}-${width}.png`, fullPage: true, animations: 'disabled' });
    await page.locator('#themeToggleBtn').click();
    await page.screenshot({ path: `outputs/ui-review/${file}-${width}-dark.png`, fullPage: true, animations: 'disabled' });
    await page.locator('#srcUploadBtn').click();
    await page.locator('#docTemplate').setInputFiles({ name: 'Mau.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from(fixtures.docx) });
    await page.locator('#excelData').setInputFiles({ name: 'DuLieu.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(fixtures.xlsx) });
    await page.waitForFunction(() => window.dataContext?.fullData?.length === 3);
    await page.locator('#processBtn').click();
    await page.locator('#dataPreviewModal.is-open').waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, 'Preview must not expand the page');
    const confirmFits = await page.locator('#confirmExportBtn').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight && rect.right <= innerWidth;
    });
    assert.equal(confirmFits, true, 'Preview export action stays inside the viewport');
    await page.screenshot({ path: `outputs/ui-review/preview-${file}-${width}.png`, animations: 'disabled' });
  }
  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log('PASS: picker/cancel, preview edits/filtering/export, safe saved copies, keyboard/dialogs, live Google Sheets link and refresh, 16 responsive views, 4 preview layouts and both themes.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
