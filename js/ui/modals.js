'use strict';

import { keepOriginalText, removeVietnameseTones } from '../core/charset.js';
import { formatBytes, MAX_TEMPLATES, MAX_DATA_SOURCES } from '../core/constants.js';
import { buildSampleDataRow } from '../services/excel-service.js';

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Kiểm tra tính thống nhất của dữ liệu so với file mẫu
 */
export function checkDataConsistency(excelData, varList, nameFormat) {
  const warnings = [];

  const dataHeaders = excelData.length > 0 ? Object.keys(excelData[0]).map(h => keepOriginalText(h)) : [];
  const missingCols = [];
  varList.forEach(field => {
    if (!dataHeaders.includes(field)) {
      missingCols.push(field);
    }
  });

  if (missingCols.length > 0) {
    warnings.push({
      type: 'danger',
      title: 'Mất thống nhất cấu trúc biến',
      msg: `File Word mẫu yêu cầu các biến sau nhưng bảng dữ liệu không có cột tương ứng: ${missingCols.map(c => `<code>{{${escapeHtml(c)}}}</code>`).join(', ')}.`
    });
  }

  const normalizedVars = {};
  varList.forEach(v => {
    const norm = v.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!normalizedVars[norm]) normalizedVars[norm] = [];
    if (!normalizedVars[norm].includes(v)) normalizedVars[norm].push(v);
  });

  for (const norm in normalizedVars) {
    if (normalizedVars[norm].length > 1) {
      warnings.push({
        type: 'warning',
        title: 'Không đồng nhất định dạng viết biến trong template',
        msg: `File Word mẫu sử dụng các biến có tên rất giống nhau nhưng viết khác nhau: ${normalizedVars[norm].map(c => `<code>{{${escapeHtml(c)}}}</code>`).join(' và ')}. Bạn nên chỉnh sửa lại để thống nhất cách đặt tên.`
      });
    }
  }

  const emptyCells = [];
  excelData.forEach((row, idx) => {
    const rowNum = idx + 1;
    varList.forEach(field => {
      if (dataHeaders.includes(field)) {
        const val = row[field];
        if (val === undefined || val === null || String(val).trim() === '') {
          emptyCells.push(`Dòng ${rowNum}: Cột <strong>"${escapeHtml(field)}"</strong> đang bỏ trống.`);
        }
      }
    });
  });

  if (emptyCells.length > 0) {
    warnings.push({
      type: 'warning',
      title: 'Dữ liệu bị bỏ trống',
      msg: `Phát hiện các ô dữ liệu bị bỏ trống. Khi xuất, các vị trí này sẽ bị trống trong văn bản:<br><ul style="margin-top: 5px; margin-left: 15px; font-size: 0.8rem; max-height: 120px; overflow-y: auto;">` + emptyCells.map(c => `<li>${c}</li>`).join('') + `</ul>`
    });
  }

  if (excelData.length > 1) {
    const fileNames = new Set();
    const duplicateNames = [];
    excelData.forEach((row, idx) => {
      let rawFileName = nameFormat.replace(/\[(.*?)\]/g, (match, colName) => {
        const v = row[keepOriginalText(colName)];
        return (v !== undefined && v !== '') ? v : 'KhongXacDinh';
      });
      const finalFileName = `${removeVietnameseTones(rawFileName)}.docx`;
      if (fileNames.has(finalFileName)) {
        duplicateNames.push(`Dòng ${idx + 1}: Tạo tên file trùng lặp "<strong>${escapeHtml(finalFileName)}</strong>"`);
      } else {
        fileNames.add(finalFileName);
      }
    });

    if (duplicateNames.length > 0) {
      warnings.push({
        type: 'danger',
        title: 'Trùng lặp tên file kết quả',
        msg: `Một số dòng dữ liệu sẽ tạo ra các file có tên giống nhau, gây đè dữ liệu hoặc khó phân biệt:<br><ul style="margin-top: 5px; margin-left: 15px; font-size: 0.8rem;">` + duplicateNames.map(c => `<li>${c}</li>`).join('') + `</ul>`
      });
    }
  }

  return warnings;
}

