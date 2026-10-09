import {FormatError} from './errors.js';
// Checks a loaded project before any of it is used, so damaged or hostile files fail with a friendly message.
const MAX_ITEMS = 200000;
function validateProject(p) {
  const bad = (code, msg) => { throw new FormatError(code, msg); };
  if (!p || typeof p !== 'object' || Array.isArray(p)) bad('shape', 'That file is not a WODBLOK project.');
  if (p.app !== 'WODBLOK') bad('app', 'That file is not a WODBLOK project.');
  if (p.v !== undefined && !(Number.isInteger(p.v) && p.v >= 1)) bad('version', 'That project file has a version number the app cannot read.');
  if (!Array.isArray(p.tiles) || !p.tiles.length) bad('tiles', 'That project has no stamps, so it may be damaged.');
  if (!Array.isArray(p.layers)) bad('layers', 'That project has no layers, so it may be damaged.');
  let n = 0;
  for (const t of p.tiles) {
    if (!t || typeof t !== 'object' || !Array.isArray(t.items)) bad('tiles', 'A stamp in that project is damaged.');
    n += t.items.length;
    for (const q of t.items) if (!q || typeof q !== 'object' || typeof q.m !== 'string' || !Number.isFinite(+q.x) || !Number.isFinite(+q.y)) bad('items', 'A motif in that project is damaged.');
  }
  if (n > MAX_ITEMS || p.layers.length > 5000) bad('size', 'That project is far larger than WODBLOK can open.');
  for (const L of p.layers) if (!L || typeof L !== 'object') bad('layers', 'A layer in that project is damaged.');
  if (p.arts !== undefined && (p.arts === null || typeof p.arts !== 'object')) bad('arts', 'The pictures in that project are damaged.');
  return p;
}
export {validateProject};
