import assert from 'node:assert/strict';
import { DataManager, TemplateManager } from '../js/core/storage.js';
import { getSafeSourceUrl, getSourceDetails } from '../js/ui/source-details.js';

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value)
};

const file = await DataManager.save('local-test', {
  name: 'Hồ sơ', type: 'local_file', fileName: 'DuLieu.xlsx', sheetName: 'Trang 1'
});
assert.equal(file.fileName, 'DuLieu.xlsx');
assert.equal((await DataManager.list())['local-test'].fileName, 'DuLieu.xlsx');
const fileDetails = getSourceDetails(file, 'data');
assert.equal(fileDetails.fileName, 'DuLieu.xlsx');
assert.match(fileDetails.note, /không cung cấp đường dẫn/);

const sheet = await DataManager.save('sheet-test', {
  name: 'Bảng tính', type: 'google_sheets', link: 'https://docs.google.com/spreadsheets/d/demo/edit'
});
assert.equal(getSourceDetails(sheet, 'data').url, sheet.link);
assert.equal(getSafeSourceUrl(sheet.link), sheet.link);
assert.equal(getSafeSourceUrl('javascript:alert(1)'), '');
assert.equal(getSafeSourceUrl('file:///C:/private.xlsx'), '');

const template = await TemplateManager.save('Mẫu thử.docx', new Uint8Array([1, 2, 3]).buffer, 'khac', {
  fileName: 'BanGoc.docx'
});
assert.equal(getSourceDetails(template, 'template').fileName, 'BanGoc.docx');
assert.equal(getSourceDetails(template, 'template').url, '');
console.log('PASS: stored file metadata, linked source URL, legacy-safe template details and URL scheme validation.');
