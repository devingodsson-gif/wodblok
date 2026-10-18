#!/usr/bin/env node
// Rule: UI follows docs/developing-wodblok.md Part 9 (the UI standard). Fails on a font size, radius or font family outside the standard scales,
// in the page CSS (src/shell.html) and in styles written by modules.
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
// Exemptions (style guide 3.2 and 4.3): wordmark 15 and splash 20 display text; "+" glyphs 18 and 28.
const FS_OK = new Set(['11px', '12.5px', '14px', 'inherit', '15px', '18px', '20px', '28px']);
// 1-3px radii are slider and scrollbar tracks (style guide 4.2).
const R_OK = new Set(['0', '1px', '2px', '3px', '4px', '8px', '12px', '50%', '999px', 'inherit']);
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = [path.join(SRC, 'shell.html'), ...walk(path.join(SRC, 'modules')).filter(f => f.endsWith('.js'))];
let bad = 0;
const report = (f, i, msg) => { console.error(`${path.relative(SRC, f)}:${i + 1}: ${msg}`); bad++; };
for (const f of files) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/@font-face/.test(line)) return;
    for (const m of line.matchAll(/(?<![\w-])font-size\s*:\s*([^;}"']+)/g)) { const v = m[1].trim(); if (!v.startsWith('var(') && !FS_OK.has(v)) report(f, i, `font-size ${v}`); }
    for (const m of line.matchAll(/(?<![\w-])border-radius\s*:\s*([^;}"']+)/g)) { for (const v of m[1].trim().split(/\s+/)) if (!v.startsWith('var(') && !R_OK.has(v)) report(f, i, `border-radius ${v}`); }
    for (const m of line.matchAll(/font-family\s*:\s*([^;}"]+)/g)) if (/serif|fraunces/i.test(m[1].replace(/sans-serif/gi, ''))) report(f, i, `font-family ${m[1].trim()}`);
  });
}
if (bad) { console.error(bad + ' style violations'); process.exit(1); }
console.log('style check OK');
