#!/usr/bin/env node
// Phase 1b codemod, step 1: move every top-level let/var that is reassigned from a different piece than the one
// that declares it onto one shared object `S`.   cur = 3   becomes   S.cur = 3
// Why: when the pieces become ES modules (1c), a module cannot assign to another module's variable.
//
// Usage: node tools/codemod-state.js [--apply] [--only a,b,c] [--list]
//   (no flag)  dry run: print the plan and anything that needs a human decision
//   --apply    rewrite src/legacy/*.js in place
//   --only     restrict to these names (used to do the move in batches)
//   --list     print only the candidate names
//
// It uses scope analysis, so a local variable that happens to share a name is never touched, and it refuses to
// continue (exit 2) when it meets a shape it cannot rewrite safely.
const fs = require('fs');
const path = require('path');
const espree = require('espree');
const eslintScope = require('eslint-scope');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'src', 'legacy');
const args = process.argv.slice(2);
const APPLY = args.includes('--apply'), LIST = args.includes('--list');
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const STATE = 'WBS';

const files = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
const texts = files.map(f => fs.readFileSync(path.join(DIR, f), 'utf8'));
// one source for parsing: pieces joined by one newline each (each piece ends with '\n' already, so join with '')
const offsets = []; let pos = 0;
for (const t of texts) { offsets.push(pos); pos += t.length; }
const src = texts.join('');
const pieceOf = at => { let i = 0; while (i + 1 < offsets.length && offsets[i + 1] <= at) i++; return i; };

const ast = espree.parse(src, { ecmaVersion: 'latest', sourceType: 'script', range: true, loc: true });
const sm = eslintScope.analyze(ast, { ecmaVersion: 2022, sourceType: 'script' });
const g = sm.globalScope;

// refuse a name that already exists as a binding anywhere (a local named S would shadow the state object)
for (const sc of sm.scopes) if (sc.set.has(STATE) && sc !== g) { console.error(`a binding named "${STATE}" already exists (${sc.type} scope); pick another state name`); process.exit(2); }

const parentOf = new Map();
(function walk(n, p) { parentOf.set(n, p); for (const k in n) { if (k === 'loc' || k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && c.type && walk(c, n)); else if (v && typeof v.type === 'string') walk(v, n); } })(ast, null);

const candidates = [];
for (const v of g.variables) {
  if (!v.defs.length) continue;
  const d = v.defs[0];
  if (d.type !== 'Variable' || (d.parent.kind !== 'let' && d.parent.kind !== 'var')) continue;
  const home = pieceOf(d.name.range[0]);
  const writes = v.references.filter(r => r.isWrite() && !r.init);
  if (writes.some(r => pieceOf(r.identifier.range[0]) !== home) || v.defs.some(df => pieceOf(df.name.range[0]) !== home)) candidates.push(v);
}
candidates.sort((a, b) => a.name.localeCompare(b.name));
if (LIST) { console.log(candidates.map(v => v.name).join(',')); process.exit(0); }
const targets = candidates.filter(v => !only || only.has(v.name));

const problems = [];
const edits = [];            // { at, end, text }  absolute positions in src
const note = (v, msg) => problems.push(`${v.name}: ${msg}`);

for (const v of targets) {
  // declarations
  for (const df of v.defs) {
    const declr = df.node, decl = df.parent;
    if (df.type !== 'Variable' || declr.id.type !== 'Identifier') { note(v, 'declared by a destructuring pattern'); continue; }
    if (parentOf.get(decl) !== ast) { note(v, `declaration at line ${decl.loc.start.line} is not at the top level of the script`); continue; }
  }
  // references
  for (const r of v.references) {
    const id = r.identifier, par = parentOf.get(id);
    if (v.defs.some(df => df.name === id)) continue;                       // handled with the declaration
    if (par.type === 'Property' && par.shorthand) {
      if (par.value.type === 'AssignmentPattern') { note(v, `shorthand with default at line ${id.loc.start.line}`); continue; }
      edits.push({ at: par.range[0], end: par.range[1], text: `${v.name}:${STATE}.${v.name}` });
    } else if (par.type === 'ExportSpecifier') { note(v, 'export'); }
    else edits.push({ at: id.range[0], end: id.range[1], text: `${STATE}.${v.name}` });
  }
}

