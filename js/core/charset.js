'use strict';

export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const CHAR_MAPPINGS = [
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

export const vniMappings = CHAR_MAPPINGS.map((m, idx) => ({ from: m.vni, to: m.unicode, index: idx }))
  .sort((a, b) => b.from.length - a.from.length);

export const tcvn3Mappings = CHAR_MAPPINGS.map((m, idx) => ({ from: m.tcvn3, to: m.unicode, index: idx }))
  .sort((a, b) => b.from.length - a.from.length);

// Dùng chính bảng chuyển đổi làm chữ ký phát hiện để không bỏ sót tổ hợp VNI như eä, iæ, oä.
const vniSignatureRegex = new RegExp(
  vniMappings
    .filter(item => item.from.length > 1 && /[^\x00-\x7F]/.test(item.from))
    .map(item => escapeRegExp(item.from))
    .join('|'),
  'gi'
);

// Một số tệp Excel cũ lưu mã glyph của font VNI thay vì chuỗi VNI gõ (aù, eä).
// Khi thư viện XLSX đọc chuỗi đó, nó trông như Unicode nhưng tạo ra các tổ hợp
// không thể là chính tả tiếng Việt, ví dụ: Bỡnh, NguyỦn, dỹch. Không được thay
// từng ký tự rời rạc: ỡ/ỹ/Ủ vẫn là Unicode hợp lệ trong ngữ cảnh khác.
const legacyVniGlyphPatterns = [
  [/\bBỡ(?=nh\b)/g, 'Bệ'],
  [/\bbỡ(?=nh\b)/g, 'bệ'],
  [/iỡ/gi, match => match === 'IỠ' ? 'IỆ' : match[0] === 'I' ? 'Iệ' : 'iệ'],
  [/yỦ/g, 'yễ'],
  [/YỦ/g, 'YỄ'],
  [/Ęường/g, 'Đường'],
  [/\bdỹch\b/g, 'dịch'],
  [/\bDỹch\b/g, 'Dịch'],
  [/^Ợ$/g, 'ổ']
];

// Một số bảng .VnTime cũ được lưu dưới dạng glyph (mã Unicode hiển thị sai
// khi rời font), khác với chuỗi TCVN3 một byte. Bảng này chỉ được dùng khi
// đoạn có chữ ký glyph; tuyệt đối không áp cho Unicode bình thường.
const vnTimeGlyphMap = new Map([
  ['Ę', 'Đ'], ['Ē', 'ă'], ['Ý', 'Ô'], ['ỹ', 'ị'], ['Ờ', 'ồ'], ['Ộ', 'ố'],
  ['Ự', 'ỉ'], ['Ỻ', 'ớ'], ['Ỡ', 'ệ'], ['Ợ', 'ổ'], ['Ủ', 'ễ']
]);
const vnTimeGlyphSignature = new RegExp(`[${[...vnTimeGlyphMap.keys()].join('')}]`);

function hasLegacyVniGlyphPattern(text) {
  return legacyVniGlyphPatterns.some(([pattern]) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

function hasVnTimeGlyphSignature(text) {
  return vnTimeGlyphSignature.test(text);
}

export function vnTimeGlyphToUnicode(value) {
  const text = String(value ?? '');
  return [...text].map(char => vnTimeGlyphMap.get(char) || char).join('').normalize('NFC');
}

export function legacyVniGlyphToUnicode(value) {
  let text = String(value ?? '');
  for (const [pattern, replacement] of legacyVniGlyphPatterns) {
    pattern.lastIndex = 0;
    text = text.replace(pattern, replacement);
  }
  return text.normalize('NFC');
}

export function vniToUnicode(str) {
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

export function tcvn3ToUnicode(str) {
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

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

/**
 * Nhận diện bảng mã trên một đoạn văn bản ngắn, thay vì suy đoán từ cả tài liệu.
 * Chỉ dùng các dấu hiệu VNI/TCVN3 đặc trưng để tránh làm hỏng Unicode hợp lệ.
 */
export function detectFragmentEncoding(value) {
  const text = String(value ?? '');
  if (!text) return 'UNICODE';

  if (hasLegacyVniGlyphPattern(text)) return 'VNI_GLYPH';

  const vniScore = countMatches(text, vniSignatureRegex);
  // § là ký hiệu điều khoản phổ biến. Các dấu còn lại (kể cả µ trong .VnTime)
  // là chữ ký TCVN3; riêng các đơn vị kỹ thuật như µm/µg được giữ nguyên.
  const textWithoutMicroUnits = text.replace(/µ\s*(?:m|g|s|l)\b/gi, '');
  const tcvn3Score = countMatches(textWithoutMicroUnits, /[®µ¸©ª«¬­¶¹¨¡¢£¤¥¦·]/g);

  if (vniScore > 0 && vniScore > tcvn3Score) return 'VNI';
  if (tcvn3Score > 0 && tcvn3Score > vniScore) return 'TCVN3';
  return 'UNICODE';
}

/** Chuẩn hóa an toàn một giá trị cho Word: VNI/TCVN3 đặc trưng -> Unicode NFC. */
export function normalizeVietnameseText(value, { allowVnTimeGlyph = false } = {}) {
  if (value === null || value === undefined) {
    return { text: '', encoding: 'UNICODE', converted: false };
  }

  const original = String(value);
  const encoding = allowVnTimeGlyph && hasVnTimeGlyphSignature(original)
    ? 'VNTIME_GLYPH'
    : detectFragmentEncoding(original);
  const converted = encoding === 'VNI'
    ? vniToUnicode(original)
    : encoding === 'TCVN3'
      ? tcvn3ToUnicode(original)
      : encoding === 'VNTIME_GLYPH'
        ? vnTimeGlyphToUnicode(original)
      : encoding === 'VNI_GLYPH'
        ? legacyVniGlyphToUnicode(original)
      : original.normalize('NFC');

  return {
    text: converted.normalize('NFC'),
    encoding,
    converted: encoding !== 'UNICODE'
  };
}

export function detectTextEncoding(sampleText) {
  return detectFragmentEncoding(sampleText);
}

export function detectExcelEncoding(excelData) {
  if (!Array.isArray(excelData) || excelData.length === 0) return "UNICODE";
  let sampleText = "";
  let count = 0;
  sampleText += " " + Object.keys(excelData[0]).join(" ");
  for (const row of excelData) {
    for (const key in row) {
      sampleText += " " + String(row[key]);
      if (++count > 300) break;
    }
    if (count > 300) break;
  }
  return detectTextEncoding(sampleText);
}

export function detectDocxZipEncoding(zip) {
  if (!zip || !zip.files) return "UNICODE";
  let fullTextSample = "";
  for (const filename in zip.files) {
    if (filename.endsWith('.xml') && filename.toLowerCase().includes('word')) {
      const fileObj = zip.file(filename);
      if (!fileObj) continue;
      const content = fileObj.asText();
      const tMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (tMatches) {
        fullTextSample += " " + tMatches.map(m => m.replace(/<w:t[^>]*>|<\/w:t>/g, '')).join(' ');
      }
    }
    if (fullTextSample.length > 5000) break;
  }
  return detectTextEncoding(fullTextSample);
}

export function removeVietnameseTones(str) {
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
  return str || "Khong_Xac_Dinh";
}

export function sanitizeFilename(str) {
  if (!str) return "Van_Ban";
  return String(str)
    .normalize("NFC")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim() || "Van_Ban";
}

export function keepOriginalText(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFC")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/\uFEFF/g, "")
    .trim();
}

export function encodeValueForTemplate(value) {
  if (typeof value !== 'string') return value;
  return value.normalize("NFC");
}

export { base64ToBuffer } from './constants.js';

