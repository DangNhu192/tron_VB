const fs = require('fs');
const vm = require('vm');

console.log("=== KIEM TRA TOAN DIEN WORKER.JS (CA 3 CHE DO XUAT) ===");

function createWorkerContext() {
  const messages = [];
  let onDoneResolve = null;
  const donePromise = new Promise(resolve => { onDoneResolve = resolve; });

  const context = {
    Blob: Blob,
    self: {
      Blob: Blob,
      postMessage: function(msg) {
        messages.push(msg);
        console.log('  -> Worker message:', msg.type, msg.filename || (msg.count ? msg.count + ' files' : msg.message || ''));
        if (msg.type === 'done' || msg.type === 'done_merged' || msg.type === 'done_single' || msg.type === 'error') {
          if (onDoneResolve) onDoneResolve(msg);
        }
      },
      addEventListener: function() {},
      setTimeout: setTimeout,
      clearTimeout: clearTimeout
    },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    console: console
  };
  context.self.self = context.self;
  context.importScripts = function(...files) {
    for (const f of files) {
      const code = fs.readFileSync(f, 'utf8');
      vm.runInContext(code, context, { filename: f });
    }
  };
  context.self.importScripts = context.importScripts;
  vm.createContext(context);

  const workerCode = fs.readFileSync('worker.js', 'utf8');
  vm.runInContext(workerCode, context, { filename: 'worker.js' });
  return { context, messages, donePromise };
}

const PizZip = new Function('window', fs.readFileSync('libs/pizzip.min.js', 'utf8') + ';return window.PizZip;')({});
const fixture = new PizZip();
fixture.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
fixture.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
fixture.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{{ten_bien}}</w:t></w:r></w:p><w:sectPr/></w:body></w:document>');
const tplBuffer = fixture.generate({ type: 'nodebuffer' });
const testData = [
  { ten_bien: 'Cong ty Co phan Duoc pham A' },
  { ten_bien: 'Cong ty Co phan Duoc pham B' },
  { ten_bien: 'Cong ty Co phan Duoc pham C' }
];

async function runAllTests() {
  // TEST 1: Xuat hang loat nhieu file (.ZIP) khi nguoi dung chon zip
  console.log("\n[TEST 1] Che do Xuat file nen (.ZIP)...");
  const w1 = createWorkerContext();
  w1.context.self.onmessage({
    data: {
      editedData: testData,
      processedDocBuffer: tplBuffer,
      nameFormat: '[ten_bien]',
      fieldTransformers: {},
      singleFileIndex: null,
      actualRowIndex: null,
      prefixIndex: true,
      removeTones: true,
      exportFormat: 'docx',
      batchExportMode: 'zip'
    }
  });
  const res1 = await w1.donePromise;
  if (res1.type === 'done' && res1.blob && res1.count === 3) {
    console.log("=> PASS TEST 1: Xuat thanh cong goi ZIP 3 file!");
  } else {
    console.error("=> FAIL TEST 1:", res1);
    process.exit(1);
  }

  // TEST 2: Xuat hang loat gop chung 1 file (.DOCX) - MAC DINH
  console.log("\n[TEST 2] Che do Gop chung 1 file duy nhat (.DOCX) - Mac dinh...");
  const w2 = createWorkerContext();
  w2.context.self.onmessage({
    data: {
      editedData: testData,
      processedDocBuffer: tplBuffer,
      nameFormat: '[ten_bien]',
      fieldTransformers: {},
      singleFileIndex: null,
      actualRowIndex: null,
      prefixIndex: true,
      removeTones: true,
      exportFormat: 'docx',
      batchExportMode: 'merged'
    }
  });
  const res2 = await w2.donePromise;
  if (res2.type === 'done_merged' && res2.blob && res2.count === 3 && res2.filename.endsWith('.docx')) {
    console.log("=> PASS TEST 2: Gop thanh cong 3 van ban vao 1 file Word duy nhat:", res2.filename);
  } else {
    console.error("=> FAIL TEST 2:", res2);
    process.exit(1);
  }

  // TEST 3: Xuat tung file rieng le (.DOCX truc tiep khong zip)
  console.log("\n[TEST 3] Che do Tai tung file rieng le (.DOCX khong qua ZIP)...");
  const w3 = createWorkerContext();
  let individualFilesCount = 0;
  let individualDoneResolve = null;
  const individualDonePromise = new Promise(r => { individualDoneResolve = r; });

  const originalPost = w3.context.self.postMessage;
  w3.context.self.postMessage = function(msg) {
    originalPost(msg);
    if (msg.type === 'file_ready' && msg.filename && msg.filename.endsWith('.docx')) {
      individualFilesCount++;
    }
    if (msg.type === 'done_individual') {
      individualDoneResolve(msg);
    }
  };

  w3.context.self.onmessage({
    data: {
      editedData: testData,
      processedDocBuffer: tplBuffer,
      nameFormat: '[ten_bien]',
      fieldTransformers: {},
      singleFileIndex: null,
      actualRowIndex: null,
      prefixIndex: true,
      removeTones: true,
      exportFormat: 'docx',
      batchExportMode: 'individual'
    }
  });
  const res3 = await individualDonePromise;
  if (res3.type === 'done_individual' && individualFilesCount === 3) {
    console.log("=> PASS TEST 3: Tai rieng le thanh cong 3 file .docx truc tiep!");
  } else {
    console.error("=> FAIL TEST 3:", res3, "files count:", individualFilesCount);
    process.exit(1);
  }

  // TEST 4: Xuat 1 file don le
  console.log("\n[TEST 4] Che do Xuat 1 file don le...");
  const w4 = createWorkerContext();
  w4.context.self.onmessage({
    data: {
      editedData: testData,
      processedDocBuffer: tplBuffer,
      nameFormat: '[ten_bien]',
      fieldTransformers: {},
      singleFileIndex: 1, // Row 2
      actualRowIndex: 2,
      prefixIndex: true,
      removeTones: true,
      exportFormat: 'docx'
    }
  });
  const res4 = await w4.donePromise;
  if (res4.type === 'done_single' && res4.blob && res4.filename && res4.filename.endsWith('.docx')) {
    console.log("=> PASS TEST 4: Xuat thanh cong 1 file don .docx:", res4.filename);
  } else {
    console.error("=> FAIL TEST 4:", res4);
    process.exit(1);
  }

  console.log("\n=======================================================");
  console.log("=== TAT CA 4 CHE DO TEST DEU DAT KET QUA HOAN HAO! ===");
  console.log("=======================================================");
}

runAllTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
