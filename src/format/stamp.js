import {FormatError} from './errors.js';
// A single stamp from the library as its own small file: {app:'WODBLOK-STAMP', v:1, name, w, h, img, tile, motifs, colors, tximgs}. tximgs (2.51.0, optional): the pictures of the imported textures the stamp uses, {id: {n, src}}.
// The motifs the stamp uses and its colour travel with it. The app still cleans the motifs when the stamp is added to a project.
const STAMP_APP = 'WODBLOK-STAMP', STAMP_V = 1, STAMP_MAX = 8e6;
const fmtStampPack = rec => JSON.stringify({ app: STAMP_APP, v: STAMP_V, name: String(rec.name || 'Stamp'), w: rec.w, h: rec.h, img: rec.img || '', tile: rec.tile, motifs: rec.motifs || {}, colors: rec.colors || [], tximgs: rec.tximgs || {} });
// Returns a library record (without id). Throws FormatError with a plain message.
function fmtStampOpen(text) {
  const bad = (c, m) => { throw new FormatError(c, m); };
  if (typeof text !== 'string' || text.length > STAMP_MAX) bad('size', 'That file is too large to be a stamp.');
  let o; try { o = JSON.parse(text); } catch (e) { bad('json', 'That file is not a WODBLOK stamp.'); }
  if (!o || o.app !== STAMP_APP) bad('app', 'That file is not a WODBLOK stamp.');
  if (!(Number.isInteger(o.v) && o.v >= 1)) bad('version', 'That stamp file has a version number the app cannot read.');
  if (o.v > STAMP_V) bad('newer', 'That stamp was made by a newer WODBLOK. Update the app first.');
  let t; try { t = JSON.parse(o.tile); } catch (e) { t = null; }
  if (!t || typeof t !== 'object' || !Array.isArray(t.items)) bad('tile', 'That stamp file is damaged.');
  if (o.motifs !== undefined && (o.motifs === null || typeof o.motifs !== 'object' || Array.isArray(o.motifs))) bad('motifs', 'The motifs in that stamp file are damaged.');
  if (o.colors !== undefined && !Array.isArray(o.colors)) bad('colors', 'The colours in that stamp file are damaged.');
  return { name: String(o.name || 'Stamp').replace(/["<>&|]/g, '').slice(0, 40) || 'Stamp', updated: Date.now(), w: +o.w || 0, h: +o.h || 0, img: typeof o.img === 'string' ? o.img : '', tile: o.tile, motifs: o.motifs || {}, colors: o.colors || [], tximgs: o.tximgs && typeof o.tximgs === 'object' && !Array.isArray(o.tximgs) ? o.tximgs : {} };
}
export {fmtStampPack,fmtStampOpen};
