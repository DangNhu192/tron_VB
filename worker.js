// Polyfill window & global environment for worker context
if (typeof window === 'undefined') {
  self.window = self;
}

// Polyfill setImmediate for JSZip async streams in Web Worker
if (typeof setImmediate === 'undefined') {
  var setImmediate = function(fn, ...args) {
    return setTimeout(fn, 0, ...args);
  };
  var clearImmediate = function(id) {
    clearTimeout(id);
  };
  self.setImmediate = setImmediate;
  self.clearImmediate = clearImmediate;
  if (typeof globalThis !== 'undefined') {
    globalThis.setImmediate = setImmediate;
    globalThis.clearImmediate = clearImmediate;
  }
}

// Polyfill DOMParser, XMLSerializer, XMLDocument for Web Worker
if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
  try {
    importScripts('libs/xmldom.min.js');
    const xmlDomObj = (typeof XMLDOM !== 'undefined' ? XMLDOM : null) || 
                      (typeof self !== 'undefined' ? self.XMLDOM : null) || 
                      (typeof globalThis !== 'undefined' ? globalThis.XMLDOM : null);
    if (xmlDomObj) {
      self.DOMParser = xmlDomObj.DOMParser;
      self.XMLSerializer = xmlDomObj.XMLSerializer;
      self.XMLDocument = xmlDomObj.XMLDocument;
      if (self.window) {
        self.window.DOMParser = xmlDomObj.DOMParser;
        self.window.XMLSerializer = xmlDomObj.XMLSerializer;
        self.window.XMLDocument = xmlDomObj.XMLDocument;
      }
    }
  } catch (errXmldom) {
    console.warn('Cảnh báo nạp libs/xmldom.min.js trong Worker:', errXmldom);
  }
}