/**
 * Kiểm tra lỗi cú pháp ngoặc nhọn trong file mẫu Word
 */
export function checkTemplateBraces(fullText) {
  const warnings = [];
  if (!fullText) return warnings;

  // Nhận diện GUID/UUID hệ thống: ví dụ {909E8E84-426E-40DD-AFC4-6F175D3DCCD1}
  const isGuid = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(str.trim());
  // Nhận diện mã trường Word nội tại: ví dụ { PAGE }, { NUMPAGES }, { MERGEFIELD }
  const isWordFieldCode = (str) => /^(PAGE|NUMPAGES|DATE|TIME|HYPERLINK|MERGEFIELD|TOC|REF|EMBED|LINK|SYMBOL|XE|TC|SEQ|INDEX|AUTOTEXT|INCLUDETEXT|SHAPE|DRAWING)\b/i.test(str.trim());
  // Nhận diện cú pháp mã máy, JSON, CSS
  const isCodeOrJson = (str) => /[:;\\=]/.test(str);

  const singleBraceRegex = /(?<!\{)\{([^{}]+)\}(?!\})/g;
  const singleMatches = [];
  let match;

  while ((match = singleBraceRegex.exec(fullText)) !== null) {
    const rawContent = match[1].trim();
    if (!rawContent) continue;
    // Bỏ qua GUID / UUID hệ thống
    if (isGuid(rawContent)) continue;
    // Bỏ qua mã trường Word Field Code
    if (isWordFieldCode(rawContent)) continue;
    // Bỏ qua cấu trúc mã / JSON
    if (isCodeOrJson(rawContent)) continue;

    // Chỉ coi là biến nghi ngờ nếu có chứa chữ cái (tên biến)
    if (/[a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]/.test(rawContent)) {
      singleMatches.push(`{${rawContent}}`);
    }
  }

  if (singleMatches.length > 0) {
    const uniqueMatches = [...new Set(singleMatches)];
    warnings.push({
      type: 'warning',
      title: 'Lỗi cú pháp ngoặc nhọn đơn',
      msg: `Phát hiện các từ khóa nghi ngờ viết sai cú pháp trong template (chỉ có 1 ngoặc nhọn): ${uniqueMatches.map(m => `<code>${escapeHtml(m)}</code>`).join(', ')}. Hãy sửa thành ngoặc kép dạng <code>{{...}}</code> để template chạy đúng.`
    });
  }

  // Đếm mở/đóng ngoặc: Bỏ qua GUID hệ thống khi tính cân bằng ngoặc
  const cleanTextForBraceCount = fullText.replace(/\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}/gi, '');
  let openCount = 0;
  let closeCount = 0;
  for (let i = 0; i < cleanTextForBraceCount.length; i++) {
    if (cleanTextForBraceCount[i] === '{') openCount++;
    if (cleanTextForBraceCount[i] === '}') closeCount++;
  }
  if (openCount !== closeCount) {
    warnings.push({
      type: 'warning',
      title: 'Mất cân bằng dấu ngoặc nhọn',
      msg: `Tổng số dấu ngoặc nhọn mở và đóng trong file mẫu không khớp nhau (Mở: ${openCount}, Đóng: ${closeCount}). Hãy kiểm tra xem có vị trí nào gõ thiếu ngoặc đóng/mở.`
    });
  }

  return warnings;
}

/**
 * Hiển thị Modal Cảnh báo Không Đồng Nhất
 */
