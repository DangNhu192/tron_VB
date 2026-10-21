'use strict';

import { showToast } from './toast.js';

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
 * Render Bảng Xem Trước dữ liệu trong Modal
 */
export function renderPreviewTable(state) {
  const tableEl = document.getElementById('previewDataTable');
  if (!tableEl) return;

  const {
    headers = [],
    rawData = [],
    templateVars = [],
    fieldTransformers = {},
    isOnlyErrorsFilter = false
  } = state;

function getColumnMinWidth(colName) {
  if (!colName) return 150;
  const lower = String(colName).toLowerCase();
  if (/địa chỉ|diachi|nơi ở|hộ khẩu|ghichu|ghi chú|nội dung|trích yếu|mô tả|lydo|lý do/.test(lower)) {
    return 280;
  }
  if (/họ và tên|họ tên|hoten|người|cơ quan|đơn vị|chức vụ|phòng ban|tiêu đề/.test(lower)) {
    return 200;
  }
  if (/ngày|date|tháng|năm|sdt|điện thoại|phone|cmnd|cccd|mã|code|số|id|stt/.test(lower)) {
    return 130;
  }
  return 160;
}

  const searchQuery = (document.getElementById('previewSearchInput')?.value || '').toLowerCase().trim();

  let headerHtml = '<tr>';
  headerHtml += `
    <th class="col-select" title="Chọn tất cả">
      <input type="checkbox" id="selectVisiblePreviewRows" aria-label="Chọn các dòng đang hiển thị" style="cursor:pointer; accent-color:var(--primary);">
    </th>
    <th class="col-stt">#</th>
  `;
  
  headers.forEach(h => {
    const transformer = fieldTransformers[h];
    const tfBadge = transformer && transformer !== 'none' 
      ? `<span class="tf-badge">${escapeHtml(transformer)}</span>` 
      : '';
    const minW = getColumnMinWidth(h);
    headerHtml += `<th style="min-width:${minW}px;">${escapeHtml(h)} ${tfBadge}</th>`;
  });
  headerHtml += `<th class="col-action">Hành động</th></tr>`;

  let indexedRows = rawData.map((row, originalIdx) => ({ row, originalIdx }));

  if (searchQuery) {
    indexedRows = indexedRows.filter(({ row }) => {
      return Object.values(row).some(v => String(v || '').toLowerCase().includes(searchQuery));
    });
  }

  if (isOnlyErrorsFilter && templateVars.length > 0) {
    indexedRows = indexedRows.filter(({ row }) => {
      return templateVars.some(v => !row[v] || String(row[v]).trim() === '');
    });
  }

  let rowsHtml = '';
  indexedRows.forEach(({ row, originalIdx }) => {
    const isHasEmptyCell = templateVars.some(v => !row[v] || String(row[v]).trim() === '');
    const rowBgStyle = isHasEmptyCell ? 'background-color: #fffbeb;' : '';

    rowsHtml += `<tr class="preview-row" data-row-idx="${originalIdx}" style="${rowBgStyle}">`;
    rowsHtml += `
      <td class="col-select">
        <input type="checkbox" class="row-select-checkbox" aria-label="Chọn dòng ${originalIdx + 1}" ${state.excludedRows?.has(row) ? '' : 'checked'} style="cursor:pointer; accent-color:var(--primary);">
      </td>
      <td class="col-stt" style="font-weight:600; color:var(--text-muted);">
        ${originalIdx + 1}
      </td>
    `;

    headers.forEach(h => {
      const val = row[h] !== undefined ? String(row[h]) : '';
      const isMissing = templateVars.includes(h) && !val.trim();
      const inputStyle = isMissing ? 'border-color:#fca5a5; background:#fef2f2;' : '';
      const minW = getColumnMinWidth(h);
      rowsHtml += `
        <td style="min-width:${minW}px;">
          <input type="text" class="preview-input" data-col="${escapeHtml(h)}" value="${escapeHtml(val)}" title="${escapeHtml(val)}" style="${inputStyle}; min-width:${minW - 20}px;">
        </td>
      `;
    });

    rowsHtml += `
      <td class="col-action" style="display:flex; gap:4px; justify-content:center; align-items:center;">
        <button class="btn-export-single" data-row-idx="${originalIdx}" title="Xuất file đơn này" style="background:none; border:none; color:var(--primary); cursor:pointer; padding:4px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="btn-del-row" title="Xóa dòng này" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:4px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </td>
    </tr>`;
  });

  if (!indexedRows.length) {
    rowsHtml = `<tr><td colspan="${headers.length + 3}" class="table-empty">Không có dòng phù hợp. Hãy đổi từ khóa hoặc tắt bộ lọc cảnh báo.</td></tr>`;
  }
  tableEl.innerHTML = headerHtml + rowsHtml;

  const statsBadge = document.getElementById('previewStatsBadge');
  if (statsBadge) {
    statsBadge.textContent = `${indexedRows.length} / ${rawData.length} hàng`;
  }

  updateSelectionControls(state);
  for (const id of ['selectVisiblePreviewRows', 'selectAllPreviewRows']) {
    const cb = document.getElementById(id);
    if (cb) cb.onchange = () => {
      document.querySelectorAll('.preview-row').forEach(tr => {
        const item = tr.querySelector('.row-select-checkbox');
        item.checked = cb.checked;
        const row = state.rawData[Number(tr.dataset.rowIdx)];
        if (cb.checked) state.excludedRows?.delete(row);
        else state.excludedRows?.add(row);
      });
      updateSelectionControls(state);
    };
  }
}

