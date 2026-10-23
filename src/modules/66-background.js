import {CH,CW} from './04-canvas-and-stamp-outlines.js';
import {fpU} from './24-free-place-layers.js';

// ===== The Background (2.27.0): an ordinary Shape, not a setting of the canvas. Every new project starts with a Rectangle exactly the size of the canvas, filled with the first tray
// colour (a link to it, so it follows the tray), called "Background", at the bottom of the element list. It can be recoloured, resized, hidden, textured or deleted like any Shape
// (delete it and the canvas is transparent). A click on the canvas goes through it: it is picked from the element list. {bgd:1} marks it, so a Randomize roll keeps it.
// A project made by an older app has none and is refused (file format 26), never converted.
// Owner, Oct 22 2026: "instead of having a background defined on the canvas, create each project with a shape which is the exact size of the canvas".
const bgNew=ink=>({u:fpU(),k:'shape',sh:'rect',x:+(CW/2).toFixed(1),y:+(CH/2).toFixed(1),s:+CW.toFixed(1),wy:+(CH/CW).toFixed(4),r:0,f:1,ink,nm:'Background',bgd:1});
export {bgNew};
