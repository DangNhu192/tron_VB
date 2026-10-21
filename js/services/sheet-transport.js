'use strict';

export function parseSheetLink(value, sheetName = '') {
  let url;
  try { url = new URL(value); } catch { throw new Error('Liên kết Google Sheets không hợp lệ.'); }
  if (url.protocol !== 'https:' || !['docs.google.com', 'drive.google.com'].includes(url.hostname)) {
    throw new Error('Hãy dùng liên kết HTTPS của Google Sheets hoặc Google Drive.');
  }
  const published = url.pathname.match(/\/spreadsheets\/d\/e\/([\w-]+)\//);
  const match = url.pathname.match(/\/(?:spreadsheets\/(?:u\/\d+\/)?|file\/)d\/([\w-]+)/);
  const id = published?.[1] || match?.[1] || url.searchParams.get('id');
  if (!id || !/^[\w-]+$/.test(id)) throw new Error('Không tìm thấy ID Google Sheets trong liên kết.');
  const hash = new URLSearchParams(url.hash.slice(1));
  const gid = hash.get('gid') || url.searchParams.get('gid');
  if (gid && !/^\d+$/.test(gid)) throw new Error('Mã trang tính (gid) không hợp lệ.');
  const account = url.pathname.match(/\/u\/(\d+)\//)?.[1] || url.searchParams.get('authuser');
  const requestedName = sheetName.trim() || url.searchParams.get('sheet') || '';
  if (published && requestedName) throw new Error('Link công bố chọn trang tính bằng gid. Hãy dùng link chỉnh sửa nếu cần chọn bằng tên Sheet.');
  return { id, gid, sheetName: requestedName, account,
    published: Boolean(published), resourceKey: url.searchParams.get('resourcekey') };
}

function csvUrl(sheet, kind, authenticated) {
  const account = authenticated && sheet.account && /^\d+$/.test(sheet.account) ? `u/${sheet.account}/` : '';
  const prefix = sheet.published ? `d/e/${sheet.id}/pub` : `${account}d/${sheet.id}/${kind}`;
  const url = new URL(`https://docs.google.com/spreadsheets/${prefix}`);
  if (sheet.published) { url.searchParams.set('output', 'csv'); url.searchParams.set('single', 'true'); }
  else if (kind === 'gviz/tq') { url.searchParams.set('tqx', 'out:csv'); url.searchParams.set('headers', '1'); }
  else url.searchParams.set('format', 'csv');
  if (sheet.sheetName) url.searchParams.set('sheet', sheet.sheetName);
  else if (sheet.gid !== null) url.searchParams.set('gid', sheet.gid);
  if (sheet.resourceKey) url.searchParams.set('resourcekey', sheet.resourceKey);
  if (authenticated && sheet.account) url.searchParams.set('authuser', sheet.account);
  url.searchParams.set('_autodoc', `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return url.href;
}

function isCsvResponse(result) {
  return result.ok && typeof result.text === 'string'
    && !/text\/html|javascript|application\/json/i.test(result.contentType || '')
    && !/^\s*(?:<!doctype\s+html|<html\b|<head\b|google\.visualization\.)/i.test(result.text)
    && !result.login;
}

async function requestCsv(url, credentials) {
  const res = await fetch(url, { credentials, cache: 'no-store', signal: AbortSignal.timeout(7000) });
  return { ok: res.ok, status: res.status, contentType: res.headers.get('content-type') || '',
    login: Boolean(res.url && new URL(res.url).hostname === 'accounts.google.com'),
    text: res.ok ? await res.text() : '' };
}

// Self-contained: Chrome serializes this function into the requested Sheet tab.
// Uses the browser session normally; never reads cookies or authentication tokens.
export async function readCsvInSheetTab(sheet) {
  if (location.hostname !== 'docs.google.com') return { ok: false, status: 401 };
  const match = location.pathname.match(/\/spreadsheets\/(?:u\/\d+\/)?d\/([\w-]+)/);
  if (match?.[1] !== sheet.id) return { ok: false, status: 401 };
  const account = location.pathname.match(/\/u\/(\d+)\//)?.[1];
  let last = { ok: false, status: 0 };
  for (const kind of (sheet.sheetName ? ['gviz/tq'] : ['export', 'gviz/tq'])) {
    const prefix = account ? `u/${account}/` : '';
    const url = new URL(`https://docs.google.com/spreadsheets/${prefix}d/${sheet.id}/${kind}`);
    if (kind === 'export') url.searchParams.set('format', 'csv');
    else { url.searchParams.set('tqx', 'out:csv'); url.searchParams.set('headers', '1'); }
    if (sheet.sheetName) url.searchParams.set('sheet', sheet.sheetName);
    else if (sheet.gid !== null) url.searchParams.set('gid', sheet.gid);
    const authuser = new URL(location.href).searchParams.get('authuser') || account || sheet.account;
    if (authuser) url.searchParams.set('authuser', authuser);
    if (sheet.resourceKey) url.searchParams.set('resourcekey', sheet.resourceKey);
    url.searchParams.set('_autodoc', `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    try {
      const response = await fetch(url.href, { credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(7000) });
      const text = response.ok ? await response.text() : '';
      const contentType = response.headers.get('content-type') || '';
      const login = Boolean(response.url && new URL(response.url).hostname === 'accounts.google.com');
      last = { ok: response.ok, status: response.status, text, contentType, login };
      if (last.ok && !login && !/text\/html|javascript|application\/json/i.test(contentType)
        && !/^\s*(?:<!doctype\s+html|<html\b|<head\b|google\.visualization\.)/i.test(text)) return last;
    } catch { last = { ok: false, status: 0 }; }
  }
  return { ...last, ok: false };
}

function waitForTab(chromeApi, tabId) {
  return new Promise((resolve, reject) => {
    const finish = error => {
      clearTimeout(timer);
      chromeApi.tabs.onUpdated.removeListener(updated);
      if (error) reject(error); else resolve();
    };
    const updated = (id, change) => { if (id === tabId && change.status === 'complete') finish(); };
    const timer = setTimeout(() => finish(new Error('Google Sheets tải quá lâu. Hãy mở link Sheet rồi thử lại.')), 15000);
    chromeApi.tabs.onUpdated.addListener(updated);
    chromeApi.tabs.get(tabId).then(tab => { if (tab.status === 'complete') finish(); }, finish);
  });
}

async function requestInBrowserSession(sheet) {
  const api = globalThis.chrome;
  if (sheet.published || !api?.scripting?.executeScript || !api.tabs?.query) return null;
  const tabs = (await api.tabs.query({ url: 'https://docs.google.com/spreadsheets/*' }))
    .filter(tab => {
      try { return parseSheetLink(tab.url).id === sheet.id; } catch { return false; }
    }).sort((a, b) => {
      const preferred = tab => Number(parseSheetLink(tab.url).account === sheet.account) * 2 + Number(Boolean(tab.active));
      return preferred(b) - preferred(a);
    });
  let createdId;
  try {
    if (!tabs.length) {
      const prefix = sheet.account && /^\d+$/.test(sheet.account) ? `u/${sheet.account}/` : '';
      const url = new URL(`https://docs.google.com/spreadsheets/${prefix}d/${sheet.id}/edit`);
      if (sheet.account) url.searchParams.set('authuser', sheet.account);
      if (sheet.resourceKey) url.searchParams.set('resourcekey', sheet.resourceKey);
      const tab = await api.tabs.create({ url: url.href, active: false });
      createdId = tab.id;
      await waitForTab(api, tab.id);
      tabs.push(tab);
    }
    let last;
    for (const tab of tabs.slice(0, 2)) {
      try {
        const results = await api.scripting.executeScript({ target: { tabId: tab.id }, func: readCsvInSheetTab, args: [sheet] });
        last = results[0]?.result;
        if (last && isCsvResponse(last)) return last;
      } catch { last = { ok: false, status: 0 }; }
    }
    return last;
  } finally {
    if (createdId !== undefined) await api.tabs.remove(createdId).catch(() => {});
  }
}

export async function fetchSheetCsv(link, sheetName = '') {
  const sheet = parseSheetLink(link, sheetName);
  const failures = [];
  const attempts = sheet.published ? [['export', 'omit']]
    : sheet.sheetName ? [['gviz/tq', 'include'], ['gviz/tq', 'omit']]
      : [['export', 'include'], ['export', 'omit'], ['gviz/tq', 'omit']];
  for (const [kind, credentials] of attempts) {
    try {
      const result = await requestCsv(csvUrl(sheet, kind, credentials === 'include'), credentials);
      if (isCsvResponse(result)) return result.text.replace(/^\uFEFF/, '');
      failures.push(result);
    } catch { failures.push({ status: 0 }); }
  }
  try {
    const result = await requestInBrowserSession(sheet);
    if (result && isCsvResponse(result)) return result.text.replace(/^\uFEFF/, '');
    if (result) failures.push(result);
  } catch { failures.push({ status: 0 }); }
  const statuses = failures.map(result => result.status);
  if (statuses.every(status => status === 0)) {
    throw new Error('Không kết nối được Google Sheets. Kiểm tra mạng hoặc quyền truy cập website của extension rồi thử lại.');
  }
  if (statuses.includes(429) || statuses.some(status => status >= 500)) {
    throw new Error('Google Sheets đang giới hạn yêu cầu hoặc tạm lỗi máy chủ. Hãy thử lại sau.');
  }
  if (statuses.includes(400)) throw new Error('Google không đọc được trang tính đã chọn. Kiểm tra tên Sheet hoặc gid trong link.');
  throw new Error('Chưa đọc được dữ liệu Google Sheets qua phiên hiện tại. Hãy mở chính link Sheet bằng tài khoản có quyền, giữ tab đó mở rồi thử lại. Nếu Google chặn tải xuống cho người xem, chủ file cần cho phép tải dữ liệu. Link sai hoặc file đã xóa cũng có thể gây lỗi này.');
}
