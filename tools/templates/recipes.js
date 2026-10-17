// The built-in templates ("Starting points"): what each one is and how to make it. `npm run templates` plays these steps in the built app
// (tests/make-templates.spec.js), saves each as a .wodblok file in src/templates/<kind>/, and writes src/data/templates.js for the build.
// Built-in shapes, textures and colours only: nothing drawn or imported. Change a recipe or the file format, run the command again.
// kind: canvas (normal canvas) | tile (repeating pattern) | book. seed: the dice for Randomize; the same seed always gives the same piece.
// `look` lists what Randomize may change for this one (everything else stays as the new project has it): the stamps, a new palette, the layout.
const RECIPES = [
  { id: 'poster', kind: 'canvas', n: 'Portrait poster', seed: 2, look: { layout: true } },
  { id: 'badge', kind: 'canvas', n: 'Circle badge', seed: 5, shape: 'circle', look: { layout: false } },
  { id: 'random', kind: 'canvas', n: 'Random design', seed: 7, look: { layout: true } },
  { id: 'half-drop', kind: 'tile', n: 'Half-drop', seed: 3, grid: 'drop', look: { layout: false } },
  { id: 'brick', kind: 'tile', n: 'Brick', seed: 8, grid: 'brick', look: { layout: false } },
  { id: 'hexagon', kind: 'tile', n: 'Hexagon', seed: 5, block: 'hex', grid: 'honey', look: { layout: false } },
  { id: 'book-5-5x8-5', kind: 'book', n: 'Book 5.5 × 8.5 in', seed: 4, trim: '5.5x8.5', look: { layout: true } },
  { id: 'book-6x9', kind: 'book', n: 'Book 6 × 9 in', seed: 9, trim: '6x9', look: { layout: true } },
  { id: 'book-8-5x11', kind: 'book', n: 'Book 8.5 × 11 in (Letter)', seed: 1, trim: '8.5x11', look: { layout: true } },
];
// Templates that were made by hand (a saved project the owner supplied) and not played from a recipe. The source file (with its own picture)
// is kept in tools/templates/custom/; `node tools/templates/add-custom.js` stores it in src/templates/<kind>/ and puts it FIRST in its kind
// in src/data/templates.js. `npm run templates` runs it again at the end, so a regenerate keeps these.
const CUSTOM = [
  { id: 'logo-1', kind: 'canvas', n: 'Logo 1', file: 'logo-1.wodblok' },
];
module.exports = { RECIPES, CUSTOM };
