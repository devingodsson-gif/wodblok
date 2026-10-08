#!/usr/bin/env node
// Rule: platform access only through src/platform/. Fails if any other source file touches storage, the clipboard,
// the artifact runtime, the file pickers, or alert/confirm/prompt directly.
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const banned = [/\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /navigator\.clipboard/, /window\.claude\b/, /\bclaude\.use\b/, /showSaveFilePicker|showOpenFilePicker/, /(^|[^.\w$])(alert|confirm|prompt)\s*\(/];
let bad = 0;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk(SRC)) {
  const rel = path.relative(SRC, f);
  if (!f.endsWith('.js') || rel.startsWith('platform' + path.sep)) continue;
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => { for (const re of banned) if (re.test(line)) { console.error(`${rel}:${i + 1}: ${re} outside src/platform/`); bad++; } });
}
if (bad) { console.error(bad + ' platform violations'); process.exit(1); }
console.log('platform check OK');
