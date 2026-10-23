import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {fpU} from './24-free-place-layers.js';
import {basicKey} from './76-basic-shapes.js';

// ===== The Background (2.27.0): an ordinary element, not a setting of the canvas. Every new project starts with a Rectangle exactly the size of the canvas, filled with the first tray
// colour (a link to it, so it follows the tray), called "Background", at the bottom of the element list. It can be recoloured, resized, hidden, textured or deleted like any element
// (delete it and the canvas is transparent). A click on the canvas goes through it: it is picked from the element list. {bgd:1} marks it, so a Randomize roll keeps it.
// 2.31.0: it is the Rectangle motif of the Basic shapes (the Shape element is gone). A project made by an older app is refused (file format 27), never converted.
// Owner, Oct 22 2026: "instead of having a background defined on the canvas, create each project with a shape which is the exact size of the canvas".
const bgNew=ink=>({u:fpU(),k:'motif',m:basicKey('rect')||'b0',x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:+CW.toFixed(1),wy:+(CH/CW).toFixed(4),r:0,f:1,ink,nm:'Background',bgd:1});
export {bgNew};
