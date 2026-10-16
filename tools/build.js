#!/usr/bin/env node
// Build the single-file app from the ES modules in src/modules (order: src/modules/manifest.json) and src/main.js.
// There is no bundler dependency: every top-level name is unique across modules, so the bundle is the modules laid
// end to end with the import/export lines removed, wrapped in one strict-mode function. `src/main.js` goes last and
// runs the start-up. Usage: node tools/build.js [out] [--web]   (default dist/wodblok.html; --web builds dist/web/ for hosting)
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), WEB = args.includes('--web');      // --web: the hosted / installable web app in dist/web/ (index.html, manifest, service worker, icons)
const out = path.resolve(args.find(a => !a.startsWith('--')) || path.join(ROOT, 'dist', WEB ? path.join('web', 'index.html') : 'wodblok.html'));
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
for (const sub of ['data', 'platform', 'format', 'commands']) {                    // shared layers first, in this order
  const d = path.join(ROOT, 'src', sub);
  for (const f of fs.readdirSync(d).filter(f => f.endsWith('.js')).sort()) parts.push(strip(sub + '/' + f, fs.readFileSync(path.join(d, f), 'utf8')));
}
parts.push(...manifest.map(f => strip(f, fs.readFileSync(path.join(dir, f), 'utf8'))));
parts.push(strip('main.js', fs.readFileSync(path.join(ROOT, 'src', 'main.js'), 'utf8')));
// The version lives in package.json as 0.MINOR.PATCH while the app is pre-1.0 (the minor number is the release number: 0.108 is what was
// called v108; it became 1.0.0 when Phase 6 was done). The build shows it as "0.108" (and "0.108.1" for a patch) in WB_VER, the badge and
// the page <title>; nothing else needs editing for a release. Versions from before the change (108.0.0 and earlier) still show as 108.
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const VM = /^(\d+)\.(\d+)\.(\d+)$/.exec(PKG);
if (!VM) throw new Error('package.json version must look like 0.108.0');
const VER = +VM[1] >= 100 ? VM[1] : VM[1] + '.' + VM[2] + (+VM[3] ? '.' + VM[3] : '');
let stamped = 0;
for (let i = 0; i < parts.length; i++) parts[i] = parts[i].replace(/^const WB_VER='[^']*';/m, () => { stamped++; return "const WB_VER='" + VER + "';"; });
if (stamped !== 1) throw new Error('expected exactly one "const WB_VER=" line, found ' + stamped);
// When the build was made: WB_BUILT from the environment, else the date of the commit being built (the same commit always gives the same
// stamp), else now if there are uncommitted changes. The page shows it, subtly, in the bottom bar.
const { execSync } = require('child_process');
const git = c => { try { return execSync(c, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch (e) { return ''; } };
const iso = t => { const d = new Date(t); return isNaN(d) ? '' : d.toISOString().replace(/\.\d+Z$/, 'Z'); };
const dirty = git('git status --porcelain -- src package.json tools');
const BUILT = process.env.WB_BUILT || (dirty ? '' : iso(git('git log -1 --format=%cI'))) || iso(Date.now());
let stampedB = 0;
for (let i = 0; i < parts.length; i++) parts[i] = parts[i].replace(/^const WB_BUILT='';/m, () => { stampedB++; return "const WB_BUILT='" + BUILT + "';"; });
if (stampedB !== 1) throw new Error('expected exactly one "const WB_BUILT=" line, found ' + stampedB);
const body = "(function(){'use strict';\n" + parts.join('') + '})();';
const shell = fs.readFileSync(path.join(ROOT, 'src', 'shell.html'), 'utf8');
const marker = '/*@@MAIN@@*/';
if (shell.split(marker).length !== 2) throw new Error('shell.html must contain exactly one ' + marker);
fs.mkdirSync(path.dirname(out), { recursive: true });
const WEBHEAD = WEB ? '<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="theme-color" content="#1b1a18"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="WODBLOK">' : '';
fs.writeFileSync(out, shell.replace('<!--@@WEBHEAD@@-->', () => WEBHEAD).replace('/*@@FONTS@@*/', () => require('./fonts')()).replace(marker, () => body).replace(/<title>Wodblok v[\d.]+<\/title>/, '<title>Wodblok v' + VER + '</title>'));
console.log('version', VER, 'built', BUILT);
console.log('built', path.relative(ROOT, out), fs.statSync(out).size, 'bytes from', manifest.length, 'modules + main.js');
if (WEB) {
  // the rest of the web app, next to index.html. The service worker's cache name changes with every build, so a new build is a new version.
  const wd = path.dirname(out), sd = path.join(ROOT, 'src', 'web');
  for (const f of fs.readdirSync(sd)) {
    if (f === 'sw.js') fs.writeFileSync(path.join(wd, f), fs.readFileSync(path.join(sd, f), 'utf8').replace('@@CACHE@@', 'wodblok-' + VER + '-' + BUILT));
    else fs.copyFileSync(path.join(sd, f), path.join(wd, f));
  }
  console.log('web app files in', path.relative(ROOT, wd));
} else if (!args.length) {
  // Hosting (Cloudflare Pages etc.) serves index.html from the output folder, so a default build also leaves an identical
  // copy next to the single file. wodblok.html stays the file tests and GitHub Releases use.
  const idx = path.join(path.dirname(out), 'index.html');
  fs.copyFileSync(out, idx);
  console.log('copied', path.relative(ROOT, idx));
}
