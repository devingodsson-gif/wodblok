#!/usr/bin/env node
// Phase 1b codemod, step 3: functions that another piece replaces (monkey-patching, e.g. draw = function(){_draw();nums()})
// cannot stay plain function names once pieces are modules, because a module may not assign to an import.
// They move to one registry, WBH:   draw()  ->  WBH.draw()    draw = function...  ->  WBH.draw = function...
// and the declaring piece registers the original at its top:  WBH.draw = draw;
// Usage: node tools/codemod-hooks.js [--apply]
const fs = require('fs'), path = require('path'), espree = require('espree'), eslintScope = require('eslint-scope');
const DIR = path.join(__dirname, '..', 'src', 'legacy'), APPLY = process.argv.includes('--apply'), REG = 'WBH';
const files = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
const texts = files.map(f => fs.readFileSync(path.join(DIR, f), 'utf8'));
const offsets = []; let pos = 0; for (const t of texts) { offsets.push(pos); pos += t.length; }
const src = texts.join('');
const pieceOf = at => { let i = 0; while (i + 1 < offsets.length && offsets[i + 1] <= at) i++; return i; };
const ast = espree.parse(src, { ecmaVersion: 'latest', sourceType: 'script', range: true });
const sm = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script' });
if (sm.scopes.some(s => s.set.has(REG) && s !== sm.globalScope)) { console.error(REG + ' already bound'); process.exit(2); }
const parentOf = new Map();
(function walk(n, p) { parentOf.set(n, p); for (const k in n) { if (k === 'loc' || k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && c.type && walk(c, n)); else if (v && typeof v.type === 'string') walk(v, n); } })(ast, null);
const hooks = [];
for (const v of sm.globalScope.variables) {
  if (!v.defs.length || v.defs[0].type !== 'FunctionName') continue;
  const home = pieceOf(v.defs[0].name.range[0]);
  if (v.references.some(r => r.isWrite() && !r.init && pieceOf(r.identifier.range[0]) !== home)) hooks.push(v);
}
const edits = [], regByPiece = new Map();
for (const v of hooks) {
  const home = pieceOf(v.defs[0].name.range[0]);
  (regByPiece.get(home) || regByPiece.set(home, []).get(home)).push(v.name);
  for (const r of v.references) {
    const id = r.identifier, par = parentOf.get(id);
    if (par.type === 'Property' && par.shorthand) { console.error('shorthand use of ' + v.name); process.exit(2); }
    edits.push({ at: id.range[0], end: id.range[1], text: `${REG}.${v.name}` });
  }
}
console.log(`${hooks.length} hooks: ${hooks.map(v => v.name).join(', ')}; ${edits.length} reference edits`);
if (!APPLY) process.exit(0);
edits.sort((a, b) => b.at - a.at);
const out = texts.slice();
for (const e of edits) { const i = pieceOf(e.at); out[i] = out[i].slice(0, e.at - offsets[i]) + e.text + out[i].slice(e.end - offsets[i]); }
for (const [i, names] of regByPiece) out[i] = names.map(n => `${REG}.${n}=${n};`).join('') + '\n' + out[i];
out[0] = `const ${REG}={};\n` + out[0];
files.forEach((f, i) => fs.writeFileSync(path.join(DIR, f), out[i]));
console.log('written');