// declarations: rewrite each affected top-level statement once, as a sequence of statements
const targetNames = new Set(targets.map(v => v.name));
const declStatements = new Set();
for (const v of targets) for (const df of v.defs) if (df.type === 'Variable' && parentOf.get(df.parent) === ast) declStatements.add(df.parent);
for (const decl of declStatements) {
  const parts = []; let run = [];
  const flush = () => { if (run.length) { parts.push(`${decl.kind} ${run.join(',')};`); run = []; } };
  for (const dr of decl.declarations) {
    if (dr.id.type === 'Identifier' && targetNames.has(dr.id.name)) {
      flush();
      // the initialiser text may itself contain references that are edited: take it from the edited source later
      parts.push({ init: dr.init ? [dr.init.range[0], dr.init.range[1]] : null, name: dr.id.name });
    } else run.push([dr.range[0], dr.range[1]]);
  }
  // build text with placeholders resolved after the other edits are applied
  edits.push({ at: decl.range[0], end: decl.range[1], decl: { kind: decl.kind, groups: (() => {
    const groups = []; let cur = [];
    for (const dr of decl.declarations) {
      if (dr.id.type === 'Identifier' && targetNames.has(dr.id.name)) { if (cur.length) { groups.push({ plain: cur }); cur = []; } groups.push({ name: dr.id.name, init: dr.init ? [dr.init.range[0], dr.init.range[1]] : null }); }
      else cur.push([dr.range[0], dr.range[1]]);
    }
    if (cur.length) groups.push({ plain: cur });
    return groups; })() } });
}

if (problems.length) { console.error('NEEDS A HUMAN DECISION:\n  ' + problems.join('\n  ')); process.exit(2); }

// apply: later positions first; nested edits (a reference inside a declaration's initialiser) are resolved by
// rendering each declaration from the already-edited text of its parts.
function render(from, to, list) {            // text of src[from,to) with the plain reference edits inside it applied
  const inner = list.filter(e => !e.decl && e.at >= from && e.end <= to).sort((a, b) => b.at - a.at);
  let t = src.slice(from, to), base = from;
  for (const e of inner) t = t.slice(0, e.at - base) + e.text + t.slice(e.end - base);
  return t;
}
const declEdits = edits.filter(e => e.decl);
const plain = edits.filter(e => !e.decl);
const finalEdits = [];
for (const e of declEdits) {
  const out = [];
  for (const gp of e.decl.groups) {
    if (gp.plain) out.push(`${e.decl.kind} ` + gp.plain.map(([a, b]) => render(a, b, plain)).join(',') + ';');
    else out.push(`${STATE}.${gp.name}=` + (gp.init ? render(gp.init[0], gp.init[1], plain) : 'undefined') + ';');
  }
  finalEdits.push({ at: e.at, end: e.end, text: out.join('') });
}
for (const e of plain) if (!declEdits.some(d => e.at >= d.at && e.end <= d.end)) finalEdits.push(e);

console.log(`${targets.length} variables to move onto ${STATE}${only ? ' (batch)' : ''}: ${targets.map(v => v.name).join(', ')}`);
console.log(`${finalEdits.length} edits in ${new Set(finalEdits.map(e => pieceOf(e.at))).size} pieces`);
if (!APPLY) process.exit(0);

// write back piece by piece
finalEdits.sort((a, b) => b.at - a.at);
const outTexts = texts.slice();
for (const e of finalEdits) {
  const i = pieceOf(e.at);
  if (e.end > offsets[i] + texts[i].length) throw new Error('edit spans two pieces at ' + e.at);
  let t = outTexts[i];
  t = t.slice(0, e.at - offsets[i]) + e.text + t.slice(e.end - offsets[i]);
  outTexts[i] = t;
}
if (!outTexts[0].includes(`const ${STATE}={};`)) outTexts[0] = `const ${STATE}={};\n` + outTexts[0];
files.forEach((f, i) => fs.writeFileSync(path.join(DIR, f), outTexts[i]));
console.log('written');
