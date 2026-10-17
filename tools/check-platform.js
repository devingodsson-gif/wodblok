#!/usr/bin/env node
// Rule: platform access only through src/platform/. Fails if any other source file touches storage, the clipboard,
// the artifact runtime, the file pickers, the network (fetch and friends: only platform/account.js may use it) or alert/confirm/prompt directly.
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const banned = [/\blocalStorage\b/, /\bsessionStorage\b/, /\bindexedDB\b/, /navigator\.clipboard/, /window\.claude\b/, /\bclaude\.use\b/, /showSaveFilePicker|showOpenFilePicker/, /navigator\.serviceWorker|navigator\.storage/, /(^|[^.\w$])(alert|confirm|prompt)\s*\(/, /(^|[^.\w$])fetch\s*\(|XMLHttpRequest|sendBeacon|new WebSocket|EventSource/];
let bad = 0;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk(SRC)) {
  const rel = path.relative(SRC, f);
  if (!f.endsWith('.js') || rel.startsWith('platform' + path.sep) || rel.startsWith('web' + path.sep)) continue;   // web/ holds the service worker, which has its own scope
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => { for (const re of banned) if (re.test(line)) { console.error(`${rel}:${i + 1}: ${re} outside src/platform/`); bad++; } });
}
if (bad) { console.error(bad + ' platform violations'); process.exit(1); }
console.log('platform check OK');