export function showConsistencyWarnings(warnings, onConfirm, onCancel) {
  const listEl = document.getElementById('consistencyWarningList');
  if (!listEl) return;
  
  let html = '';
  warnings.forEach(w => {
    let color = '#2563eb';
    let bg = '#eff6ff';
    let border = '#bfdbfe';
    if (w.type === 'danger') {
      color = '#dc2626';
      bg = '#fee2e2';
      border = '#fecaca';
    } else if (w.type === 'warning') {
      color = '#d97706';
      bg = '#fef3c7';
      border = '#fde68a';
    }

    const iconSvg = w.type === 'danger'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>'
      : (w.type === 'warning'
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>');

    html += `
      <div style="padding: 12px; border-radius: 8px; background: ${bg}; border: 1.5px solid ${border}; color: ${color}; line-height: 1.5; font-size: 0.82rem;">
        <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span style="flex-shrink:0;display:flex;">${iconSvg}</span>
          <span>${escapeHtml(w.title)}</span>
        </div>
        <div style="color: #334155; margin-left: 22px;">${w.msg}</div>
      </div>
    `;
  });

  listEl.innerHTML = html;
  
  const modalEl = document.getElementById('consistencyModal');
  if (!modalEl) return;
  modalEl.classList.add('is-open');
  
  const bypassBtn = document.getElementById('bypassExportConsistencyBtn');
  const cancelBtn = document.getElementById('cancelExportConsistencyBtn');
  const closeBtn = document.getElementById('closeConsistencyBtn');
  
  const handleBypass = () => {
    modalEl.classList.remove('is-open');
    if (onConfirm) onConfirm();
    cleanup();
  };
  
  const handleCancel = () => {
    modalEl.classList.remove('is-open');
    if (onCancel) onCancel();
    cleanup();
  };
  
  const cleanup = () => {
    if (bypassBtn) bypassBtn.removeEventListener('click', handleBypass);
    if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
    if (closeBtn) closeBtn.removeEventListener('click', handleCancel);
  };
  
  if (bypassBtn) bypassBtn.addEventListener('click', handleBypass);
  if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
  if (closeBtn) closeBtn.addEventListener('click', handleCancel);
}

/**
 * Hiển thị Modal Transformers
 */
export function openTransformersModal(templateVars, fieldTransformers) {
  const container = document.getElementById('transformersConfigList');
  if (!container) return;

  if (!templateVars || templateVars.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">Vui lòng chọn hoặc nạp mẫu Word trước để quét các biến.</div>`;
  } else {
    container.innerHTML = templateVars.map(v => {
      const currentTf = fieldTransformers[v] || 'none';
      const safeV = escapeHtml(v);
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:var(--surface-2); border-radius:6px; border:1px solid var(--border);">
          <span style="font-weight:600; font-family:monospace; color:var(--primary);">{{${safeV}}}</span>
          <select class="transformer-select" data-var="${safeV}" style="padding:4px 8px; border-radius:4px; border:1px solid var(--border); font-size:0.8rem;">
            <option value="none" ${currentTf === 'none' ? 'selected' : ''}>— Mặc định (Giữ nguyên) —</option>
            <option value="uppercase" ${currentTf === 'uppercase' ? 'selected' : ''}>Chữ hoa (UPPERCASE)</option>
            <option value="lowercase" ${currentTf === 'lowercase' ? 'selected' : ''}>Chữ thường (lowercase)</option>
            <option value="capitalize" ${currentTf === 'capitalize' ? 'selected' : ''}>Viết Hoa Đầu Từ (Title Case)</option>
            <option value="currency" ${currentTf === 'currency' ? 'selected' : ''}>Định dạng tiền tệ VNĐ (1.000.000 đ)</option>
            <option value="date" ${currentTf === 'date' ? 'selected' : ''}>Định dạng ngày (DD/MM/YYYY)</option>
          </select>
        </div>
      `;
    }).join('');
  }

  const modal = document.getElementById('transformersModal');
  if (modal) modal.classList.add('is-open');
}

/**
 * Render Danh mục Filter Chips
 */
export async function renderCategoryFilterChips(CategoryManager) {
  const bar = document.getElementById('tplCatFilterBar');
  if (!bar) return;
  const cats = await CategoryManager.list();
  const currentActive = bar.querySelector('.cat-chip.active')?.dataset.cat || 'all';

  let html = `
    <button class="cat-chip ${currentActive === 'all' ? 'active' : ''}" data-cat="all">Tất cả</button>
    <button class="cat-chip ${currentActive === 'fav' ? 'active' : ''}" data-cat="fav">⭐ Yêu thích</button>
  `;

  cats.forEach(c => {
    const isActive = currentActive === c.id ? 'active' : '';
    html += `<button class="cat-chip ${isActive}" data-cat="${escapeHtml(c.id)}">${escapeHtml(c.name)}</button>`;
  });

  bar.innerHTML = html;
}

/**
 * Render Select Option Danh mục
 */
export async function renderCategorySelectOptions(CategoryManager) {
  const sel = document.getElementById('tplCategorySelect');
  if (!sel) return;
  const cats = await CategoryManager.list();
  sel.innerHTML = cats.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
}

/**
 * Render Danh mục trong Modal Quản lý
 */
export async function renderCategoryManagerList(CategoryManager) {
  const container = document.getElementById('categoryListContainer');
  if (!container) return;
  const cats = await CategoryManager.list();
  
  container.innerHTML = cats.map(c => {
    const isDefaultKhac = c.id === 'khac';
    const safeId = escapeHtml(c.id);
    const safeName = escapeHtml(c.name);
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:var(--surface-2); border-radius:6px; border:1px solid var(--border);">
        <span style="font-weight:600; font-size:0.88rem; color:var(--text);">${safeName}</span>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary btn-rename-cat" data-id="${safeId}" data-name="${safeName}" style="font-size:0.75rem; padding:4px 8px;">Sửa tên</button>
          ${!isDefaultKhac ? `<button class="btn btn-secondary btn-del-cat" data-id="${safeId}" data-name="${safeName}" style="font-size:0.75rem; padding:4px 8px; color:var(--error);">Xóa</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Lịch sử Xuất
 */
export async function renderHistoryList(HistoryManager) {
  const container = document.getElementById('historyListContainer');
  if (!container) return;
  const history = await HistoryManager.list();
  if (history.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">Chưa có lịch sử xuất nào được ghi nhận.</div>`;
    return;
  }
  container.innerHTML = history.map(h => {
    const d = new Date(h.exportAt);
    const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const fmtTag = (h.format || 'docx').toUpperCase();
    const safeId = escapeHtml(h.id);
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 15px; border-bottom:1px solid var(--border); background:var(--surface); border-radius:6px; margin-bottom:6px;">
        <div>
          <div style="font-weight:600; font-size:0.9rem; color:var(--text);">${escapeHtml(h.templateName || 'Văn bản hàng loạt')} <span style="font-size:0.75rem; font-weight:700; padding:2px 6px; border-radius:4px; background:var(--primary-light); color:var(--primary); margin-left:6px;">${fmtTag}</span></div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">Thời gian: ${dateStr} • Số lượng: <b>${h.count || 0} file</b> • ${formatBytes(h.size || 0)}</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-redownload-zip" data-id="${safeId}" style="font-size:0.78rem; padding:6px 12px; font-weight:600; border:1px solid var(--primary); color:var(--primary);">Tải Lại ZIP</button>
          <button class="btn btn-secondary btn-del-history" data-id="${safeId}" style="font-size:0.78rem; padding:6px 10px; color:var(--error);">&times;</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Danh sách Mẫu Word trong Thư viện
 */
export async function renderTemplateList(TemplateManager, CategoryManager) {
  const templates = await TemplateManager.list();
  const cats = await CategoryManager.list();
  const catMap = {};
  cats.forEach(c => catMap[c.id] = c.name);

  const filterQuery = (document.getElementById('tplSearchInput')?.value || '').toLowerCase().trim();
  const activeCatBtn = document.querySelector('#tplCatFilterBar .cat-chip.active');
  const activeCat = activeCatBtn ? activeCatBtn.dataset.cat : 'all';

  let entries = Object.values(templates).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  
  if (activeCat === 'fav') {
    entries = entries.filter(t => t.isFavorite);
  } else if (activeCat && activeCat !== 'all') {
    entries = entries.filter(t => (t.category || 'khac') === activeCat);
  }

  if (filterQuery) {
    entries = entries.filter(t => (t.name || '').toLowerCase().includes(filterQuery));
  }
  const count = Object.keys(templates).length;

  const countEl = document.getElementById('tplCount');
  if (countEl) countEl.textContent = `${count} / ${MAX_TEMPLATES}`;

  const listEl = document.getElementById('templateList');
  if (!listEl) return;

  if (entries.length === 0) {
    listEl.innerHTML = `<div class="tpl-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 1-2 2v13c0 1.1.9 2 2 2Z"/></svg><div>Chưa có mẫu nào phù hợp.<br>Tải lên mẫu bên dưới để bắt đầu.</div></div>`;
  } else {
    listEl.innerHTML = entries.map(t => {
      const safeName = escapeHtml(t.name);
      const isFav = !!t.isFavorite;
      const catText = escapeHtml(catMap[t.category] || 'Khác');
      return `
        <div class="tpl-item" data-name="${safeName}">
          <button class="tpl-star-btn ${isFav ? 'is-fav' : ''}" data-name="${safeName}" title="${isFav ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          <span class="tpl-name" title="${safeName}">${safeName} <br><small style="color:var(--primary);font-weight:500">[${catText}]</small></span>
          <span class="tpl-size">${formatBytes(t.size)}</span>
          <button class="tpl-download" data-name="${safeName}" title="Tải file mẫu (.docx) về máy"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
          <button class="tpl-rename" data-name="${safeName}" title="Đổi tên"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
          <button class="tpl-del" data-name="${safeName}" title="Xóa"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
        </div>
      `;
    }).join('');
  }

  const sel = document.getElementById('tplLibSelect');
  if (sel) {
    sel.innerHTML = Object.keys(templates).length === 0
      ? '<option value="">— Chưa có mẫu nào trong thư viện —</option>'
      : Object.values(templates).map(t => `<option value="${escapeHtml(t.name)}">${escapeHtml(t.name)} (${formatBytes(t.size)})</option>`).join('');
  }

  const totalSize = await TemplateManager.totalSize();
  const percent = Math.min(100, (totalSize / (100 * 1024 * 1024)) * 100);
  const fillEl = document.getElementById('storageFill');
  if (fillEl) fillEl.style.width = `${percent}%`;
  const usedEl = document.getElementById('storageUsed');
  if (usedEl) usedEl.textContent = `${formatBytes(totalSize)} / ~100 MB`;
}

/**
 * Render Danh sách Nguồn dữ liệu trong Thư viện
 */
export async function renderDataList(DataManager) {
  const sources = await DataManager.list();
  const filterQuery = (document.getElementById('dataSearchInput')?.value || '').toLowerCase().trim();
  
  let entries = Object.values(sources).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  if (filterQuery) {
    entries = entries.filter(s => (s.name || '').toLowerCase().includes(filterQuery) || (s.sheetName || '').toLowerCase().includes(filterQuery));
  }
  const count = Object.keys(sources).length;

  const countEl = document.getElementById('dataCount');
  if (countEl) countEl.textContent = `${count} / ${MAX_DATA_SOURCES}`;

  const listEl = document.getElementById('dataList');
  if (!listEl) return;

  if (entries.length === 0) {
    listEl.innerHTML = `<div class="tpl-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><div>Chưa có dữ liệu nào được lưu.<br>Thêm mới bên dưới để bắt đầu.</div></div>`;
  } else {
    listEl.innerHTML = entries.map(s => {
      const safeId = escapeHtml(s.id);
      let cleanDisplayName = s.name;
      if (cleanDisplayName === 'Google Sheet (Mặc định)') cleanDisplayName = 'Google Sheet';
      const safeName = escapeHtml(cleanDisplayName);
      const isExcelLink = s.type === 'excel_link';
      const isLocalFile = s.type === 'local_file';
      const isLegacyLocal = s.type === 'local';
      
      let iconSvg = '';
      let subText = '';
      if (isLocalFile) {
        const isDocx = (s.fileName || '').toLowerCase().endsWith('.docx');
        if (isDocx) {
          iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
          subText = `<span style="color:#2563eb;font-weight:600">Bảng Word Máy</span> • ${escapeHtml(s.fileName || 'Docx')}`;
        } else {
          iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
          subText = `<span style="color:#2563eb;font-weight:600">File Máy Tính</span> • ${escapeHtml(s.fileName || 'Excel')} (Sheet: ${escapeHtml(s.sheetName || 'Mặc định')})`;
        }
      } else if (isExcelLink) {
        const isDocx = (s.name || s.link || '').toLowerCase().includes('.docx') || (s.sheetName || '').toLowerCase().includes('docx');
        if (isDocx) {
          iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
          subText = `<span style="color:#8b5cf6;font-weight:600">Link Bảng Word</span> • Trực tuyến`;
        } else {
          iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
          subText = `<span style="color:#8b5cf6;font-weight:600">Link Excel</span> • Sheet: ${escapeHtml(s.sheetName || 'Mặc định')}`;
        }
      } else if (isLegacyLocal) {
        iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>';
        subText = `<span style="color:#64748b;font-weight:600">File lưu</span> • ${s.data ? s.data.length : 0} hàng`;
      } else {
        iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
        subText = `<span style="color:#10b981;font-weight:600">Google Sheets</span> • ${s.sheetName ? `Sheet: ${escapeHtml(s.sheetName)}` : 'Trực tuyến'}`;
      }

      return `
        <div class="tpl-item" data-id="${safeId}">
          <span class="tpl-icon">${iconSvg}</span>
          <span class="tpl-name" title="${safeName}">${safeName} <br><small style="color:var(--text-muted);font-weight:400">${subText}</small></span>
          <button class="tpl-del-data" data-id="${safeId}" title="Xóa"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
        </div>
      `;
    }).join('');
  }

  const sel = document.getElementById('dataLibSelect');
  if (sel) {
    sel.innerHTML = Object.keys(sources).length === 0
      ? '<option value="">- Chưa có dữ liệu trong thư viện -</option>'
      : Object.values(sources).map(s => {
          let typeLabel = 'Google Sheets';
          if (s.type === 'local_file') {
            const isDocx = (s.fileName || '').toLowerCase().endsWith('.docx');
            typeLabel = isDocx ? `Bảng Word máy: ${s.fileName}` : `File máy: ${s.fileName || s.sheetName || 'Mặc định'}`;
          } else if (s.type === 'excel_link') {
            const isDocx = (s.name || s.link || '').toLowerCase().includes('.docx') || (s.sheetName || '').toLowerCase().includes('docx');
            typeLabel = isDocx ? 'Link Docx' : 'Link Excel';
          } else if (s.type === 'local') {
            typeLabel = `${s.data?.length || 0} hàng`;
          } else {
            typeLabel = s.sheetName ? `Sheet: ${s.sheetName}` : 'Google Sheets';
          }
          return `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} [${escapeHtml(typeLabel)}]</option>`;
        }).join('');
  }
}

/**
 * Mở Modal Rà Soát Mẫu Văn Bản & Tạo Cột Dữ Liệu
 */
export function openTemplateAuditModal({
  varList = [],
  fullText = '',
  templateName = 'Mẫu văn bản',
  onExportExcel,
  onExportDocx,
  onExportGoogleSheet
}) {
  const modal = document.getElementById('templateAuditModal');
  if (!modal) return;

  const tplNameEl = document.getElementById('auditTplName');
  if (tplNameEl) tplNameEl.textContent = templateName;

  const varCountEl = document.getElementById('auditVarCount');
  if (varCountEl) varCountEl.textContent = `${varList.length} biến`;

  // Kiểm tra cú pháp ngoặc nhọn
  const warnings = checkTemplateBraces(fullText);
  const warnBox = document.getElementById('auditWarningBox');
  const warnText = document.getElementById('auditWarningText');

  if (warnBox && warnText) {
    if (warnings.length > 0) {
      warnBox.style.display = 'block';
      warnText.innerHTML = warnings.map(w => `<div>• <b>${escapeHtml(w.title)}:</b> ${w.msg}</div>`).join('');
    } else {
      warnBox.style.display = 'none';
      warnText.innerHTML = '';
    }
  }

  // Render danh sách biến
  const listEl = document.getElementById('auditVarList');
  if (listEl) {
    if (varList.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">Không tìm thấy biến số {{...}} nào trong file mẫu.</div>`;
    } else {
      listEl.innerHTML = `
        <table class="audit-table">
          <thead>
            <tr>
              <th style="width:45px; text-align:center;">STT</th>
              <th>Thẻ Biến Trong Mẫu</th>
              <th>Tên Cột Dữ Liệu</th>
              <th>Dữ Liệu Mẫu Gợi Ý</th>
            </tr>
          </thead>
          <tbody>
            ${varList.map((v, i) => `
              <tr>
                <td style="text-align:center; color:var(--text-muted); font-size:12px;">${i + 1}</td>
                <td><code class="audit-badge-code">{{${escapeHtml(v)}}}</code></td>
                <td><b>${escapeHtml(v)}</b></td>
                <td style="color:var(--text-muted); font-style:italic;">${escapeHtml(buildSampleDataRow([v])[0])}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }

  // Helper đọc options
  function getOptions() {
    const includeSTT = document.getElementById('auditOptSTT')?.checked !== false;
    const includeCheckDL = document.getElementById('auditOptCheckDL')?.checked !== false;
    const sampleRows = 1;
    return { includeSTT, includeCheckDL, sampleRows, templateName };
  }

  const guideBox = document.getElementById('auditSheetGuideBox');
  if (guideBox) guideBox.style.display = 'none';

  const closeGuideBoxBtn = document.getElementById('closeAuditSheetGuideBtn');
  if (closeGuideBoxBtn) {
    closeGuideBoxBtn.onclick = () => {
      if (guideBox) guideBox.style.display = 'none';
    };
  }

  // Gắn sự kiện nút xuất
  const btnExcel = document.getElementById('auditExportExcelBtn');
  const btnDocx = document.getElementById('auditExportDocxBtn');
  const btnSheet = document.getElementById('auditExportSheetBtn');

  if (btnExcel) {
    btnExcel.onclick = () => {
      if (onExportExcel) onExportExcel(varList, getOptions());
    };
  }

  if (btnDocx) {
    btnDocx.onclick = () => {
      if (onExportDocx) onExportDocx(varList, getOptions());
    };
  }

  if (btnSheet) {
    btnSheet.onclick = () => {
      if (guideBox) {
        guideBox.style.display = 'block';
        try { guideBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e) {}
      }
      if (onExportGoogleSheet) onExportGoogleSheet(varList, getOptions());
    };
  }

  // Đóng modal
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.style.display = 'none';
    if (guideBox) guideBox.style.display = 'none';
  };

  const closeBtnHeader = document.getElementById('closeAuditModalBtn');
  if (closeBtnHeader) {
    closeBtnHeader.onclick = closeModal;
  }
  const closeBtnFooter = document.getElementById('closeAuditModalFooterBtn');
  if (closeBtnFooter) {
    closeBtnFooter.onclick = closeModal;
  }

  modal.classList.add('is-open');
  modal.style.display = 'flex';
}
