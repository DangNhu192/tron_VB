import fs from 'fs';
import { extractTableDataFromDocx } from '../js/core/docx-xml.js';

// We can load PizZip
const pizzipCode = fs.readFileSync('libs/pizzip.min.js', 'utf8');
const xmldomCode = fs.readFileSync('libs/xmldom.min.js', 'utf8');

const ctx = {
  window: {},
  DOMParser: null
};
const runInContext = new Function('window', pizzipCode + '; return window.PizZip;');
const PizZip = runInContext(ctx.window);

const runXmlDom = new Function('window', xmldomCode + '; return window.DOMParser;');
global.DOMParser = runXmlDom(ctx.window);
global.window = { PizZip, DOMParser: global.DOMParser };

function createSampleDocx(headers, sampleRow) {
  const zip = new PizZip();

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

  // Header row
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
          <w:t>${h}</w:t>
        </w:r>
      </w:p>
    </w:tc>`;
  }
  tableXml += `</w:tr>`;

  // Sample data row
  tableXml += `<w:tr>`;
  for (const v of sampleRow) {
    tableXml += `<w:tc>
      <w:p>
        <w:pPr><w:jc w:val="left"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr>
          <w:t>${v}</w:t>
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
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="200"/></w:pPr>
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

  return zip.generate({ type: 'nodebuffer' });
}

const headers = ['STT', 'Check DL', 'HO_TEN', 'SO_VB', 'NGAY_THANG'];
const sample = ['1', 'TRUE', 'Nguyễn Văn A', '123/UBND', '25/09/2026'];

const buf = createSampleDocx(headers, sample);
console.log('Docx generated, size:', buf.length);

const parsed = extractTableDataFromDocx(buf);
console.log('Parsed table rows:', parsed.length);
console.log('Parsed row 0:', parsed[0]);

if (parsed.length === 1 && parsed[0]['HO_TEN'] === 'Nguyễn Văn A' && parsed[0]['Check DL'] === 'TRUE') {
  console.log('[SUCCESS] Generated Docx is 100% compatible with extractTableDataFromDocx!');
} else {
  console.error('[FAIL] Parsing failed');
  process.exit(1);
}
