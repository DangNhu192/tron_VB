'use strict';

import { 
  detectDocxZipEncoding, 
  keepOriginalText,
  normalizeVietnameseText
} from './charset.js';

function getPizZipClass() {
  if (typeof PizZip !== 'undefined') return PizZip;
  if (typeof window !== 'undefined' && window.PizZip) return window.PizZip;
  throw new Error('Thư viện PizZip chưa được nạp.');
}

function getDocxtemplaterClass() {
  if (typeof docxtemplater !== 'undefined') return docxtemplater;
  if (typeof window !== 'undefined' && window.docxtemplater) return window.docxtemplater;
  return null;
}

function normalizeWordFonts(xmlStr, targetFont) {
  const fontAttributes = `w:ascii="${targetFont}" w:hAnsi="${targetFont}" w:eastAsia="${targetFont}" w:cs="${targetFont}"`;

  let normalized = xmlStr.replace(/<w:rFonts\b([^>]*?)(\/?>)/gi, (match, attrs, closing) => {
    let updatedAttrs = attrs
      .replace(/\s+w:(?:ascii|hAnsi|eastAsia|cs)Theme="[^"]*"/gi, '')
      .replace(/\s+w:(?:ascii|hAnsi|eastAsia|cs)="[^"]*"/gi, '');
    return `<w:rFonts${updatedAttrs} ${fontAttributes}${closing}`;
  });

  normalized = normalized.replace(/<w:rPr(\b[^>]*?)\s*\/>/gi, `<w:rPr$1><w:rFonts ${fontAttributes}/></w:rPr>`);
  normalized = normalized.replace(/<w:rPr(\b[^>]*)>([\s\S]*?)<\/w:rPr>/gi, (match, attrs, content) => {
    if (/<w:rFonts\b/i.test(content)) return match;
    return `<w:rPr${attrs}><w:rFonts ${fontAttributes}/>${content}</w:rPr>`;
  });

  return normalized;
}

/**
 * Chuẩn bị file Word mẫu: chuyển bảng mã static sang Unicode và chuẩn hóa Font chữ về Times New Roman nếu được bật
 */
export function prepareTemplateZip(rawBuffer, normalizeFont = true) {
  const PizZipClass = getPizZipClass();
  const zip = new PizZipClass(rawBuffer);
  const detectedDocEncoding = detectDocxZipEncoding(zip);

  const conversionStats = { VNI: 0, TCVN3: 0, UNICODE: 0 };
  const wordXmlFileRegex = /^word\/.+\.xml$/i;
  for (const filename in zip.files) {
    if (wordXmlFileRegex.test(filename)) {
        const fileObj = zip.file(filename);
        if (!fileObj) continue;
        let xmlStr = fileObj.asText();

        // Chuyển theo từng nút text để DOCX trộn Unicode/VNI/TCVN3 vẫn an toàn.
        xmlStr = xmlStr.replace(/<w:(t|delText|instrText|delInstrText)(\b[^>]*)>([\s\S]*?)<\/w:\1>/gi, (match, tag, attrs, content) => {
          const normalized = normalizeVietnameseText(content);
          conversionStats[normalized.encoding]++;
          return `<w:${tag}${attrs}>${normalized.text}</w:${tag}>`;
        });

        if (normalizeFont) {
          const targetFont = "Times New Roman";
          xmlStr = normalizeWordFonts(xmlStr, targetFont);
        }

        zip.file(filename, xmlStr);
    }
  }

  return {
    zip,
    detectedDocEncoding,
    finalDocEncoding: 'UNICODE',
    conversionStats
  };
}

/**
 * Quét toàn diện tất cả các biến {{...}} trong file Word (bao gồm document, header, footer)
 */
