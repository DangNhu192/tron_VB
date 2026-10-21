import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  normalizeVietnameseText
} from '../js/core/charset.js';
import { prepareTemplateZip } from '../js/core/docx-xml.js';

const pizzipCode = fs.readFileSync('libs/pizzip.min.js', 'utf8');
const loadPizZip = new Function('window', `${pizzipCode}; return window.PizZip;`);
const PizZip = loadPizZip({});
global.window = { PizZip };

assert.deepEqual(normalizeVietnameseText('aù'), {
  text: 'á',
  encoding: 'VNI',
  converted: true
});
assert.deepEqual(normalizeVietnameseText('Vieät Nam'), {
  text: 'Việt Nam',
  encoding: 'VNI',
  converted: true
});
assert.deepEqual(normalizeVietnameseText('µn'), {
  text: 'àn',
  encoding: 'TCVN3',
  converted: true
});
assert.deepEqual(normalizeVietnameseText('¸'), {
  text: 'á',
  encoding: 'TCVN3',
  converted: true
});
assert.deepEqual(normalizeVietnameseText('Vo\u0302'), {
  text: 'Vô',
  encoding: 'UNICODE',
  converted: false
});
assert.equal(normalizeVietnameseText('Español').text, 'Español');
assert.deepEqual(normalizeVietnameseText('Bỡnh viỡn'), {
  text: 'Bệnh viện',
  encoding: 'VNI_GLYPH',
  converted: true
});
assert.equal(normalizeVietnameseText('Ợ').text, 'ổ');
assert.equal(normalizeVietnameseText('Ęường').text, 'Đường');
assert.equal(normalizeVietnameseText('NguyỦn').text, 'Nguyễn');
assert.equal(normalizeVietnameseText('dỹch').text, 'dịch');
assert.equal(normalizeVietnameseText('nghiỡp').text, 'nghiệp');
assert.equal(normalizeVietnameseText('ngỡ').text, 'ngỡ');
assert.equal(normalizeVietnameseText('Long PhưỺc', { allowVnTimeGlyph: true }).text, 'Long Phước');
assert.equal(normalizeVietnameseText('Thỹ HỜng', { allowVnTimeGlyph: true }).text, 'Thị Hồng');
assert.equal(normalizeVietnameseText('Ýng Lê QuỘc Hùng', { allowVnTimeGlyph: true }).text, 'Ông Lê Quốc Hùng');
assert.equal(normalizeVietnameseText('Đường tỰnh 868, khu phỘ 2, phường Cai Lậy, tỰnh ĐỜng Tháp', { allowVnTimeGlyph: true }).text,
  'Đường tỉnh 868, khu phố 2, phường Cai Lậy, tỉnh Đồng Tháp');
assert.equal(normalizeVietnameseText('Thỹ Hồng').text, 'Thỹ Hồng');
assert.equal(normalizeVietnameseText('Nguyễn VĒn Bé', { allowVnTimeGlyph: true }).text, 'Nguyễn Văn Bé');

const zip = new PizZip();
zip.file('word/document.xml', '<w:document><w:r><w:rPr><w:rFonts w:asciiTheme="minorHAnsi" w:hAnsi="Arial" w:eastAsia="SimSun" w:cs="VNI-Times"/></w:rPr><w:t>aù</w:t></w:r></w:document>');
zip.file('word/header1.xml', '<w:hdr><w:t>¸</w:t></w:hdr>');
zip.file('word/comments.xml', '<w:comments><w:r><w:rPr><w:b/></w:rPr><w:t>Vo\u0302</w:t></w:r></w:comments>');
zip.file('word/styles.xml', '<w:styles><w:docDefaults><w:rPrDefault><w:rPr/></w:rPrDefault></w:docDefaults></w:styles>');
zip.file('word/footnotes.xml', '<w:footnotes><w:delText>aù</w:delText></w:footnotes>');
zip.file('word/theme/theme1.xml', '<a:theme><a:t>aù</a:t></a:theme>');

const result = prepareTemplateZip(zip.generate({ type: 'arraybuffer' }), true);
const documentXml = result.zip.file('word/document.xml').asText();
const commentsXml = result.zip.file('word/comments.xml').asText();
const stylesXml = result.zip.file('word/styles.xml').asText();
assert.match(documentXml, /w:ascii="Times New Roman"/);
assert.match(documentXml, /w:hAnsi="Times New Roman"/);
assert.match(documentXml, /w:eastAsia="Times New Roman"/);
assert.match(documentXml, /w:cs="Times New Roman"/);
assert.doesNotMatch(documentXml, /Theme=/);
assert.match(commentsXml, /<w:rPr><w:rFonts w:ascii="Times New Roman"/);
assert.match(stylesXml, /<w:rPr><w:rFonts w:ascii="Times New Roman"/);
assert.match(documentXml, /<w:t>á<\/w:t>/);
assert.equal(result.zip.file('word/header1.xml').asText(), '<w:hdr><w:t>á</w:t></w:hdr>');
assert.match(commentsXml, /<w:t>Vô<\/w:t>/);
assert.equal(result.zip.file('word/footnotes.xml').asText(), '<w:footnotes><w:delText>á</w:delText></w:footnotes>');
assert.equal(result.zip.file('word/theme/theme1.xml').asText(), '<a:theme><a:t>aù</a:t></a:theme>');

console.log('[SUCCESS] Per-fragment Unicode normalization covers DOCX story parts.');
