#!/usr/bin/env node
// Build the single-file app: src/shell.html with the pieces from src/legacy/manifest.json joined in.
// Usage: node tools/build.js [out]   (default dist/wodblok.html)
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(ROOT, 'dist', 'wodblok.html'));
const dir = path.join(ROOT, 'src', 'legacy');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const body = manifest.map(f => {
  const t = fs.readFileSync(path.join(dir, f), 'utf8');
  if (!t.endsWith('\n')) throw new Error(f + ' must end with a newline');
  return t.slice(0, -1);
}).join('\n');
const shell = fs.readFileSync(path.join(ROOT, 'src', 'shell.html'), 'utf8');
const marker = '/*@@MAIN@@*/';
if (shell.split(marker).length !== 2) throw new Error('shell.html must contain exactly one ' + marker);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, shell.replace(marker, () => body));
console.log('built', path.relative(ROOT, out), fs.statSync(out).size, 'bytes from', manifest.length, 'pieces');
