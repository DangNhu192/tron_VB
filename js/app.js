// AutoDoc Pro - Main Application Controller
'use strict';

import {
  safeStorage,
  TemplateManager,
  DataManager,
  CategoryManager,
  HistoryManager,
  exportLibraryBackup,
  importLibraryBackup
} from './core/storage.js';

import {
  base64ToBuffer,
  DATA_SOURCES_KEY,
  TEMPLATES_KEY
} from './core/constants.js';

import {
  keepOriginalText
} from './core/charset.js';

import {
  prepareTemplateZip,
  extractVariablesFromDocxZip
} from './core/docx-xml.js';

import {
  parseLocalDataFile,
  generateSampleExcelFromTemplate,
  generateSampleDocxFromTemplate,
  generateGoogleSheetTemplate,
  exportPreviewDataToExcel,
  isDataModified
} from './services/excel-service.js';

import {
  GoogleSheetsManager,
  openDrivePicker,
  initGoogleDrivePickerListeners
} from './services/google-sheets.js';

import {
  createBatchWorker,
  executeBatchJob,
  terminateBatchWorker
} from './services/worker-client.js';

import {
  pickLocalExcelFile,
  saveFileHandle,
  getFileFromHandle,
  deleteFileHandle
} from './services/file-system.js';

import { showToast } from './ui/toast.js';
import { setupFileDropzones } from './ui/file-drop.js';
import { setupDialogAccessibility } from './ui/dialogs.js';
import { initTheme, toggleTheme } from './ui/theme.js';

import {
  renderPreviewTable,
  getEditedData,
  syncInputsToRawData,
  setupPreviewTableListeners
} from './ui/preview-table.js';

import {
  checkDataConsistency,
  checkTemplateBraces,
  showConsistencyWarnings,
  openTransformersModal,
  openTemplateAuditModal,
  renderCategoryFilterChips,
  renderCategorySelectOptions,
  renderCategoryManagerList,
  renderHistoryList,
  renderTemplateList,
  renderDataList
} from './ui/modals.js';

// Application State
let currentTemplateVars = [];
let currentTemplateText = '';
let currentPreviewHeaders = [];

// Unicode NFC for Word, without guessing legacy encodings or trimming source data.
function normalizeRowsForWord(rows) {
  return rows.map(row => {
    const normalizedRow = {};
    for (const [key, value] of Object.entries(row)) {
      normalizedRow[key] = typeof value === 'string' ? value.normalize('NFC') : value;
    }
    return normalizedRow;
  });
}
let currentPreviewRawData = [];
const excludedPreviewRows = new Set();
let previewCopyId = null;
let savedPreviewSnapshot = null;
let currentExcelWorkbook = null;
let fieldTransformers = {};
let isOnlyErrorsFilter = false;
let activeWorker = null;
let onConfirmExportCallback = null;
let activeDataSourceOrigin = null;

