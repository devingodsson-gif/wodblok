import {zipSync,unzipSync,strToU8,strFromU8} from '../vendor/fflate.js';
import {FormatError} from './errors.js';
import {fmtMigrate,FMT_LATEST} from './migrate.js';
import {fmtValidate} from './validate.js';
// The .wodblok container: a zip with `mimetype` first (stored, not compressed), `project.json`, `assets/<hash>.<ext>` (each image once,
// however often it is used) and an optional `thumbnail.png`. Images are stored as they are (no recompression); JSON is compressed.
// In memory, a project keeps its images as data URLs, as the app always has; the container only moves them out of the JSON.
const FMT_MIME = 'application/vnd.wodblok+zip', FMT_REF = 'wbasset:';
const FMT_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const FMT_TYPE = Object.fromEntries(Object.entries(FMT_EXT).map(([k, v]) => [v, k]));
const FMT_DATA_URL = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\r\n]*)$/;
const fmtHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const fmtB64ToBytes = s => { const bin = atob(s.replace(/[\r\n]/g, '')); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
const fmtBytesToB64 = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const fmtIsZip = b => b.length > 3 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 3 || b[2] === 5);

// Where images live in a project. Anything else in the file is kept exactly as it is.
function fmtImageSlots(p) {
  const s = [];
  if (p.arts && typeof p.arts === 'object') for (const a of Object.values(p.arts)) if (a && typeof a === 'object') s.push([a, 'src']);
  const c = p.cover;
  if (c && typeof c === 'object') { s.push([c, 'img']); for (const k of ['back', 'spine']) if (c[k] && typeof c[k] === 'object') s.push([c[k], 'img']); }
  return s;
}
async function fmtPack(project, { thumbnail } = {}) {
  const p = JSON.parse(JSON.stringify(fmtMigrate(project).project)), files = {}, seen = new Map();
  for (const [o, k] of fmtImageSlots(p)) {
    const m = typeof o[k] === 'string' && FMT_DATA_URL.exec(o[k]);
    if (!m) continue;
    const bytes = fmtB64ToBytes(m[2]), id = fmtHex(await crypto.subtle.digest('SHA-256', bytes)), name = 'assets/' + id + '.' + FMT_EXT[m[1]];
    if (!seen.has(name)) { seen.set(name, 1); files[name] = [bytes, { level: 0 }]; }
    o[k] = FMT_REF + name;
  }
  const out = { mimetype: [strToU8(FMT_MIME), { level: 0 }], 'project.json': strToU8(JSON.stringify(p)) };
  if (thumbnail) out['thumbnail.png'] = [thumbnail, { level: 0 }];
  return zipSync({ ...out, ...files });
}
// Accepts the bytes of a .wodblok zip or of an older .wodblok.json. Returns { project (images as data URLs, format 19), newer, from, missingAssets }.
// Opening never changes the file: the caller saves to a new file, and an older file is only replaced when the person says so.
async function fmtOpen(bytes) {
  let raw, files = null, from, missingAssets = 0;
  if (fmtIsZip(bytes)) {
    try { files = unzipSync(bytes); } catch (e) { throw new FormatError('zip', 'That file looks damaged: it could not be unpacked.'); }
    if (!files.mimetype || strFromU8(files.mimetype) !== FMT_MIME) throw new FormatError('mime', 'That zip file is not a WODBLOK project.');
    if (!files['project.json']) throw new FormatError('missing', 'That project file is missing its main part, so it may be damaged.');
    try { raw = JSON.parse(strFromU8(files['project.json'])); } catch (e) { throw new FormatError('json', 'That project file is damaged and could not be read.'); }
    from = 'zip';
  } else {
    try { raw = JSON.parse(strFromU8(bytes)); } catch (e) { throw new FormatError('json', 'That file is not a WODBLOK project.'); }
    from = 'json';
  }
  fmtValidate(raw);
  const { project, newer } = fmtMigrate(raw);
  if (files) {
    let missing = 0;
    for (const [o, k] of fmtImageSlots(project)) {
      const v = o[k];
      if (typeof v !== 'string' || !v.startsWith(FMT_REF)) continue;
      const name = v.slice(FMT_REF.length), ext = /^assets\/[0-9a-f]{64}\.(png|jpg|webp|gif)$/.exec(name), f = ext && files[name];
      if (!f) { o[k] = ''; missing++; continue; }
      o[k] = 'data:' + FMT_TYPE[ext[1]] + ';base64,' + fmtBytesToB64(f);
    }
    missingAssets = missing;
  }
  return { project, newer, from, missingAssets };
}
export {fmtPack,fmtOpen,fmtIsZip,FMT_MIME,FMT_LATEST};
