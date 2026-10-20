import {FormatError} from './errors.js';
// Checks a loaded project before any of it is used, so damaged or hostile files fail with a friendly message.
const FMT_MAX_ITEMS = 200000;
function fmtValidate(p) {
  const bad = (code, msg) => { throw new FormatError(code, msg); };
  if (!p || typeof p !== 'object' || Array.isArray(p)) bad('shape', 'That file is not a WODBLOK project.');
  if (p.app !== 'WODBLOK') bad('app', 'That file is not a WODBLOK project.');
  if (p.v !== undefined && !(Number.isInteger(p.v) && p.v >= 1)) bad('version', 'That project file has a version number the app cannot read.');
  if (!Array.isArray(p.tiles) || !p.tiles.length) bad('tiles', 'That project has no stamps, so it may be damaged.');
  if (!Array.isArray(p.els)) bad('els', 'That project has no elements, so it may be damaged.');
  let n = 0;
  for (const t of p.tiles) {
    if (!t || typeof t !== 'object' || !Array.isArray(t.items)) bad('tiles', 'A stamp in that project is damaged.');
    n += t.items.length;
    for (const q of t.items) if (!q || typeof q !== 'object' || typeof q.m !== 'string' || !Number.isFinite(+q.x) || !Number.isFinite(+q.y)) bad('items', 'A shape in that project is damaged.');
  }
  if (n > FMT_MAX_ITEMS) bad('size', 'That project is far larger than WODBLOK can open.');
  if (p.els.length > FMT_MAX_ITEMS || p.els.some(q => !q || typeof q !== 'object' || typeof q.k !== 'string' || (q.k !== 'group' && (!Number.isFinite(+q.x) || !Number.isFinite(+q.y))))) bad('items', 'That project has damaged pieces in its element list.');
  if (p.arts !== undefined && (p.arts === null || typeof p.arts !== 'object')) bad('arts', 'The pictures in that project are damaged.');
  return p;
}
export {fmtValidate};
