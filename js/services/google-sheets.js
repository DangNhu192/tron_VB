'use strict';

import { extractTableDataFromDocx } from '../core/docx-xml.js';
import { readExcelWorkbook } from '../core/xlsx-text.js';

function getXLSX() {
  if (typeof XLSX !== 'undefined') return XLSX;
  if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
  throw new Error("Thư viện SheetJS (XLSX) chưa được nạp.");
}

export const GoogleSheetsManager = {
  extractFileId(url) {
    try {
      if (!url) return null;
      if (url.includes('/d/')) {
        return url.split('/d/')[1].split('/')[0];
      } else if (url.includes('id=')) {
        return new URL(url).searchParams.get('id');
      }
    } catch(e) {}
    return null;
  },

  extractGid(url) {
    try {
      if (!url) return '0';
      if (url.includes('gid=')) {
        return new URL(url).searchParams.get('gid') || '0';
      }
    } catch(e) {}
    return '0';
  },

  async fetchFileTitle(url) {
    try {
      const fileId = this.extractFileId(url);
      if (!fileId) return null;
      let userPrefix = '';
      const userMatch = (url || '').match(/\/u\/(\d+)\//);
      if (userMatch) userPrefix = `/u/${userMatch[1]}`;

      let fetchUrl = '';
      if (url.includes('spreadsheets/d/')) {
        fetchUrl = `https://docs.google.com${userPrefix}/spreadsheets/d/${fileId}/htmlview`;
      } else if (url.includes('document/d/')) {
        fetchUrl = `https://docs.google.com${userPrefix}/document/d/${fileId}/htmlview`;
      } else {
        fetchUrl = `https://drive.google.com/file/d/${fileId}/view`;
      }

      const res = await fetch(fetchUrl, { credentials: 'include' });
      if (!res.ok) return null;
      const html = await res.text();
      const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) 
                   || html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
      if (ogMatch && ogMatch[1]) {
        return ogMatch[1].trim();
      }
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        return titleMatch[1].replace(/\s*-\s*Google\s*(Trang tính|Sheets|Tài liệu|Docs|Drive).*$/i, '').trim();
      }
    } catch (e) {
      console.warn('Không thể tự động đọc tên file Google:', e);
    }
    return null;
  },

  async importLinkSheet(url, sheetName) {
    const fileId = this.extractFileId(url);
    if (!fileId) throw new Error("Link Google Sheet không hợp lệ hoặc thiếu ID.");

    let userPrefix = '';
    const userMatch = url.match(/\/u\/(\d+)\//);
    if (userMatch) {
      userPrefix = `/u/${userMatch[1]}`;
    }

    let exportUrl = `https://docs.google.com${userPrefix}/spreadsheets/d/${fileId}/export?format=csv`;
    if (sheetName) {
      exportUrl += `&sheet=${encodeURIComponent(sheetName)}`;
    } else {
      const gid = this.extractGid(url);
      if (gid && gid !== '0') {
        exportUrl += `&gid=${gid}`;
      }
    }

    const res = await fetch(exportUrl, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("Không có quyền truy cập Google Sheet. Hãy kiểm tra bạn đã đăng nhập đúng tài khoản Google quản lý file trên trình duyệt, hoặc mở quyền 'Bất kỳ ai có liên kết'.");
      }
      if (res.status === 404) {
        throw new Error("Không tìm thấy Google Sheet. Vui lòng kiểm tra lại liên kết.");
      }
      throw new Error(`Lỗi tải dữ liệu Google Sheet (HTTP ${res.status})`);
    }

    const csvText = await res.text();
    const XLSXLib = getXLSX();
    const workbook = XLSXLib.read(csvText, { type: 'string' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    let rawData = XLSXLib.utils.sheet_to_json(sheet, { defval: "" });

    if (!rawData || rawData.length === 0) {
      throw new Error("Google Sheet không có dữ liệu hoặc không đúng cấu trúc bảng.");
    }

    const firstRowKeys = Object.keys(rawData[0]);
    const checkDLKey = firstRowKeys.find(k => k.toLowerCase().trim() === 'check dl');
    if (checkDLKey) {
      rawData = rawData.filter(row => {
        const val = row[checkDLKey];
        return val !== undefined && val !== null && val.toString().trim().toLowerCase() === 'true';
      });
      if (rawData.length === 0) {
        throw new Error("Không có hàng dữ liệu nào có giá trị Check DL = 'True' trong Google Sheet.");
      }
    }

    return rawData;
  },

  async importExcelLink(url, sheetName) {
    if (!url) throw new Error("Vui lòng cung cấp link file Excel hoặc Word .docx.");
    let downloadUrl = url.trim();

    // Hỗ trợ link file lưu trên Google Drive
    const fileId = this.extractFileId(downloadUrl);
    if (fileId && (downloadUrl.includes('drive.google.com') || downloadUrl.includes('docs.google.com'))) {
      downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    } else if (downloadUrl.includes('onedrive.live.com') || downloadUrl.includes('sharepoint.com')) {
      // Hỗ trợ link OneDrive / SharePoint
      if (!downloadUrl.includes('download=1')) {
        downloadUrl += downloadUrl.includes('?') ? '&download=1' : '?download=1';
      }
    }

    const res = await fetch(downloadUrl, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        throw new Error("Không thể tải file từ link. Kiểm tra lại quyền truy cập hoặc phiên đăng nhập tài khoản.");
      }
      throw new Error(`Lỗi tải file dữ liệu (HTTP ${res.status})`);
    }

    const buffer = await res.arrayBuffer();
    const isDocxUrl = downloadUrl.toLowerCase().includes('.docx') || downloadUrl.includes('/document/d/');
    let rawData = [];

    if (isDocxUrl) {
      try {
        rawData = extractTableDataFromDocx(buffer);
      } catch (errDocx) {
        throw new Error(`Lỗi đọc bảng từ file Word .docx: ${errDocx.message}`);
      }
    } else {
      try {
        const XLSXLib = getXLSX();
        const workbook = readExcelWorkbook(buffer, XLSXLib);
        const targetSheet = (sheetName && workbook.Sheets[sheetName]) ? sheetName : workbook.SheetNames[0];
        if (!targetSheet || !workbook.Sheets[targetSheet]) {
          throw new Error(`Không tìm thấy Sheet "${sheetName || ''}" trong file Excel.`);
        }
        rawData = XLSXLib.utils.sheet_to_json(workbook.Sheets[targetSheet], { defval: "" });
      } catch (errXlsx) {
        // Fallback thử đọc dạng bảng Word .docx nếu file thực chất là file docx
        try {
          rawData = extractTableDataFromDocx(buffer);
        } catch (errFallback) {
          throw new Error(`Không thể giải mã dữ liệu bảng tính hoặc bảng Word: ${errXlsx.message}`);
        }
      }
    }

    if (!rawData || rawData.length === 0) {
      throw new Error("File dữ liệu không có dữ liệu hoặc bảng rỗng.");
    }

    const firstRowKeys = Object.keys(rawData[0]);
    const checkDLKey = firstRowKeys.find(k => k.toLowerCase().trim() === 'check dl');
    if (checkDLKey) {
      rawData = rawData.filter(row => {
        const val = row[checkDLKey];
        return val !== undefined && val !== null && val.toString().trim().toLowerCase() === 'true';
      });
      if (rawData.length === 0) {
        throw new Error("Không có hàng dữ liệu nào có giá trị Check DL = 'True' trong file.");
      }
    }

    return rawData;
  },

  async importLinkWord(url) {
    const fileId = this.extractFileId(url);
    if (!fileId) throw new Error("Link không hợp lệ.");
    
    const exportUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
    const res = await fetch(exportUrl, { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        throw new Error("Không có quyền truy cập file Word hoặc file không tồn tại. Đảm bảo chia sẻ 'Bất kỳ ai có liên kết' hoặc tài khoản Google có quyền truy cập.");
      }
      throw new Error(`Lỗi HTTP ${res.status}`);
    }
    return res.arrayBuffer();
  }
};

