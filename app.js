'use strict';

// =============================================================================
// PHẦN 1: TIỆN ÍCH CƠ BẢN & TOAST NOTIFICATION
// =============================================================================

function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  } else if (type === 'warning') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  } else {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }

  toast.innerHTML = `
    <span style="display:flex; align-items:center;">${iconSvg}</span>
    <span style="flex:1; line-height:1.4;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function removeVietnameseTones(str) {
  if (!str) return "Khong_Xac_Dinh";
  str = String(str).normalize("NFC");
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/[^a-zA-Z0-9]/g, "_");
  str = str.replace(/_+/g, "_");
  str = str.replace(/^_|_$/g, "");
  return str;
}

function keepOriginalText(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFC")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\uFEFF/g, "")
    .trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================================================
// BẢNG MÃ TIẾNG VIỆT (UNICODE, VNI-WINDOWS, TCVN3-ABC) & FONT NORMALIZATION
// =============================================================================

const CHAR_MAPPINGS = [
  { unicode: 'À', vni: 'AØ', tcvn3: 'Aµ' },
  { unicode: 'Á', vni: 'AÙ', tcvn3: 'A¸' },
  { unicode: 'Â', vni: 'AÂ', tcvn3: '¢' },
  { unicode: 'Ã', vni: 'AÕ', tcvn3: 'A·' },
  { unicode: 'È', vni: 'EØ', tcvn3: 'EÌ' },
  { unicode: 'É', vni: 'EÙ', tcvn3: 'EÐ' },
  { unicode: 'Ê', vni: 'EÂ', tcvn3: '£' },
  { unicode: 'Ì', vni: 'Ì', tcvn3: 'I×' },
  { unicode: 'Í', vni: 'Í', tcvn3: 'IÝ' },
  { unicode: 'Ò', vni: 'OØ', tcvn3: 'Oß' },
  { unicode: 'Ó', vni: 'OÙ', tcvn3: 'Oã' },
  { unicode: 'Ô', vni: 'OÂ', tcvn3: '¤' },
  { unicode: 'Õ', vni: 'OÕ', tcvn3: 'Oâ' },
  { unicode: 'Ù', vni: 'UØ', tcvn3: 'Uï' },
  { unicode: 'Ú', vni: 'UÙ', tcvn3: 'Uó' },
  { unicode: 'Ý', vni: 'YÙ', tcvn3: 'Yý' },
  { unicode: 'à', vni: 'aø', tcvn3: 'µ' },
  { unicode: 'á', vni: 'aù', tcvn3: '¸' },
  { unicode: 'â', vni: 'aâ', tcvn3: '©' },
  { unicode: 'ã', vni: 'aõ', tcvn3: '·' },
  { unicode: 'è', vni: 'eø', tcvn3: 'Ì' },
  { unicode: 'é', vni: 'eù', tcvn3: 'Ð' },
  { unicode: 'ê', vni: 'eâ', tcvn3: 'ª' },
  { unicode: 'ì', vni: 'ì', tcvn3: '×' },
  { unicode: 'í', vni: 'í', tcvn3: 'Ý' },
  { unicode: 'ò', vni: 'oø', tcvn3: 'ß' },
  { unicode: 'ó', vni: 'où', tcvn3: 'ã' },
  { unicode: 'ô', vni: 'oâ', tcvn3: '«' },
  { unicode: 'õ', vni: 'oõ', tcvn3: 'â' },
  { unicode: 'ù', vni: 'uø', tcvn3: 'ï' },
  { unicode: 'ú', vni: 'uù', tcvn3: 'ó' },
  { unicode: 'ý', vni: 'yù', tcvn3: 'ý' },
  { unicode: 'Ă', vni: 'AÊ', tcvn3: '¡' },
  { unicode: 'Đ', vni: 'Ñ', tcvn3: '§' },
  { unicode: 'Ĩ', vni: 'Ó', tcvn3: 'IÜ' },
  { unicode: 'Ũ', vni: 'UÕ', tcvn3: 'Uò' },
  { unicode: 'Ơ', vni: 'Ô', tcvn3: '¥' },
  { unicode: 'Ư', vni: 'Ö', tcvn3: '¦' },
  { unicode: 'ă', vni: 'aê', tcvn3: '¨' },
  { unicode: 'đ', vni: 'ñ', tcvn3: '®' },
  { unicode: 'ĩ', vni: 'ó', tcvn3: 'Ü' },
  { unicode: 'ũ', vni: 'uõ', tcvn3: 'ò' },
  { unicode: 'ơ', vni: 'ô', tcvn3: '¬' },
  { unicode: 'ư', vni: 'ö', tcvn3: '­' },
  { unicode: 'Ạ', vni: 'AÏ', tcvn3: 'A¹' },
  { unicode: 'Ả', vni: 'AÛ', tcvn3: 'A¶' },
  { unicode: 'Ấ', vni: 'AÁ', tcvn3: '¢Ê' },
  { unicode: 'Ầ', vni: 'AÀ', tcvn3: '¢Ç' },
  { unicode: 'Ẩ', vni: 'AÅ', tcvn3: '¢È' },
  { unicode: 'Ẫ', vni: 'AÃ', tcvn3: '¢É' },
  { unicode: 'Ậ', vni: 'AÄ', tcvn3: '¢Ë' },
  { unicode: 'Ắ', vni: 'AÉ', tcvn3: '¡¾' },
  { unicode: 'Ằ', vni: 'AÈ', tcvn3: '¡»' },
  { unicode: 'Ẳ', vni: 'AÚ', tcvn3: '¡¼' },
  { unicode: 'Ẵ', vni: 'AÜ', tcvn3: '¡½' },
  { unicode: 'Ặ', vni: 'AË', tcvn3: '¡Æ' },
  { unicode: 'Ẹ', vni: 'EÏ', tcvn3: 'EÑ' },
  { unicode: 'Ẻ', vni: 'EÛ', tcvn3: 'EÎ' },
  { unicode: 'Ẽ', vni: 'EÕ', tcvn3: 'EÏ' },
  { unicode: 'Ế', vni: 'EÁ', tcvn3: '£Õ' },
  { unicode: 'Ề', vni: 'EÀ', tcvn3: '£Ò' },
  { unicode: 'Ể', vni: 'EÅ', tcvn3: '£Ó' },
  { unicode: 'Ễ', vni: 'EÃ', tcvn3: '£Ô' },
  { unicode: 'Ệ', vni: 'EÄ', tcvn3: '£Ö' },
  { unicode: 'Ỉ', vni: 'Æ', tcvn3: 'IØ' },
  { unicode: 'Ị', vni: 'Ò', tcvn3: 'IÞ' },
  { unicode: 'Ọ', vni: 'OÏ', tcvn3: 'Oä' },
  { unicode: 'Ỏ', vni: 'OÛ', tcvn3: 'Oá' },
  { unicode: 'Ố', vni: 'OÁ', tcvn3: '¤è' },
  { unicode: 'Ồ', vni: 'OÀ', tcvn3: '¤å' },
  { unicode: 'Ổ', vni: 'OÅ', tcvn3: '¤æ' },
  { unicode: 'Ỗ', vni: 'OÃ', tcvn3: '¤ç' },
  { unicode: 'Ộ', vni: 'OÄ', tcvn3: '¤é' },
  { unicode: 'Ớ', vni: 'ÔÙ', tcvn3: '¥í' },
  { unicode: 'Ờ', vni: 'ÔØ', tcvn3: '¥ê' },
  { unicode: 'Ở', vni: 'ÔÛ', tcvn3: '¥ë' },
  { unicode: 'Ỡ', vni: 'ÔÕ', tcvn3: '¥ì' },
  { unicode: 'Ợ', vni: 'ÔÏ', tcvn3: '¥î' },
  { unicode: 'Ụ', vni: 'UÏ', tcvn3: 'Uô' },
  { unicode: 'Ủ', vni: 'UÛ', tcvn3: 'Uñ' },
  { unicode: 'Ứ', vni: 'ÖÙ', tcvn3: '¦ø' },
  { unicode: 'Ừ', vni: 'ÖØ', tcvn3: '¦õ' },
  { unicode: 'Ử', vni: 'ÖÛ', tcvn3: '¦ö' },
  { unicode: 'Ữ', vni: 'ÖÕ', tcvn3: '¦÷' },
  { unicode: 'Ự', vni: 'ÖÏ', tcvn3: '¦ù' },
  { unicode: 'Ỳ', vni: 'YØ', tcvn3: 'Yú' },
  { unicode: 'Ỵ', vni: 'Î', tcvn3: 'Yþ' },
  { unicode: 'Ỷ', vni: 'Ë', tcvn3: 'Yû' },
  { unicode: 'Ỹ', vni: 'Ì', tcvn3: 'Yü' },
  { unicode: 'ạ', vni: 'aï', tcvn3: '¹' },
  { unicode: 'ả', vni: 'aû', tcvn3: '¶' },
  { unicode: 'ấ', vni: 'aá', tcvn3: 'Ê' },
  { unicode: 'ầ', vni: 'aà', tcvn3: 'Ç' },
  { unicode: 'ẩ', vni: 'aå', tcvn3: 'È' },
  { unicode: 'ẫ', vni: 'aã', tcvn3: 'É' },
  { unicode: 'ậ', vni: 'aä', tcvn3: 'Ë' },
  { unicode: 'ắ', vni: 'aé', tcvn3: '¾' },
  { unicode: 'ằ', vni: 'aè', tcvn3: '»' },
  { unicode: 'ẳ', vni: 'aú', tcvn3: '¼' },
  { unicode: 'ẵ', vni: 'aü', tcvn3: '½' },
  { unicode: 'ặ', vni: 'aë', tcvn3: 'Æ' },
  { unicode: 'ẹ', vni: 'eï', tcvn3: 'Ñ' },
  { unicode: 'ẻ', vni: 'eû', tcvn3: 'Î' },
  { unicode: 'ẽ', vni: 'eõ', tcvn3: 'Ï' },
  { unicode: 'ế', vni: 'eá', tcvn3: 'Õ' },
  { unicode: 'ề', vni: 'eà', tcvn3: 'Ò' },
  { unicode: 'ể', vni: 'eå', tcvn3: 'Ó' },
  { unicode: 'ễ', vni: 'eã', tcvn3: 'Ô' },
  { unicode: 'ệ', vni: 'eä', tcvn3: 'Ö' },
  { unicode: 'ỉ', vni: 'æ', tcvn3: 'Ø' },
  { unicode: 'ị', vni: 'ò', tcvn3: 'Þ' },
  { unicode: 'ọ', vni: 'oï', tcvn3: 'ä' },
  { unicode: 'ỏ', vni: 'oû', tcvn3: 'á' },
  { unicode: 'ố', vni: 'oá', tcvn3: 'è' },
  { unicode: 'ồ', vni: 'oà', tcvn3: 'å' },
  { unicode: 'ổ', vni: 'oå', tcvn3: 'æ' },
  { unicode: 'ỗ', vni: 'oã', tcvn3: 'ç' },
  { unicode: 'ộ', vni: 'oä', tcvn3: 'é' },
  { unicode: 'Ớ', vni: 'ÔÙ', tcvn3: '¥í' },
  { unicode: 'Ờ', vni: 'ÔØ', tcvn3: '¥ê' },
  { unicode: 'Ở', vni: 'ÔÛ', tcvn3: '¥ë' },
  { unicode: 'Ỡ', vni: 'ÔÕ', tcvn3: '¥ì' },
  { unicode: 'Ợ', vni: 'ÔÏ', tcvn3: '¥î' },
  { unicode: 'Ụ', vni: 'UÏ', tcvn3: 'Uô' },
  { unicode: 'Ủ', vni: 'UÛ', tcvn3: 'Uñ' },
  { unicode: 'Ứ', vni: 'ÖÙ', tcvn3: '¦ø' },
  { unicode: 'Ừ', vni: 'ÖØ', tcvn3: '¦õ' },
  { unicode: 'Ử', vni: 'ÖÛ', tcvn3: '¦ö' },
  { unicode: 'Ữ', vni: 'ÖÕ', tcvn3: '¦÷' },
  { unicode: 'Ự', vni: 'ÖÏ', tcvn3: '¦ù' },
  { unicode: 'Ỳ', vni: 'YØ', tcvn3: 'Yú' },
  { unicode: 'Ỵ', vni: 'Î', tcvn3: 'Yþ' },
  { unicode: 'Ỷ', vni: 'Ë', tcvn3: 'Yû' },
  { unicode: 'Ỹ', vni: 'Ì', tcvn3: 'Yü' }
];

const vniMappings = CHAR_MAPPINGS.map((m, idx) => ({ from: m.vni, to: m.unicode, index: idx }))
  .sort((a, b) => b.from.length - a.from.length);

const tcvn3Mappings = CHAR_MAPPINGS.map((m, idx) => ({ from: m.tcvn3, to: m.unicode, index: idx }))
  .sort((a, b) => b.from.length - a.from.length);

function vniToUnicode(str) {
  if (!str) return "";
  let text = String(str);
  for (let item of vniMappings) {
    text = text.replace(new RegExp(escapeRegExp(item.from), 'g'), `::${item.index}::`);
  }
  for (let item of vniMappings) {
    text = text.replace(new RegExp(`::${item.index}::`, 'g'), item.to);
  }
  return text.normalize("NFC");
}

function tcvn3ToUnicode(str) {
  if (!str) return "";
  let text = String(str);
  for (let item of tcvn3Mappings) {
    text = text.replace(new RegExp(escapeRegExp(item.from), 'g'), `::${item.index}::`);
  }
  for (let item of tcvn3Mappings) {
    text = text.replace(new RegExp(`::${item.index}::`, 'g'), item.to);
  }
  return text.normalize("NFC");
}

function detectTextEncoding(sampleText) {
  const vniRegex = /([aeiouyâêô][øùûõïìíîëæòóÌÍÒÓ])|([aeo]â)|(aê)|ñ|Ñ|ö|Ö/gi;
  const tcvn3Regex = /[§®µ¸©ª«¬­¶¹¨¡¢£¤¥¦·]/g;
  const unicodeRegex = /[áàảạđươăéèẻẹíỉịỏọúùủụỳỷỵ]/gi;
  const vniScore = (sampleText.match(vniRegex) || []).length;
  const tcvn3Score = (sampleText.match(tcvn3Regex) || []).length;
  const unicodeScore = (sampleText.match(unicodeRegex) || []).length;
  if (vniScore > unicodeScore && vniScore > tcvn3Score) return "VNI";
  if (tcvn3Score > unicodeScore && tcvn3Score > vniScore) return "TCVN3";
  return "UNICODE";
}

function detectExcelEncoding(excelData) {
  let sampleText = "";
  let count = 0;
  if (excelData.length > 0) sampleText += " " + Object.keys(excelData[0]).join(" ");
  for (const row of excelData) {
    for (const key in row) {
      sampleText += " " + String(row[key]);
      if (++count > 300) break;
    }
    if (count > 300) break;
  }
  return detectTextEncoding(sampleText);
}

function detectDocxZipEncoding(zip) {
  let fullTextSample = "";
  for (const filename in zip.files) {
    if (filename.endsWith('.xml') && filename.toLowerCase().includes('word')) {
      const fileObj = zip.file(filename);
      if (!fileObj) continue;
      const content = fileObj.asText();
      const tMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (tMatches) fullTextSample += " " + tMatches.map(m => m.replace(/<w:t[^>]*>|<\/w:t>/g, '')).join(' ');
    }
    if (fullTextSample.length > 5000) break;
  }
  return detectTextEncoding(fullTextSample);
}

// Chuẩn bị file Word mẫu: chuyển bảng mã static sang Unicode và chuẩn hóa Font chữ về Times New Roman nếu được bật
function prepareTemplateZip(rawBuffer, normalizeFont = true) {
  const zip = new PizZip(rawBuffer);
  const detectedDocEncoding = detectDocxZipEncoding(zip);

  if (normalizeFont) {
    const xmlFileRegex = /^word\/(document|styles|header\d+|footer\d+)\.xml$/i;
    for (const filename in zip.files) {
      if (xmlFileRegex.test(filename)) {
        const fileObj = zip.file(filename);
        if (!fileObj) continue;
        let xmlStr = fileObj.asText();

        // 1. Chuyển đổi nội dung văn bản static trong <w:t> sang Unicode nếu template gốc là VNI / TCVN3
        if (detectedDocEncoding !== 'UNICODE') {
          xmlStr = xmlStr.replace(/<w:t(\b[^>]*)>([\s\S]*?)<\/w:t>/gi, (match, attrs, content) => {
            let converted = content;
            if (detectedDocEncoding === 'VNI') converted = vniToUnicode(content);
            else if (detectedDocEncoding === 'TCVN3') converted = tcvn3ToUnicode(content);
            return `<w:t${attrs}>${converted}</w:t>`;
          });
        }

        // 2. Chuẩn hóa font về Times New Roman
        const targetFont = "Times New Roman";
        xmlStr = xmlStr.replace(/<w:rFonts\b([^>]*?)(\/?>)/gi, (match, attrs, closing) => {
          let updatedAttrs = attrs;
          if (/w:ascii="[^"]*"/i.test(updatedAttrs)) {
            updatedAttrs = updatedAttrs.replace(/w:ascii="[^"]*"/gi, `w:ascii="${targetFont}"`);
          } else {
            updatedAttrs += ` w:ascii="${targetFont}"`;
          }
          if (/w:hAnsi="[^"]*"/i.test(updatedAttrs)) {
            updatedAttrs = updatedAttrs.replace(/w:hAnsi="[^"]*"/gi, `w:hAnsi="${targetFont}"`);
          } else {
            updatedAttrs += ` w:hAnsi="${targetFont}"`;
          }
          if (/w:cs="[^"]*"/i.test(updatedAttrs)) {
            updatedAttrs = updatedAttrs.replace(/w:cs="[^"]*"/gi, `w:cs="${targetFont}"`);
          } else {
            updatedAttrs += ` w:cs="${targetFont}"`;
          }
          return `<w:rFonts${updatedAttrs}${closing}`;
        });

        // Đảm bảo kiểu mặc định trong styles.xml dùng Times New Roman
        if (filename.toLowerCase() === 'word/styles.xml') {
          if (xmlStr.includes('<w:rPrDefault>') && !xmlStr.match(/<w:rPrDefault>[\s\S]*?<w:rFonts/i)) {
            xmlStr = xmlStr.replace(/(<w:rPrDefault>\s*<w:rPr>)/i, `$1<w:rFonts w:ascii="${targetFont}" w:hAnsi="${targetFont}" w:cs="${targetFont}"/>`);
          }
        }

        zip.file(filename, xmlStr);
      }
    }
  }

  return {
    zip,
    detectedDocEncoding,
    finalDocEncoding: normalizeFont ? 'UNICODE' : detectedDocEncoding
  };
}

// Quét toàn diện tất cả các biến {{...}} trong file Word (bao gồm document, header, footer)
function extractVariablesFromDocxZip(zip) {
  const foundVars = new Set();
  let combinedText = "";

  // 1. Quét bằng docxtemplater nếu có thể
  try {
    const doc = new window.docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter() { return ""; }
    });
    combinedText += " " + doc.getFullText();
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



// Biến toàn cục phục vụ xử lý ứng dụng
let currentTemplateVars = [];
let currentTemplateText = "";
let currentPreviewHeaders = [];
let currentPreviewRawData = [];
let currentExcelWorkbook = null;
let fieldTransformers = {};
let onConfirmExportCallback = null;
let activeWorker = null;
let isOnlyErrorsFilter = false;

// Trích xuất dữ liệu bảng từ file Word (.docx)
function extractTableDataFromDocx(arrayBuffer) {
  const zip = new PizZip(arrayBuffer);
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

// Đọc file dữ liệu Local (.xlsx, .xls, .csv, .docx)
async function parseLocalDataFile(file, selectedSheetName = null) {
  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (name.endsWith('.docx')) {
    currentExcelWorkbook = null;
    const sheetGrp = document.getElementById('excelSheetGroup');
    if (sheetGrp) sheetGrp.style.display = 'none';
    return extractTableDataFromDocx(buffer);
  }

  // File Excel hoặc CSV
  const workbook = XLSX.read(buffer, { type: 'array' });
  currentExcelWorkbook = workbook;

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

  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  if (!rawData || rawData.length === 0) {
    throw new Error("Trang tính (Sheet) chọn không chứa hàng dữ liệu nào.");
  }

  return rawData;
}

// Render Bảng Xem Trước dữ liệu
function showPreviewModal(headers, rowsData) {
  currentPreviewHeaders = headers;
  currentPreviewRawData = rowsData;
  renderPreviewTable();
  document.getElementById('dataPreviewModal').classList.add('is-open');
}

function renderPreviewTable() {
  const tableEl = document.getElementById('previewDataTable');
  if (!tableEl) return;

  const searchQuery = (document.getElementById('previewSearchInput')?.value || '').toLowerCase().trim();

  let headerHtml = '<tr>';
  headerHtml += `
    <th style="width:36px; text-align:center; min-width:36px;">
      <input type="checkbox" id="selectAllPreviewRows" checked style="cursor:pointer; accent-color:var(--primary);">
    </th>
    <th style="width:50px; text-align:center; min-width:50px;">#</th>
  `;
  
  currentPreviewHeaders.forEach(h => {
    const transformer = fieldTransformers[h];
    const tfBadge = transformer && transformer !== 'none' ? `<span class="tf-badge">${transformer}</span>` : '';
    headerHtml += `<th>${h} ${tfBadge}</th>`;
  });
  headerHtml += `<th style="width:110px; text-align:center; min-width:110px;">Hành động</th></tr>`;

  let displayRows = currentPreviewRawData;

  if (searchQuery) {
    displayRows = displayRows.filter(row => {
      return Object.values(row).some(v => String(v || '').toLowerCase().includes(searchQuery));
    });
  }

  if (isOnlyErrorsFilter && currentTemplateVars.length > 0) {
    displayRows = displayRows.filter(row => {
      return currentTemplateVars.some(v => !row[v] || String(row[v]).trim() === '');
    });
  }

  let rowsHtml = '';
  displayRows.forEach((row, rowIdx) => {
    const isHasEmptyCell = currentTemplateVars.some(v => !row[v] || String(row[v]).trim() === '');
    const rowBgStyle = isHasEmptyCell ? 'background-color: #fffbeb;' : '';

    rowsHtml += `<tr class="preview-row" data-row-idx="${rowIdx}" style="${rowBgStyle}">`;
    rowsHtml += `
      <td style="text-align:center; min-width:36px;">
        <input type="checkbox" class="row-select-checkbox" checked style="cursor:pointer; accent-color:var(--primary);">
      </td>
      <td style="text-align:center; font-weight:600; color:var(--text-muted); min-width:50px;">
        ${rowIdx + 1}
      </td>
    `;

    currentPreviewHeaders.forEach(h => {
      const val = row[h] !== undefined ? String(row[h]) : '';
      const isMissing = currentTemplateVars.includes(h) && !val.trim();
      const inputStyle = isMissing ? 'border-color:#fca5a5; background:#fef2f2;' : '';
      rowsHtml += `
        <td>
          <input type="text" class="preview-input" data-col="${h}" value="${val.replace(/"/g, '&quot;')}" style="${inputStyle}">
        </td>
      `;
    });

    rowsHtml += `
      <td style="text-align:center; display:flex; gap:4px; justify-content:center;">
        <button class="btn-export-single" data-row-idx="${rowIdx}" title="Xuất file đơn này" style="background:none; border:none; color:var(--primary); cursor:pointer; padding:4px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button class="btn-del-row" title="Xóa dòng này" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:4px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </td>
    </tr>`;
  });

  tableEl.innerHTML = headerHtml + rowsHtml;

  const statsBadge = document.getElementById('previewStatsBadge');
  if (statsBadge) {
    statsBadge.textContent = `${displayRows.length} / ${currentPreviewRawData.length} hàng`;
  }

  const selectAllCb = document.getElementById('selectAllPreviewRows');
  if (selectAllCb) {
    selectAllCb.addEventListener('change', (e) => {
      const cbs = document.querySelectorAll('.row-select-checkbox');
      cbs.forEach(cb => cb.checked = e.target.checked);
    });
  }
}

function getEditedData() {
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

// Xử lý dán nhiều ô từ Excel/Google Sheets (TSV clipboard) vào bảng xem trước
function handleTablePaste(event, currentInput) {
  const clipboardText = event.clipboardData ? event.clipboardData.getData('text/plain') : '';
  if (!clipboardText || (!clipboardText.includes('\t') && !clipboardText.includes('\n'))) {
    return; // Dán bình thường 1 ô
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
  const startColIdx = currentPreviewHeaders.indexOf(startCol);

  if (isNaN(startRowIdx) || startColIdx === -1) return;

  let pastedColsCount = 0;
  lines.forEach((line, rIdx) => {
    const targetRowIdx = startRowIdx + rIdx;
    while (targetRowIdx >= currentPreviewRawData.length) {
      const emptyRow = {};
      currentPreviewHeaders.forEach(h => emptyRow[h] = '');
      currentPreviewRawData.push(emptyRow);
    }

    const cells = line.split('\t');
    pastedColsCount = Math.max(pastedColsCount, cells.length);
    cells.forEach((cellVal, cIdx) => {
      const targetColIdx = startColIdx + cIdx;
      if (targetColIdx < currentPreviewHeaders.length) {
        const colHeader = currentPreviewHeaders[targetColIdx];
        currentPreviewRawData[targetRowIdx][colHeader] = cellVal.trim();
      }
    });
  });

  renderPreviewTable();
  showToast(`Đã dán thành công ${lines.length} dòng x ${pastedColsCount} cột từ bảng tính!`, "success");
}

// Xuất toàn bộ bảng dữ liệu hiện tại trong modal xem trước ra file Excel (.xlsx)
function exportPreviewDataToExcel() {
  const editedData = getEditedData();
  if (!editedData || editedData.length === 0) {
    showToast("Không có hàng dữ liệu nào được chọn để xuất Excel.", "warning");
    return;
  }

  try {
    const ws = XLSX.utils.json_to_sheet(editedData, { header: currentPreviewHeaders });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Du_Lieu_Xem_Truoc");

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Du_Lieu_AutoDoc_${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`Đã xuất ${editedData.length} dòng dữ liệu ra file Excel thành công!`, "success");
  } catch (err) {
    showToast("Lỗi xuất Excel: " + err.message, "error");
  }
}

// =============================================================================
// PHẦN 2: CHUẨN HÓA & LƯU TRỮ (STORAGE & BACKUP MANAGER)
// =============================================================================

function encodeValueForTemplate(value) {
  if (typeof value !== 'string') return value;
  return value.normalize("NFC");
}

const safeStorage = {
  get(keys, callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, callback);
    } else {
      const result = {};
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(k => {
        const val = localStorage.getItem(k);
        if (val !== null) {
          try {
            result[k] = JSON.parse(val);
          } catch(e) {
            result[k] = val;
          }
        }
      });
      callback(result);
    }
  },
  set(items, callback) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(items, callback);
    } else {
      for (const k in items) {
        const val = typeof items[k] === 'object' ? JSON.stringify(items[k]) : items[k];
        localStorage.setItem(k, val);
      }
      if (callback) callback();
    }
  }
};

const TEMPLATES_KEY = 'tpl_lib_v1';
const MAX_TEMPLATES = 50;
const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // 100 MB

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}



const DATA_SOURCES_KEY = 'autodoc_data_sources_v1';
const MAX_DATA_SOURCES = 20;

const DataManager = {
  async list() {
    return new Promise(resolve => {
      safeStorage.get(DATA_SOURCES_KEY, (result) => {
        resolve(result[DATA_SOURCES_KEY] || {});
      });
    });
  },

  async save(name, type, dataOrLink, sheetName = '') {
    const sources = await this.list();
    if (Object.keys(sources).length >= MAX_DATA_SOURCES && !sources[name]) {
      throw new Error(`Đã đạt giới hạn ${MAX_DATA_SOURCES} nguồn dữ liệu. Xóa bớt nguồn cũ để tiếp tục.`);
    }

    const id = 'ds_' + Date.now();
    sources[id] = {
      id,
      name,
      type,
      data: type === 'local' ? dataOrLink : null,
      link: type === 'google_sheets' ? dataOrLink : null,
      sheetName,
      savedAt: new Date().toISOString()
    };

    return new Promise(resolve => {
      safeStorage.set({ [DATA_SOURCES_KEY]: sources }, resolve);
    });
  },

  async delete(id) {
    const sources = await this.list();
    delete sources[id];
    return new Promise(resolve => {
      safeStorage.set({ [DATA_SOURCES_KEY]: sources }, resolve);
    });
  }
};

const EXPORT_HISTORY_KEY = 'autodoc_export_history_v1';
const HistoryManager = {
  async list() {
    return new Promise(resolve => {
      safeStorage.get(EXPORT_HISTORY_KEY, (result) => {
        resolve(result[EXPORT_HISTORY_KEY] || []);
      });
    });
  },
  async save(record) {
    let history = await this.list();
    history.unshift(record);
    if (history.length > 20) history = history.slice(0, 20);
    return new Promise(resolve => {
      safeStorage.set({ [EXPORT_HISTORY_KEY]: history }, resolve);
    });
  },
  async delete(id) {
    let history = await this.list();
    history = history.filter(h => h.id !== id);
    return new Promise(resolve => {
      safeStorage.set({ [EXPORT_HISTORY_KEY]: history }, resolve);
    });
  }
};

const CATEGORIES_KEY = 'autodoc_categories_v1';
const DEFAULT_CATEGORIES = [
  { id: 'hop_dong', name: 'Hợp đồng' },
  { id: 'bao_cao', name: 'Báo cáo' },
  { id: 'giay_phep', name: 'Giấy phép' },
  { id: 'khac', name: 'Khác' }
];

const CategoryManager = {
  async list() {
    return new Promise(resolve => {
      safeStorage.get(CATEGORIES_KEY, (result) => {
        let cats = result[CATEGORIES_KEY];
        if (!cats || !Array.isArray(cats) || cats.length === 0) {
          cats = DEFAULT_CATEGORIES;
          safeStorage.set({ [CATEGORIES_KEY]: cats });
        }
        resolve(cats);
      });
    });
  },

  async add(name) {
    if (!name || !name.trim()) throw new Error("Tên danh mục không được để trống.");
    const cats = await this.list();
    const cleanName = name.trim();
    if (cats.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      throw new Error(`Danh mục "${cleanName}" đã tồn tại.`);
    }
    const newCat = { id: 'cat_' + Date.now(), name: cleanName };
    cats.push(newCat);
    await new Promise(r => safeStorage.set({ [CATEGORIES_KEY]: cats }, r));
    return newCat;
  },

  async rename(id, newName) {
    if (!newName || !newName.trim()) throw new Error("Tên danh mục không được để trống.");
    const cats = await this.list();
    const cat = cats.find(c => c.id === id);
    if (!cat) throw new Error("Không tìm thấy danh mục.");
    cat.name = newName.trim();
    return new Promise(r => safeStorage.set({ [CATEGORIES_KEY]: cats }, r));
  },

  async delete(id) {
    if (id === 'khac') throw new Error("Không thể xóa danh mục mặc định 'Khác'.");
    let cats = await this.list();
    cats = cats.filter(c => c.id !== id);
    await new Promise(r => safeStorage.set({ [CATEGORIES_KEY]: cats }, r));

    const templates = await TemplateManager.list();
    let hasChanges = false;
    Object.values(templates).forEach(t => {
      if (t.category === id) {
        t.category = 'khac';
        hasChanges = true;
      }
    });
    if (hasChanges) {
      await new Promise(r => safeStorage.set({ [TEMPLATES_KEY]: templates }, r));
    }
  }
};

const TemplateManager = {
  async list() {
    return new Promise(resolve => {
      safeStorage.get(TEMPLATES_KEY, (result) => {
        resolve(result[TEMPLATES_KEY] || {});
      });
    });
  },

  async save(name, arrayBuffer, category = 'khac') {
    const templates = await this.list();
    if (Object.keys(templates).length >= MAX_TEMPLATES && !templates[name]) {
      throw new Error(`Đã đạt giới hạn ${MAX_TEMPLATES} mẫu. Xóa một mẫu cũ để tiếp tục.`);
    }
    const base64 = bufferToBase64(arrayBuffer);
    templates[name] = { 
      name, 
      data: base64, 
      size: arrayBuffer.byteLength, 
      savedAt: new Date().toISOString(),
      category: category || 'khac',
      isFavorite: false
    };
    return new Promise(resolve => {
      safeStorage.set({ [TEMPLATES_KEY]: templates }, resolve);
    });
  },

  async toggleFavorite(name) {
    const templates = await this.list();
    if (templates[name]) {
      templates[name].isFavorite = !templates[name].isFavorite;
      return new Promise(resolve => {
        safeStorage.set({ [TEMPLATES_KEY]: templates }, resolve);
      });
    }
  },

  async rename(oldName, newName) {
    const templates = await this.list();
    if (!templates[oldName]) throw new Error(`Không tìm thấy mẫu "${oldName}".`);
    
    if (!newName.toLowerCase().endsWith('.docx')) {
      newName += '.docx';
    }
    if (newName === oldName) return;
    if (templates[newName]) throw new Error(`Đã tồn tại mẫu có tên "${newName}".`);

    templates[newName] = templates[oldName];
    templates[newName].name = newName;
    delete templates[oldName];

    return new Promise(resolve => {
      safeStorage.set({ [TEMPLATES_KEY]: templates }, resolve);
    });
  },

  async getBuffer(name) {
    const templates = await this.list();
    if (!templates[name]) throw new Error(`Không tìm thấy mẫu "${name}" trong thư viện.`);
    return base64ToBuffer(templates[name].data);
  },

  async delete(name) {
    const templates = await this.list();
    delete templates[name];
    return new Promise(resolve => {
      safeStorage.set({ [TEMPLATES_KEY]: templates }, resolve);
    });
  },

  async totalSize() {
    const templates = await this.list();
    return Object.values(templates).reduce((sum, t) => sum + (t.size || 0), 0);
  }
};



// Hàm sao lưu Thư viện ra file JSON
async function exportLibraryBackup() {
  const templates = await TemplateManager.list();
  const dataSources = await DataManager.list();
  const backupObj = {
    version: '2.1',
    exportedAt: new Date().toISOString(),
    templates,
    dataSources
  };
  const jsonStr = JSON.stringify(backupObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AutoDoc_Backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Đã xuất file sao lưu thư viện thành công!", "success");
}

// Hàm phục hồi Thư viện từ file JSON
async function importLibraryBackup(file) {
  try {
    const text = await file.text();
    const backupObj = JSON.parse(text);
    if (!backupObj || typeof backupObj !== 'object') {
      throw new Error("File sao lưu không hợp lệ.");
    }
    const { templates = {}, dataSources = {} } = backupObj;
    await safeStorage.set({
      [TEMPLATES_KEY]: templates,
      [DATA_SOURCES_KEY]: dataSources
    });
    await renderTemplateList();
    await renderDataList();
    showToast("Phục hồi Thư viện thành công!", "success");
  } catch (err) {
    showToast("Lỗi phục hồi: " + err.message, "error");
  }
}

// Hàm tạo File Excel Mẫu (.xlsx) chứa tiêu đề biến từ Template Word
async function generateSampleExcelFromTemplate() {
  try {
    let vars = currentTemplateVars;
    if (!vars || vars.length === 0) {
      // Đọc file mẫu hiện tại nếu có
      let docBuffer;
      const srcLibBtnEl = document.getElementById('srcLibBtn');
      const isLibSource = srcLibBtnEl ? srcLibBtnEl.classList.contains('active') : true;

      if (isLibSource) {
        const tplSelectEl = document.getElementById('tplLibSelect');
        const selectedTpl = tplSelectEl ? tplSelectEl.value : '';
        if (!selectedTpl) throw new Error("Vui lòng chọn hoặc nạp một mẫu Word trước.");
        docBuffer = await TemplateManager.getBuffer(selectedTpl);
      } else {
        const docTemplateEl = document.getElementById('docTemplate');
        const docFile = docTemplateEl ? docTemplateEl.files[0] : null;
        if (!docFile) throw new Error("Vui lòng chọn hoặc nạp một mẫu Word trước.");
        docBuffer = await docFile.arrayBuffer();
      }

      const zip = new PizZip(docBuffer);
      const { varList, fullText } = extractVariablesFromDocxZip(zip);
      vars = varList;
      currentTemplateVars = varList;
      currentTemplateText = fullText;
    }

    if (!vars || vars.length === 0) {
      throw new Error("Không tìm thấy biến số {{...}} nào trong file Word mẫu.");
    }

    // Tạo file Excel .xlsx với 1 hàng tiêu đề
    const ws = XLSX.utils.aoa_to_sheet([vars]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dữ_Liệu_Mẫu");

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Excel_Mau_AutoDoc_${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`Đã tải xuống file Excel mẫu với ${vars.length} cột biến!`, "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function renderDataList() {
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
      const safeId = (s.id || '').replace(/"/g, '&quot;');
      const safeName = (s.name || '').replace(/"/g, '&quot;');
      const isLocal = s.type === 'local';
      
      const iconSvg = isLocal
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';

      const subText = isLocal 
        ? `${s.data ? s.data.length : 0} hàng dữ liệu` 
        : `Sheet: ${s.sheetName || 'Mặc định'}`;

      return `
        <div class="tpl-item" data-id="${safeId}">
          <span class="tpl-icon">${iconSvg}</span>
          <span class="tpl-name" title="${safeName}">${s.name} <br><small style="color:var(--text-muted);font-weight:400">${subText}</small></span>
          <button class="tpl-del-data" data-id="${safeId}" title="Xóa"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
        </div>
      `;
    }).join('');
  }

  const sel = document.getElementById('dataLibSelect');
  if (sel) {
    sel.innerHTML = Object.keys(sources).length === 0
      ? '<option value="">- Chưa có dữ liệu trong thư viện -</option>'
      : Object.values(sources).map(s => `<option value="${s.id}">${s.name} (${s.type === 'local' ? `${s.data?.length || 0} hàng` : s.sheetName || 'Mặc định'})</option>`).join('');
  }
}

async function renderCategoryFilterChips() {
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
    html += `<button class="cat-chip ${isActive}" data-cat="${c.id}">${c.name}</button>`;
  });

  bar.innerHTML = html;
}

async function renderCategorySelectOptions() {
  const sel = document.getElementById('tplCategorySelect');
  if (!sel) return;
  const cats = await CategoryManager.list();
  sel.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function renderCategoryManagerList() {
  const container = document.getElementById('categoryListContainer');
  if (!container) return;
  const cats = await CategoryManager.list();
  
  container.innerHTML = cats.map(c => {
    const isDefaultKhac = c.id === 'khac';
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:var(--surface-2); border-radius:6px; border:1px solid var(--border);">
        <span style="font-weight:600; font-size:0.88rem; color:var(--text);">${c.name}</span>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-secondary btn-rename-cat" data-id="${c.id}" data-name="${c.name}" style="font-size:0.75rem; padding:4px 8px;">Sửa tên</button>
          ${!isDefaultKhac ? `<button class="btn btn-secondary btn-del-cat" data-id="${c.id}" data-name="${c.name}" style="font-size:0.75rem; padding:4px 8px; color:var(--error);">Xóa</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function renderTemplateList() {
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

  document.getElementById('tplCount').textContent = `${count} / ${MAX_TEMPLATES}`;

  const listEl = document.getElementById('templateList');
  if (entries.length === 0) {
    listEl.innerHTML = `<div class="tpl-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 1-2 2v13c0 1.1.9 2 2 2Z"/></svg><div>Chưa có mẫu nào phù hợp.<br>Tải lên mẫu bên dưới để bắt đầu.</div></div>`;
  } else {
    listEl.innerHTML = entries.map(t => {
      const safeName = t.name.replace(/"/g, '&quot;');
      const isFav = !!t.isFavorite;
      const catText = catMap[t.category] || 'Khác';
      return `
        <div class="tpl-item" data-name="${safeName}">
          <button class="tpl-star-btn ${isFav ? 'is-fav' : ''}" data-name="${safeName}" title="${isFav ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          <span class="tpl-name" title="${safeName}">${t.name} <br><small style="color:var(--primary);font-weight:500">[${catText}]</small></span>
          <span class="tpl-size">${formatBytes(t.size)}</span>
          <button class="tpl-download" data-name="${safeName}" title="Tải file mẫu (.docx) về máy"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
          <button class="tpl-rename" data-name="${safeName}" title="Đổi tên"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
          <button class="tpl-del" data-name="${safeName}" title="Xóa"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
        </div>
      `;
    }).join('');
  }

  const sel = document.getElementById('tplLibSelect');
  sel.innerHTML = Object.keys(templates).length === 0
    ? '<option value="">— Chưa có mẫu nào trong thư viện —</option>'
    : Object.values(templates).map(t => `<option value="${t.name}">${t.name} (${formatBytes(t.size)})</option>`).join('');

  await updateStorageBar();
}

async function updateStorageBar() {
  const totalSize = await TemplateManager.totalSize();
  const percent = Math.min(100, (totalSize / MAX_STORAGE_BYTES) * 100);
  document.getElementById('storageFill').style.width = `${percent}%`;
  document.getElementById('storageUsed').textContent = `${formatBytes(totalSize)} / ~100 MB`;
}

// =============================================================================
// PHẦN 3: KIỂM TRA TÍNH THỐNG NHẤT DỮ LIỆU & VĂN BẢN
// =============================================================================

function checkDataConsistency(excelData, varList, nameFormat) {
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
      msg: `File Word mẫu yêu cầu các biến sau nhưng bảng dữ liệu không có cột tương ứng: ${missingCols.map(c => `<code>{{${c}}}</code>`).join(', ')}.`
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
        msg: `File Word mẫu sử dụng các biến có tên rất giống nhau nhưng viết khác nhau: ${normalizedVars[norm].map(c => `<code>{{${c}}}</code>`).join(' và ')}. Bạn nên chỉnh sửa lại để thống nhất cách đặt tên.`
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
          emptyCells.push(`Dòng ${rowNum}: Cột <strong>"${field}"</strong> đang bỏ trống.`);
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
        duplicateNames.push(`Dòng ${idx + 1}: Tạo tên file trùng lặp "<strong>${finalFileName}</strong>"`);
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

function checkTemplateBraces(fullText) {
  const warnings = [];
  if (!fullText) return warnings;

  const isGuid = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(str.trim());
  const isWordFieldCode = (str) => /^(PAGE|NUMPAGES|DATE|TIME|HYPERLINK|MERGEFIELD|TOC|REF|EMBED|LINK|SYMBOL|XE|TC|SEQ|INDEX|AUTOTEXT|INCLUDETEXT|SHAPE|DRAWING)\b/i.test(str.trim());
  const isCodeOrJson = (str) => /[:;\\=]/.test(str);

  const singleBraceRegex = /(?<!\{)\{([^{}]+)\}(?!\})/g;
  const singleMatches = [];
  let match;

  while ((match = singleBraceRegex.exec(fullText)) !== null) {
    const rawContent = match[1].trim();
    if (!rawContent) continue;
    if (isGuid(rawContent)) continue;
    if (isWordFieldCode(rawContent)) continue;
    if (isCodeOrJson(rawContent)) continue;

    if (/[a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9]/.test(rawContent)) {
      singleMatches.push(`{${rawContent}}`);
    }
  }

  if (singleMatches.length > 0) {
    const uniqueMatches = [...new Set(singleMatches)];
    warnings.push({
      type: 'warning',
      title: 'Lỗi cú pháp ngoặc nhọn đơn',
      msg: `Phát hiện các từ khóa nghi ngờ viết sai cú pháp trong template (chỉ có 1 ngoặc nhọn): ${uniqueMatches.map(m => `<code>${m}</code>`).join(', ')}. Hãy sửa thành ngoặc kép dạng <code>{{...}}</code> để template chạy đúng.`
    });
  }

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

function showConsistencyWarnings(warnings, onConfirm, onCancel) {
  const listEl = document.getElementById('consistencyWarningList');
  
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
          <span>${w.title}</span>
        </div>
        <div style="color: #334155; margin-left: 22px;">${w.msg}</div>
      </div>
    `;
  });

  listEl.innerHTML = html;
  
  const modalEl = document.getElementById('consistencyModal');
  modalEl.classList.add('is-open');
  
  const bypassBtn = document.getElementById('bypassExportConsistencyBtn');
  const cancelBtn = document.getElementById('cancelExportConsistencyBtn');
  const closeBtn = document.getElementById('closeConsistencyBtn');
  
  const handleBypass = () => {
    modalEl.classList.remove('is-open');
    onConfirm();
    cleanup();
  };
  
  const handleCancel = () => {
    modalEl.classList.remove('is-open');
    onCancel();
    cleanup();
  };
  
  const cleanup = () => {
    bypassBtn.removeEventListener('click', handleBypass);
    cancelBtn.removeEventListener('click', handleCancel);
    closeBtn.removeEventListener('click', handleCancel);
  };
  
  bypassBtn.addEventListener('click', handleBypass);
  cancelBtn.addEventListener('click', handleCancel);
  closeBtn.addEventListener('click', handleCancel);
}

// =============================================================================
// PHẦN 4: HÀM MỞ MODAL ĐỊNH DẠNG BIẾN (TRANSFORMERS)
// =============================================================================

function openTransformersModal() {
  const container = document.getElementById('transformersConfigList');
  if (!container) return;

  if (currentTemplateVars.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted);">Vui lòng chọn hoặc nạp mẫu Word trước để quét các biến.</div>`;
  } else {
    container.innerHTML = currentTemplateVars.map(v => {
      const currentTf = fieldTransformers[v] || 'none';
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:var(--surface-2); border-radius:6px; border:1px solid var(--border);">
          <span style="font-weight:600; font-family:monospace; color:var(--primary);">{{${v}}}</span>
          <select class="transformer-select" data-var="${v}" style="padding:4px 8px; border-radius:4px; border:1px solid var(--border); font-size:0.8rem;">
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

  document.getElementById('transformersModal').classList.add('is-open');
}

// =============================================================================
// PHẦN 5: GIAO DIỆN & ĐIỀU HƯỚNG SỰ KIỆN
// =============================================================================

function switchSource(source) {
  const isLib = source === 'library';
  document.getElementById('srcLibBtn').classList.toggle('active', isLib);
  document.getElementById('srcUploadBtn').classList.toggle('active', !isLib);
  document.getElementById('srcLibPanel').style.display = isLib ? '' : 'none';
  document.getElementById('srcUploadPanel').style.display = isLib ? 'none' : '';
}

function bindFileNameDisplay(inputId, nameElId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.addEventListener('change', function () {
      const nameEl = document.getElementById(nameElId);
      if (nameEl) {
        nameEl.textContent = this.files[0] ? this.files[0].name : '';
      }
    });
  }
}

// Theme System (Dark Mode)
function initTheme() {
  safeStorage.get('autodoc_theme', (result) => {
    const theme = result.autodoc_theme || 'light';
    applyTheme(theme);
  });
}

function applyTheme(theme) {
  const sunIcon = document.getElementById('themeIconSun');
  const moonIcon = document.getElementById('themeIconMoon');
  const label = document.getElementById('themeLabel');

  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (sunIcon) sunIcon.style.display = 'inline';
    if (moonIcon) moonIcon.style.display = 'none';
    if (label) label.textContent = 'Sáng';
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (sunIcon) sunIcon.style.display = 'none';
    if (moonIcon) moonIcon.style.display = 'inline';
    if (label) label.textContent = 'Tối';
  }
}

async function renderHistoryList() {
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
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 15px; border-bottom:1px solid var(--border); background:var(--surface); border-radius:6px; margin-bottom:6px;">
        <div>
          <div style="font-weight:600; font-size:0.9rem; color:var(--text);">${h.templateName || 'Văn bản hàng loạt'} <span style="font-size:0.75rem; font-weight:700; padding:2px 6px; border-radius:4px; background:var(--primary-light); color:var(--primary); margin-left:6px;">${fmtTag}</span></div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">Thời gian: ${dateStr} • Số lượng: <b>${h.count || 0} file</b> • ${formatBytes(h.size || 0)}</div>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-secondary btn-redownload-zip" data-id="${h.id}" style="font-size:0.78rem; padding:6px 12px; font-weight:600; border:1px solid var(--primary); color:var(--primary);">Tải Lại ZIP</button>
          <button class="btn btn-secondary btn-del-history" data-id="${h.id}" style="font-size:0.78rem; padding:6px 10px; color:var(--error);">&times;</button>
        </div>
      </div>
    `;
  }).join('');
}

// Khởi tạo ứng dụng sau khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();

  // Nút chuyển đổi Theme (Dark Mode)
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      safeStorage.set({ autodoc_theme: newTheme });
    });
  }

  // Modal Lịch sử Xuất
  const historyModal = document.getElementById('historyModal');
  const historyBtn = document.getElementById('historyBtn');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');

  if (historyBtn && historyModal) {
    historyBtn.addEventListener('click', () => {
      renderHistoryList();
      historyModal.classList.add('is-open');
    });
  }
  if (closeHistoryBtn && historyModal) {
    closeHistoryBtn.addEventListener('click', () => historyModal.classList.remove('is-open'));
  }

  // Tải lại hoặc Xóa lịch sử xuất
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
          chrome.downloads.download({
            url: url,
            filename: `HoSo_ReDownload_${Date.now()}.zip`,
            saveAs: true
          }, () => URL.revokeObjectURL(url));
          showToast("Đã tải lại gói ZIP lịch sử!", "success");
        } else {
          showToast("Không tìm thấy file lưu vết trong lịch sử.", "error");
        }
      }

      const delHistoryBtn = e.target.closest('.btn-del-history');
      if (delHistoryBtn) {
        const id = delHistoryBtn.dataset.id;
        await HistoryManager.delete(id);
        await renderHistoryList();
        showToast("Đã xóa mục lịch sử.", "info");
      }
    });
  }

  // Khởi tạo Danh mục và Render bộ lọc & dropdown
  await renderCategoryFilterChips();
  await renderCategorySelectOptions();

  // Modal Quản lý Danh mục
  const categoryModal = document.getElementById('categoryModal');
  const manageCatBtn = document.getElementById('manageCatBtn');
  const closeCategoryBtn = document.getElementById('closeCategoryBtn');

  if (manageCatBtn && categoryModal) {
    manageCatBtn.addEventListener('click', async () => {
      await renderCategoryManagerList();
      categoryModal.classList.add('is-open');
    });
  }
  if (closeCategoryBtn && categoryModal) {
    closeCategoryBtn.addEventListener('click', () => categoryModal.classList.remove('is-open'));
  }

  // Thêm Danh mục Mới
  const addCatBtn = document.getElementById('addCatBtn');
  if (addCatBtn) {
    addCatBtn.addEventListener('click', async () => {
      const input = document.getElementById('newCatNameInput');
      const catName = input ? input.value.trim() : '';
      if (!catName) return showToast("Vui lòng nhập tên danh mục.", "warning");
      try {
        await CategoryManager.add(catName);
        input.value = '';
        await renderCategoryFilterChips();
        await renderCategorySelectOptions();
        await renderCategoryManagerList();
        await renderTemplateList();
        showToast(`Đã thêm danh mục "${catName}" thành công!`, "success");
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  }

  // Sửa tên hoặc Xóa Danh mục trong Modal
  const categoryContainer = document.getElementById('categoryListContainer');
  if (categoryContainer) {
    categoryContainer.addEventListener('click', async (e) => {
      const renameBtn = e.target.closest('.btn-rename-cat');
      if (renameBtn) {
        const id = renameBtn.dataset.id;
        const oldName = renameBtn.dataset.name;
        const newName = prompt("Nhập tên mới cho danh mục:", oldName);
        if (newName && newName.trim() !== '') {
          try {
            await CategoryManager.rename(id, newName.trim());
            await renderCategoryFilterChips();
            await renderCategorySelectOptions();
            await renderCategoryManagerList();
            await renderTemplateList();
            showToast("Đã đổi tên danh mục thành công!", "success");
          } catch (err) {
            showToast(err.message, "error");
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
          await renderCategoryFilterChips();
          await renderCategorySelectOptions();
          await renderCategoryManagerList();
          await renderTemplateList();
          showToast("Đã xóa danh mục.", "info");
        } catch (err) {
          showToast(err.message, "error");
        }
      }
    });
  }

  // Lắng nghe thanh lọc Danh mục Mẫu (Category Filter Chips)
  const catFilterBar = document.getElementById('tplCatFilterBar');
  if (catFilterBar) {
    catFilterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.cat-chip');
      if (chip) {
        catFilterBar.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderTemplateList();
      }
    });
  }

  safeStorage.get(['fileNameFormat', 'enableConsistencyCheck', 'enableFontNormalization', 'enablePrefixIndex', 'enableRemoveTones'], (result) => {
    if (result.fileNameFormat) document.getElementById('fileNameFormat').value = result.fileNameFormat;
    else document.getElementById('fileNameFormat').value = "[1]_[2]";
    
    const checkEl = document.getElementById('enableConsistencyCheck');
    if (checkEl) checkEl.checked = result.enableConsistencyCheck !== false;

    const fontEl = document.getElementById('enableFontNormalization');
    if (fontEl) fontEl.checked = result.enableFontNormalization !== false;

    const prefixEl = document.getElementById('enablePrefixIndex');
    if (prefixEl) prefixEl.checked = result.enablePrefixIndex !== false;

    const tonesEl = document.getElementById('enableRemoveTones');
    if (tonesEl) tonesEl.checked = result.enableRemoveTones !== false;
  });

  // Modal Guide
  const modal = document.getElementById("guideModal");
  const openGuideBtn = document.getElementById("openGuideBtn");
  const closeGuideBtn = document.getElementById("closeGuideBtn");

  if (openGuideBtn && modal) openGuideBtn.addEventListener('click', () => modal.classList.add('is-open'));
  if (closeGuideBtn && modal) closeGuideBtn.addEventListener('click', () => modal.classList.remove('is-open'));

  // Nút Tải File Excel Mẫu
  const downloadSampleBtn = document.getElementById('downloadSampleExcelBtn');
  if (downloadSampleBtn) {
    downloadSampleBtn.addEventListener('click', generateSampleExcelFromTemplate);
  }

  // Sao lưu & Phục hồi Thư viện
  const backupBtn = document.getElementById('backupLibBtn');
  if (backupBtn) backupBtn.addEventListener('click', exportLibraryBackup);

  const restoreBtn = document.getElementById('restoreLibBtn');
  const restoreFileInput = document.getElementById('restoreLibFileInput');
  if (restoreBtn && restoreFileInput) {
    restoreBtn.addEventListener('click', () => restoreFileInput.click());
    restoreFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        importLibraryBackup(e.target.files[0]);
      }
    });
  }

  // Lắng nghe sự kiện chọn Sheet Excel
  const excelSheetSelect = document.getElementById('excelSheetSelect');
  if (excelSheetSelect) {
    excelSheetSelect.addEventListener('change', async (e) => {
      const selectedSheet = e.target.value;
      if (currentExcelWorkbook && selectedSheet) {
        const worksheet = currentExcelWorkbook.Sheets[selectedSheet];
        if (worksheet) {
          const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          window.dataContext = window.dataContext || {};
          window.dataContext.fullData = rawData;
          showToast(`Đã chuyển sang Sheet "${selectedSheet}" (${rawData.length} hàng).`, "info");
        }
      }
    });
  }

  // Lắng nghe chọn file dữ liệu ở Card 3
  const excelDataInput = document.getElementById('excelData');
  if (excelDataInput) {
    excelDataInput.addEventListener('change', async function() {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        document.getElementById('excelDataName').textContent = file.name;
        try {
          const rawData = await parseLocalDataFile(file);
          window.dataContext = window.dataContext || {};
          window.dataContext.fullData = rawData;
          showToast(`Đã nạp file "${file.name}" thành công (${rawData.length} hàng)!`, "success");
        } catch (err) {
          showToast("Lỗi nạp file dữ liệu: " + err.message, "error");
        }
      }
    });
  }

  // Lắng nghe chọn file dữ liệu ở Card 4 (Thư viện Dữ liệu)
  const dataFileInput = document.getElementById('dataFileInput');
  if (dataFileInput) {
    dataFileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        document.getElementById('dataFileName').textContent = this.files[0].name;
      }
    });
  }

  // Bộ lọc tìm kiếm thư viện
  const tplSearchInput = document.getElementById('tplSearchInput');
  if (tplSearchInput) tplSearchInput.addEventListener('input', renderTemplateList);

  const dataSearchInput = document.getElementById('dataSearchInput');
  if (dataSearchInput) dataSearchInput.addEventListener('input', renderDataList);

  bindFileNameDisplay('docTemplate', 'docTemplateName');

  // Thêm Mẫu vào Thư viện
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

      if (!files || files.length === 0) return showToast("Vui lòng chọn file DOCX trước.", "warning");

      try {
        if (files.length === 1) {
          if (!name) return showToast("Vui lòng đặt tên cho mẫu.", "warning");
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
        await renderTemplateList();
        showToast("Đã lưu mẫu vào thư viện!", "success");
        if (tplCancelBtn) tplCancelBtn.click();
      } catch (err) {
        showToast("Lỗi khi lưu: " + err.message, "error");
      }
    });
  }

  const srcLibBtn = document.getElementById('srcLibBtn');
  const srcUploadBtn = document.getElementById('srcUploadBtn');
  if (srcLibBtn) srcLibBtn.addEventListener('click', () => switchSource('library'));
  if (srcUploadBtn) srcUploadBtn.addEventListener('click', () => switchSource('upload'));

  // Event delegation cho danh sách biểu mẫu
  const templateListEl = document.getElementById('templateList');
  if (templateListEl) {
    templateListEl.addEventListener('click', async (event) => {
      const tplStar = event.target.closest('.tpl-star-btn');
      if (tplStar) {
        event.stopPropagation();
        const name = tplStar.dataset.name;
        await TemplateManager.toggleFavorite(name);
        await renderTemplateList();
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
          showToast(`Đang tải file mẫu "${downloadFileName}" về máy...`, "success");
        } catch (e) {
          showToast("Lỗi tải file mẫu: " + e.message, "error");
        }
        return;
      }

      const tplRename = event.target.closest('.tpl-rename');
      if (tplRename) {
        event.stopPropagation();
        const oldName = tplRename.dataset.name;
        const newName = prompt("Nhập tên mới cho mẫu:", oldName.replace(/\.docx$/i, ''));
        if (newName && newName.trim() !== "") {
          try {
            await TemplateManager.rename(oldName, newName.trim());
            await renderTemplateList();
            showToast("Đã đổi tên mẫu thành công!", "success");
          } catch (e) {
            showToast(e.message, "error");
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
        await renderTemplateList();
        showToast("Đã xóa mẫu khỏi thư viện.", "info");
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
        if (!confirm(`Xóa liên kết dữ liệu này khỏi Thư viện?`)) return;
        await DataManager.delete(id);
        await renderDataList();
        showToast("Đã xóa liên kết dữ liệu.", "info");
        return;
      }
    });
  }

  // Thẻ tab chọn nguồn dữ liệu ở Card 3
  const dsUploadBtn = document.getElementById('dataSourceUploadBtn');
  const dsLinkBtn = document.getElementById('dataSourceLinkBtn');
  if (dsUploadBtn && dsLinkBtn) {
    dsUploadBtn.addEventListener('click', () => {
      dsUploadBtn.classList.add('active');
      dsLinkBtn.classList.remove('active');
      dsUploadBtn.style.color = 'var(--text)';
      dsLinkBtn.style.color = 'var(--text-muted)';
      document.getElementById('dataUploadPanel').style.display = '';
      document.getElementById('dataLinkPanel').style.display = 'none';
    });
    dsLinkBtn.addEventListener('click', () => {
      dsLinkBtn.classList.add('active');
      dsUploadBtn.classList.remove('active');
      dsLinkBtn.style.color = 'var(--text)';
      dsUploadBtn.style.color = 'var(--text-muted)';
      document.getElementById('dataUploadPanel').style.display = 'none';
      document.getElementById('dataLinkPanel').style.display = '';
    });
  }

  // Chuyển tab Nguồn Dữ liệu Card 4 (Thư viện Dữ liệu)
  window.switchDataSource = function(sourceType) {
    const linkTab = document.getElementById('dataSrcLinkBtn');
    const fileTab = document.getElementById('dataSrcFileBtn');
    const linkPanel = document.getElementById('dataSrcLinkPanel');
    const filePanel = document.getElementById('dataSrcFilePanel');

    const isLink = sourceType === 'link';
    if (linkTab) {
      linkTab.classList.toggle('active', isLink);
      linkTab.style.color = isLink ? 'var(--primary)' : 'var(--text-muted)';
      linkTab.style.borderBottom = isLink ? '2px solid var(--primary)' : 'none';
    }
    if (fileTab) {
      fileTab.classList.toggle('active', !isLink);
      fileTab.style.color = !isLink ? 'var(--primary)' : 'var(--text-muted)';
      fileTab.style.borderBottom = !isLink ? '2px solid var(--primary)' : 'none';
    }
    if (linkPanel) linkPanel.style.display = isLink ? 'block' : 'none';
    if (filePanel) filePanel.style.display = isLink ? 'none' : 'block';
  };

  // Drag & Drop cho Kéo thả File Card 4
  const dataFileDropZone = document.getElementById('dataFileDropZone');
  const dataFileInputEl = document.getElementById('dataFileInput');
  const dataFileNameEl = document.getElementById('dataFileName');
  if (dataFileDropZone && dataFileInputEl) {
    dataFileDropZone.addEventListener('click', () => dataFileInputEl.click());
    dataFileInputEl.addEventListener('change', () => {
      if (dataFileInputEl.files && dataFileInputEl.files[0] && dataFileNameEl) {
        dataFileNameEl.textContent = dataFileInputEl.files[0].name;
      }
    });
    dataFileDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dataFileDropZone.style.borderColor = 'var(--primary)';
    });
    dataFileDropZone.addEventListener('dragleave', () => {
      dataFileDropZone.style.borderColor = 'var(--border)';
    });
    dataFileDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dataFileDropZone.style.borderColor = 'var(--border)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        dataFileInputEl.files = e.dataTransfer.files;
        if (dataFileNameEl) dataFileNameEl.textContent = e.dataTransfer.files[0].name;
      }
    });
  }

  // Nút "Tải Dữ Liệu" ở Card 4 (Thư viện Dữ liệu)
  const dataLinkImportBtn = document.getElementById('dataLinkImportBtn');
  if (dataLinkImportBtn) {
    dataLinkImportBtn.addEventListener('click', async () => {
      const srcFilePanel = document.getElementById('dataSrcFilePanel');
      const isFileTabActive = srcFilePanel && srcFilePanel.style.display !== 'none';

      if (isFileTabActive) {
        const fileInput = document.getElementById('dataFileInput');
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;
        if (!file) {
          showToast("Vui lòng chọn file dữ liệu từ máy tính (.xlsx, .xls, .csv, .docx).", "warning");
          return;
        }
        const fileSheetName = document.getElementById('dataFileSheetNameInput')?.value.trim();
        try {
          dataLinkImportBtn.disabled = true;
          dataLinkImportBtn.textContent = "Đang đọc file...";
          const parsedData = await parseLocalDataFile(file, fileSheetName);
          window.dataContext = window.dataContext || {};
          window.dataContext.fullData = parsedData;

          const excelDataName = document.getElementById('excelDataName');
          if (excelDataName) excelDataName.textContent = `${file.name} (${parsedData.length} hàng)`;

          showToast(`Đã nạp ${parsedData.length} hàng dữ liệu từ file "${file.name}"!`, "success");
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          dataLinkImportBtn.disabled = false;
          dataLinkImportBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Tải Dữ Liệu
          `;
        }
      } else {
        const link = (document.getElementById('dataLinkInput')?.value || '').trim();
        const sheetName = (document.getElementById('dataSheetNameInput')?.value || '').trim();
        if (!link) {
          showToast("Vui lòng dán liên kết Google Sheets.", "warning");
          return;
        }
        try {
          dataLinkImportBtn.disabled = true;
          dataLinkImportBtn.textContent = "Đang tải Google Sheets...";
          const rawData = await GoogleSheetsManager.importLinkSheet(link, sheetName);
          window.dataContext = window.dataContext || {};
          window.dataContext.fullData = rawData;

          const excelDataName = document.getElementById('excelDataName');
          if (excelDataName) excelDataName.textContent = `Google Sheet live (${rawData.length} hàng)`;

          showToast(`Đã nạp ${rawData.length} hàng dữ liệu từ Google Sheet trực tuyến!`, "success");
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          dataLinkImportBtn.disabled = false;
          dataLinkImportBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Tải Dữ Liệu
          `;
        }
      }
    });
  }

  // Nút Lưu Dữ Liệu vào Thư viện (Hỗ trợ cả File Local & Link Google Sheets)
  const dataLibSaveBtn = document.getElementById('dataLibSaveBtn');
  if (dataLibSaveBtn) {
    dataLibSaveBtn.addEventListener('click', async () => {
      const name = document.getElementById('dataLibNameInput').value.trim();
      const link = document.getElementById('dataLinkInput').value.trim();
      const sheet = document.getElementById('dataSheetNameInput').value.trim();

      const srcFilePanel = document.getElementById('dataSrcFilePanel');
      const isFileTabActive = srcFilePanel && srcFilePanel.style.display !== 'none';

      const fileInput = document.getElementById('dataFileInput');
      const localFile = fileInput && fileInput.files ? fileInput.files[0] : null;

      const id = 'data_' + new Date().getTime();

      try {
        if (isFileTabActive || localFile) {
          if (!localFile) throw new Error("Vui lòng chọn một file dữ liệu từ máy tính (.xlsx, .xls, .csv, .docx).");
          const fileSheetName = document.getElementById('dataFileSheetNameInput')?.value.trim();
          const customName = name || localFile.name;
          showToast(`Đang xử lý lưu file "${localFile.name}"...`, 'info');
          const parsedData = await parseLocalDataFile(localFile, fileSheetName);
          await DataManager.save(id, {
            name: customName,
            type: 'local',
            data: parsedData,
            sheetName: fileSheetName || '',
            fileName: localFile.name
          });
          document.getElementById('dataLibNameInput').value = '';
          document.getElementById('dataFileName').textContent = '';
          if (document.getElementById('dataFileSheetNameInput')) {
            document.getElementById('dataFileSheetNameInput').value = '';
          }
          fileInput.value = '';
          await renderDataList();
          showToast(`Đã lưu file "${customName}" vào Thư viện thành công (${parsedData.length} hàng)!`, "success");
        } else {
          if (!link) throw new Error("Vui lòng dán Link Google Sheet.");
          const customName = name || `Google Sheet (${sheet || 'Mặc định'})`;
          await DataManager.save(id, { name: customName, link, sheetName: sheet, type: 'google_sheets' });
          await renderDataList();
          document.getElementById('dataLibNameInput').value = '';
          showToast(`Đã lưu dữ liệu "${customName}" vào thư viện thành công!`, "success");
        }
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  }

  // Popup Preview & Toolbar Handlers
  const closePreviewBtn = document.getElementById('closePreviewBtn');
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', () => {
      document.getElementById('dataPreviewModal').classList.remove('is-open');
    });
  }

  const previewSearchInput = document.getElementById('previewSearchInput');
  if (previewSearchInput) {
    previewSearchInput.addEventListener('input', renderPreviewTable);
  }

  const toggleEmptyErrorBtn = document.getElementById('toggleEmptyErrorBtn');
  if (toggleEmptyErrorBtn) {
    toggleEmptyErrorBtn.addEventListener('click', () => {
      isOnlyErrorsFilter = !isOnlyErrorsFilter;
      toggleEmptyErrorBtn.style.background = isOnlyErrorsFilter ? 'var(--warning-light)' : '';
      toggleEmptyErrorBtn.style.color = isOnlyErrorsFilter ? 'var(--warning)' : '';
      renderPreviewTable();
    });
  }

  const openTransformersModalBtn = document.getElementById('openTransformersModalBtn');
  if (openTransformersModalBtn) {
    openTransformersModalBtn.addEventListener('click', openTransformersModal);
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
      renderPreviewTable();
      showToast("Đã cập nhật quy tắc định dạng biến!", "success");
    });
  }

  const addPreviewRowBtn = document.getElementById('addPreviewRowBtn');
  if (addPreviewRowBtn) {
    addPreviewRowBtn.addEventListener('click', () => {
      const emptyRow = {};
      currentPreviewHeaders.forEach(h => emptyRow[h] = '');
      currentPreviewRawData.push(emptyRow);
      renderPreviewTable();
    });
  }

  const exportPreviewDataBtn = document.getElementById('exportPreviewDataBtn');
  if (exportPreviewDataBtn) {
    exportPreviewDataBtn.addEventListener('click', exportPreviewDataToExcel);
  }

  const previewDataTableEl = document.getElementById('previewDataTable');
  if (previewDataTableEl) {
    // Tự động đồng bộ dữ liệu khi người dùng gõ vào bất kỳ ô input nào trong bảng
    previewDataTableEl.addEventListener('input', (event) => {
      const input = event.target.closest('.preview-input');
      if (input) {
        const tr = input.closest('.preview-row');
        if (!tr) return;
        const rowIdx = parseInt(tr.dataset.rowIdx, 10);
        const col = input.dataset.col;
        if (!isNaN(rowIdx) && currentPreviewRawData[rowIdx] && col) {
          currentPreviewRawData[rowIdx][col] = input.value;
        }
      }
    });

    // Bắt sự kiện dán nhiều dòng x nhiều cột từ clipboard (Excel/Google Sheets)
    previewDataTableEl.addEventListener('paste', (event) => {
      const input = event.target.closest('.preview-input');
      if (input) {
        handleTablePaste(event, input);
      }
    });

    previewDataTableEl.addEventListener('click', (event) => {
      const btnDel = event.target.closest('.btn-del-row');
      if (btnDel) {
        const tr = btnDel.closest('tr');
        const rowIdx = parseInt(tr.dataset.rowIdx, 10);
        if (!isNaN(rowIdx)) {
          currentPreviewRawData.splice(rowIdx, 1);
          renderPreviewTable();
        }
        return;
      }

      const btnExportSingle = event.target.closest('.btn-export-single');
      if (btnExportSingle) {
        const tr = btnExportSingle.closest('tr');
        const rowIdx = parseInt(tr.dataset.rowIdx, 10);
        if (isNaN(rowIdx) || !onConfirmExportCallback) return;

        btnExportSingle.style.opacity = '0.5';
        showToast(`Đang tạo file đơn cho dòng ${rowIdx + 1}...`, 'info');
        
        const singleData = getEditedData();
        if (singleData[rowIdx]) {
          onConfirmExportCallback([singleData[rowIdx]], true, rowIdx);
        }
      }
    });
  }

  const confirmExportBtn = document.getElementById('confirmExportBtn');
  if (confirmExportBtn) {
    confirmExportBtn.addEventListener('click', () => {
      const editedData = getEditedData();
      if (editedData.length === 0) {
        return showToast("Vui lòng tích chọn ít nhất 1 hàng dữ liệu để xuất.", "warning");
      }

      const checkEnabled = document.getElementById('enableConsistencyCheck')?.checked;
      if (checkEnabled && currentTemplateVars.length > 0) {
        const nameFormat = document.getElementById('fileNameFormat').value.trim() || "[1]_[2]";
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
      safeStorage.set({ 
        fileNameFormat: format,
        enableConsistencyCheck: checkEl ? checkEl.checked : true,
        enableFontNormalization: document.getElementById('enableFontNormalization')?.checked !== false,
        enablePrefixIndex: document.getElementById('enablePrefixIndex')?.checked !== false,
        enableRemoveTones: document.getElementById('enableRemoveTones')?.checked !== false
      }, () => {
        showToast("Đã lưu cấu hình thành công!", "success");
      });
    });
  }

  // =============================================================================
  // PHẦN 6: LUỒNG XỬ LÝ CHÍNH VÀ INTEGRATION WEB WORKER
  // =============================================================================

  const processBtn = document.getElementById('processBtn');
  if (processBtn) {
    processBtn.addEventListener('click', async () => {
      const formatInput = document.getElementById('fileNameFormat');
      let nameFormat = formatInput ? formatInput.value.trim() : "[1]_[2]";
      if (!nameFormat) nameFormat = "[1]_[2]";

      const ui = {
        btn: document.getElementById('processBtn'),
        status: document.getElementById('status'),
        track: document.getElementById('progressTrack'),
        bar: document.getElementById('progressBar')
      };

      if (ui.btn) ui.btn.disabled = true;
      if (ui.status) {
        ui.status.style.color = "var(--primary)";
        ui.status.innerText = "Đang kiểm tra mẫu...";
      }

      try {
        let docBuffer;
        const srcLibBtnEl = document.getElementById('srcLibBtn');
        const isLibSource = srcLibBtnEl ? srcLibBtnEl.classList.contains('active') : true;

        if (isLibSource) {
          const tplSelectEl = document.getElementById('tplLibSelect');
          const selectedTpl = tplSelectEl ? tplSelectEl.value : '';
          if (!selectedTpl) throw new Error("Vui lòng chọn một mẫu từ Thư viện, hoặc chuyển sang 'Upload File'.");
          if (ui.status) ui.status.innerText = `Đang tải mẫu "${selectedTpl}"...`;
          docBuffer = await TemplateManager.getBuffer(selectedTpl);
        } else {
          const docTemplateEl = document.getElementById('docTemplate');
          const docFile = docTemplateEl ? docTemplateEl.files[0] : null;
          if (!docFile) throw new Error("Vui lòng chọn file Word mẫu (.docx) để upload.");
          docBuffer = await docFile.arrayBuffer();
        }

        const enableFontNormalization = document.getElementById('enableFontNormalization')?.checked !== false;
        const prefixIndex = document.getElementById('enablePrefixIndex')?.checked !== false;
        const removeTones = document.getElementById('enableRemoveTones')?.checked !== false;

        let preparedZip;
        let detectedDocEncoding = 'UNICODE';
        try {
          const prep = prepareTemplateZip(docBuffer, enableFontNormalization);
          preparedZip = prep.zip;
          detectedDocEncoding = prep.detectedDocEncoding;
        } catch (e) {
          throw new Error("Lỗi đọc cấu trúc file Word mẫu: " + e.message);
        }

        const { varList, fullText } = extractVariablesFromDocxZip(preparedZip);
        if (varList.length === 0) {
          throw new Error("Không tìm thấy biến số {{...}} nào trong file Word mẫu (kể cả phần thân, tiêu đề đầu và chân trang).");
        }

        currentTemplateVars = varList;
        currentTemplateText = fullText;
        const processedDocBuffer = preparedZip.generate({ type: 'arraybuffer' });

        const dataFileInput = document.getElementById('excelData');
        const dataFile = dataFileInput ? dataFileInput.files[0] : null;
        let rawData = [];

        const srcDataLinkBtnEl = document.getElementById('dataSourceLinkBtn');
        const isDataLinkSource = srcDataLinkBtnEl ? srcDataLinkBtnEl.classList.contains('active') : false;

        if (isDataLinkSource) {
          const sel = document.getElementById('dataLibSelect');
          if (!sel || !sel.value) throw new Error("Vui lòng chọn một nguồn dữ liệu từ Thư viện.");
          const sources = await DataManager.list();
          const item = sources[sel.value];
          if (!item) throw new Error("Không tìm thấy dữ liệu đã chọn trong Thư viện.");
          
          if (item.type === 'local' && item.data) {
            if (ui.status) ui.status.innerText = `Đang nạp dữ liệu từ file lưu sẵn "${item.name}"...`;
            rawData = item.data;
          } else if (item.link || item.type === 'google_sheets') {
            if (ui.status) ui.status.innerText = `Đang tải dữ liệu "${item.name}" từ Google Sheet (Sheet: ${item.sheetName || 'Mặc định'})...`;
            rawData = await GoogleSheetsManager.importLinkSheet(item.link, item.sheetName);
          } else {
            throw new Error("Dữ liệu trong thư viện không hợp lệ.");
          }
        } else if (dataFile) {
          if (ui.status) ui.status.innerText = `Đang đọc dữ liệu từ file "${dataFile.name}"...`;
          const selectedSheet = document.getElementById('excelSheetSelect')?.value;
          rawData = await parseLocalDataFile(dataFile, selectedSheet);
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
          if (checkDLKey) {
            rawData = rawData.filter(row => {
              const val = row[checkDLKey];
              return val !== undefined && val !== null && val.toString().trim().toLowerCase() === 'true';
            });
            if (rawData.length === 0) throw new Error("Không có dòng dữ liệu nào có Check DL = true.");
          }
        }

        if (rawData && rawData.length > 0) {
          const dataEnc = detectExcelEncoding(rawData);
          if (dataEnc !== 'UNICODE') {
            rawData = rawData.map(row => {
              const convertedRow = {};
              for (const k in row) {
                let v = row[k];
                if (typeof v === 'string') {
                  if (dataEnc === 'VNI') v = vniToUnicode(v);
                  else if (dataEnc === 'TCVN3') v = tcvn3ToUnicode(v);
                }
                convertedRow[k] = v;
              }
              return convertedRow;
            });
          }
        }

        const headers = (isDataLinkSource && rawData.length > 0) ? Object.keys(rawData[0]).map(h => keepOriginalText(h)) : ((dataFile && rawData.length > 0) ? Object.keys(rawData[0]).map(h => keepOriginalText(h)) : varList);

        if (ui.status) ui.status.innerText = "Đã nạp thành công! Đang mở bảng xem trước...";

        // Callback thực tế chạy Web Worker để xuất file
        onConfirmExportCallback = (editedData, isSingle = false, singleIdx = null) => {
          if (ui.btn) ui.btn.disabled = true;
          if (ui.track) ui.track.style.display = "block";
          if (ui.bar) ui.bar.style.width = "10%";
          if (ui.status) ui.status.innerText = isSingle ? "Đang tạo file đơn..." : "Đang khởi tạo Web Worker...";

          if (activeWorker) {
            activeWorker.terminate();
          }

          const workerUrl = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
            ? chrome.runtime.getURL('worker.js')
            : 'worker.js';
          activeWorker = new Worker(workerUrl);

          activeWorker.onmessage = (e) => {
            const data = e.data;

            if (data.type === 'progress') {
              if (ui.bar) ui.bar.style.width = `${data.percent}%`;
              if (ui.status) ui.status.innerText = `Đang tạo: ${data.current} / ${data.total} file (${data.percent}%)`;
            } else if (data.type === 'status') {
              if (ui.status) ui.status.innerText = data.message;
            } else if (data.type === 'done') {
              if (ui.bar) ui.bar.style.width = "100%";
              if (ui.status) {
                ui.status.style.color = "var(--success)";
                ui.status.innerText = `HOÀN TẤT — Đã xuất thành công ${data.count} file.`;
              }

              const zipUrl = URL.createObjectURL(data.blob);
              chrome.downloads.download({
                url: zipUrl,
                filename: `HoSo_AutoDoc_${Date.now()}.zip`,
                saveAs: true
              }, () => { URL.revokeObjectURL(zipUrl); });

              showToast(`Đã xuất thành công gói ZIP ${data.count} file văn bản!`, "success");

              // Lưu vết vào Lịch sử Xuất
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
                  renderHistoryList();
                };
                reader.readAsDataURL(data.blob);
              } catch(errHist) {
                console.error("Lỗi lưu lịch sử xuất:", errHist);
              }

              if (ui.btn) ui.btn.disabled = false;
              setTimeout(() => {
                if (ui.track) ui.track.style.display = "none";
                if (ui.bar) ui.bar.style.width = "0%";
              }, 2000);
              activeWorker.terminate();
              activeWorker = null;
            } else if (data.type === 'done_single') {
              const fileUrl = URL.createObjectURL(data.blob);
              chrome.downloads.download({
                url: fileUrl,
                filename: data.filename,
                saveAs: true
              }, () => { URL.revokeObjectURL(fileUrl); });

              showToast(`Đã tải xuống file "${data.filename}"`, "success");
              if (ui.btn) ui.btn.disabled = false;
              activeWorker.terminate();
              activeWorker = null;
            } else if (data.type === 'done_merged') {
              if (ui.bar) ui.bar.style.width = '100%';
              if (ui.status) {
                ui.status.style.color = 'var(--success)';
                ui.status.innerText = `HOÀN TẤT — Đã gộp thành công ${data.count} văn bản vào 1 file duy nhất.`;
              }
              const fileUrl = URL.createObjectURL(data.blob);
              chrome.downloads.download({
                url: fileUrl,
                filename: data.filename,
                saveAs: true
              }, () => { URL.revokeObjectURL(fileUrl); });

              showToast(`Đã xuất thành công file Word gộp ${data.count} văn bản ("${data.filename}")!`, "success");
              if (ui.btn) ui.btn.disabled = false;
              setTimeout(() => {
                if (ui.track) ui.track.style.display = "none";
                if (ui.bar) ui.bar.style.width = "0%";
              }, 2000);
              activeWorker.terminate();
              activeWorker = null;
            } else if (data.type === 'file_ready') {
              const fileUrl = URL.createObjectURL(data.blob);
              chrome.downloads.download({
                url: fileUrl,
                filename: data.filename,
                saveAs: false
              }, () => {
                setTimeout(() => URL.revokeObjectURL(fileUrl), 10000);
              });
            } else if (data.type === 'done_individual') {
              if (ui.bar) ui.bar.style.width = '100%';
              if (ui.status) {
                ui.status.style.color = 'var(--success)';
                ui.status.innerText = `HOÀN TẤT — Đã xuất thành công ${data.count} file văn bản riêng lẻ.`;
              }
              showToast(`Đã xuất thành công ${data.count} file .${data.format || 'docx'} vào thư mục tải xuống!`, "success");
              if (ui.btn) ui.btn.disabled = false;
              setTimeout(() => {
                if (ui.track) ui.track.style.display = "none";
                if (ui.bar) ui.bar.style.width = "0%";
              }, 2000);
              activeWorker.terminate();
              activeWorker = null;
            } else if (data.type === 'error') {
              if (ui.status) {
                ui.status.style.color = "var(--error)";
                ui.status.innerText = "Lỗi: " + data.message;
              }
              showToast("Lỗi khi xuất: " + data.message, "error");
              if (ui.btn) ui.btn.disabled = false;
              activeWorker.terminate();
              activeWorker = null;
            }
          };

          activeWorker.onerror = (err) => {
            if (ui.status) {
              ui.status.style.color = "var(--error)";
              ui.status.innerText = "Lỗi Worker: " + err.message;
            }
            showToast("Lỗi Web Worker: " + err.message, "error");
            if (ui.btn) ui.btn.disabled = false;
          };

          const exportFormatSelectEl = document.getElementById('exportFormatSelect');
          const exportFormat = exportFormatSelectEl ? exportFormatSelectEl.value : 'docx';

          const batchExportModeSelectEl = document.getElementById('batchExportModeSelect');
          const modalBatchExportModeSelectEl = document.getElementById('modalBatchExportModeSelect');
          let batchExportMode = (modalBatchExportModeSelectEl ? modalBatchExportModeSelectEl.value : (batchExportModeSelectEl ? batchExportModeSelectEl.value : 'merged')) || 'merged';
          if (batchExportMode === 'multiple') batchExportMode = 'merged';
          const mergeToOneFile = batchExportMode === 'merged';

          activeWorker.postMessage({
            editedData,
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
        };

        if (ui.btn) ui.btn.disabled = false;
        showPreviewModal(headers, rawData);

      } catch (err) {
        if (ui.status) {
          ui.status.style.color = "var(--error)";
          ui.status.innerText = "Lỗi: " + err.message;
        }
        showToast(err.message, "error");
        if (ui.btn) ui.btn.disabled = false;
      }
    });
  }

  await renderTemplateList();
  await renderDataList();
});

// ==========================================================
// GOOGLE SHEETS MANAGER & LINK IMPORTING
// ==========================================================
const GoogleSheetsManager = {
  extractFileId(url) {
    try {
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
      if (url.includes('gid=')) {
        return new URL(url).searchParams.get('gid');
      }
    } catch(e) {}
    return '0';
  },

  async importLinkSheet(url, sheetName) {
    const fileId = this.extractFileId(url);
    if (!fileId) throw new Error("Link Google Sheets không hợp lệ.");
    
    let exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`;
    if (sheetName) {
      exportUrl = `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    } else {
      const gid = this.extractGid(url);
      exportUrl += `&gid=${gid}`;
    }
    
    const res = await fetch(exportUrl, { credentials: 'omit' });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        throw new Error("Không có quyền truy cập file hoặc file không tồn tại. Hãy chia sẻ link 'Bất kỳ ai có liên kết'.");
      }
      throw new Error(`Lỗi HTTP ${res.status}`);
    }
    const csvText = await res.text();
    
    return new Promise((resolve, reject) => {
      try {
        const workbook = XLSX.read(csvText, { type: 'string' });
        const firstSheet = workbook.SheetNames[0];
        let rawData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" });
        if (rawData && rawData.length > 0) {
          const firstRowKeys = Object.keys(rawData[0]);
          const checkDLKey = firstRowKeys.find(k => k.toLowerCase().trim() === 'check dl');
          if (checkDLKey) {
            rawData = rawData.filter(row => {
              const val = row[checkDLKey];
              return val !== undefined && val !== null && val.toString().trim().toLowerCase() === 'true';
            });
            if (rawData.length === 0) {
              return reject(new Error("Không có hàng dữ liệu nào có giá trị Check DL = 'True' trong Google Sheet."));
            }
          }
          resolve(rawData);
        } else {
          reject(new Error("File không có dữ liệu hoặc không đúng cấu trúc bảng."));
        }
      } catch (err) {
        reject(new Error("Lỗi đọc dữ liệu: " + err.message));
      }
    });
  },

  async importLinkWord(url) {
    const fileId = this.extractFileId(url);
    if (!fileId) throw new Error("Link không hợp lệ.");
    
    const exportUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
    const res = await fetch(exportUrl, { credentials: 'omit' });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        throw new Error("Không có quyền truy cập file hoặc file không tồn tại. Đảm bảo chia sẻ 'Bất kỳ ai có liên kết'.");
      }
      throw new Error(`Lỗi HTTP ${res.status}`);
    }
    return res.arrayBuffer();
  }
};

let pickerWindowId = null;
let pickerType = null;

function openDrivePicker(type) {
  if (pickerWindowId) {
    chrome.windows.remove(pickerWindowId, () => {});
  }
  pickerType = type;
  chrome.windows.create({
    url: 'https://drive.google.com/',
    type: 'popup',
    width: 1000,
    height: 700
  }, (win) => {
    pickerWindowId = win.id;
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'autodocDriveSelected' && pickerWindowId) {
    const fileUrl = message.url;
    if (fileUrl.includes('drive.google.com') && !fileUrl.includes('/file/d/') && !message.forceFileId) {
      showToast("Vui lòng NHẤP ĐÚP file để mở tab mới, sau đó bấm Xác nhận!", "warning");
      return;
    }
    const finalUrl = message.forceFileId ? `https://drive.google.com/file/d/${message.forceFileId}/view` : fileUrl;
    chrome.windows.remove(pickerWindowId, () => {});
    if (sender.tab && sender.tab.windowId !== pickerWindowId) {
      chrome.tabs.remove(sender.tab.id, () => {});
    }
    pickerWindowId = null;
    if (pickerType === 'data') {
      const input = document.getElementById('dataLinkInput');
      if (input) input.value = finalUrl;
    } else if (pickerType === 'tpl') {
      const input = document.getElementById('tplLinkInput');
      const btn = document.getElementById('tplLinkImportBtn');
      if (input) input.value = finalUrl;
      if (btn) btn.click();
    }
  }
});

chrome.tabs.onUpdated.addListener(function pickerListener(tabId, changeInfo, tab) {
  if (!pickerWindowId) return;
  if (changeInfo.status === 'complete' && tab.url) {
    const isDrive = tab.url.includes('drive.google.com');
    const isDocs = tab.url.includes('docs.google.com/spreadsheets/d/') || tab.url.includes('docs.google.com/document/d/');
    
    if (isDrive || isDocs) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (pickerType) => {
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
              : (pickerType === 'data' ? 'Chọn <b>Tab (Sheet)</b> ở dưới đáy, rồi bấm ->' : 'Kiểm tra đúng file mẫu, rồi bấm ->');

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
              chrome.runtime.sendMessage({ 
                action: 'autodocDriveSelected', 
                url: window.location.href,
                forceFileId: forceFileId 
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

function switchDataSource(source) {
  const isLink = source === 'link';
  const isFile = source === 'file';
  
  const linkBtn = document.getElementById('dataSrcLinkBtn');
  const fileBtn = document.getElementById('dataSrcFileBtn');
  if (linkBtn) {
    linkBtn.classList.toggle('active', isLink);
    linkBtn.style.borderBottom = isLink ? '2px solid var(--primary)' : 'none';
    linkBtn.style.color = isLink ? 'var(--primary)' : 'var(--text-muted)';
  }
  if (fileBtn) {
    fileBtn.classList.toggle('active', isFile);
    fileBtn.style.borderBottom = isFile ? '2px solid var(--primary)' : 'none';
    fileBtn.style.color = isFile ? 'var(--primary)' : 'var(--text-muted)';
  }
  
  const linkPanel = document.getElementById('dataSrcLinkPanel');
  const filePanel = document.getElementById('dataSrcFilePanel');
  if (linkPanel) linkPanel.style.display = isLink ? '' : 'none';
  if (filePanel) filePanel.style.display = isFile ? '' : 'none';
}

window.switchDataSource = switchDataSource;

document.addEventListener('DOMContentLoaded', () => {
  const dataSrcLinkBtn = document.getElementById('dataSrcLinkBtn');
  const dataSrcFileBtn = document.getElementById('dataSrcFileBtn');
  if (dataSrcLinkBtn) dataSrcLinkBtn.addEventListener('click', () => switchDataSource('link'));
  if (dataSrcFileBtn) dataSrcFileBtn.addEventListener('click', () => switchDataSource('file'));

  const dataFileDropZone = document.getElementById('dataFileDropZone');
  const dataFileInput = document.getElementById('dataFileInput');
  if (dataFileDropZone && dataFileInput) {
    dataFileDropZone.addEventListener('click', (e) => {
      if (e.target !== dataFileInput) {
        dataFileInput.click();
      }
    });
  }

  const dataLinkImportBtn = document.getElementById('dataLinkImportBtn');
  if (dataLinkImportBtn) {
    dataLinkImportBtn.addEventListener('click', async () => {
      const input = document.getElementById('dataLinkInput');
      const sheetNameInput = document.getElementById('dataSheetNameInput');
      const url = input ? input.value.trim() : '';
      const sheetName = sheetNameInput ? sheetNameInput.value.trim() : '';
      if (!url) return showToast("Vui lòng nhập link file Google Sheets / Drive.", "warning");
      
      dataLinkImportBtn.disabled = true;
      dataLinkImportBtn.textContent = "Đang tải...";
      
      try {
        const rawData = await GoogleSheetsManager.importLinkSheet(url, sheetName);
        window.dataContext = window.dataContext || { headers: [], fullData: [] };
        if (rawData.length > 0) window.dataContext.headers = Object.keys(rawData[0]);
        window.dataContext.fullData = rawData;
        showToast(`Tải dữ liệu thành công! Tìm thấy ${rawData.length} hàng dữ liệu.`, "success");
      } catch (err) {
        showToast("Lỗi tải dữ liệu từ link: " + err.message, "error");
      } finally {
        dataLinkImportBtn.disabled = false;
        dataLinkImportBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Tải Dữ Liệu
        `;
      }
    });
  }
});