function updateSelectionControls(state) {
  const cbs = Array.from(document.querySelectorAll('.row-select-checkbox'));
  const selected = cbs.filter(cb => cb.checked).length;
  for (const id of ['selectVisiblePreviewRows', 'selectAllPreviewRows']) {
    const cb = document.getElementById(id);
    if (!cb) continue;
    cb.checked = cbs.length > 0 && selected === cbs.length;
    cb.indeterminate = selected > 0 && selected < cbs.length;
    cb.disabled = cbs.length === 0;
  }
  const stats = document.getElementById('previewStatsBadge');
  if (stats) stats.textContent = `Hiện ${cbs.length}/${state.rawData.length} dòng · Chọn ${selected}`;
  const exportBtn = document.getElementById('confirmExportBtn');
  if (exportBtn) exportBtn.disabled = selected === 0;
}

/**
 * Thu thập dữ liệu đã sửa từ các hàng được chọn
 */
export function getEditedData() {
  const rows = document.querySelectorAll('.preview-row');
  const data = [];
  rows.forEach(row => {
    const cb = row.querySelector('.row-select-checkbox');
    if (cb && !cb.checked) return;

    const rowObj = {};
    const inputs = row.querySelectorAll('.preview-input');
    inputs.forEach(input => {
      const col = input.dataset.col;
      rowObj[col] = input.value;
    });
    data.push(rowObj);
  });
  return data;
}

/**
 * Xử lý dán dữ liệu nhiều ô từ clipboard (TSV)
 */