let pickerWindowId = null;
let pickerType = null;

export function openDrivePicker(type) {
  if (typeof chrome === 'undefined' || !chrome.windows) return;
  if (pickerWindowId) {
    chrome.windows.remove(pickerWindowId, () => {});
  }
  pickerType = type;
  let targetUrl = 'https://drive.google.com/';
  if (type === 'data_sheet' || type === 'data') {
    targetUrl = 'https://drive.google.com/drive/search?q=type:spreadsheet';
  } else if (type === 'data_excel') {
    targetUrl = 'https://drive.google.com/drive/search?q=.xlsx%20or%20.docx%20or%20.xls';
  } else if (type === 'tpl') {
    targetUrl = 'https://drive.google.com/drive/search?q=type:document';
  }
  chrome.windows.create({
    url: targetUrl,
    type: 'popup',
    width: 1000,
    height: 700
  }, (win) => {
    pickerWindowId = win.id;
  });
}

export function initGoogleDrivePickerListeners(onSelected) {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.tabs) return;

  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'autodocDriveSelected' && pickerWindowId) {
      const fileUrl = message.url;
      if (fileUrl.includes('drive.google.com') && !fileUrl.includes('/file/d/') && !message.forceFileId) {
        if (onSelected) onSelected({ error: "Vui lòng NHẤP ĐÚP file để mở tab mới, sau đó bấm Xác nhận!" });
        return;
      }
      const finalUrl = message.forceFileId ? `https://drive.google.com/file/d/${message.forceFileId}/view` : fileUrl;
      chrome.windows.remove(pickerWindowId, () => {});
      if (sender.tab && sender.tab.windowId !== pickerWindowId) {
        chrome.tabs.remove(sender.tab.id, () => {});
      }
      pickerWindowId = null;

      if (onSelected) {
        onSelected({ 
          type: pickerType, 
          url: finalUrl,
          fileName: message.fileName,
          sheetName: message.sheetName
        });
      }
    }
  });

  chrome.tabs.onUpdated.addListener(function pickerListener(tabId, changeInfo, tab) {
    if (!pickerWindowId) return;
    if (changeInfo.status === 'complete' && tab.url) {
      const isDrive = tab.url.includes('drive.google.com');
      const isDocs = tab.url.includes('docs.google.com/spreadsheets/d/') || tab.url.includes('docs.google.com/document/d/');
      
      if (isDrive || isDocs && chrome.scripting) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: (pType) => {
            if (window.autodocPickerInjected) return;
            window.autodocPickerInjected = true;
            
            setInterval(() => {
              if (document.getElementById('autodoc-picker-bar')) return;
              
              const bar = document.createElement('div');
              bar.id = 'autodoc-picker-bar';
              bar.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:white;color:#333;padding:12px 20px;border-radius:8px;z-index:9999999;font-size:14px;box-shadow:0 4px 15px rgba(0,0,0,0.3);font-family:sans-serif; display:flex; align-items:center; gap:15px; border: 1px solid #ddd;';
              
              const isDrivePage = window.location.href.includes('drive.google.com');
              const text = isDrivePage 
                ? 'Mở (Nhấp đúp) file bạn muốn chọn, sau đó bấm ->' 
                : (pType === 'data' ? 'Chọn <b>Tab (Sheet)</b> ở dưới đáy, rồi bấm ->' : 'Kiểm tra đúng file mẫu, rồi bấm ->');

              bar.innerHTML = `
                <div>
                  <strong style="color:#059669;">AutoDoc Pro:</strong>
                  <span>${text}</span>
                </div>
                <button id="autodoc-confirm-btn" style="background:#059669;color:white;border:none;padding:8px 16px;border-radius:4px;font-weight:bold;cursor:pointer;font-size:14px;">Xác nhận chọn</button>
              `;
              document.body.appendChild(bar);

              document.getElementById('autodoc-confirm-btn').addEventListener('click', () => {
                const btn = document.getElementById('autodoc-confirm-btn');
                btn.textContent = "Đang xử lý...";
                let forceFileId = null;
                let fileName = null;
                let sheetTabName = null;
                if (window.location.href.includes('drive.google.com')) {
                  const selectedEls = Array.from(document.querySelectorAll('[aria-selected="true"]'));
                  for (const el of selectedEls) {
                    if (el.dataset && el.dataset.id) { forceFileId = el.dataset.id; break; }
                    if (el.dataset && el.dataset.targetId) { forceFileId = el.dataset.targetId; break; }
                    const child = el.querySelector('[data-id], [data-target-id]');
                    if (child) {
                      forceFileId = child.dataset.id || child.dataset.targetId;
                      break;
                    }
                  }
                }
                // 1. Lấy tên tệp Google Sheets / Docs nếu đang mở trực tiếp
                const titleInput = document.querySelector('input.docs-title-input, .docs-title-input');
                if (titleInput && titleInput.value) {
                  fileName = titleInput.value.trim();
                } else if (document.title) {
                  fileName = document.title.replace(/\s*-\s*Google\s*(Trang tính|Sheets|Tài liệu|Docs|Drive).*$/i, '').trim();
                }

                // 2. Lấy tên tab sheet đang active ở đáy màn hình
                const activeTab = document.querySelector('.docs-sheet-tab-name.docs-sheet-active-tab, .docs-sheet-active-tab .docs-sheet-tab-name, .docs-sheet-active-tab');
                if (activeTab && activeTab.textContent) {
                  sheetTabName = activeTab.textContent.trim();
                }

                chrome.runtime.sendMessage({ 
                  action: 'autodocDriveSelected', 
                  url: window.location.href,
                  forceFileId: forceFileId,
                  fileName: fileName,
                  sheetName: sheetTabName
                });
                setTimeout(() => { btn.textContent = "Xác nhận chọn"; }, 1500);
              });
            }, 1000);
          },
          args: [pickerType]
        }).catch(e => console.log('Inject error', e));
      }
    }
  });
}
