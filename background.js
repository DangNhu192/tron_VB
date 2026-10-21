'use strict';

// Background Service Worker - AutoDoc Pro v2.3

// Quản lý danh sách tab Google Sheet đang chờ inject trợ lý AutoDoc
const pendingSheetTabs = new Map();

function injectSheetHelper(tabId, data) {
  if (!chrome.scripting || !chrome.scripting.executeScript) return;

  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (hList, tsvData, templateName) => {
      if (document.getElementById('autodoc-sheet-helper-bar')) return;

      const bar = document.createElement('div');
      bar.id = 'autodoc-sheet-helper-bar';
      bar.style.cssText = `
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: #0f172a;
        color: #f8fafc;
        padding: 12px 20px;
        border-radius: 12px;
        z-index: 2147483647;
        box-shadow: 0 10px 35px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        gap: 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        border: 2px solid #10b981;
        animation: autodocSlideDown 0.35s ease-out;
      `;

      const style = document.createElement('style');
      style.textContent = `
        @keyframes autodocSlideDown {
          from { transform: translate(-50%, -40px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .autodoc-sheet-btn {
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .autodoc-sheet-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .autodoc-sheet-btn:active { transform: translateY(0); }
      `;
      document.head.appendChild(style);

      bar.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:24px;">📋</span>
          <div>
            <div style="font-weight:700; font-size:14px; color:#34d399; display:flex; align-items:center; gap:8px;">
              AutoDoc Pro: Đã sẵn sàng ${hList.length} cột dữ liệu mẫu
              <span style="background:#1e293b; color:#94a3b8; font-size:11px; padding:2px 6px; border-radius:4px; font-weight:normal;">${templateName}</span>
            </div>
            <div style="font-size:12px; color:#cbd5e1; margin-top:2px;">
              👉 Nhấp chọn ô <b>A1</b> rồi nhấn <kbd style="background:#334155; color:#38bdf8; padding:2px 7px; border-radius:4px; font-weight:bold; font-family:monospace; border:1px solid #475569;">Ctrl + V</kbd> để điền ngay dữ liệu vào bảng tính!
            </div>
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button id="autodoc-recopy-btn" class="autodoc-sheet-btn" style="background:#10b981; color:white;">
            📋 Copy Lại Cột
          </button>
          <button id="autodoc-save-to-lib-btn" class="autodoc-sheet-btn" style="background:#2563eb; color:white;">
            🔗 Lưu Link Sheet Vào AutoDoc
          </button>
          <button id="autodoc-close-helper-btn" style="background:transparent; color:#94a3b8; border:none; font-size:18px; cursor:pointer; padding:4px 8px; line-height:1;" title="Đóng">✕</button>
        </div>
      `;

      document.body.appendChild(bar);

      // Bắt sự kiện Copy lại
      const recopyBtn = document.getElementById('autodoc-recopy-btn');
      if (recopyBtn) {
        recopyBtn.addEventListener('click', () => {
          const ta = document.createElement('textarea');
          ta.value = tsvData;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          recopyBtn.textContent = '✓ Đã Copy! Bấm Ctrl+V tại ô A1';
          setTimeout(() => { recopyBtn.textContent = '📋 Copy Lại Cột'; }, 2500);
        });
      }

      // Bắt sự kiện Lưu Link Sheet vào AutoDoc
      const saveBtn = document.getElementById('autodoc-save-to-lib-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          saveBtn.textContent = 'Đang lưu...';
          saveBtn.disabled = true;

          // Lấy tiêu đề thực tế từ Google Sheet nếu có
          let docTitle = '';
          const titleInput = document.querySelector('input.docs-title-input, .docs-title-input');
          if (titleInput && titleInput.value) {
            docTitle = titleInput.value.trim();
          } else if (document.title) {
            docTitle = document.title.replace(/\s*-\s*Google\s*(Trang tính|Sheets|Tài liệu|Docs|Drive).*$/i, '').trim();
          }
          const finalSheetName = docTitle || `Sheet ${templateName}`;

          chrome.runtime.sendMessage({
            action: 'autodocSaveSheetToLib',
            url: window.location.href,
            name: finalSheetName
          }, (res) => {
            if (res && res.success) {
              saveBtn.textContent = '✓ Đã Lưu Vào Thư Viện!';
              saveBtn.style.background = '#059669';
              setTimeout(() => { bar.style.display = 'none'; }, 2000);
            } else {
              saveBtn.textContent = 'Lỗi lưu link';
              saveBtn.disabled = false;
            }
          });
        });
      }

      // Đóng thanh trợ lý
      const closeBtn = document.getElementById('autodoc-close-helper-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          bar.style.display = 'none';
        });
      }
    },
    args: [data.headers, data.tsv, data.tplName]
  }).catch((err) => {
    console.warn('Lỗi inject script vào Google Sheet:', err);
  });
}

// Lắng nghe cập nhật trạng thái các tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (pendingSheetTabs.has(tabId)) {
    const data = pendingSheetTabs.get(tabId);
    const targetUrl = tab.url || changeInfo.url || '';
    if (targetUrl.includes('docs.google.com/spreadsheets/d/')) {
      if (changeInfo.status === 'complete') {
        pendingSheetTabs.delete(tabId);
        setTimeout(() => injectSheetHelper(tabId, data), 600);
      }
    }
  }
});

// Xóa khỏi pending nếu tab bị đóng
chrome.tabs.onRemoved.addListener((tabId) => {
  if (pendingSheetTabs.has(tabId)) {
    pendingSheetTabs.delete(tabId);
  }
});

// Lắng nghe Message từ AutoDoc App / Content Script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return;

  if (message.action === 'autodocCreateGoogleSheet') {
    const newSheetUrl = 'https://sheet.new';
    chrome.tabs.create({ url: newSheetUrl }, (tab) => {
      if (tab && tab.id) {
        pendingSheetTabs.set(tab.id, {
          headers: message.headers || [],
          tsv: message.tsv || '',
          tplName: message.tplName || 'AutoDoc'
        });
        sendResponse({ success: true, tabId: tab.id });
      } else {
        sendResponse({ success: false, error: 'Không thể mở tab Google Sheet' });
      }
    });
    return true; // Phản hồi bất đồng bộ
  }

  if (message.action === 'autodocSaveSheetToLib') {
    const DATA_SOURCES_KEY = 'autodoc_data_sources_v1';
    chrome.storage.local.get([DATA_SOURCES_KEY], (res) => {
      const sources = res[DATA_SOURCES_KEY] || {};
      const id = 'ds_' + Date.now();
      const sheetName = message.name || 'Google Sheet Mới';
      sources[id] = {
        id,
        name: sheetName,
        type: 'google_sheets',
        data: null,
        link: message.url,
        sheetName: '',
        savedAt: new Date().toISOString()
      };
      chrome.storage.local.set({ [DATA_SOURCES_KEY]: sources }, () => {
        sendResponse({ success: true, id });
      });
    });
    return true; // Phản hồi bất đồng bộ
  }
});

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }

  if (chrome.contextMenus) {
    chrome.contextMenus.create({
      id: 'open_autodoc_tab',
      title: 'Mở AutoDoc Pro (Tab toàn màn hình)',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'open_autodoc_sidepanel',
      title: 'Mở AutoDoc Pro (Cửa sổ cạnh bên - Side Panel)',
      contexts: ['action', 'page']
    });
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: chrome.runtime.getURL("app.html") });
});

if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'open_autodoc_sidepanel') {
      if (chrome.sidePanel && chrome.sidePanel.open && tab && tab.id) {
        chrome.sidePanel.open({ tabId: tab.id }).catch(() => {
          chrome.tabs.create({ url: chrome.runtime.getURL("sidepanel.html") });
        });
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL("sidepanel.html") });
      }
    } else if (info.menuItemId === 'open_autodoc_tab') {
      chrome.tabs.create({ url: chrome.runtime.getURL("app.html") });
    }
  });
}
