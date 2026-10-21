import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch {
  const bundled = process.env.CODEX_NODE_MODULES || (process.env.USERPROFILE && path.join(
    process.env.USERPROFILE, '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules'
  ));
  if (!bundled) throw new Error('Cần cài Playwright hoặc chỉ định CODEX_NODE_MODULES để chụp ảnh.');
  playwright = require(path.join(bundled, 'playwright'));
}

const root = process.cwd();
const output = path.join(root, 'docs', 'images');
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
  try { res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
  catch { res.writeHead(404).end(); }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await playwright.chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN' });
  const page = await context.newPage();
  const base = `http://127.0.0.1:${server.address().port}`;
  fs.mkdirSync(output, { recursive: true });

  async function loadDemo(file) {
    await page.goto(`${base}/${file}`);
    await page.locator('#srcUploadBtn').click();
    const fixture = await page.evaluate(() => {
      const zip = new PizZip();
      zip.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
      zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
      zip.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hồ sơ {{MaHoSo}} — {{TenDonVi}}</w:t></w:r></w:p><w:sectPr/></w:body></w:document>');
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
        ['MaHoSo', 'TenDonVi'],
        ['MAU-001', 'Đơn vị minh họa A'],
        ['MAU-002', 'Đơn vị minh họa B']
      ]), 'Minh họa');
      return {
        docx: [...zip.generate({ type: 'uint8array' })],
        xlsx: [...new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx', bookSST: true }))]
      };
    });
    await page.locator('#docTemplate').setInputFiles({ name: 'Mau_minh_hoa.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from(fixture.docx) });
    await page.locator('#excelData').setInputFiles({ name: 'Du_lieu_minh_hoa.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(fixture.xlsx) });
    await page.waitForFunction(() => window.dataContext?.fullData?.length === 2);
    await page.locator('#fileNameFormat').fill('[MaHoSo]_[TenDonVi]');
    await page.waitForTimeout(3400);
  }

  await loadDemo('app.html');
  await page.screenshot({ path: path.join(output, '01-chon-mau-du-lieu.png'), animations: 'disabled' });
  await page.locator('#processBtn').click();
  await page.locator('#dataPreviewModal.is-open').waitFor();
  assert.equal(await page.locator('.preview-row').count(), 2);
  await page.screenshot({ path: path.join(output, '02-xem-truoc-du-lieu.png'), animations: 'disabled' });

  await page.setViewportSize({ width: 440, height: 900 });
  await loadDemo('sidepanel.html');
  await page.screenshot({ path: path.join(output, '03-cua-so-canh-ben.png'), fullPage: true, animations: 'disabled' });
  for (const name of ['01-chon-mau-du-lieu.png', '02-xem-truoc-du-lieu.png', '03-cua-so-canh-ben.png']) {
    const png = fs.readFileSync(path.join(output, name));
    for (let offset = 8; offset + 12 <= png.length;) {
      const length = png.readUInt32BE(offset);
      const type = png.toString('ascii', offset + 4, offset + 8);
      assert.ok(!['tEXt', 'zTXt', 'iTXt', 'eXIf'].includes(type), `${name} must not contain text or EXIF metadata`);
      offset += length + 12;
    }
  }
  console.log('Captured three AutoDoc screens with synthetic data in an isolated Chrome context.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
