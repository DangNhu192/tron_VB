import fs from 'fs';
import path from 'path';

function getIdsFromHtml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const ids = new Set();
  const regex = /id=["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    ids.add(match[1]);
  }
  return ids;
}

function getGetElementByIdCalls(dir) {
  const calls = new Map();
  function scan(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        scan(fullPath);
      } else if (file.endsWith('.js')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const regex = /document\.getElementById\(["']([^"']+)["']\)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const id = match[1];
          if (!calls.has(id)) calls.set(id, []);
          calls.get(id).push(fullPath);
        }
      }
    }
  }
  scan(dir);
  return calls;
}

const appHtmlIds = getIdsFromHtml('app.html');
const sidepanelHtmlIds = getIdsFromHtml('sidepanel.html');
const jsCalls = getGetElementByIdCalls('js');

console.log('Total IDs in app.html:', appHtmlIds.size);
console.log('Total IDs in sidepanel.html:', sidepanelHtmlIds.size);
console.log('Total unique IDs queried in js/:', jsCalls.size);

let missingApp = 0;
for (const [id, files] of jsCalls.entries()) {
  if (!appHtmlIds.has(id)) {
    console.log('[Missing in app.html]', id, '-> used in:', files.map(f => path.basename(f)).join(', '));
    missingApp++;
  }
}

let missingSidepanel = 0;
for (const [id, files] of jsCalls.entries()) {
  if (!sidepanelHtmlIds.has(id)) {
    console.log('[Missing in sidepanel.html]', id, '-> used in:', files.map(f => path.basename(f)).join(', '));
    missingSidepanel++;
  }
}

if (missingApp === 0 && missingSidepanel === 0) {
  console.log('100% IDs MATCHED PERFECTLY ACROSS BOTH HTML FILES!');
}