export function handleTablePaste(event, currentInput, state, onRender) {
  const clipboardText = event.clipboardData ? event.clipboardData.getData('text/plain') : '';
  if (!clipboardText || (!clipboardText.includes('\t') && !clipboardText.includes('\n'))) {
    return; // Dán 1 ô thông thường
  }

  event.preventDefault();

  const lines = clipboardText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  if (lines.length === 0) return;

  const currentRow = currentInput.closest('.preview-row');
  if (!currentRow) return;
  const startRowIdx = parseInt(currentRow.dataset.rowIdx, 10);
  const startCol = currentInput.dataset.col;
  const startColIdx = state.headers.indexOf(startCol);

  if (isNaN(startRowIdx) || startColIdx === -1) return;

  let pastedColsCount = 0;
  lines.forEach((line, rIdx) => {
    const targetRowIdx = startRowIdx + rIdx;
    while (targetRowIdx >= state.rawData.length) {
      const emptyRow = {};
      state.headers.forEach(h => emptyRow[h] = '');
      state.rawData.push(emptyRow);
    }

    const cells = line.split('\t');
    pastedColsCount = Math.max(pastedColsCount, cells.length);
    cells.forEach((cellVal, cIdx) => {
      const targetColIdx = startColIdx + cIdx;
      if (targetColIdx < state.headers.length) {
        const colHeader = state.headers[targetColIdx];
        state.rawData[targetRowIdx][colHeader] = cellVal;
      }
    });
  });

  if (onRender) onRender();
  showToast(`Đã dán thành công ${lines.length} dòng x ${pastedColsCount} cột từ bảng tính!`, "success");
}

/**
 * Đồng bộ tất cả giá trị input đang hiển thị trên bảng về state.rawData
 */
export function syncInputsToRawData(state) {
  if (!state || !state.rawData) return [];
  const rows = document.querySelectorAll('.preview-row');
  rows.forEach(row => {
    const rowIdx = parseInt(row.dataset.rowIdx, 10);
    if (!isNaN(rowIdx) && state.rawData[rowIdx]) {
      const inputs = row.querySelectorAll('.preview-input');
      inputs.forEach(input => {
        const col = input.dataset.col;
        if (col) {
          state.rawData[rowIdx][col] = input.value;
        }
      });
    }
  });
  return state.rawData;
}

/**
 * Gắn listeners cho bảng xem trước
 */
export function setupPreviewTableListeners(tableEl, stateOrProvider, onRender, onExportSingle, onDataChange) {
  if (!tableEl) return;
  const getState = () => typeof stateOrProvider === 'function' ? stateOrProvider() : stateOrProvider;

  tableEl.addEventListener('change', event => {
    if (!event.target.matches('.row-select-checkbox')) return;
    const state = getState();
    const row = state.rawData[Number(event.target.closest('.preview-row').dataset.rowIdx)];
    if (event.target.checked) state.excludedRows?.delete(row);
    else state.excludedRows?.add(row);
    updateSelectionControls(state);
  });

  tableEl.addEventListener('input', (event) => {
    const state = getState();
    const input = event.target.closest('.preview-input');
    if (input) {
      const tr = input.closest('.preview-row');
      if (!tr) return;
      const rowIdx = parseInt(tr.dataset.rowIdx, 10);
      const col = input.dataset.col;
      if (!isNaN(rowIdx) && state.rawData[rowIdx] && col) {
        state.rawData[rowIdx][col] = input.value;
        if (onDataChange) onDataChange();
      }
    }
  });

  tableEl.addEventListener('paste', (event) => {
    const state = getState();
    const input = event.target.closest('.preview-input');
    if (input) {
      handleTablePaste(event, input, state, () => {
        if (onRender) onRender();
        if (onDataChange) onDataChange();
      });
    }
  });

  tableEl.addEventListener('click', (event) => {
    const state = getState();
    const btnDel = event.target.closest('.btn-del-row');
    if (btnDel) {
      const tr = btnDel.closest('tr');
      const rowIdx = parseInt(tr.dataset.rowIdx, 10);
      if (!isNaN(rowIdx)) {
        state.excludedRows?.delete(state.rawData[rowIdx]);
        state.rawData.splice(rowIdx, 1);
        if (onRender) onRender();
        if (onDataChange) onDataChange();
      }
      return;
    }

    const btnExportSingle = event.target.closest('.btn-export-single');
    if (btnExportSingle && onExportSingle) {
      const tr = btnExportSingle.closest('tr');
      const rowIdx = parseInt(tr.dataset.rowIdx, 10);
      if (!isNaN(rowIdx)) {
        onExportSingle(rowIdx, btnExportSingle);
      }
    }
  });
}