export function extractVariablesFromDocxZip(zip) {
  const foundVars = new Set();
  let combinedText = "";

  // 1. Quét bằng docxtemplater nếu có thể
  try {
    const DocxClass = getDocxtemplaterClass();
    if (DocxClass) {
      const doc = new DocxClass(zip, {
        delimiters: { start: '{{', end: '}}' },
        paragraphLoop: true,
        linebreaks: true,
        nullGetter() { return ""; }
      });
      combinedText += " " + doc.getFullText();
    }
  } catch (e) {
    // Tiếp tục quét bằng XML nếu lỗi
  }

  // 2. Quét tất cả các file XML trong word/ (bao gồm document.xml, header*.xml, footer*.xml...)
  for (const filename in zip.files) {
    if (filename.startsWith('word/') && filename.endsWith('.xml')) {
      const fileObj = zip.file(filename);
      if (!fileObj) continue;
      const content = fileObj.asText();
      const tMatches = content.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi);
      if (tMatches) {
        combinedText += " " + tMatches.map(m => m.replace(/<w:t[^>]*>|<\/w:t>/gi, '')).join('');
      }
    }
  }

  const mvRx = /\{\{([^{}]+?)\}\}/g;
  let mv;
  while ((mv = mvRx.exec(combinedText)) !== null) {
    const varName = keepOriginalText(mv[1]);
    if (varName && !varName.startsWith('#') && !varName.startsWith('/') && !varName.startsWith('^')) {
      foundVars.add(varName);
    }
  }

  return {
    varList: [...foundVars],
    fullText: combinedText
  };
}

/**
 * Trích xuất dữ liệu bảng từ file Word (.docx)
 */
export function extractTableDataFromDocx(arrayBuffer) {
  const PizZipClass = getPizZipClass();
  const zip = new PizZipClass(arrayBuffer);
  const docXmlStr = zip.file("word/document.xml")?.asText();
  if (!docXmlStr) {
    throw new Error("Không thể đọc cấu trúc file Word (thiếu word/document.xml).");
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXmlStr, "application/xml");
  
  const allElements = xmlDoc.getElementsByTagName("*");
  const tables = [];
  for (let i = 0; i < allElements.length; i++) {
    if (allElements[i].localName === "tbl") {
      tables.push(allElements[i]);
    }
  }

  if (tables.length === 0) {
    throw new Error("Không tìm thấy bảng dữ liệu nào trong file Word.");
  }

  const table = tables[0];
  const rows = [];
  for (let child = table.firstChild; child; child = child.nextSibling) {
    if (child.nodeType === 1 && child.localName === "tr") {
      rows.push(child);
    }
  }
  if (rows.length === 0) {
    const tblElements = table.getElementsByTagName("*");
    for (let i = 0; i < tblElements.length; i++) {
      if (tblElements[i].localName === "tr") {
        rows.push(tblElements[i]);
      }
    }
  }

  if (rows.length === 0) {
    throw new Error("Bảng dữ liệu trong file Word trống.");
  }

  function getRowCells(row) {
    const cells = [];
    for (let child = row.firstChild; child; child = child.nextSibling) {
      if (child.nodeType === 1 && child.localName === "tc") {
        let text = "";
        const tEls = child.getElementsByTagName("*");
        for (let j = 0; j < tEls.length; j++) {
          if (tEls[j].localName === "t") {
            text += tEls[j].textContent;
          }
        }
        cells.push(text.trim());
      }
    }
    return cells;
  }

  const headers = getRowCells(rows[0]);
  if (headers.length === 0 || headers.every(h => !h)) {
    throw new Error("Không tìm thấy tiêu đề cột hợp lệ ở dòng đầu tiên của bảng.");
  }

  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = getRowCells(rows[i]);
    if (cells.length === 0 || cells.every(c => !c)) {
      continue;
    }
    const rowObj = {};
    headers.forEach((header, colIdx) => {
      if (header) {
        rowObj[header] = cells[colIdx] || "";
      }
    });
    data.push(rowObj);
  }

  if (data.length === 0) {
    throw new Error("Không có hàng dữ liệu nào trong bảng.");
  }

  return data;
}
