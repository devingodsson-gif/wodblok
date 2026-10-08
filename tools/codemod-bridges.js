#!/usr/bin/env node
// Phase 1b codemod, step 2: replace the window.wbX bridges with one explicit registry object WBX.
//   window.wbCap = f      ->  WBX.wbCap = f
//   window.wbGrade && wbGrade.get()  ->  WBX.wbGrade && WBX.wbGrade.get()
// A name counts as a bridge when some piece assigns it as window.wbX. Bare references to a bridge name that no
// local binding resolves (the implicit global) are rewritten too. Usage: node tools/codemod-bridges.js [--apply]
const fs = require('fs'), path = require('path'), espree = require('espree'), eslintScope = require('eslint-scope');
const DIR = path.join(__dirname, '..', 'src', 'legacy'), APPLY = process.argv.includes('--apply'), REG = 'WBX';
const files = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
const texts = files.map(f => fs.readFileSync(path.join(DIR, f), 'utf8'));
const offsets = []; let pos = 0; for (const t of texts) { offsets.push(pos); pos += t.length; }
const src = texts.join('');
const pieceOf = at => { let i = 0; while (i + 1 < offsets.length && offsets[i + 1] <= at) i++; return i; };
const ast = espree.parse(src, { ecmaVersion: 'latest', sourceType: 'script', range: true, loc: true });
const sm = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script' });
if (sm.scopes.some(s => s.set.has(REG))) { console.error(REG + ' already bound'); process.exit(2); }
const parentOf = new Map();
(function walk(n, p) { parentOf.set(n, p); for (const k in n) { if (k === 'loc' || k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && c.type && walk(c, n)); else if (v && typeof v.type === 'string') walk(v, n); } })(ast, null);
const isWin = n => n.type === 'MemberExpression' && !n.computed && n.object.type === 'Identifier' && n.object.name === 'window' && n.property.name.startsWith('wb');
// bridge names = assigned as window.wbX
const names = new Set();
(function find(n) { if (n.type === 'AssignmentExpression' && isWin(n.left)) names.add(n.left.property.name);
  for (const k in n) { if (k === 'loc' || k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && c.type && find(c)); else if (v && typeof v.type === 'string') find(v); } })(ast);
const edits = [];
// window.wbX member accesses
for (const [n] of parentOf) if (isWin(n) && names.has(n.property.name)) edits.push({ at: n.range[0], end: n.object.range[1], text: REG });
const loose = [];
for (const r of sm.globalScope.through) {
  const id = r.identifier; if (!names.has(id.name)) continue;
  const par = parentOf.get(id);
  if (par.type === 'MemberExpression' && par.object === id && par.parent) { /* fine: wbGrade.x */ }
  if (par.type === 'Property' && par.shorthand) { loose.push(`${id.name}: shorthand at line ${id.loc.start.line}`); continue; }
  edits.push({ at: id.range[0], end: id.range[1], text: `${REG}.${id.name}` });
}
// a bridge name that is ALSO declared at top level would be ambiguous
// a name that is also declared at top level (wbBA) keeps its declaration; only the window.wbBA accesses move
if (loose.length) { console.error('NEEDS A HUMAN DECISION:\n  ' + loose.join('\n  ')); process.exit(2); }
console.log(`${names.size} bridges: ${[...names].sort().join(', ')}`);
console.log(`${edits.length} edits in ${new Set(edits.map(e => pieceOf(e.at))).size} pieces`);
if (!APPLY) process.exit(0);
edits.sort((a, b) => b.at - a.at);
const out = texts.slice();
for (const e of edits) { const i = pieceOf(e.at); out[i] = out[i].slice(0, e.at - offsets[i]) + e.text + out[i].slice(e.end - offsets[i]); }
if (!out[0].includes(`const ${REG}={};`)) out[0] = `const ${REG}={};\n` + out[0];
files.forEach((f, i) => fs.writeFileSync(path.join(DIR, f), out[i]));
console.log('written');
