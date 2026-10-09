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
const IMPORT = /^import \{[A-Za-z0-9_$,]*\} from '\.{1,2}\/[^']+';\n/gm;
const EXPORT = /^export \{[A-Za-z0-9_$,]*\};\n/gm;
const strip = (name, t) => {
  if (!t.endsWith('\n')) throw new Error(name + ' must end with a newline');
  const r = t.replace(IMPORT, '').replace(EXPORT, '');
  if (/^(import|export)\b/m.test(r)) throw new Error(name + ' has an import/export the bundler does not understand');
  return r;
};
const parts = [];
// Vendored libraries keep their own scope: their short top-level names must not meet the app's. Each file becomes
// `const {exported names} = (() => { ...library...; return {names}; })();`
for (const f of fs.readdirSync(path.join(ROOT, 'src', 'vendor')).filter(f => f.endsWith('.js')).sort()) {
  const t = fs.readFileSync(path.join(ROOT, 'src', 'vendor', f), 'utf8'), m = /^export \{([A-Za-z0-9_$,]*)\};\n/m.exec(t);
  if (!m) throw new Error('vendor/' + f + ' needs a final export line');
  parts.push('const {' + m[1] + '}=(()=>{' + t.replace(m[0], '') + '\nreturn {' + m[1] + '};})();\n');
}
for (const sub of ['platform', 'format', 'commands']) {                    // shared layers first, in this order
  const d = path.join(ROOT, 'src', sub);
  for (const f of fs.readdirSync(d).filter(f => f.endsWith('.js')).sort()) parts.push(strip(sub + '/' + f, fs.readFileSync(path.join(d, f), 'utf8')));
}
parts.push(...manifest.map(f => strip(f, fs.readFileSync(path.join(dir, f), 'utf8'))));
parts.push(strip('main.js', fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8')));
// The version lives in package.json (major number = the release number: 101 is the first repo build). The build writes it
// into WB_VER and the page <title>; nothing else needs editing for a release.
const VER = parseInt(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version, 10);
if (!(VER >= 100)) throw new Error('package.json version must start with the release number');
let stamped = 0;
for (let i = 0; i < parts.length; i++) parts[i] = parts[i].replace(/^const WB_VER=\d+;/m, () => { stamped++; return 'const WB_VER=' + VER + ';'; });
if (stamped !== 1) throw new Error('expected exactly one "const WB_VER=" line, found ' + stamped);
const body = "(function(){'use strict';\n" + parts.join('') + '})();';
const shell = fs.readFileSync(path.join(ROOT, 'src', 'shell.html'), 'utf8');
const marker = '/*@@MAIN@@*/';
if (shell.split(marker).length !== 2) throw new Error('shell.html must contain exactly one ' + marker);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, shell.replace(marker, () => body).replace(/<title>Wodblok v\d+<\/title>/, '<title>Wodblok v' + VER + '</title>'));
console.log('version', VER);
console.log('built', path.relative(ROOT, out), fs.statSync(out).size, 'bytes from', manifest.length, 'modules + main.js');
