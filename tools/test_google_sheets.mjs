import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fetchSheetCsv, parseSheetLink, readCsvInSheetTab } from '../js/services/sheet-transport.js';
import { GoogleSheetsManager } from '../js/services/google-sheets.js';

const require = createRequire(import.meta.url);
globalThis.XLSX = require('../libs/xlsx.full.min.js');
const originalFetch = globalThis.fetch;
const originalChrome = globalThis.chrome;
const link = 'https://docs.google.com/spreadsheets/d/test_file/edit#gid=42';
const csv = 'Họ tên,Mã,Check DL\r\nNguyễn Thị Hồng,00123,TRUE\r\nLê Quốc Hùng,007,FALSE';
const response = (text = '', status = 200, type = 'text/csv', url = 'https://docs.google.com/export') => ({
  ok: status === 200, status, url, headers: { get: () => type }, text: async () => text
});
try {
  assert.equal(parseSheetLink(link).gid, '42');
  assert.equal(parseSheetLink(link.replace('#gid=42', '?gid=4#gid=42')).gid, '42');
  assert.equal(parseSheetLink('https://docs.google.com/spreadsheets/u/2/d/test_file/edit').account, '2');
  assert.equal(parseSheetLink('https://docs.google.com/u/2/spreadsheets/d/test_file/edit').account, '2');
  assert.throws(() => parseSheetLink('https://docs.google.com.evil.invalid/spreadsheets/d/test/edit'));
  assert.throws(() => parseSheetLink('https://docs.google.com/spreadsheets/d/test/edit#gid=oops'));
  let requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push([new URL(url), options]);
    return options.credentials === 'include' ? response('', 403) : response(csv);
  };
  assert.equal(await fetchSheetCsv(link), csv, 'Anonymous read survives a wrong logged-in account');
  assert.equal(requests.length, 2);
  assert.equal(requests[0][0].searchParams.get('gid'), '42');
  assert.equal(requests[1][1].credentials, 'omit');
  assert.ok(requests.every(([, options]) => options.cache === 'no-store' && options.signal));
  const before = requests[1][0].searchParams.get('_autodoc');
  await fetchSheetCsv(link);
  assert.notEqual(requests.at(-1)[0].searchParams.get('_autodoc'), before, 'Each read requests new data');

  requests = [];
  globalThis.fetch = async (url, options) => { requests.push([new URL(url), options]); return response(csv); };
  await fetchSheetCsv('https://docs.google.com/spreadsheets/u/2/d/test_file/edit', 'Dữ liệu thực');
  assert.equal(requests[0][0].pathname, '/spreadsheets/u/2/d/test_file/gviz/tq');
  assert.equal(requests[0][0].searchParams.get('sheet'), 'Dữ liệu thực');
  assert.equal(requests[0][0].searchParams.get('headers'), '1');
  assert.equal(requests[0][0].searchParams.has('gid'), false, 'Explicit sheet name overrides gid');

  requests = [];
  await fetchSheetCsv('https://docs.google.com/spreadsheets/d/e/2PACX_published/pubhtml?gid=17');
  assert.equal(requests[0][0].pathname, '/spreadsheets/d/e/2PACX_published/pub');
  assert.equal(requests[0][0].searchParams.get('output'), 'csv');

  let requestedTab;
  let removed = [];
  globalThis.fetch = async () => response('<html>Sign in</html>', 200, 'text/html', 'https://accounts.google.com/ServiceLogin');
  globalThis.chrome = {
    tabs: { query: async () => [{ id: 7, url: link, active: true }, { id: 8, url: 'https://docs.google.com/spreadsheets/d/other/edit' }], remove: async id => removed.push(id) },
    scripting: { executeScript: async ({ target, func, args }) => {
      requestedTab = target.tabId;
      const result = await vm.runInNewContext(`(${func.toString()})(sheet)`, {
        sheet: args[0], location: new URL('https://docs.google.com/spreadsheets/u/2/d/test_file/edit'),
        URL, Date, Math, AbortSignal,
        fetch: async (url, options) => {
          assert.equal(new URL(url).pathname, '/spreadsheets/u/2/d/test_file/export');
          assert.equal(new URL(url).searchParams.get('authuser'), '2', 'Session tab account overrides an outdated account in a saved link');
          assert.equal(options.cache, 'no-store');
          assert.equal(options.credentials, 'include');
          return response(csv);
        }
      });
      return [{ result }];
    } }
  };
  assert.equal(await fetchSheetCsv(link), csv, 'Authenticated same-site tab can read a private Sheet');
  assert.equal(requestedTab, 7, 'Only tabs for the requested file are used');
  assert.equal(await fetchSheetCsv('https://docs.google.com/spreadsheets/u/0/d/test_file/edit#gid=42'), csv);
  assert.deepEqual(removed, [], 'Existing user tabs are never closed');

  let listeners = new Set();
  let created;
  globalThis.chrome.tabs = {
    query: async () => [],
    create: async options => { created = options; return { id: 99 }; },
    get: async () => ({ status: 'complete' }),
    onUpdated: { addListener: f => listeners.add(f), removeListener: f => listeners.delete(f) },
    remove: async id => removed.push(id)
  };
  assert.equal(await fetchSheetCsv(link), csv);
  assert.equal(created.active, false, 'A temporary session tab does not steal focus');
  assert.deepEqual(removed, [99], 'Only the temporary tab is cleaned up');
  assert.equal(listeners.size, 0);
  globalThis.chrome.scripting.executeScript = async () => { throw new Error('Injection denied'); };
  await assert.rejects(fetchSheetCsv(link), /Chưa đọc được/);
  assert.deepEqual(removed, [99, 99], 'Temporary tab is also cleaned up on failure');

  globalThis.chrome = undefined;
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(fetchSheetCsv(link), /Không kết nối/);
  globalThis.fetch = async () => response('', 429);
  await assert.rejects(fetchSheetCsv(link), /giới hạn/);
  globalThis.fetch = async () => response('', 400);
  await assert.rejects(fetchSheetCsv(link), /tên Sheet hoặc gid/);
  globalThis.fetch = async () => response('google.visualization.Query.setResponse({"status":"error"});', 200, 'text/javascript');
  await assert.rejects(fetchSheetCsv(link), /Chưa đọc được/);

  let generation = 0;
  globalThis.fetch = async () => response(generation++ ? csv.replace('Nguyễn Thị Hồng', 'Dữ liệu mới') : csv);
  const first = await GoogleSheetsManager.importLinkSheet(link);
  const second = await GoogleSheetsManager.importLinkSheet(link);
  assert.equal(first.length, 1, 'Check DL filtering remains active');
  assert.equal(first[0]['Họ tên'], 'Nguyễn Thị Hồng');
  assert.equal(first[0]['Mã'], '00123', 'CSV identifiers retain leading zeros');
  assert.equal(second[0]['Họ tên'], 'Dữ liệu mới', 'Saved links read live data, not a stored snapshot');
  globalThis.fetch = async () => response('STT,Họ tên,Mã\r\n1,Nguyễn Thị Hồng,00123\r\n2,  ,  \r\n3,Lê Quốc Hùng,0');
  const withoutCheck = await GoogleSheetsManager.importLinkSheet(link);
  assert.deepEqual(withoutCheck.map(row => row['Họ tên']), ['Nguyễn Thị Hồng', 'Lê Quốc Hùng'], 'Without Check, only populated rows appear');

  globalThis.fetch = async () => response('STT,Họ tên,Check,Ghi chú\r\n1,Nguyễn Thị Hồng,TRUE,có dữ liệu\r\n2,Lê Quốc Hùng,FALSE,bỏ qua\r\n3,Trần An, true ,chọn\r\n4,,TRUE,\r\n5,  ,TRUE,  ');
  const withCheck = await GoogleSheetsManager.importLinkSheet(link);
  assert.deepEqual(withCheck.map(row => row['Họ tên']), ['Nguyễn Thị Hồng', 'Trần An'], 'Check=True selects only populated rows');

  globalThis.fetch = async () => response('Họ tên,Check,Check DL\r\nĐược chọn,TRUE,FALSE\r\nKhông chọn,FALSE,TRUE');
  assert.deepEqual((await GoogleSheetsManager.importLinkSheet(link)).map(row => row['Họ tên']), ['Được chọn'], 'Check takes precedence when both selection columns exist');

  globalThis.fetch = async () => response('Họ tên,Check\r\nLê Quốc Hùng,FALSE');
  await assert.rejects(GoogleSheetsManager.importLinkSheet(link), /Check = True/, 'An unselected Sheet has no preview rows');
  assert.equal(GoogleSheetsManager.extractGid(link), '42');
  console.log('PASS: public/session fallback, account paths, hash gid, named/published tabs, login rejection, cache bypass, error classification, tab cleanup, Unicode and live rereads.');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.chrome = originalChrome;
}