let _libsLoaded = false;
try {
  importScripts('libs/jszip.min.js', 'libs/pizzip.min.js', 'libs/docxtemplater.js');
  _libsLoaded = true;
} catch (errLibs) {
  // Báo ngay về UI — không để UI câm lặng khi thư viện load thất bại
  self.postMessage({
    type: 'error',
    message: 'Lỗi nạp thư viện xử lý Word trong Worker: ' + (errLibs.message || errLibs)
      + '. Hãy kiểm tra lại file libs/ hoặc tải lại tiện ích.'
  });
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Xóa dấu tiếng Việt & ký tự không hợp lệ cho tên file
function removeVietnameseTones(str) {
  if (!str) return "Khong_Xac_Dinh";
  let text = String(str).normalize("NFC");
  text = text.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  text = text.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  text = text.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  text = text.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  text = text.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  text = text.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  text = text.replace(/đ/g, "d");
  text = text.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  text = text.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  text = text.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  text = text.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  text = text.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  text = text.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  text = text.replace(/Đ/g, "D");
  text = text.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  text = text.replace(/\u02C6|\u0306|\u031B/g, "");
  text = text.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  text = text.replace(/_+/g, "_");
  return text.trim();
}

// Chuẩn hóa tên file theo cấu hình tùy chọn
function sanitizeFilename(str, removeTones = true) {
  if (!str) return "Khong_Xac_Dinh";
  if (removeTones) {
    return removeVietnameseTones(str);
  }
  let text = String(str).normalize("NFC");
  // Loại bỏ các ký tự cấm đặt tên file trên Windows và Unix: \ / : * ? " < > |
  text = text.replace(/[\\/:*?"<>|]/g, "_");
  text = text.replace(/[\x00-\x1f\x80-\x9f]/g, "");
  text = text.replace(/_+/g, "_");
  return text.trim() || "Khong_Xac_Dinh";
}

// Hàm biến đổi định dạng giá trị (Field Transformers)
function applyTransformers(value, transformerType) {
  if (value === undefined || value === null || value === "") return "";
  let str = String(value).normalize("NFC").trim();

  switch (transformerType) {
    case 'uppercase':
      return str.toUpperCase();
    case 'lowercase':
      return str.toLowerCase();
    case 'capitalize':
      return str.replace(/\b\w/g, l => l.toUpperCase());
    case 'currency': {
      const num = parseFloat(str.replace(/[^0-9.-]+/g, ""));
      if (!isNaN(num)) {
        return new Intl.NumberFormat('vi-VN').format(num) + " đ";
      }
      return str;
    }
    case 'date': {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
      return str;
    }
    default:
      return str;
  }
}

// Tách phần thân và section properties của word/document.xml để ghép nối văn bản
function extractDocxBodyParts(xml) {
  const bodyMatch = xml.match(/<w:body[^>]*>/);
  if (!bodyMatch) {
    throw new Error("Không tìm thấy thẻ <w:body> trong file Word mẫu.");
  }
  const bodyStart = bodyMatch.index + bodyMatch[0].length;
  const bodyEnd = xml.lastIndexOf('</w:body>');
  if (bodyEnd === -1 || bodyEnd < bodyStart) {
    throw new Error("Cấu trúc thẻ </w:body> trong file Word mẫu không hợp lệ.");
  }

  const bodyContent = xml.substring(bodyStart, bodyEnd);
  const sectPrIdx = bodyContent.lastIndexOf('<w:sectPr');
  let content = bodyContent;
  let sectPr = '';
  if (sectPrIdx !== -1) {
    content = bodyContent.substring(0, sectPrIdx);
    sectPr = bodyContent.substring(sectPrIdx);
  }

  return {
    prefix: xml.substring(0, bodyStart),
    suffix: xml.substring(bodyEnd),
    content,
    sectPr
  };
}

self.onmessage = function(e) {
  // Kiểm tra thư viện đã nạp chưa — nếu importScripts thất bại thì dừng ngay
  if (!_libsLoaded) {
    self.postMessage({ type: 'error', message: 'Thư viện xử lý Word chưa được nạp vào Worker. Hãy tải lại tiện ích hoặc kiểm tra file libs/.' });
    return;
  }

  const { 
    editedData, 
    processedDocBuffer, 
    nameFormat, 
    fieldTransformers = {}, 
    singleFileIndex = null,
    actualRowIndex = null,
    prefixIndex = true,
    removeTones = true,
    exportFormat = 'docx',
    batchExportMode = 'merged', // 'merged' | 'individual' | 'zip'
    mergeToOneFile = false
  } = e.data;

  self.postMessage({ type: 'status', message: 'Đã kết nối Web Worker, bắt đầu xử lý dữ liệu...' });

  const totalRows = editedData ? editedData.length : 0;
  if (totalRows === 0) {
    self.postMessage({ type: 'error', message: "Không có dữ liệu để xuất." });
    return;
  }

  // Tìm Docxtemplater — hỗ trợ nhiều cách export khác nhau của các build khác nhau
  const Docxtemplater = (typeof self.docxtemplater !== 'undefined' ? self.docxtemplater : null)
    || (typeof self.Docxtemplater !== 'undefined' ? self.Docxtemplater : null)
    || (typeof docxtemplater !== 'undefined' ? docxtemplater : null)
    || (typeof Docxtemplater !== 'undefined' ? Docxtemplater : null);
  if (!Docxtemplater) {
    self.postMessage({ type: 'error', message: "Không tìm thấy thư viện Docxtemplater trong Web Worker. Kiểm tra file libs/docxtemplater.js." });
    return;
  }

  const PizZipClass = (typeof self.PizZip !== 'undefined' ? self.PizZip : null)
    || (typeof PizZip !== 'undefined' ? PizZip : null);
  if (!PizZipClass) {
    self.postMessage({ type: 'error', message: "Không tìm thấy thư viện PizZip trong Web Worker. Kiểm tra file libs/pizzip.min.js." });
    return;
  }

  const JSZipClass = (typeof self !== 'undefined' && self.JSZip) || 
                     (typeof window !== 'undefined' ? window.JSZip : null) || 
                     (typeof JSZip !== 'undefined' ? JSZip : null);

  const ext = exportFormat === 'pdf' ? 'pdf' : 'docx';

  try {
    // TRƯỜNG HỢP 1: XUẤT 1 FILE ĐƠN LẺ (từ nút xuất ở từng dòng HOẶC khi chỉ chọn đúng 1 dòng)
    if (singleFileIndex !== null || totalRows === 1) {
      const idx = singleFileIndex !== null ? singleFileIndex : 0;
      const row = editedData[idx];
      const zipIn = new PizZipClass(processedDocBuffer);
      const doc = new Docxtemplater(zipIn, {
        delimiters: { start: '{{', end: '}}' },
        paragraphLoop: true,
        linebreaks: true,
        nullGetter() { return ""; }
      });

      const safeRow = {};
      for (let key in row) {
        let val = row[key];
        const transformer = fieldTransformers[key];
        val = applyTransformers(val, transformer);
        safeRow[key.normalize("NFC")] = val;
      }

      doc.setData(safeRow);
      doc.render();

      const contentBlob = doc.getZip().generate({ 
        type: "blob", 
        mimeType: DOCX_MIME 
      });

      let rawFileName = nameFormat.replace(/\[(.*?)\]/g, (match, colName) => {
        const v = safeRow[colName.normalize("NFC")];
        return (v !== undefined && v !== '') ? v : 'KhongXacDinh';
      });

      const cleanName = sanitizeFilename(rawFileName, removeTones);
      const rowNum = (actualRowIndex !== null && actualRowIndex !== undefined) ? actualRowIndex : (idx + 1);
      const finalFileName = prefixIndex ? `${rowNum}_${cleanName}.${ext}` : `${cleanName}.${ext}`;

      self.postMessage({
        type: 'done_single',
        blob: contentBlob,
        filename: finalFileName,
        format: ext
      });
      return;
    }

    // Xác định chế độ xuất: Mặc định luôn là gộp 1 file Word .docx duy nhất (trừ khi người dùng chủ động chọn 'individual' hoặc 'zip')
    const isZip = batchExportMode === 'zip';
    const isIndividual = batchExportMode === 'individual' || batchExportMode === 'individual_files';
    const isMerged = !isZip && !isIndividual;

    // TRƯỜNG HỢP 2: GỘP CHUNG TẤT CẢ VĂN BẢN VÀO CÙNG 1 FILE DOCX DUY NHẤT (MẶC ĐỊNH - KHUYÊN DÙNG)
    if (isMerged) {
      const renderedBodyParts = [];
      let finalSectPr = '';
      let xmlPrefix = '';
      let xmlSuffix = '';

      const PAGE_BREAK = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

      for (let i = 0; i < totalRows; i++) {
        const row = editedData[i];
        if (!row || Object.keys(row).length === 0) continue;

        const zipIn = new PizZipClass(processedDocBuffer);
        const doc = new Docxtemplater(zipIn, {
          delimiters: { start: '{{', end: '}}' },
          paragraphLoop: true,
          linebreaks: true,
          nullGetter() { return ""; }
        });

        const safeRow = {};
        for (let key in row) {
          let val = row[key];
          const transformer = fieldTransformers[key];
          val = applyTransformers(val, transformer);
          safeRow[key.normalize("NFC")] = val;
        }

        try {
          doc.setData(safeRow);
          doc.render();
        } catch (err) {
          throw new Error(`Lỗi điền dữ liệu tại dòng ${i + 1}: ${err.message}`);
        }

        const docXml = doc.getZip().file("word/document.xml")?.asText();
        if (!docXml) {
          throw new Error(`Không đọc được word/document.xml tại dòng ${i + 1}.`);
        }

        const parts = extractDocxBodyParts(docXml);
        renderedBodyParts.push(parts.content);
        if (parts.sectPr) finalSectPr = parts.sectPr;
        if (!xmlPrefix) xmlPrefix = parts.prefix;
        if (!xmlSuffix) xmlSuffix = parts.suffix;

        // Báo cáo tiến trình
        if (i % 5 === 0 || i === totalRows - 1) {
          const percent = Math.round(((i + 1) / totalRows) * 100);
          self.postMessage({
            type: 'progress',
            current: i + 1,
            total: totalRows,
            percent: percent
          });
        }
      }

      self.postMessage({ type: 'status', message: 'Đang hoàn thiện file Word gộp duy nhất...' });

      // Ghép toàn bộ nội dung giữa các bản ghi bằng dấu ngắt trang
      const mergedBodyContent = renderedBodyParts.join(PAGE_BREAK) + finalSectPr;
      const mergedXml = xmlPrefix + mergedBodyContent + xmlSuffix;

      const mergedZip = new PizZipClass(processedDocBuffer);
      mergedZip.file("word/document.xml", mergedXml);
      const mergedBlob = mergedZip.generate({ 
        type: "blob",
        mimeType: DOCX_MIME 
      });

      // Đặt tên cho file gộp
      let firstRowSafe = {};
      if (editedData[0]) {
        for (let k in editedData[0]) {
          firstRowSafe[k.normalize("NFC")] = editedData[0][k];
        }
      }
      let rawMergedName = nameFormat.replace(/\[(.*?)\]/g, (match, colName) => {
        const v = firstRowSafe[colName.normalize("NFC")];
        return (v !== undefined && v !== '') ? v : '';
      }).trim();

      const baseName = sanitizeFilename(rawMergedName, removeTones);
      const finalMergedFileName = baseName && baseName !== 'Khong_Xac_Dinh'
        ? `Gop_${totalRows}_VB_${baseName}.${ext}`
        : `AutoDoc_Gop_${totalRows}_VanBan_${Date.now()}.${ext}`;

      self.postMessage({
        type: 'done_merged',
        blob: mergedBlob,
        count: totalRows,
        filename: finalMergedFileName,
        format: ext
      });
      return;
    }

    // TRƯỜNG HỢP 3: TẢI TRỰC TIẾP TỪNG FILE .DOCX RIÊNG LẺ (KHÔNG NÉN ZIP)
    if (isIndividual) {
      for (let i = 0; i < totalRows; i++) {
        const row = editedData[i];
        if (!row || Object.keys(row).length === 0) continue;

        const zipIn = new PizZipClass(processedDocBuffer);
        const doc = new Docxtemplater(zipIn, {
          delimiters: { start: '{{', end: '}}' },
          paragraphLoop: true,
          linebreaks: true,
          nullGetter() { return ""; }
        });

        const safeRow = {};
        for (let key in row) {
          let val = row[key];
          const transformer = fieldTransformers[key];
          val = applyTransformers(val, transformer);
          safeRow[key.normalize("NFC")] = val;
        }

        try {
          doc.setData(safeRow);
          doc.render();
        } catch (err) {
          throw new Error(`Lỗi tại dòng dữ liệu ${i + 1}: ${err.message}`);
        }

        const fileBlob = doc.getZip().generate({ 
          type: "blob", 
          mimeType: DOCX_MIME 
        });

        let rawFileName = nameFormat.replace(/\[(.*?)\]/g, (match, colName) => {
          const v = safeRow[colName.normalize("NFC")];
          return (v !== undefined && v !== '') ? v : 'KhongXacDinh';
        });

        const cleanName = sanitizeFilename(rawFileName, removeTones);
        const finalFileName = prefixIndex ? `${i + 1}_${cleanName}.${ext}` : `${cleanName}.${ext}`;

        // Gửi từng file về client để tải trực tiếp vào thư mục Downloads
        self.postMessage({
          type: 'file_ready',
          blob: fileBlob,
          filename: finalFileName,
          current: i + 1,
          total: totalRows
        });

        const percent = Math.round(((i + 1) / totalRows) * 100);
        self.postMessage({
          type: 'progress',
          current: i + 1,
          total: totalRows,
          percent: percent
        });
      }

      self.postMessage({
        type: 'done_individual',
        count: totalRows,
        format: ext
      });
      return;
    }

    // TRƯỜNG HỢP 4: ĐÓNG GÓI TỆP NÉN ZIP (CHỈ KHI NGƯỜI DÙNG CHỦ ĐỘNG CHỌN)
    if (!JSZipClass) {
      self.postMessage({ type: 'error', message: "Không tìm thấy thư viện JSZip để đóng gói ZIP." });
      return;
    }

    const zipOutput = new JSZipClass();

    for (let i = 0; i < totalRows; i++) {
      const row = editedData[i];
      if (!row || Object.keys(row).length === 0) continue;

      const zipIn = new PizZipClass(processedDocBuffer);
      const doc = new Docxtemplater(zipIn, {
        delimiters: { start: '{{', end: '}}' },
        paragraphLoop: true,
        linebreaks: true,
        nullGetter() { return ""; }
      });

      const safeRow = {};
      for (let key in row) {
        let val = row[key];
        const transformer = fieldTransformers[key];
        val = applyTransformers(val, transformer);
        safeRow[key.normalize("NFC")] = val;
      }

      try {
        doc.setData(safeRow);
        doc.render();
      } catch (err) {
        throw new Error(`Lỗi tại dòng dữ liệu ${i + 1}: ${err.message}`);
      }

      const contentBinary = doc.getZip().generate({ type: "uint8array" });

      let rawFileName = nameFormat.replace(/\[(.*?)\]/g, (match, colName) => {
        const v = safeRow[colName.normalize("NFC")];
        return (v !== undefined && v !== '') ? v : 'KhongXacDinh';
      });

      const cleanName = sanitizeFilename(rawFileName, removeTones);
      const finalFileName = prefixIndex ? `${i + 1}_${cleanName}.${ext}` : `${cleanName}.${ext}`;
      zipOutput.file(finalFileName, contentBinary);

      // Báo cáo tiến trình định kỳ
      if (i % 5 === 0 || i === totalRows - 1) {
        const percent = Math.round(((i + 1) / totalRows) * 100);
        self.postMessage({
          type: 'progress',
          current: i + 1,
          total: totalRows,
          percent: percent
        });
      }
    }

    self.postMessage({ type: 'status', message: 'Đang đóng gói file ZIP...' });
    zipOutput.generateAsync({ type: 'blob' }).then(blob => {
      self.postMessage({
        type: 'done',
        blob: blob,
        count: totalRows,
        format: ext
      });
    }).catch(err => {
      self.postMessage({ type: 'error', message: "Lỗi nén ZIP: " + err.message });
    });

  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
