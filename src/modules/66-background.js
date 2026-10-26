import {fpU} from './24-free-place-layers.js';

// ===== The Background (2.27.0): an ordinary element, not a setting of the canvas. Every new project starts with one, filled with the first tray colour (a link to it,
// so it follows the tray), called "Background", at the bottom of the element list. It can be recoloured, hidden, given effects, moved or deleted like any element
// (delete it and the canvas is transparent). {bgd:1} marks it, so a Randomize roll keeps it under the roll and the filter effects take their paper colour from it.
// 2.53.0 (owner Oct 26 2026): it is a Sheet (89-sheet-element.js), which always covers the whole canvas, so nothing has to refit it when the canvas changes size.
// A project made by an older app is refused (file format 28), never converted.
const bgNew=ink=>({u:fpU(),k:'sheet',n:'Background',ink,bgd:1});
export {bgNew};
