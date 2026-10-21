'use strict';

const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const STRICT = 'http://purl.oclc.org/ooxml/spreadsheetml/main';

// Keep OOXML strings intact, independent of SheetJS' runtime codepage decoder.
export function readExcelWorkbook(buffer, XLSXLib) {
  const workbook = XLSXLib.read(buffer, { type: 'array' });
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) return workbook;

  const Zip = globalThis.PizZip || globalThis.window?.PizZip;
  if (!Zip) throw new Error('Thiếu PizZip để đọc nguyên văn dữ liệu Excel.');
  const zip = new Zip(buffer);
  if (!zip.file('xl/workbook.xml')) return workbook;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const parse = path => {
    const entry = zip.file(path);
    if (!entry) throw new Error(`Thiếu thành phần Excel: ${path}`);
    const xml = new DOMParser().parseFromString(decoder.decode(entry.asUint8Array()), 'application/xml');
    if (xml.getElementsByTagName('parsererror').length) {
      throw new Error(`XML Excel không hợp lệ: ${path}`);
    }
    return xml;
  };
  const elements = (node, name) => {
    const nodes = node.getElementsByTagNameNS(MAIN, name);
    return Array.from(nodes.length ? nodes : node.getElementsByTagNameNS(STRICT, name));
  };
  const unescape = value => value.replace(/_x([0-9a-f]{4})_/gi,
    (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const textOf = node => unescape(elements(node, 't').filter(t => {
    for (let p = t.parentNode; p && p !== node; p = p.parentNode) {
      if (p.localName === 'rPh') return false;
    }
    return true;
  }).map(t => t.textContent).join(''));

  const rels = Array.from(parse('xl/_rels/workbook.xml.rels').getElementsByTagName('Relationship'));
  const resolve = target => new URL(target, 'https://xlsx.invalid/xl/workbook.xml').pathname.slice(1);
  const sharedRel = rels.find(r => /\/sharedStrings$/.test(r.getAttribute('Type')));
  const sharedPath = sharedRel ? resolve(sharedRel.getAttribute('Target')) : 'xl/sharedStrings.xml';
  const shared = zip.file(sharedPath) ? elements(parse(sharedPath), 'si').map(textOf) : [];
  const sheets = elements(parse('xl/workbook.xml'), 'sheet');
  sheets.forEach((sheet, index) => {
    const rel = rels.find(r => r.getAttribute('Id') === sheet.getAttribute('r:id'));
    if (!rel || rel.getAttribute('TargetMode') === 'External') {
      throw new Error('Không tìm thấy dữ liệu trang tính Excel.');
    }
    const worksheet = workbook.Sheets[workbook.SheetNames[index]];
    if (!worksheet) return;
    for (const cell of elements(parse(resolve(rel.getAttribute('Target'))), 'c')) {
      const type = cell.getAttribute('t');
      if (!['s', 'inlineStr', 'str'].includes(type)) continue;
      const address = cell.getAttribute('r');
      const value = elements(cell, 'v')[0]?.textContent || '';
      let text;
      if (type === 's') {
        if (!/^\d+$/.test(value) || Number(value) >= shared.length) {
          throw new Error(`Chỉ mục chuỗi Excel không hợp lệ: ${address}`);
        }
        text = shared[Number(value)];
      } else text = type === 'inlineStr' ? textOf(cell) : unescape(value);
      const target = worksheet[address] || (worksheet[address] = {});
      target.t = 's';
      target.v = text;
      delete target.w;
      delete target.h;
      delete target.r;
    }
  });
  return workbook;
}