function checkAndDisplayModifiedState() {
  const badge = document.getElementById('previewModifiedBadge');
  if (!badge) return;
  if (activeDataSourceOrigin && isDataModified(activeDataSourceOrigin.originalData, currentPreviewRawData)) {
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

function getPreviewState() {
  return {
    headers: currentPreviewHeaders,
    rawData: currentPreviewRawData,
    templateVars: currentTemplateVars,
    fieldTransformers,
    isOnlyErrorsFilter,
    excludedRows: excludedPreviewRows
  };
}

function refreshPreviewTable() {
  renderPreviewTable(getPreviewState());
  checkAndDisplayModifiedState();
}

function showPreviewModal(headers, rowsData) {
  previewCopyId = null;
  savedPreviewSnapshot = null;
  excludedPreviewRows.clear();
  isOnlyErrorsFilter = false;
  const search = document.getElementById('previewSearchInput');
  if (search) search.value = '';
  document.getElementById('toggleEmptyErrorBtn')?.classList.remove('active');
  currentPreviewHeaders = headers;
  currentPreviewRawData = rowsData;
  refreshPreviewTable();
  const badge = document.getElementById('previewModifiedBadge');
  if (badge) badge.style.display = 'none';
  const modal = document.getElementById('dataPreviewModal');
  if (modal) modal.classList.add('is-open');
  const live = Boolean(activeDataSourceOrigin?.isGoogleSheet);
  const reload = document.getElementById('reloadSheetPreviewBtn');
  const freshness = document.getElementById('sheetFreshness');
  if (reload) reload.style.display = live ? 'inline-flex' : 'none';
  if (freshness) {
    freshness.style.display = live ? 'inline' : 'none';
    freshness.textContent = live ? `Đọc từ Google Sheets lúc ${new Date(activeDataSourceOrigin.fetchedAt).toLocaleTimeString('vi-VN')}` : '';
  }
}

// Save an explicit library copy; exporting must not overwrite the original file.
async function savePreviewCopy() {
  syncInputsToRawData(getPreviewState());
  if (!currentPreviewRawData.length) return;
  previewCopyId ||= 'data_copy_' + Date.now();
  const snapshot = JSON.stringify(currentPreviewRawData);
  await DataManager.save(previewCopyId, {
    name: (activeDataSourceOrigin?.name || 'Dữ liệu') + ' (Bản sao chỉnh sửa)',
    type: 'local',
    data: JSON.parse(snapshot)
  });
  savedPreviewSnapshot = snapshot;
  await renderDataList(DataManager);
  showToast('Đã lưu bản sao dữ liệu vào thư viện. File gốc được giữ nguyên.', 'success');
}

async function reloadSheetPreview() {
  const origin = activeDataSourceOrigin;
  if (!origin?.isGoogleSheet || !origin.link) return;
  syncInputsToRawData(getPreviewState());
  const before = JSON.stringify(currentPreviewRawData);
  if (isDataModified(origin.originalData, currentPreviewRawData) && savedPreviewSnapshot !== before) {
    showToast('Bạn đã chỉnh sửa dữ liệu xem trước. Hãy lưu bản sao trước khi cập nhật từ Google Sheets.', 'warning');
    return;
  }
  const button = document.getElementById('reloadSheetPreviewBtn');
  const confirm = document.getElementById('confirmExportBtn');
  button.disabled = true;
  if (confirm) confirm.disabled = true;
  try {
    const data = await GoogleSheetsManager.importLinkSheet(origin.link, origin.sheetName);
    if (activeDataSourceOrigin !== origin || !document.getElementById('dataPreviewModal').classList.contains('is-open')) return;
    if (JSON.stringify(currentPreviewRawData) !== before) {
      showToast('Dữ liệu vừa được chỉnh sửa trong lúc tải. Giữ nguyên bản xem trước để tránh mất thay đổi.', 'warning');
      return;
    }
    origin.originalData = JSON.parse(JSON.stringify(data));
    origin.fetchedAt = Date.now();
    showPreviewModal(Object.keys(data[0]), data);
    showToast(`Đã lấy dữ liệu mới từ Google Sheets (${data.length} dòng).`, 'success');
  } catch (err) {
    showToast(`Chưa cập nhật được Google Sheets: ${err.message}. Bản xem trước được giữ nguyên.`, 'error');
  } finally {
    button.disabled = false;
    if (confirm) confirm.disabled = getEditedData().length === 0;
  }
}

function switchSource(source) {
  const isLib = source === 'library';
  const srcLibBtn = document.getElementById('srcLibBtn');
  const srcUploadBtn = document.getElementById('srcUploadBtn');
  const srcLibPanel = document.getElementById('srcLibPanel');
  const srcUploadPanel = document.getElementById('srcUploadPanel');

  if (srcLibBtn) srcLibBtn.classList.toggle('active', isLib);
  if (srcUploadBtn) srcUploadBtn.classList.toggle('active', !isLib);
  if (srcLibPanel) srcLibPanel.style.display = isLib ? 'block' : 'none';
  if (srcUploadPanel) srcUploadPanel.style.display = isLib ? 'none' : 'block';
}

function switchDataSource(sourceType) {
  const linkTab = document.getElementById('dataSrcLinkBtn');
  const excelLinkTab = document.getElementById('dataSrcExcelLinkBtn');
  const localTab = document.getElementById('dataSrcLocalBtn');
  const linkPanel = document.getElementById('dataSrcLinkPanel');
  const excelLinkPanel = document.getElementById('dataSrcExcelLinkPanel');
  const localPanel = document.getElementById('dataSrcLocalPanel');

  const isSheets = sourceType === 'link' || sourceType === 'sheets';
  const isExcel = sourceType === 'excel';
  const isLocal = sourceType === 'local';

  if (linkTab) linkTab.classList.toggle('active', isSheets);
  if (excelLinkTab) excelLinkTab.classList.toggle('active', isExcel);
  if (localTab) localTab.classList.toggle('active', isLocal);

  if (linkPanel) linkPanel.style.display = isSheets ? 'block' : 'none';
  if (excelLinkPanel) excelLinkPanel.style.display = isExcel ? 'block' : 'none';
  if (localPanel) localPanel.style.display = isLocal ? 'block' : 'none';
}

window.switchDataSource = switchDataSource;
window.switchSource = switchSource;

function bindFileNameDisplay(inputId, nameElId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.addEventListener('change', function () {
      const nameEl = document.getElementById(nameElId);
      if (nameEl) {
        nameEl.textContent = this.files[0] ? `Đã chọn: ${this.files[0].name}` : '';
      }
    });
  }
}

async function handleAuditTemplate() {
  try {
    let vars = [];
    let fullText = '';
    let tplName = 'Mẫu văn bản';

    const srcLibBtnEl = document.getElementById('srcLibBtn');
    const isLibSource = srcLibBtnEl ? srcLibBtnEl.classList.contains('active') : true;

    if (isLibSource) {
      const tplSelectEl = document.getElementById('tplLibSelect');
      const selectedTpl = tplSelectEl ? tplSelectEl.value : '';
      if (!selectedTpl) {
        // Kiểm tra xem người dùng có nạp file ở tab upload không
        const docTemplateEl = document.getElementById('docTemplate');
        const docFile = docTemplateEl ? docTemplateEl.files[0] : null;
        if (docFile) {
          switchSource('upload');
          tplName = docFile.name;
          const docBuffer = await docFile.arrayBuffer();
          const { zip } = prepareTemplateZip(docBuffer, false);
          const extracted = extractVariablesFromDocxZip(zip);
          vars = extracted.varList;
          fullText = extracted.fullText;
          currentTemplateVars = vars;
          currentTemplateText = fullText;
        } else {
          showToast('Vui lòng chọn một mẫu từ Thư viện hoặc chuyển sang "Tải File Lên" để chọn file .docx trước khi rà soát.', 'warning');
          return;
        }
      } else {
        tplName = selectedTpl;
        const docBuffer = await TemplateManager.getBuffer(selectedTpl);
        const { zip } = prepareTemplateZip(docBuffer, false);
        const extracted = extractVariablesFromDocxZip(zip);
        vars = extracted.varList;
        fullText = extracted.fullText;
        currentTemplateVars = vars;
        currentTemplateText = fullText;
      }
    } else {
      const docTemplateEl = document.getElementById('docTemplate');
      const docFile = docTemplateEl ? docTemplateEl.files[0] : null;
      if (!docFile) {
        // Kiểm tra nếu có mẫu được chọn bên thư viện
        const tplSelectEl = document.getElementById('tplLibSelect');
        const selectedTpl = tplSelectEl ? tplSelectEl.value : '';
        if (selectedTpl) {
          switchSource('library');
          tplName = selectedTpl;
          const docBuffer = await TemplateManager.getBuffer(selectedTpl);
          const { zip } = prepareTemplateZip(docBuffer, false);
          const extracted = extractVariablesFromDocxZip(zip);
          vars = extracted.varList;
          fullText = extracted.fullText;
          currentTemplateVars = vars;
          currentTemplateText = fullText;
        } else {
          showToast('Vui lòng kéo thả hoặc chọn file Word (.docx) mẫu trước khi rà soát.', 'warning');
          return;
        }
      } else {
        tplName = docFile.name;
        const docBuffer = await docFile.arrayBuffer();
        const { zip } = prepareTemplateZip(docBuffer, false);
        const extracted = extractVariablesFromDocxZip(zip);
        vars = extracted.varList;
        fullText = extracted.fullText;
        currentTemplateVars = vars;
        currentTemplateText = fullText;
      }
    }

    if (!vars || vars.length === 0) {
      showToast('File Word mẫu không chứa thẻ biến số {{...}} nào.', 'warning');
    }

    openTemplateAuditModal({
      varList: vars,
      fullText: fullText,
      templateName: tplName,
      onExportExcel: (vList, opts) => {
        try {
          generateSampleExcelFromTemplate(vList, opts);
          showToast(`Đã xuất file Excel mẫu với ${vList.length} cột biến!`, 'success');
        } catch (err) {
          showToast(`Lỗi xuất Excel: ${err.message}`, 'error');
        }
      },
      onExportDocx: (vList, opts) => {
        try {
          generateSampleDocxFromTemplate(vList, opts);
          showToast(`Đã xuất file Word bảng mẫu với ${vList.length} cột biến!`, 'success');
        } catch (err) {
          showToast(`Lỗi xuất Word: ${err.message}`, 'error');
        }
      },
      onExportGoogleSheet: async (vList, opts) => {
        try {
          await generateGoogleSheetTemplate(vList, opts);
          showToast(`Đã sao chép sẵn ${vList.length} cột vào Clipboard & mở Google Sheet! Bạn hãy chọn ô A1 rồi bấm Ctrl+V để điền dữ liệu.`, 'success');
        } catch (err) {
          showToast(`Lỗi tạo Google Sheet: ${err.message}`, 'error');
        }
      }
    });

  } catch (err) {
    showToast('Lỗi rà soát mẫu: ' + err.message, 'error');
  }
}

// Giữ lại tên cũ để đảm bảo tương thích ngược
const handleGenerateSampleExcel = handleAuditTemplate;

async function initApp() {
  await initTheme();
  setupDialogAccessibility();

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  safeStorage.get(['fileNameFormat', 'enableConsistencyCheck', 'enableFontNormalization', 'enablePrefixIndex', 'enableRemoveTones', 'batchExportMode']).then((result) => {
    const formatEl = document.getElementById('fileNameFormat');
    if (formatEl) formatEl.value = result.fileNameFormat || '[1]_[2]';
    
    const checkEl = document.getElementById('enableConsistencyCheck');
    if (checkEl) checkEl.checked = result.enableConsistencyCheck !== false;

    const fontEl = document.getElementById('enableFontNormalization');
    if (fontEl) fontEl.checked = result.enableFontNormalization !== false;

    const prefixEl = document.getElementById('enablePrefixIndex');
    if (prefixEl) prefixEl.checked = result.enablePrefixIndex !== false;

    const tonesEl = document.getElementById('enableRemoveTones');
    if (tonesEl) tonesEl.checked = result.enableRemoveTones !== false;

    let mode = result.batchExportMode;
    if (!mode || mode === 'multiple') {
      mode = 'merged';
    }
    const mainModeSelect = document.getElementById('batchExportModeSelect');
    const modalModeSelect = document.getElementById('modalBatchExportModeSelect');
    if (mainModeSelect) mainModeSelect.value = mode;
    if (modalModeSelect) modalModeSelect.value = mode;
  });

  const mainModeSelect = document.getElementById('batchExportModeSelect');
  const modalModeSelect = document.getElementById('modalBatchExportModeSelect');
  if (mainModeSelect && modalModeSelect) {
    mainModeSelect.addEventListener('change', () => {
      modalModeSelect.value = mainModeSelect.value;
    });
    modalModeSelect.addEventListener('change', () => {
      mainModeSelect.value = modalModeSelect.value;
    });
  }

  const historyModal = document.getElementById('historyModal');
  const historyBtn = document.getElementById('historyBtn');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');

  if (historyBtn && historyModal) {
    historyBtn.addEventListener('click', async () => {
      await renderHistoryList(HistoryManager);
      historyModal.classList.add('is-open');
    });
  }
  if (closeHistoryBtn && historyModal) {
    closeHistoryBtn.addEventListener('click', () => historyModal.classList.remove('is-open'));
  }

  const historyContainer = document.getElementById('historyListContainer');
  if (historyContainer) {
    historyContainer.addEventListener('click', async (e) => {
      const redownloadBtn = e.target.closest('.btn-redownload-zip');
      if (redownloadBtn) {
        const id = redownloadBtn.dataset.id;
        const history = await HistoryManager.list();
        const item = history.find(h => h.id === id);
        if (item && item.zipBase64) {
          const buffer = base64ToBuffer(item.zipBase64);
          const blob = new Blob([buffer], { type: 'application/zip' });
          const url = URL.createObjectURL(blob);
          if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
            chrome.downloads.download({
              url: url,
              filename: `HoSo_ReDownload_${Date.now()}.zip`,
              saveAs: true
            }, () => URL.revokeObjectURL(url));
          } else {
            const a = document.createElement('a');
            a.href = url;
            a.download = `HoSo_ReDownload_${Date.now()}.zip`;
            a.click();
            URL.revokeObjectURL(url);
          }
          showToast('Đã tải lại gói ZIP lịch sử!', 'success');
        } else {
          showToast('Không tìm thấy file lưu vết trong lịch sử.', 'error');
        }
      }

      const delHistoryBtn = e.target.closest('.btn-del-history');
      if (delHistoryBtn) {
        const id = delHistoryBtn.dataset.id;
        await HistoryManager.delete(id);
        await renderHistoryList(HistoryManager);
        showToast('Đã xóa mục lịch sử.', 'info');
      }
    });
  }

  await renderCategoryFilterChips(CategoryManager);
  await renderCategorySelectOptions(CategoryManager);

  const categoryModal = document.getElementById('categoryModal');
  const manageCatBtn = document.getElementById('manageCatBtn');
  const closeCategoryBtn = document.getElementById('closeCategoryBtn');

  if (manageCatBtn && categoryModal) {
    manageCatBtn.addEventListener('click', async () => {
      await renderCategoryManagerList(CategoryManager);
      categoryModal.classList.add('is-open');
    });
  }
  if (closeCategoryBtn && categoryModal) {
    closeCategoryBtn.addEventListener('click', () => categoryModal.classList.remove('is-open'));
  }

  const addCatBtn = document.getElementById('addCatBtn');
  if (addCatBtn) {
    addCatBtn.addEventListener('click', async () => {
      const input = document.getElementById('newCatNameInput');
      const catName = input ? input.value.trim() : '';
      if (!catName) return showToast('Vui lòng nhập tên danh mục.', 'warning');
      try {
        await CategoryManager.add(catName);
        input.value = '';
        await renderCategoryFilterChips(CategoryManager);
        await renderCategorySelectOptions(CategoryManager);
        await renderCategoryManagerList(CategoryManager);
        await renderTemplateList(TemplateManager, CategoryManager);
        showToast(`Đã thêm danh mục "${catName}" thành công!`, 'success');
      } catch (e) {
        showToast(e.message, 'error');
      }
    });
  }

  const categoryContainer = document.getElementById('categoryListContainer');
  if (categoryContainer) {
    categoryContainer.addEventListener('click', async (e) => {
      const renameBtn = e.target.closest('.btn-rename-cat');
      if (renameBtn) {
        const id = renameBtn.dataset.id;
        const oldName = renameBtn.dataset.name;
        const newName = prompt('Nhập tên mới cho danh mục:', oldName);
        if (newName && newName.trim() !== '') {
          try {
            await CategoryManager.rename(id, newName.trim());
            await renderCategoryFilterChips(CategoryManager);
            await renderCategorySelectOptions(CategoryManager);
            await renderCategoryManagerList(CategoryManager);
            await renderTemplateList(TemplateManager, CategoryManager);
            showToast('Đã đổi tên danh mục thành công!', 'success');
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
        return;
      }

      const delBtn = e.target.closest('.btn-del-cat');
      if (delBtn) {
        const id = delBtn.dataset.id;
        const name = delBtn.dataset.name;
        if (!confirm(`Xóa danh mục "${name}"? Các mẫu thuộc danh mục này sẽ được chuyển về "Khác".`)) return;
        try {
          await CategoryManager.delete(id);
          await renderCategoryFilterChips(CategoryManager);
          await renderCategorySelectOptions(CategoryManager);
          await renderCategoryManagerList(CategoryManager);
          await renderTemplateList(TemplateManager, CategoryManager);
          showToast('Đã xóa danh mục.', 'info');
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  }

  const catFilterBar = document.getElementById('tplCatFilterBar');
  if (catFilterBar) {
    catFilterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.cat-chip');
      if (chip) {
        catFilterBar.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderTemplateList(TemplateManager, CategoryManager);
      }
    });
  }

  const modal = document.getElementById('guideModal');
  const openGuideBtn = document.getElementById('openGuideBtn');
  const closeGuideBtn = document.getElementById('closeGuideBtn');
  if (openGuideBtn && modal) openGuideBtn.addEventListener('click', () => modal.classList.add('is-open'));
  if (closeGuideBtn && modal) closeGuideBtn.addEventListener('click', () => modal.classList.remove('is-open'));

  // Click outside to dismiss modal
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('is-open');
      }
    });
  });

  const auditBtn = document.getElementById('auditTemplateBtn');
  if (auditBtn) {
    auditBtn.addEventListener('click', handleAuditTemplate);
  }

  const downloadSampleBtn = document.getElementById('downloadSampleExcelBtn');
  if (downloadSampleBtn) {
    downloadSampleBtn.addEventListener('click', handleAuditTemplate);
  }

  const backupBtn = document.getElementById('backupLibBtn');
  if (backupBtn) backupBtn.addEventListener('click', exportLibraryBackup);

  const restoreBtn = document.getElementById('restoreLibBtn');
  const restoreFileInput = document.getElementById('restoreLibFileInput');
  if (restoreBtn && restoreFileInput) {
    restoreBtn.addEventListener('click', () => restoreFileInput.click());
    restoreFileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        try {
          await importLibraryBackup(e.target.files[0]);
          await renderTemplateList(TemplateManager, CategoryManager);
          await renderDataList(DataManager);
          showToast('Phục hồi Thư viện thành công!', 'success');
        } catch (err) {
          showToast('Lỗi phục hồi: ' + err.message, 'error');
        }
      }
    });
  }

  const excelSheetSelect = document.getElementById('excelSheetSelect');
  if (excelSheetSelect) {
    excelSheetSelect.addEventListener('change', (e) => {
      const selectedSheet = e.target.value;
      if (currentExcelWorkbook && selectedSheet) {
        const worksheet = currentExcelWorkbook.Sheets[selectedSheet];
        if (worksheet && typeof XLSX !== 'undefined') {
          const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          window.dataContext = window.dataContext || {};
          window.dataContext.fullData = rawData;
          showToast(`Đã chuyển sang Sheet "${selectedSheet}" (${rawData.length} hàng).`, 'info');
        }
      }
    });
  }

  const excelDataInput = document.getElementById('excelData');
  if (excelDataInput) {
    excelDataInput.addEventListener('change', async function() {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        const nameEl = document.getElementById('excelDataName');
        if (nameEl) nameEl.textContent = file.name;
        try {
          const res = await parseLocalDataFile(file);
          currentExcelWorkbook = res.workbook;
          window.dataContext = window.dataContext || {};
          window.dataContext.fullData = res.data;
          showToast(`Đã nạp file "${file.name}" thành công (${res.data.length} hàng)!`, 'success');
        } catch (err) {
          showToast('Lỗi nạp file dữ liệu: ' + err.message, 'error');
        }
      }
    });
  }

  const dataFileInput = document.getElementById('dataFileInput');
  if (dataFileInput) {
    dataFileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const nameEl = document.getElementById('dataFileName');
        if (nameEl) nameEl.textContent = this.files[0].name;
      }
    });
  }

  const tplSearchInput = document.getElementById('tplSearchInput');
  if (tplSearchInput) {
    tplSearchInput.addEventListener('input', () => renderTemplateList(TemplateManager, CategoryManager));
  }

  const dataSearchInput = document.getElementById('dataSearchInput');
  if (dataSearchInput) {
    dataSearchInput.addEventListener('input', () => renderDataList(DataManager));
  }

  bindFileNameDisplay('docTemplate', 'docTemplateName');

  setupFileDropzones();

  const tplFileInput = document.getElementById('tplFileInput');
  if (tplFileInput) {
    tplFileInput.addEventListener('change', function () {
      const files = this.files;
      const nameEl = document.getElementById('tplFileName');
      const saveRow = document.getElementById('tplSaveRow');
      const nameInput = document.getElementById('tplNameInput');
      const nameInputGroup = nameInput ? nameInput.closest('.form-group') : null;
      
      if (files && files.length > 0) {
        if (files.length === 1) {
          const file = files[0];
          if (nameEl) nameEl.textContent = file.name;
          if (nameInput) {
            nameInput.value = file.name.replace(/\.docx$/i, '');
            if (nameInputGroup) nameInputGroup.style.display = 'block';
          }
        } else {
          if (nameEl) nameEl.textContent = `Đã chọn ${files.length} file biểu mẫu`;
          if (nameInputGroup) nameInputGroup.style.display = 'none';
        }
        if (saveRow) saveRow.style.display = 'block';
      } else {
        if (nameEl) nameEl.textContent = '';
        if (saveRow) saveRow.style.display = 'none';
      }
    });
  }

  const tplCancelBtn = document.getElementById('tplCancelBtn');
  if (tplCancelBtn) {
    tplCancelBtn.addEventListener('click', () => {
      const input = document.getElementById('tplFileInput');
      if (input) input.value = '';
      const nameEl = document.getElementById('tplFileName');
      if (nameEl) nameEl.textContent = '';
      const nameInput = document.getElementById('tplNameInput');
      if (nameInput) nameInput.value = '';
      const saveRow = document.getElementById('tplSaveRow');
      if (saveRow) saveRow.style.display = 'none';
    });
  }

  const tplSaveBtn = document.getElementById('tplSaveBtn');
  if (tplSaveBtn) {
    tplSaveBtn.addEventListener('click', async () => {
      const fileInput = document.getElementById('tplFileInput');
      const files = fileInput ? fileInput.files : [];
      const nameInput = document.getElementById('tplNameInput');
      const name = nameInput ? nameInput.value.trim() : '';
      const cat = document.getElementById('tplCategorySelect')?.value || 'khac';

      if (!files || files.length === 0) return showToast('Vui lòng chọn file DOCX trước.', 'warning');

      try {
        if (files.length === 1) {
          if (!name) return showToast('Vui lòng đặt tên cho mẫu.', 'warning');
          const buffer = await files[0].arrayBuffer();
          await TemplateManager.save(name, buffer, cat);
        } else {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const autoName = file.name.replace(/\.docx$/i, '');
            const buffer = await file.arrayBuffer();
            await TemplateManager.save(autoName, buffer, cat);
          }
        }
        await renderTemplateList(TemplateManager, CategoryManager);
        showToast('Đã lưu mẫu vào thư viện!', 'success');
        if (tplCancelBtn) tplCancelBtn.click();
      } catch (err) {
        showToast('Lỗi khi lưu: ' + err.message, 'error');
      }
    });
  }

  const srcLibBtn = document.getElementById('srcLibBtn');
  const srcUploadBtn = document.getElementById('srcUploadBtn');
  if (srcLibBtn) srcLibBtn.addEventListener('click', () => switchSource('library'));
  if (srcUploadBtn) srcUploadBtn.addEventListener('click', () => switchSource('upload'));

  const templateListEl = document.getElementById('templateList');
  if (templateListEl) {
    templateListEl.addEventListener('click', async (event) => {
      const tplStar = event.target.closest('.tpl-star-btn');
      if (tplStar) {
        event.stopPropagation();
        const name = tplStar.dataset.name;
        await TemplateManager.toggleFavorite(name);
        await renderTemplateList(TemplateManager, CategoryManager);
        return;
      }

      const tplDownload = event.target.closest('.tpl-download');
      if (tplDownload) {
        event.stopPropagation();
        const name = tplDownload.dataset.name;
        try {
          const buffer = await TemplateManager.getBuffer(name);
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          const url = URL.createObjectURL(blob);
          const downloadFileName = name.toLowerCase().endsWith('.docx') ? name : `${name}.docx`;
          if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
            chrome.downloads.download({
              url: url,
              filename: downloadFileName,
              saveAs: true
            }, () => { URL.revokeObjectURL(url); });
          } else {
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadFileName;
            a.click();
            URL.revokeObjectURL(url);
          }
          showToast(`Đang tải file mẫu "${downloadFileName}" về máy...`, 'success');
        } catch (e) {
          showToast('Lỗi tải file mẫu: ' + e.message, 'error');
        }
        return;
      }

      const tplRename = event.target.closest('.tpl-rename');
      if (tplRename) {
        event.stopPropagation();
        const oldName = tplRename.dataset.name;
        const newName = prompt('Nhập tên mới cho mẫu:', oldName.replace(/\.docx$/i, ''));
        if (newName && newName.trim() !== '') {
          try {
            await TemplateManager.rename(oldName, newName.trim());
            await renderTemplateList(TemplateManager, CategoryManager);
            showToast('Đã đổi tên mẫu thành công!', 'success');
          } catch (e) {
            showToast(e.message, 'error');
          }
        }
        return;
      }

      const tplDel = event.target.closest('.tpl-del');
      if (tplDel) {
        event.stopPropagation();
        const name = tplDel.dataset.name;
        if (!confirm(`Xóa mẫu "${name}" khỏi thư viện?`)) return;
        await TemplateManager.delete(name);
        await renderTemplateList(TemplateManager, CategoryManager);
        showToast('Đã xóa mẫu khỏi thư viện.', 'info');
        return;
      }

      const tplItem = event.target.closest('.tpl-item');
      if (tplItem) {
        document.querySelectorAll('.tpl-item').forEach(i => i.classList.remove('selected'));
        tplItem.classList.add('selected');
        const name = tplItem.dataset.name;
        const sel = document.getElementById('tplLibSelect');
        if (sel) sel.value = name;
      }
    });
  }

  const dataListEl = document.getElementById('dataList');
  if (dataListEl) {
    dataListEl.addEventListener('click', async (event) => {
      const delBtn = event.target.closest('.tpl-del-data');
      if (delBtn) {
        event.stopPropagation();
        const id = delBtn.dataset.id;
        if (!confirm('Xóa liên kết dữ liệu này khỏi Thư viện?')) return;
        await DataManager.delete(id);
        await deleteFileHandle(id);
        await renderDataList(DataManager);
        showToast('Đã xóa liên kết dữ liệu.', 'info');
        return;
      }
    });
  }

  const dsUploadBtn = document.getElementById('dataSourceUploadBtn');
  const dsLinkBtn = document.getElementById('dataSourceLinkBtn');
  if (dsUploadBtn && dsLinkBtn) {
    dsUploadBtn.addEventListener('click', () => {
      dsUploadBtn.classList.add('active');
      dsLinkBtn.classList.remove('active');
      const uploadPnl = document.getElementById('dataUploadPanel');
      const linkPnl = document.getElementById('dataLinkPanel');
      if (uploadPnl) uploadPnl.style.display = 'block';
      if (linkPnl) linkPnl.style.display = 'none';
    });
    dsLinkBtn.addEventListener('click', () => {
      dsLinkBtn.classList.add('active');
      dsUploadBtn.classList.remove('active');
      const uploadPnl = document.getElementById('dataUploadPanel');
      const linkPnl = document.getElementById('dataLinkPanel');
      if (uploadPnl) uploadPnl.style.display = 'none';
      if (linkPnl) linkPnl.style.display = 'block';
    });
  }

  // Nút mở Google Drive chọn Google Sheets
  const openDriveSheetBtn = document.getElementById('openDriveSheetBtn');
  if (openDriveSheetBtn) {
    openDriveSheetBtn.addEventListener('click', () => {
      openDrivePicker('data_sheet');
    });
  }

  // Nút mở Google Drive chọn file Excel
  const openDriveExcelBtn = document.getElementById('openDriveExcelBtn');
  if (openDriveExcelBtn) {
    openDriveExcelBtn.addEventListener('click', () => {
      openDrivePicker('data_excel');
    });
  }

  // Nút Lưu Google Sheets vào Thư Viện
  const dataLinkImportBtn = document.getElementById('dataLinkImportBtn');
  if (dataLinkImportBtn) {
    dataLinkImportBtn.addEventListener('click', async () => {
      let name = (document.getElementById('dataLibNameInput')?.value || '').trim();
      const link = (document.getElementById('dataLinkInput')?.value || '').trim();
      const sheetName = (document.getElementById('dataSheetNameInput')?.value || '').trim();

      if (!link) {
        showToast('Vui lòng dán liên kết Google Sheets hoặc bấm "Chọn từ Drive".', 'warning');
        return;
      }

      dataLinkImportBtn.disabled = true;
      dataLinkImportBtn.textContent = 'Đang kiểm tra kết nối...';

      try {
        // Tự động nhận diện tên thật của file Google Sheet nếu người dùng chưa đặt tên hoặc để mặc định
        if (!name || name === 'Google Sheet (Mặc định)') {
          const autoTitle = await GoogleSheetsManager.fetchFileTitle(link);
          if (autoTitle) {
            name = sheetName ? `${autoTitle} (${sheetName})` : autoTitle;
          } else {
            name = sheetName ? `Google Sheet (${sheetName})` : 'Google Sheet';
          }
        }

        const id = 'data_sheet_' + Date.now();
        
        // Kiểm tra nạp thử dữ liệu trực tiếp
        const rawData = await GoogleSheetsManager.importLinkSheet(link, sheetName);
        
        await DataManager.save(id, {
          name: name,
          link: link,
          sheetName: sheetName,
          type: 'google_sheets'
        });

        // Xóa form sau khi lưu
        if (document.getElementById('dataLibNameInput')) document.getElementById('dataLibNameInput').value = '';
        if (document.getElementById('dataLinkInput')) document.getElementById('dataLinkInput').value = '';
        if (document.getElementById('dataSheetNameInput')) document.getElementById('dataSheetNameInput').value = '';

        await renderDataList(DataManager);
        showToast(`Đã lưu Google Sheets "${name}" vào thư viện thành công (${rawData.length} hàng)!`, 'success');
      } catch (err) {
        showToast(`Lỗi lưu Google Sheets: ${err.message}`, 'error');
      } finally {
        dataLinkImportBtn.disabled = false;
        dataLinkImportBtn.textContent = 'Lưu Google Sheets Vào Thư Viện';
      }
    });
  }

  // Tự động nhận diện tên Google Sheet khi dán hoặc nhập link
  const dataLinkInputEl = document.getElementById('dataLinkInput');
  const dataLibNameInputEl = document.getElementById('dataLibNameInput');
  if (dataLinkInputEl) {
    const handleUrlChange = async () => {
      const url = dataLinkInputEl.value.trim();
      if (!url) return;
      if (url.includes('docs.google.com') || url.includes('drive.google.com')) {
        if (dataLibNameInputEl && (!dataLibNameInputEl.value || dataLibNameInputEl.value.startsWith('Google Sheet'))) {
          dataLibNameInputEl.placeholder = 'Đang lấy tên Google Sheet...';
          const title = await GoogleSheetsManager.fetchFileTitle(url);
          if (title && (!dataLibNameInputEl.value || dataLibNameInputEl.value.startsWith('Google Sheet'))) {
            dataLibNameInputEl.value = title;
          }
          dataLibNameInputEl.placeholder = 'VD: Bảng lương Q1/2026...';
        }
      }
    };
    dataLinkInputEl.addEventListener('change', handleUrlChange);
    dataLinkInputEl.addEventListener('paste', () => setTimeout(handleUrlChange, 150));
  }

  // Nút Lưu Liên Kết File Excel / Docx vào Thư Viện
  const dataExcelSaveBtn = document.getElementById('dataExcelSaveBtn');
  if (dataExcelSaveBtn) {
    dataExcelSaveBtn.addEventListener('click', async () => {
      const name = (document.getElementById('dataExcelLibNameInput')?.value || '').trim();
      const link = (document.getElementById('dataExcelLinkInput')?.value || '').trim();
      const sheetName = (document.getElementById('dataExcelSheetNameInput')?.value || '').trim();

      if (!link) {
        showToast('Vui lòng dán liên kết file Excel (.xlsx) / Word (.docx) hoặc bấm "Chọn từ Drive".', 'warning');
        return;
      }

      const isDocx = link.toLowerCase().includes('.docx') || name.toLowerCase().endsWith('.docx');
      const id = 'data_excel_' + Date.now();
      const defaultName = name || (isDocx ? `Link Bảng Docx` : `Link Excel (${sheetName || 'Mặc định'})`);

      try {
        dataExcelSaveBtn.disabled = true;
        dataExcelSaveBtn.textContent = 'Đang kiểm tra file...';

        // Kiểm tra đọc thử từ liên kết trực tiếp
        const rawData = await GoogleSheetsManager.importExcelLink(link, sheetName);

        await DataManager.save(id, {
          name: defaultName,
          link: link,
          sheetName: sheetName,
          type: 'excel_link'
        });

        // Xóa form sau khi lưu
        if (document.getElementById('dataExcelLibNameInput')) document.getElementById('dataExcelLibNameInput').value = '';
        if (document.getElementById('dataExcelLinkInput')) document.getElementById('dataExcelLinkInput').value = '';
        if (document.getElementById('dataExcelSheetNameInput')) document.getElementById('dataExcelSheetNameInput').value = '';

        await renderDataList(DataManager);
        showToast(`Đã lưu liên kết "${defaultName}" vào thư viện thành công (${rawData.length} hàng)!`, 'success');
      } catch (err) {
        showToast(`Lỗi nạp liên kết: ${err.message}`, 'error');
      } finally {
        dataExcelSaveBtn.disabled = false;
        dataExcelSaveBtn.textContent = 'Lưu Liên Kết Excel / Docx Vào Thư Viện';
      }
    });
  }
  // Quản lý biến tạm chọn file máy tính
  let selectedLocalHandle = null;
  let selectedLocalFile = null;

  const dataLocalPickBtn = document.getElementById('dataLocalPickBtn');
  const dataLocalFileInput = document.getElementById('dataLocalFileInput');
  const dataLocalFileName = document.getElementById('dataLocalFileName');

  if (dataLocalPickBtn) {
    dataLocalPickBtn.addEventListener('click', async () => {
      if (dataLocalPickBtn.disabled) return;
      dataLocalPickBtn.disabled = true;
      try {
        const picked = await pickLocalExcelFile();
        if (picked && picked.file) {
          selectedLocalHandle = picked.handle;
          selectedLocalFile = picked.file;
          if (dataLocalFileName) {
            dataLocalFileName.innerHTML = `✓ Đã định vị file: <b>${escapeHtml(picked.file.name)}</b>`;
          }
          const nameInput = document.getElementById('dataLocalNameInput');
          if (nameInput && !nameInput.value.trim()) {
            nameInput.value = picked.file.name.replace(/\.[^/.]+$/, "");
          }
        } else if (picked === undefined) {
          if (dataLocalFileInput) dataLocalFileInput.click();
        }
      } catch (err) {
        if (err.name === 'SecurityError' || err.name === 'NotAllowedError') {
          if (dataLocalFileInput) dataLocalFileInput.click();
        } else {
          showToast(`Không thể đọc file đã chọn: ${err.message}`, 'error');
        }
      } finally {
        dataLocalPickBtn.disabled = false;
      }
    });
  }

  if (dataLocalFileInput) {
    dataLocalFileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        selectedLocalHandle = null;
        selectedLocalFile = this.files[0];
        if (dataLocalFileName) {
          dataLocalFileName.innerHTML = `✓ Đã chọn file: <b>${escapeHtml(this.files[0].name)}</b>`;
        }
        const nameInput = document.getElementById('dataLocalNameInput');
        if (nameInput && !nameInput.value.trim()) {
          nameInput.value = this.files[0].name.replace(/\.[^/.]+$/, "");
        }
      }
    });
  }

  // Nút Lưu Nguồn File Máy Tính Vào Thư Viện
  const dataLocalSaveBtn = document.getElementById('dataLocalSaveBtn');
  if (dataLocalSaveBtn) {
    dataLocalSaveBtn.addEventListener('click', async () => {
      if (!selectedLocalFile) {
        showToast('Vui lòng bấm "Chọn File Từ Máy Tính" trước khi lưu.', 'warning');
        return;
      }

      const name = (document.getElementById('dataLocalNameInput')?.value || '').trim();
      const sheetName = (document.getElementById('dataLocalSheetNameInput')?.value || '').trim();
      const id = 'data_local_' + Date.now();
      const defaultName = name || selectedLocalFile.name;

      try {
        dataLocalSaveBtn.disabled = true;
        dataLocalSaveBtn.textContent = 'Đang lưu vị trí file...';

        // 1. Lưu FileHandle hoặc fallback File vào IndexedDB (không tốn dung lượng chrome.storage.local)
        await saveFileHandle(id, selectedLocalHandle, selectedLocalFile);

        // 2. Lưu Metadata vào DataManager
        await DataManager.save(id, {
          name: defaultName,
          fileName: selectedLocalFile.name,
          sheetName: sheetName,
          type: 'local_file'
        });

        const isDocx = (selectedLocalFile?.name || '').toLowerCase().endsWith('.docx');

        // Xóa form và reset biến tạm
        if (document.getElementById('dataLocalNameInput')) document.getElementById('dataLocalNameInput').value = '';
        if (document.getElementById('dataLocalSheetNameInput')) document.getElementById('dataLocalSheetNameInput').value = '';
        if (dataLocalFileName) dataLocalFileName.innerHTML = '';
        if (dataLocalFileInput) dataLocalFileInput.value = '';
        selectedLocalHandle = null;
        selectedLocalFile = null;

        await renderDataList(DataManager);
        showToast(`Đã lưu vị trí file ${isDocx ? 'Word (.docx)' : 'máy tính'} "${defaultName}" vào thư viện thành công!`, 'success');
      } catch (err) {
        showToast(`Lỗi lưu vị trí file: ${err.message}`, 'error');
      } finally {
        dataLocalSaveBtn.disabled = false;
        dataLocalSaveBtn.textContent = 'Lưu Nguồn File Máy Tính Vào Thư Viện';
      }
    });
  }

  // Tương thích ngược với nút dataLibSaveBtn nếu có
  const dataLibSaveBtn = document.getElementById('dataLibSaveBtn');
  if (dataLibSaveBtn) {
    dataLibSaveBtn.addEventListener('click', async () => {
      const link = document.getElementById('dataLinkInput')?.value.trim();
      if (link && dataLinkImportBtn) {
        dataLinkImportBtn.click();
      }
    });
  }

  const closePreviewBtn = document.getElementById('closePreviewBtn');
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', () => {
      const modal = document.getElementById('dataPreviewModal');
      if (modal) {
        modal.classList.remove('is-open');
        // Reset fullscreen state khi đóng modal
        const dialog = modal.querySelector('.modal-dialog');
        if (dialog) dialog.classList.remove('modal-fullscreen');
        const fsLabel = document.getElementById('fsLabel');
        const fsIcon = document.getElementById('fsIcon');
        if (fsLabel) fsLabel.textContent = 'Phóng to';
        if (fsIcon) fsIcon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';
      }
    });
  }

  // Fullscreen toggle cho app.html (cửa sổ đầy đủ)
  const togglePreviewFullscreenBtn = document.getElementById('togglePreviewFullscreenBtn');
  if (togglePreviewFullscreenBtn) {
    togglePreviewFullscreenBtn.addEventListener('click', () => {
      const modal = document.getElementById('dataPreviewModal');
      if (!modal) return;
      const dialog = modal.querySelector('.modal-dialog');
      if (!dialog) return;
      const isFs = dialog.classList.toggle('modal-fullscreen');
      const fsLabel = document.getElementById('fsLabel');
      const fsIcon = document.getElementById('fsIcon');
      if (isFs) {
        if (fsLabel) fsLabel.textContent = 'Thu nhỏ';
        if (fsIcon) fsIcon.innerHTML = '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>';
      } else {
        if (fsLabel) fsLabel.textContent = 'Phóng to';
        if (fsIcon) fsIcon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';
      }
    });
  }

  // Mở tab rộng từ side panel (sidepanel.html)
  const openPreviewInFullTabBtn = document.getElementById('openPreviewInFullTabBtn');
  if (openPreviewInFullTabBtn) {
    openPreviewInFullTabBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: chrome.runtime.getURL('app.html') });
      } else {
        window.open('app.html', '_blank');
      }
    });
  }

  const previewSearchInput = document.getElementById('previewSearchInput');
  if (previewSearchInput) {
    previewSearchInput.addEventListener('input', refreshPreviewTable);
  }

  const toggleEmptyErrorBtn = document.getElementById('toggleEmptyErrorBtn');
  if (toggleEmptyErrorBtn) {
    toggleEmptyErrorBtn.addEventListener('click', () => {
      isOnlyErrorsFilter = !isOnlyErrorsFilter;
      toggleEmptyErrorBtn.style.background = isOnlyErrorsFilter ? 'var(--warning-light)' : '';
      toggleEmptyErrorBtn.style.color = isOnlyErrorsFilter ? 'var(--warning)' : '';
      refreshPreviewTable();
    });
  }

  const openTransformersModalBtn = document.getElementById('openTransformersModalBtn');
  if (openTransformersModalBtn) {
    openTransformersModalBtn.addEventListener('click', () => {
      openTransformersModal(currentTemplateVars, fieldTransformers);
    });
  }

  const closeTransformersBtn = document.getElementById('closeTransformersBtn');
  if (closeTransformersBtn) {
    closeTransformersBtn.addEventListener('click', () => {
      document.getElementById('transformersModal').classList.remove('is-open');
    });
  }

  const saveTransformersBtn = document.getElementById('saveTransformersBtn');
  if (saveTransformersBtn) {
    saveTransformersBtn.addEventListener('click', () => {
      const selects = document.querySelectorAll('.transformer-select');
      selects.forEach(sel => {
        const v = sel.dataset.var;
        fieldTransformers[v] = sel.value;
      });
      document.getElementById('transformersModal').classList.remove('is-open');
      refreshPreviewTable();
      showToast('Đã cập nhật quy tắc định dạng biến!', 'success');
    });
  }

  const addPreviewRowBtn = document.getElementById('addPreviewRowBtn');
  if (addPreviewRowBtn) {
    addPreviewRowBtn.addEventListener('click', () => {
      const emptyRow = {};
      currentPreviewHeaders.forEach(h => emptyRow[h] = '');
      currentPreviewRawData.push(emptyRow);
      refreshPreviewTable();
      checkAndDisplayModifiedState();
    });
  }

  const exportPreviewDataBtn = document.getElementById('exportPreviewDataBtn');
  const savePreviewCopyBtn = document.getElementById('savePreviewCopyBtn');
  document.getElementById('reloadSheetPreviewBtn')?.addEventListener('click', reloadSheetPreview);
  if (savePreviewCopyBtn) {
    savePreviewCopyBtn.addEventListener('click', async () => {
      savePreviewCopyBtn.disabled = true;
      try { await savePreviewCopy(); }
      catch (err) { showToast(`Không thể lưu bản sao: ${err.message}`, 'error'); }
      finally { savePreviewCopyBtn.disabled = false; }
    });
  }
  if (exportPreviewDataBtn) {
    exportPreviewDataBtn.addEventListener('click', () => {
      try {
        const editedData = getEditedData();
        exportPreviewDataToExcel(currentPreviewHeaders, editedData);
        showToast(`Đã xuất ${editedData.length} dòng dữ liệu ra file Excel thành công!`, 'success');
      } catch (err) {
        showToast(err.message, 'warning');
      }
    });
  }

  const previewDataTableEl = document.getElementById('previewDataTable');
  if (previewDataTableEl) {
    setupPreviewTableListeners(
      previewDataTableEl,
      getPreviewState,
      refreshPreviewTable,
      async (rowIdx, btnExportSingle) => {
        if (!onConfirmExportCallback) return;
        if (document.getElementById('reloadSheetPreviewBtn')?.disabled) {
          showToast('Đang cập nhật Google Sheets. Hãy đợi tải xong trước khi xuất.', 'info');
          return;
        }
        syncInputsToRawData(getPreviewState());
        btnExportSingle.style.opacity = '0.5';
        showToast(`Đang tạo file đơn cho dòng ${rowIdx + 1}...`, 'info');
        const singleRow = currentPreviewRawData[rowIdx];
        if (singleRow) {
          onConfirmExportCallback([{ ...singleRow }], true, rowIdx);
        }
      },
      checkAndDisplayModifiedState
    );
  }

  const confirmExportBtn = document.getElementById('confirmExportBtn');
  if (confirmExportBtn) {
    confirmExportBtn.addEventListener('click', async () => {
      if (document.getElementById('reloadSheetPreviewBtn')?.disabled) {
        showToast('Đang cập nhật Google Sheets. Hãy đợi tải xong trước khi xuất.', 'info');
        return;
      }
      syncInputsToRawData(getPreviewState());
      const editedData = getEditedData();
      if (editedData.length === 0) {
        return showToast('Vui lòng tích chọn ít nhất 1 hàng dữ liệu để xuất.', 'warning');
      }

      const checkEnabled = document.getElementById('enableConsistencyCheck')?.checked;
      if (checkEnabled && currentTemplateVars.length > 0) {
        const nameFormat = document.getElementById('fileNameFormat').value.trim() || '[1]_[2]';
        const warnings = checkDataConsistency(editedData, currentTemplateVars, nameFormat);
        const syntaxWarnings = checkTemplateBraces(currentTemplateText);
        const allWarnings = [...warnings, ...syntaxWarnings];
        
        if (allWarnings.length > 0) {
          showConsistencyWarnings(allWarnings, () => {
            document.getElementById('dataPreviewModal').classList.remove('is-open');
            if (onConfirmExportCallback) {
              onConfirmExportCallback(editedData);
            }
          }, () => {});
          return;
        }
      }

      document.getElementById('dataPreviewModal').classList.remove('is-open');
      if (onConfirmExportCallback) {
        onConfirmExportCallback(editedData);
      }
    });
  }

  const saveConfigBtn = document.getElementById('saveConfigBtn');
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', () => {
      const formatInput = document.getElementById('fileNameFormat');
      const format = formatInput ? formatInput.value.trim() : '';
      const checkEl = document.getElementById('enableConsistencyCheck');
      const batchExportModeEl = document.getElementById('batchExportModeSelect');
      safeStorage.set({ 
        fileNameFormat: format,
        enableConsistencyCheck: checkEl ? checkEl.checked : true,
        enableFontNormalization: document.getElementById('enableFontNormalization')?.checked !== false,
        enablePrefixIndex: document.getElementById('enablePrefixIndex')?.checked !== false,
        enableRemoveTones: document.getElementById('enableRemoveTones')?.checked !== false,
        batchExportMode: batchExportModeEl ? batchExportModeEl.value : 'merged'
      }).then(() => {
        showToast('Đã lưu cấu hình thành công!', 'success');
      });
    });
  }

  const processBtn = document.getElementById('processBtn');
  if (processBtn) {
    processBtn.addEventListener('click', async () => {
      const formatInput = document.getElementById('fileNameFormat');
      let nameFormat = formatInput ? formatInput.value.trim() : '[1]_[2]';
      if (!nameFormat) nameFormat = '[1]_[2]';

      const ui = {
        btn: document.getElementById('processBtn'),
        status: document.getElementById('status'),
        track: document.getElementById('progressTrack'),
        bar: document.getElementById('progressBar')
      };

      if (ui.btn) ui.btn.disabled = true;
      if (ui.status) {
        ui.status.style.color = 'var(--primary)';
        ui.status.innerText = 'Đang kiểm tra mẫu...';
      }

      try {
        let docBuffer;
        const srcLibBtnEl = document.getElementById('srcLibBtn');
        const isLibSource = srcLibBtnEl ? srcLibBtnEl.classList.contains('active') : true;

        if (isLibSource) {
          const tplSelectEl = document.getElementById('tplLibSelect');
          const selectedTpl = tplSelectEl ? tplSelectEl.value : '';
          if (!selectedTpl) throw new Error('Vui lòng chọn một mẫu từ Thư viện, hoặc chuyển sang "Upload File".');
          if (ui.status) ui.status.innerText = `Đang tải mẫu "${selectedTpl}"...`;
          docBuffer = await TemplateManager.getBuffer(selectedTpl);
        } else {
          const docTemplateEl = document.getElementById('docTemplate');
          const docFile = docTemplateEl ? docTemplateEl.files[0] : null;
          if (!docFile) throw new Error('Vui lòng chọn file Word mẫu (.docx) để upload.');
          docBuffer = await docFile.arrayBuffer();
        }

        const enableFontNormalization = document.getElementById('enableFontNormalization')?.checked !== false;
        const prefixIndex = document.getElementById('enablePrefixIndex')?.checked !== false;
        const removeTones = document.getElementById('enableRemoveTones')?.checked !== false;

        let preparedZip;
        try {
          const prep = prepareTemplateZip(docBuffer, enableFontNormalization);
          preparedZip = prep.zip;
        } catch (e) {
          throw new Error('Lỗi đọc cấu trúc file Word mẫu: ' + e.message);
        }

        const { varList, fullText } = extractVariablesFromDocxZip(preparedZip);
        if (varList.length === 0) {
          throw new Error('Không tìm thấy biến số {{...}} nào trong file Word mẫu (kể cả phần thân, tiêu đề đầu và chân trang).');
        }

        currentTemplateVars = varList;
        currentTemplateText = fullText;
        const processedDocBuffer = preparedZip.generate({ type: 'arraybuffer' });

        const dataFileInput = document.getElementById('excelData');
        const dataFile = dataFileInput ? dataFileInput.files[0] : null;
        let rawData = [];
        let loadedFromSheet = false;

        const srcDataLinkBtnEl = document.getElementById('dataSourceLinkBtn');
        const isDataLinkSource = srcDataLinkBtnEl ? srcDataLinkBtnEl.classList.contains('active') : false;
        let selectedDataItem = null;

        if (isDataLinkSource) {
          const sel = document.getElementById('dataLibSelect');
          if (!sel || !sel.value) throw new Error('Vui lòng chọn một nguồn dữ liệu từ Thư viện.');
          const sources = await DataManager.list();
          const item = sources[sel.value];
          if (!item) throw new Error('Không tìm thấy dữ liệu đã chọn trong Thư viện.');
          selectedDataItem = item;
          
          if (item.type === 'local_file') {
            const isDocx = (item.fileName || '').toLowerCase().endsWith('.docx');
            if (ui.status) ui.status.innerText = isDocx
              ? `Đang đọc trực tiếp bảng dữ liệu từ file Word (.docx) "${item.fileName || item.name}"...`
              : `Đang đọc trực tiếp file từ máy tính "${item.fileName || item.name}"...`;
            const file = await getFileFromHandle(item.id);
            const res = await parseLocalDataFile(file, item.sheetName);
            rawData = res.data;
          } else if (item.type === 'local' && item.data) {
            if (ui.status) ui.status.innerText = `Đang nạp dữ liệu từ file lưu sẵn "${item.name}"...`;
            rawData = item.data;
          } else if (item.type === 'excel_link') {
            const isDocx = (item.name || item.link || '').toLowerCase().includes('.docx') || (item.sheetName || '').toLowerCase().includes('docx');
            if (ui.status) ui.status.innerText = isDocx
              ? `Đang tải bảng dữ liệu "${item.name}" từ liên kết Word (.docx)...`
              : `Đang tải dữ liệu "${item.name}" từ liên kết Excel (Sheet: ${item.sheetName || 'Mặc định'})...`;
            rawData = await GoogleSheetsManager.importExcelLink(item.link, item.sheetName);
          } else if (item.link || item.type === 'google_sheets') {
            if (ui.status) ui.status.innerText = `Đang tải dữ liệu "${item.name}" từ Google Sheet (Sheet: ${item.sheetName || 'Mặc định'})...`;
            rawData = await GoogleSheetsManager.importLinkSheet(item.link, item.sheetName);
            loadedFromSheet = true;
          } else {
            throw new Error('Dữ liệu trong thư viện không hợp lệ.');
          }
        } else if (dataFile) {
          if (ui.status) ui.status.innerText = `Đang đọc dữ liệu từ file "${dataFile.name}"...`;
          const selectedSheet = document.getElementById('excelSheetSelect')?.value;
          const res = await parseLocalDataFile(dataFile, selectedSheet);
          rawData = res.data;
        } else if (window.dataContext && window.dataContext.fullData && window.dataContext.fullData.length > 0) {
          rawData = window.dataContext.fullData;
        } else {
          const emptyRow = {};
          varList.forEach(v => emptyRow[v] = '');
          rawData = [emptyRow];
        }

        if (rawData && rawData.length > 0) {
          const firstRowKeys = Object.keys(rawData[0]);
          const checkDLKey = firstRowKeys.find(k => k.toLowerCase().trim() === 'check dl');
          if (checkDLKey && !loadedFromSheet) {
            rawData = rawData.filter(row => {
              const val = row[checkDLKey];
              return val !== undefined && val !== null && val.toString().trim().toLowerCase() === 'true';
            });
            if (rawData.length === 0) throw new Error('Không có dòng dữ liệu nào có Check DL = true.');
          }
        }

        const headers = (isDataLinkSource && rawData.length > 0) 
          ? Object.keys(rawData[0])
          : ((dataFile && rawData.length > 0) 
            ? Object.keys(rawData[0])
            : varList);

        activeDataSourceOrigin = {
          link: selectedDataItem?.link || '',
          isGoogleSheet: loadedFromSheet,
          fetchedAt: loadedFromSheet ? Date.now() : null,
          type: isDataLinkSource ? (selectedDataItem ? selectedDataItem.type : 'local') : (dataFile ? 'input_file' : 'memory'),
          id: (isDataLinkSource && selectedDataItem) ? selectedDataItem.id : null,
          name: (isDataLinkSource && selectedDataItem) ? selectedDataItem.name : (dataFile ? dataFile.name : 'Dữ liệu hiện hành'),
          fileName: (isDataLinkSource && selectedDataItem) ? (selectedDataItem.fileName || selectedDataItem.name) : (dataFile ? dataFile.name : ''),
          sheetName: (isDataLinkSource && selectedDataItem) ? selectedDataItem.sheetName : (document.getElementById('excelSheetSelect')?.value || 'Sheet1'),
          isDocx: (isDataLinkSource && selectedDataItem)
            ? ((selectedDataItem.fileName || selectedDataItem.name || '').toLowerCase().endsWith('.docx') || (selectedDataItem.link || '').toLowerCase().includes('.docx'))
            : (dataFile ? dataFile.name.toLowerCase().endsWith('.docx') : false),
          originalData: JSON.parse(JSON.stringify(rawData)),
          workbook: currentExcelWorkbook
        };

        if (ui.status) ui.status.innerText = 'Đã nạp thành công! Đang mở bảng xem trước...';

        onConfirmExportCallback = (editedData, isSingle = false, singleIdx = null) => {
          try {
            if (ui.btn) ui.btn.disabled = true;
            if (ui.track) ui.track.style.display = 'block';
            if (ui.bar) ui.bar.style.width = '10%';
            if (ui.status) {
              ui.status.style.color = 'var(--primary)';
              ui.status.innerText = isSingle ? 'Đang tạo file đơn...' : 'Đang khởi tạo Web Worker...';
            }

            if (activeWorker) {
              terminateBatchWorker(activeWorker);
            }

            // Khai báo trước để các callback có thể clear watchdog
            let workerWatchdog = null;

            activeWorker = createBatchWorker({
              onProgress: (data) => {
                clearTimeout(workerWatchdog); // Worker đang hoạt động → reset watchdog
                if (ui.bar) ui.bar.style.width = `${data.percent}%`;
                if (ui.status) ui.status.innerText = `Đang tạo: ${data.current} / ${data.total} file (${data.percent}%)`;
              },
              onStatus: (data) => {
                if (ui.status) ui.status.innerText = data.message;
              },
              onDone: (data) => {
                clearTimeout(workerWatchdog);
                if (ui.bar) ui.bar.style.width = '100%';
                if (ui.status) {
                  ui.status.style.color = 'var(--success)';
                  ui.status.innerText = `HOÀN TẤT — Đã xuất thành công ${data.count} file.`;
                }

                const zipUrl = URL.createObjectURL(data.blob);
                if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
                  chrome.downloads.download({
                    url: zipUrl,
                    filename: `HoSo_AutoDoc_${Date.now()}.zip`,
                    saveAs: true
                  }, () => { URL.revokeObjectURL(zipUrl); });
                } else {
                  const a = document.createElement('a');
                  a.href = zipUrl;
                  a.download = `HoSo_AutoDoc_${Date.now()}.zip`;
                  a.click();
                  URL.revokeObjectURL(zipUrl);
                }

                showToast(`Đã xuất thành công gói ZIP ${data.count} file văn bản!`, 'success');

                try {
                  const tplSelectEl = document.getElementById('tplLibSelect');
                  const tplName = (isLibSource && tplSelectEl) ? tplSelectEl.value : 'Mẫu Word Upload';
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const base64data = reader.result.split(',')[1];
                    await HistoryManager.save({
                      id: Date.now().toString(),
                      exportAt: new Date().toISOString(),
                      templateName: tplName || 'Văn bản hàng loạt',
                      count: data.count,
                      format: data.format || 'docx',
                      zipBase64: base64data,
                      size: data.blob.size
                    });
                    await renderHistoryList(HistoryManager);
                  };
                  reader.readAsDataURL(data.blob);
                } catch(errHist) {
                  console.error('Lỗi lưu lịch sử xuất:', errHist);
                }

                if (ui.btn) ui.btn.disabled = false;
                setTimeout(() => {
                  if (ui.track) ui.track.style.display = 'none';
                  if (ui.bar) ui.bar.style.width = '0%';
                }, 2000);
                terminateBatchWorker(activeWorker);
                activeWorker = null;
              },
              onDoneSingle: (data) => {
                clearTimeout(workerWatchdog);
                const fileUrl = URL.createObjectURL(data.blob);
                if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
                  chrome.downloads.download({
                    url: fileUrl,
                    filename: data.filename,
                    saveAs: true
                  }, () => { URL.revokeObjectURL(fileUrl); });
                } else {
                  const a = document.createElement('a');
                  a.href = fileUrl;
                  a.download = data.filename;
                  a.click();
                  URL.revokeObjectURL(fileUrl);
                }

                showToast(`Đã tải xuống file "${data.filename}"`, 'success');
                if (ui.btn) ui.btn.disabled = false;
                terminateBatchWorker(activeWorker);
                activeWorker = null;
              },
              onDoneMerged: (data) => {
                clearTimeout(workerWatchdog);
                if (ui.bar) ui.bar.style.width = '100%';
                if (ui.status) {
                  ui.status.style.color = 'var(--success)';
                  ui.status.innerText = `HOÀN TẤT — Đã gộp thành công ${data.count} văn bản vào 1 file duy nhất.`;
                }

                const fileUrl = URL.createObjectURL(data.blob);
                if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
                  chrome.downloads.download({
                    url: fileUrl,
                    filename: data.filename,
                    saveAs: true
                  }, () => { URL.revokeObjectURL(fileUrl); });
                } else {
                  const a = document.createElement('a');
                  a.href = fileUrl;
                  a.download = data.filename;
                  a.click();
                  URL.revokeObjectURL(fileUrl);
                }

                showToast(`Đã xuất thành công file Word gộp ${data.count} văn bản ("${data.filename}")!`, 'success');

                try {
                  const tplSelectEl = document.getElementById('tplLibSelect');
                  const tplName = (isLibSource && tplSelectEl) ? tplSelectEl.value : 'Mẫu Word Upload';
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const base64data = reader.result.split(',')[1];
                    await HistoryManager.save({
                      id: Date.now().toString(),
                      exportAt: new Date().toISOString(),
                      templateName: tplName || 'Văn bản gộp',
                      count: data.count,
                      format: 'docx (gộp)',
                      zipBase64: base64data,
                      size: data.blob.size
                    });
                    await renderHistoryList(HistoryManager);
                  };
                  reader.readAsDataURL(data.blob);
                } catch(errHist) {
                  console.error('Lỗi lưu lịch sử xuất:', errHist);
                }

                if (ui.btn) ui.btn.disabled = false;
                setTimeout(() => {
                  if (ui.track) ui.track.style.display = 'none';
                  if (ui.bar) ui.bar.style.width = '0%';
                }, 2000);
                terminateBatchWorker(activeWorker);
                activeWorker = null;
              },
              onFileReady: (data) => {
                const fileUrl = URL.createObjectURL(data.blob);
                if (typeof chrome !== 'undefined' && chrome.downloads && chrome.downloads.download) {
                  chrome.downloads.download({
                    url: fileUrl,
                    filename: data.filename,
                    saveAs: false
                  }, () => {
                    setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
                  });
                } else {
                  const a = document.createElement('a');
                  a.href = fileUrl;
                  a.download = data.filename;
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
                }
              },
              onDoneIndividual: (data) => {
                clearTimeout(workerWatchdog);
                if (ui.bar) ui.bar.style.width = '100%';
                if (ui.status) {
                  ui.status.style.color = 'var(--success)';
                  ui.status.innerText = `HOÀN TẤT — Đã xuất thành công ${data.count} file văn bản riêng lẻ.`;
                }
                showToast(`Đã xuất thành công ${data.count} file .${data.format || 'docx'} vào thư mục tải xuống!`, 'success');
                if (ui.btn) ui.btn.disabled = false;
                setTimeout(() => {
                  if (ui.track) ui.track.style.display = 'none';
                  if (ui.bar) ui.bar.style.width = '0%';
                }, 2000);
                terminateBatchWorker(activeWorker);
                activeWorker = null;
              },
              onError: (data) => {
                if (ui.status) {
                  ui.status.style.color = 'var(--error)';
                  ui.status.innerText = 'Lỗi: ' + data.message;
                }
                showToast('Lỗi khi xuất: ' + data.message, 'error');
                if (ui.btn) ui.btn.disabled = false;
                clearTimeout(workerWatchdog);
                terminateBatchWorker(activeWorker);
                activeWorker = null;
              }
            });

            if (!activeWorker) {
              throw new Error("Không thể kết nối Web Worker.");
            }

            // Watchdog: nếu Worker im lặng quá 45 giây → báo lỗi và kết thúc
            workerWatchdog = setTimeout(() => {
              if (activeWorker) {
                const msg = 'Quá trình xử lý bị treo hoặc mất quá nhiều thời gian (>45s). '
                  + 'Có thể do dữ liệu quá lớn, file mẫu lỗi, hoặc thư viện Worker chưa nạp được. '
                  + 'Hãy thử lại hoặc giảm số lượng dòng.';
                if (ui.status) {
                  ui.status.style.color = 'var(--error)';
                  ui.status.innerText = 'Lỗi: ' + msg;
                }
                showToast('⚠️ ' + msg, 'error');
                if (ui.btn) ui.btn.disabled = false;
                terminateBatchWorker(activeWorker);
                activeWorker = null;
              }
            }, 45000);

            const exportFormatSelectEl = document.getElementById('exportFormatSelect');
            const exportFormat = exportFormatSelectEl ? exportFormatSelectEl.value : 'docx';

            const batchExportModeSelectEl = document.getElementById('batchExportModeSelect');
            const modalBatchExportModeSelectEl = document.getElementById('modalBatchExportModeSelect');
            let batchExportMode = modalBatchExportModeSelectEl ? modalBatchExportModeSelectEl.value : (batchExportModeSelectEl ? batchExportModeSelectEl.value : 'merged');
            if (!batchExportMode || batchExportMode === 'multiple') {
              batchExportMode = 'merged';
            }
            const mergeToOneFile = batchExportMode === 'merged';

            executeBatchJob(activeWorker, {
              editedData: normalizeRowsForWord(editedData),
              processedDocBuffer,
              nameFormat,
              fieldTransformers,
              singleFileIndex: isSingle ? 0 : null,
              actualRowIndex: isSingle && singleIdx !== null ? (singleIdx + 1) : null,
              prefixIndex,
              removeTones,
              exportFormat,
              batchExportMode,
              mergeToOneFile
            });
          } catch (errConfirm) {
            console.error('Lỗi khi kích hoạt xuất:', errConfirm);
            if (ui.status) {
              ui.status.style.color = 'var(--error)';
              ui.status.innerText = 'Lỗi: ' + errConfirm.message;
            }
            showToast('Lỗi: ' + errConfirm.message, 'error');
            if (ui.btn) ui.btn.disabled = false;
          }
        };

        if (ui.btn) ui.btn.disabled = false;
        showPreviewModal(headers, rawData);

      } catch (err) {
        if (ui.status) {
          ui.status.style.color = 'var(--error)';
          ui.status.innerText = 'Lỗi: ' + err.message;
        }
        showToast(err.message, 'error');
        if (ui.btn) ui.btn.disabled = false;
      }
    });
  }

  await renderTemplateList(TemplateManager, CategoryManager);
  await renderDataList(DataManager);

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        if (changes[DATA_SOURCES_KEY]) {
          renderDataList(DataManager);
        }
        if (changes[TEMPLATES_KEY]) {
          renderTemplateList(TemplateManager, CategoryManager);
        }
      }
    });
  }

  initGoogleDrivePickerListeners((res) => {
    if (res.error) {
      showToast(res.error, 'warning');
      return;
    }
    if (res.type === 'data' || res.type === 'data_sheet') {
      const input = document.getElementById('dataLinkInput');
      if (input) input.value = res.url;
      const nameInput = document.getElementById('dataLibNameInput');
      if (nameInput) {
        if (res.fileName) {
          nameInput.value = res.fileName;
        } else {
          GoogleSheetsManager.fetchFileTitle(res.url).then(t => {
            if (t && nameInput && (!nameInput.value || nameInput.value.startsWith('Google Sheet'))) {
              nameInput.value = t;
            }
          });
        }
      }
      const sheetInput = document.getElementById('dataSheetNameInput');
      if (sheetInput && res.sheetName && !sheetInput.value) {
        sheetInput.value = res.sheetName;
      }
      showToast(res.fileName ? `Đã chọn: "${res.fileName}"` : 'Đã chọn bảng tính từ Google Drive!', 'success');
    } else if (res.type === 'data_excel') {
      const input = document.getElementById('dataExcelLinkInput');
      if (input) input.value = res.url;
      const nameInput = document.getElementById('dataExcelLibNameInput');
      if (nameInput) {
        if (res.fileName) {
          nameInput.value = res.fileName;
        } else {
          GoogleSheetsManager.fetchFileTitle(res.url).then(t => {
            if (t && nameInput && (!nameInput.value || nameInput.value.startsWith('Link Excel'))) {
              nameInput.value = t;
            }
          });
        }
      }
      showToast(res.fileName ? `Đã chọn file: "${res.fileName}"` : 'Đã chọn file Excel từ Google Drive!', 'success');
    } else if (res.type === 'tpl') {
      const input = document.getElementById('tplLinkInput');
      const btn = document.getElementById('tplLinkImportBtn');
      if (input) input.value = res.url;
      if (btn) btn.click();
    }
  });

  // View Switcher (Header Navigation Tabs)
  const navTabs = document.querySelectorAll('#mainNavTabs .nav-tab');
  document.getElementById('mainNavTabs')?.setAttribute('role', 'tablist');
  navTabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', tab.dataset.view);
    if (!tab.id) tab.id = `workspace-tab-${index}`;
    const panel = document.getElementById(tab.dataset.view);
    panel?.setAttribute('role', 'tabpanel');
    panel?.setAttribute('aria-labelledby', tab.id);
    tab.setAttribute('aria-selected', String(tab.classList.contains('active')));
    tab.tabIndex = tab.classList.contains('active') ? 0 : -1;
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % navTabs.length;
      if (event.key === 'ArrowLeft') next = (index + navTabs.length - 1) % navTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = navTabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      navTabs[next].focus();
      navTabs[next].click();
    });
    tab.addEventListener('click', () => {
      const targetViewId = tab.dataset.view;
      if (!targetViewId) return;

      navTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.tabIndex = -1;
      });
      document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      tab.tabIndex = 0;
      const targetView = document.getElementById(targetViewId);
      if (targetView) {
        targetView.classList.add('active');
      }
    });
  });

  const dataSrcLinkBtn = document.getElementById('dataSrcLinkBtn');
  const dataSrcExcelLinkBtn = document.getElementById('dataSrcExcelLinkBtn');
  const dataSrcLocalBtn = document.getElementById('dataSrcLocalBtn');
  if (dataSrcLinkBtn) dataSrcLinkBtn.addEventListener('click', () => switchDataSource('sheets'));
  if (dataSrcExcelLinkBtn) dataSrcExcelLinkBtn.addEventListener('click', () => switchDataSource('excel'));
  if (dataSrcLocalBtn) dataSrcLocalBtn.addEventListener('click', () => switchDataSource('local'));

  const openFullTabBtn = document.getElementById('openFullTabBtn');
  if (openFullTabBtn) {
    openFullTabBtn.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: chrome.runtime.getURL('app.html') });
      } else {
        window.open('app.html', '_blank');
      }
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
