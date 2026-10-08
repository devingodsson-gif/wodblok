#!/usr/bin/env node
// Build the single-file app from the ES modules in src/modules (order: src/modules/manifest.json) and src/main.js.
// There is no bundler dependency: every top-level name is unique across modules, so the bundle is the modules laid
// end to end with the import/export lines removed, wrapped in one strict-mode function. `src/main.js` goes last and
// runs the start-up. Usage: node tools/build.js [out]   (default dist/wodblok.html)
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || path.join(ROOT, 'dist', 'wodblok.html'));
const dir = path.join(ROOT, 'src', 'modules');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const IMPORT = /^import \{[A-Za-z0-9_$,]*\} from '\.\/[^']+';\n/gm;
const EXPORT = /^export \{[A-Za-z0-9_$,]*\};\n/gm;
const strip = (name, t) => {
  if (!t.endsWith('\n')) throw new Error(name + ' must end with a newline');
  const r = t.replace(IMPORT, '').replace(EXPORT, '');
  if (/^(import|export)\b/m.test(r)) throw new Error(name + ' has an import/export the bundler does not understand');
  return r;
};
const parts = manifest.map(f => strip(f, fs.readFileSync(path.join(dir, f), 'utf8')));
parts.push(strip('main.js', fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8')));
const body = "(function(){'use strict';\n" + parts.join('') + '})();';
const shell = fs.readFileSync(path.join(ROOT, 'src', 'shell.html'), 'utf8');
const marker = '/*@@MAIN@@*/';
if (shell.split(marker).length !== 2) throw new Error('shell.html must contain exactly one ' + marker);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, shell.replace(marker, () => body));
console.log('built', path.relative(ROOT, out), fs.statSync(out).size, 'bytes from', manifest.length, 'modules + main.js');
