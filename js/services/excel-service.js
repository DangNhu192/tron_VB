'use strict';

import { extractTableDataFromDocx } from '../core/docx-xml.js';
import { readExcelWorkbook } from '../core/xlsx-text.js';

function getXLSX() {
  if (typeof XLSX !== 'undefined') return XLSX;
  if (typeof window !== 'undefined' && window.XLSX) return window.XLSX;
  throw new Error("Thư viện SheetJS (XLSX) chưa được nạp.");
}

/**
 * Đọc file dữ liệu Local (.xlsx, .xls, .csv, .docx)
 */
export async function parseLocalDataFile(file, selectedSheetName = null) {
  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (name.endsWith('.docx')) {
    const sheetGrp = document.getElementById('excelSheetGroup');
    if (sheetGrp) sheetGrp.style.display = 'none';
    return {
      workbook: null,
      data: extractTableDataFromDocx(buffer)
    };
  }

  const XLSXLib = getXLSX();
  const workbook = readExcelWorkbook(buffer, XLSXLib);
  const sheetNames = workbook.SheetNames;
  const sheetGrp = document.getElementById('excelSheetGroup');
  const sheetSelect = document.getElementById('excelSheetSelect');

  if (sheetNames.length > 1 && sheetGrp && sheetSelect) {
    sheetSelect.innerHTML = sheetNames.map(s => `<option value="${s}">${s}</option>`).join('');
    if (selectedSheetName && sheetNames.includes(selectedSheetName)) {
      sheetSelect.value = selectedSheetName;
    }
    sheetGrp.style.display = 'block';
  } else if (sheetGrp) {
    sheetGrp.style.display = 'none';
  }

  const targetSheetName = (selectedSheetName && sheetNames.includes(selectedSheetName))
    ? selectedSheetName
    : sheetNames[0];

  const worksheet = workbook.Sheets[targetSheetName];
  if (!worksheet) throw new Error(`Không tìm thấy Sheet "${targetSheetName}".`);

  // Bảo toàn tuyệt đối giá trị XML từ Excel. Tên font trong styles.xml không
  // đủ để kết luận bảng mã: workbook Unicode vẫn có thể chứa style .VnTime cũ.
  // Chuyển mã legacy chỉ nên là thao tác người dùng chủ động, không tự chạy lúc import.

  const rawData = XLSXLib.utils.sheet_to_json(worksheet, { defval: "" });
  if (!rawData || rawData.length === 0) {
    throw new Error("Trang tính (Sheet) chọn không chứa hàng dữ liệu nào.");
  }

  return {
    workbook,
    data: rawData
  };
}

function getPizZip() {
  if (typeof PizZip !== 'undefined') return PizZip;
  if (typeof window !== 'undefined' && window.PizZip) return window.PizZip;
  throw new Error("Thư viện PizZip chưa được nạp.");
}

function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

/**
 * Tạo dữ liệu mẫu gợi ý thông minh dựa trên tên cột/biến
 */
export function buildSampleDataRow(headers) {
  return headers.map(h => {
    const lower = h.toLowerCase().trim();
    if (lower === 'stt') return '1';
    if (lower === 'check dl') return 'TRUE';
    if (lower.includes('ngay') || lower.includes('date')) return '25/09/2026';
    if (lower.includes('so_vb') || lower.includes('so_hd') || lower.includes('so_qd') || lower === 'so') return '123/UBND-VP';
    if (lower.includes('ten') || lower.includes('nguoi') || lower.includes('ong_ba') || lower.includes('dai_dien')) return 'Nguyễn Văn A';
    if (lower.includes('chuc_vu') || lower.includes('vi_tri')) return 'Giám đốc';
    if (lower.includes('phong') || lower.includes('ban') || lower.includes('don_vi') || lower.includes('co_quan')) return 'UBND Thành phố';
    if (lower.includes('dia_chi') || lower.includes('noi_o') || lower.includes('tru_so')) return 'Số 1 Tràng Tiền, Hà Nội';
    if (lower.includes('tien') || lower.includes('gia') || lower.includes('luong') || lower.includes('kinh_phi')) return '10,000,000';
    if (lower.includes('email') || lower.includes('mail')) return 'minh-hoa@example.invalid';
    if (lower.includes('sdt') || lower.includes('dien_thoai') || lower.includes('phone')) return '0912345678';
    return `[Mẫu ${h}]`;
  });
}

/**
 * Tạo file Excel Mẫu (.xlsx) từ danh sách biến đã rà soát
 */
