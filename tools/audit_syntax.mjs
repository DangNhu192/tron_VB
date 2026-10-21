import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function checkJsFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'libs' && f !== '.agents' && f !== '.vscode' && f !== 'tools' && f !== 'node_modules') {
        checkJsFiles(full);
      }
    } else if (f.endsWith('.js') || f.endsWith('.mjs')) {
      try {
        execSync(`node -c "${full}"`, { stdio: 'pipe' });
        console.log(`[PASS] ${full}`);
      } catch (err) {
        console.error(`[FAIL] ${full}:\n`, err.stderr.toString());
      }
    }
  }
}

function checkLibs() {
  const files = fs.readdirSync('libs');
  for (const f of files) {
    if (f.endsWith('.js')) {
      const full = path.join('libs', f);
      try {
        execSync(`node -c "${full}"`, { stdio: 'pipe' });
        console.log(`[PASS lib] ${f}`);
      } catch (err) {
        console.error(`[FAIL lib] ${f}:\n`, err.stderr.toString());
      }
    }
  }
}

console.log('=== RUNNING JS SYNTAX AUDIT ON ALL ACTIVE PROJECT FILES ===');
checkJsFiles('.');
console.log('=== RUNNING LIBS AUDIT ===');
checkLibs();
console.log('=== FINISHED ALL AUDITS ===');
