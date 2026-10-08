#!/usr/bin/env node
// One-time tool (Phase 1a): cut the main script of legacy/wodblok-v100.html into ordered pieces under
// src/legacy/ and write src/shell.html (everything around the main script) and src/legacy/manifest.json.
// Every cut must fall on a top-level statement boundary (checked with the parser), and the pieces are
// plain line ranges, so joining them again gives back the original script byte for byte.
// After this ran once, src/ is the source of truth and this file is kept only as a record of how it was made.
const fs = require('fs');
const path = require('path');
const espree = require('espree');

const ROOT = path.resolve(__dirname, '..');
const lines = fs.readFileSync(path.join(ROOT, 'legacy', 'wodblok-v100.html'), 'utf8').split('\n');
const START = 1124, END = 4454;                       // main script body, 1-based inclusive
if (lines[START - 2] !== '<script>' || lines[END] !== '</script>') throw new Error('unexpected script boundaries');

// [first line, file name]. Names say what is in the piece.
const CUTS = [
  [1124, 'launch-and-version'],
  [1134, 'draft-mode-speedups'],
  [1144, 'stamp-prints-and-drawing'],
  [1239, 'canvas-and-stamp-outlines'],
  [1390, 'motif-data'],
  [1612, 'motif-library-folders'],
  [1653, 'symmetry'],
  [1691, 'grid-shapes'],
  [1721, 'stamp-editor-grid-and-motif-ops'],
  [1787, 'layer-grids'],
  [1866, 'pressure-flooding-block-edges'],
  [1959, 'selection-and-split'],
  [1982, 'preview-and-stamp-tool'],
  [2067, 'presets-and-layer-grid-ui'],
  [2174, 'print-effects-and-stamp-texture'],
  [2235, 'texture-generators'],
  [2353, 'texture-panel-and-previews'],
  [2487, 'projects-and-cover-overlay'],
  [2585, 'randomize-and-hold'],
  [2648, 'before-after-and-randomizer'],
  [2939, 'motif-library-ui'],
  [3008, 'text-tool'],
  [3125, 'frame-layers'],
  [3197, 'free-place-layers'],
  [3236, 'art-layers'],
  [3323, 'text-boxes'],
  [3383, 'stamp-library'],
  [3460, 'crop-editor'],
  [3565, 'grid-tool'],
  [3577, 'print-cover'],
  [3615, 'colour-grading'],
  [3806, 'layers-panel'],
  [3840, 'clear'],
  [3873, 'desktop-shell'],
  [4292, 'import-artwork-and-motif-sheets'],
];

const ast = espree.parse(lines.slice(START - 1, END).join('\n'), { ecmaVersion: 'latest', sourceType: 'script', loc: true });
const spans = ast.body.map(s => [s.loc.start.line + START - 1, s.loc.end.line + START - 1]);
const bad = CUTS.filter(([L]) => spans.some(([a, b]) => a < L && L <= b));
if (bad.length) { console.error('cuts inside a statement:', bad.map(b => b[0] + ' ' + b[1]).join(', ')); process.exit(1); }
if (CUTS[0][0] !== START) throw new Error('first cut must be the first line');

const dir = path.join(ROOT, 'src', 'legacy');
fs.mkdirSync(dir, { recursive: true });
const manifest = [];
CUTS.forEach(([from, name], i) => {
  const to = i + 1 < CUTS.length ? CUTS[i + 1][0] - 1 : END;
  const file = String(i + 1).padStart(2, '0') + '-' + name + '.js';
  fs.writeFileSync(path.join(dir, file), lines.slice(from - 1, to).join('\n') + '\n');   // one trailing newline per file; the build strips it
  manifest.push(file);
  console.log(file.padEnd(48), (to - from + 1) + ' lines');
});
fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');

// the shell: everything outside the main script, with one placeholder line where the script goes
const shell = lines.slice(0, START - 1).concat(['/*@@MAIN@@*/'], lines.slice(END));
fs.writeFileSync(path.join(ROOT, 'src', 'shell.html'), shell.join('\n'));
console.log('shell.html', shell.length, 'lines;', manifest.length, 'pieces');