export function generateSampleExcelFromTemplate(varList, options = {}) {
  if (!varList || varList.length === 0) {
    throw new Error("Không có biến số nào để tạo file Excel mẫu.");
  }
  const includeSTT = options.includeSTT !== false;
  const includeCheckDL = options.includeCheckDL !== false;
  const tplName = (options.templateName || 'AutoDoc').replace(/\.[^/.]+$/, "").replace(/\s+/g, '_');

  const headers = [];
  if (includeSTT) headers.push('STT');
  if (includeCheckDL) headers.push('Check DL');
  headers.push(...varList);

  const sampleRow = buildSampleDataRow(headers);
  const data = [headers, sampleRow];

  const XLSXLib = getXLSX();
  const ws = XLSXLib.utils.aoa_to_sheet(data);

  // Tự động căn chỉnh độ rộng cột
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 15) }));

  const wb = XLSXLib.utils.book_new();
  XLSXLib.utils.book_append_sheet(wb, ws, "Dữ_Liệu_Mẫu");

  const wbout = XLSXLib.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `Du_Lieu_Mau_${tplName}_${Date.now()}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Tạo file Word Bảng Mẫu (.docx) từ danh sách biến đã rà soát
 */
export function generateSampleDocxFromTemplate(varList, options = {}) {
  if (!varList || varList.length === 0) {
    throw new Error("Không có biến số nào để tạo file Word bảng mẫu.");
  }
  const includeSTT = options.includeSTT !== false;
  const includeCheckDL = options.includeCheckDL !== false;
  const tplName = (options.templateName || 'AutoDoc').replace(/\.[^/.]+$/, "").replace(/\s+/g, '_');

  const headers = [];
  if (includeSTT) headers.push('STT');
  if (includeCheckDL) headers.push('Check DL');
  headers.push(...varList);

  const sampleRow = buildSampleDataRow(headers);

  const PizZipClass = getPizZip();
  const zip = new PizZipClass();
  
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  let tableXml = `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="0" w:type="auto"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
      </w:tblBorders>
    </w:tblPr>`;

  // Hàng tiêu đề bảng
  tableXml += `<w:tr><w:trPr><w:tblHeader/></w:trPr>`;
  for (const h of headers) {
    tableXml += `<w:tc>
      <w:tcPr>
        <w:shd w:fill="F1F5F9"/>
      </w:tcPr>
      <w:p>
        <w:pPr><w:jc w:val="center"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr>
          <w:t>${escapeXml(h)}</w:t>
        </w:r>
      </w:p>
    </w:tc>`;
  }
  tableXml += `</w:tr>`;

  // Hàng dữ liệu mẫu
  tableXml += `<w:tr>`;
  for (const v of sampleRow) {
    tableXml += `<w:tc>
      <w:p>
        <w:pPr><w:jc w:val="left"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>
          <w:t>${escapeXml(v)}</w:t>
        </w:r>
      </w:p>
    </w:tc>`;
  }
  tableXml += `</w:tr>`;
  tableXml += `</w:tbl>`;

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/><w:color w:val="1E293B"/></w:rPr>
        <w:t>BẢNG DỮ LIỆU MẪU TRỘN VĂN BẢN</w:t>
      </w:r>
    </w:p>
    ${tableXml}
    <w:sectPr>
      <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rels);
  zip.file('word/document.xml', docXml);

  const blob = zip.generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bang_Du_Lieu_Mau_${tplName}_${Date.now()}.docx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Sao chép văn bản vào Clipboard bảo đảm 100% bằng cơ chế kép (textarea + Clipboard API)
 */
export function copyToClipboard(text) {
  let success = false;
  try {
    if (typeof document !== 'undefined') {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, 99999);
      success = document.execCommand('copy');
      document.body.removeChild(ta);
    }
  } catch (err) {
    console.warn('Fallback execCommand copy error:', err);
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return success;
}

/**
 * Gắn thanh công cụ trợ lý AutoDoc nổi trên Google Sheet mới tạo
 */
function setupGoogleSheetTabHelper(tabId, headers, sampleRow, tsv, tplName) {
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.scripting) return;

  const onUpdatedListener = (updatedTabId, changeInfo, tab) => {
    if (updatedTabId !== tabId) return;

    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('docs.google.com/spreadsheets/d/')) {
      chrome.tabs.onUpdated.removeListener(onUpdatedListener);

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (hList, tsvData, templateName) => {
          if (document.getElementById('autodoc-sheet-helper-bar')) return;

          const bar = document.createElement('div');
          bar.id = 'autodoc-sheet-helper-bar';
          bar.style.cssText = `
            position: fixed;
            top: 15px;
            left: 50%;
            transform: translateX(-50%);
            background: #0f172a;
            color: #f8fafc;
            padding: 12px 20px;
            border-radius: 12px;
            z-index: 999999999;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            gap: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            border: 2px solid #10b981;
            animation: autodocSlideDown 0.3s ease-out;
          `;

          const style = document.createElement('style');
          style.textContent = `
            @keyframes autodocSlideDown {
              from { transform: translate(-50%, -30px); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
            .autodoc-sheet-btn {
              border: none;
              padding: 8px 15px;
              border-radius: 6px;
              font-weight: 600;
              font-size: 13px;
              cursor: pointer;
              transition: all 0.2s;
              display: inline-flex;
              align-items: center;
              gap: 6px;
            }
            .autodoc-sheet-btn:hover { opacity: 0.9; transform: translateY(-1px); }
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
                  👉 Nhấp chọn ô <b>A1</b> rồi nhấn <kbd style="background:#334155; color:#38bdf8; padding:2px 7px; border-radius:4px; font-weight:bold; font-family:monospace; border:1px solid #475569;">Ctrl + V</kbd> (hoặc phím Dán) để điền ngay toàn bộ dữ liệu vào bảng tính!
                </div>
              </div>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <button id="autodoc-recopy-btn" class="autodoc-sheet-btn" style="background:#10b981; color:white;">
                📋 Copy Lại Cột
              </button>
              <button id="autodoc-save-to-lib-btn" class="autodoc-sheet-btn" style="background:#2563eb; color:white;">
                🔗 Lưu Link Sheet Này Vào AutoDoc
              </button>
              <button id="autodoc-close-helper-btn" style="background:transparent; color:#94a3b8; border:none; font-size:18px; cursor:pointer; padding:4px 8px; line-height:1;">✕</button>
            </div>
          `;

          document.body.appendChild(bar);

          document.getElementById('autodoc-recopy-btn').addEventListener('click', () => {
            const ta = document.createElement('textarea');
            ta.value = tsvData;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            const btn = document.getElementById('autodoc-recopy-btn');
            btn.textContent = '✓ Đã Copy!';
            setTimeout(() => { btn.textContent = '📋 Copy Lại Cột'; }, 2000);
          });

          document.getElementById('autodoc-save-to-lib-btn').addEventListener('click', () => {
            const btn = document.getElementById('autodoc-save-to-lib-btn');
            btn.textContent = 'Đang lưu...';
            chrome.runtime.sendMessage({
              action: 'autodocSaveSheetToLib',
              url: window.location.href,
              name: `Sheet ${templateName}`
            }, () => {
              btn.textContent = '✓ Đã Lưu Vào Thư Viện!';
              setTimeout(() => { bar.style.display = 'none'; }, 2000);
            });
          });

          document.getElementById('autodoc-close-helper-btn').addEventListener('click', () => {
            bar.style.display = 'none';
          });
        },
        args: [headers, tsv, tplName]
      }).catch(err => console.log('Không thể inject helper vào Google Sheet:', err));
    }
  };

  chrome.tabs.onUpdated.addListener(onUpdatedListener);
}

/**
 * Tạo Google Sheet Mới: Sao chép TSV vào clipboard, mở sheet.new & gắn thanh trợ lý nổi
 */
export async function generateGoogleSheetTemplate(varList, options = {}) {
  if (!varList || varList.length === 0) {
    throw new Error("Không có biến số nào để tạo Google Sheet.");
  }
  const includeSTT = options.includeSTT !== false;
  const includeCheckDL = options.includeCheckDL !== false;
  const tplName = (options.templateName || 'AutoDoc').replace(/\.[^/.]+$/, "");

  const headers = [];
  if (includeSTT) headers.push('STT');
  if (includeCheckDL) headers.push('Check DL');
  headers.push(...varList);

  const sampleRow = buildSampleDataRow(headers);
  const tsv = [headers.join('\t'), sampleRow.join('\t')].join('\n');

  // Đảm bảo copy vào clipboard 100% bằng cơ chế kép
  copyToClipboard(tsv);

  const newSheetUrl = 'https://sheet.new';
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({
      action: 'autodocCreateGoogleSheet',
      headers,
      sampleRow,
      tsv,
      tplName
    }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        if (chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url: newSheetUrl }, (tab) => {
            if (tab && tab.id) {
              setupGoogleSheetTabHelper(tab.id, headers, sampleRow, tsv, tplName);
            }
          });
        } else if (typeof window !== 'undefined') {
          window.open(newSheetUrl, '_blank');
        }
      }
    });
  } else if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url: newSheetUrl }, (tab) => {
      if (tab && tab.id) {
        setupGoogleSheetTabHelper(tab.id, headers, sampleRow, tsv, tplName);
      }
    });
  } else if (typeof window !== 'undefined') {
    window.open(newSheetUrl, '_blank');
  }

  return { headers, sampleRow, tsv };
}

/**
 * Xuất dữ liệu đã xem trước ra file Excel (.xlsx)
 */
export function exportPreviewDataToExcel(headers, editedData) {
  if (!editedData || editedData.length === 0) {
    throw new Error("Không có hàng dữ liệu nào được chọn để xuất Excel.");
  }

  const XLSXLib = getXLSX();
  const ws = XLSXLib.utils.json_to_sheet(editedData, { header: headers });
  const wb = XLSXLib.utils.book_new();
  XLSXLib.utils.book_append_sheet(wb, ws, "Du_Lieu_Xem_Truoc");

  const wbout = XLSXLib.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `Du_Lieu_AutoDoc_${Date.now()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * So sánh 2 tập dữ liệu xem có chỉnh sửa / thêm mới / xóa bỏ dòng nào không
 */
export function isDataModified(originalRows, currentRows) {
  if (!originalRows && !currentRows) return false;
  if (!originalRows || !currentRows) return true;
  if (originalRows.length !== currentRows.length) return true;
  for (let i = 0; i < currentRows.length; i++) {
    const o = originalRows[i];
    const c = currentRows[i];
    const allKeys = new Set([...Object.keys(o || {}), ...Object.keys(c || {})]);
    for (const k of allKeys) {
      const v1 = String(o[k] ?? '').trim();
      const v2 = String(c[k] ?? '').trim();
      if (v1 !== v2) return true;
    }
  }
  return false;
}

/**
 * Đóng gói lại workbook Excel (.xlsx) với dữ liệu đã cập nhật
 */
export function buildUpdatedExcelBuffer(currentWorkbook, sheetName, headers, rawData) {
  const XLSXLib = getXLSX();
  const wb = currentWorkbook ? currentWorkbook : XLSXLib.utils.book_new();
  const ws = XLSXLib.utils.json_to_sheet(rawData, { header: headers });
  
  const targetSheet = sheetName || (wb.SheetNames && wb.SheetNames.length > 0 ? wb.SheetNames[0] : 'Sheet1');
  if (wb.SheetNames && wb.SheetNames.includes(targetSheet)) {
    wb.Sheets[targetSheet] = ws;
  } else {
    XLSXLib.utils.book_append_sheet(wb, ws, targetSheet);
  }
  
  return XLSXLib.write(wb, { bookType: 'xlsx', type: 'array' });
}

/**
 * Tạo file Word (.docx) chứa bảng dữ liệu cập nhật
 */
export function buildUpdatedDocxTableBuffer(headers, rows, title = 'BẢNG DỮ LIỆU ĐÃ CẬP NHẬT') {
  const PizZipClass = getPizZip();
  const zip = new PizZipClass();
  
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  let tableXml = `<w:tbl>
    <w:tblPr>
      <w:tblW w:w="0" w:type="auto"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
      </w:tblBorders>
    </w:tblPr>`;

  tableXml += `<w:tr><w:trPr><w:tblHeader/></w:trPr>`;
  for (const h of headers) {
    tableXml += `<w:tc>
      <w:tcPr><w:shd w:fill="F1F5F9"/></w:tcPr>
      <w:p>
        <w:pPr><w:jc w:val="center"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr>
          <w:t>${escapeXml(h)}</w:t>
        </w:r>
      </w:p>
    </w:tc>`;
  }
  tableXml += `</w:tr>`;

  for (const row of rows) {
    tableXml += `<w:tr>`;
    for (const h of headers) {
      const v = row[h] !== undefined ? String(row[h]) : '';
      tableXml += `<w:tc>
        <w:p>
          <w:pPr><w:jc w:val="left"/></w:pPr>
          <w:r>
            <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>
            <w:t>${escapeXml(v)}</w:t>
          </w:r>
        </w:p>
      </w:tc>`;
    }
    tableXml += `</w:tr>`;
  }
  tableXml += `</w:tbl>`;

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="240"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="28"/><w:color w:val="1E293B"/></w:rPr>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>
    ${tableXml}
    <w:sectPr>
      <w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypes);
  zip.file('_rels/.rels', rels);
  zip.file('word/document.xml', docXml);

  return zip.generate({ type: 'arraybuffer' });
}
