import {zipSync,unzipSync,strToU8,strFromU8} from '../vendor/fflate.js';
import {FormatError} from './errors.js';
import {fmtValidate} from './validate.js';
// The .wodblok container: a zip with `mimetype` first (stored, not compressed), `project.json`, `assets/<hash>.<ext>` (each image once,
// however often it is used) and an optional `thumbnail.png`. Images are stored as they are (no recompression); JSON is compressed.
// In memory, a project keeps its images as data URLs, as the app always has; the container only moves them out of the JSON.
// Format 21 is the only one the app opens. A file made by an older app is refused with a message, never converted (owner, Oct 19 2026); a file made by a newer
// app opens read-only and is never written back.
const FMT_LATEST = 24;
const FMT_MIME = 'application/vnd.wodblok+zip', FMT_REF = 'wbasset:';
const FMT_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
const FMT_TYPE = Object.fromEntries(Object.entries(FMT_EXT).map(([k, v]) => [v, k]));
const FMT_DATA_URL = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\r\n]*)$/;
const fmtSnapOk = n => !!n && typeof n.n === 'string' && Number.isFinite(+n.t) && typeof n.s === 'string' && n.s.length < 30e6;
const fmtHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const fmtB64ToBytes = s => { const bin = atob(s.replace(/[\r\n]/g, '')); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
const fmtBytesToB64 = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const fmtIsZip = b => b.length > 3 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 3 || b[2] === 5);

// Where images live in a project. Anything else in the file is kept exactly as it is.
function fmtImageSlots(p) {
  const s = [];
  if (p.arts && typeof p.arts === 'object') for (const a of Object.values(p.arts)) if (a && typeof a === 'object') s.push([a, 'src']);
  if (p.art && typeof p.art === 'object') s.push([p.art, 'src']);          // the project picture used when this project is placed as Art
  const c = p.cover;
  if (c && typeof c === 'object') { s.push([c, 'img']); for (const k of ['back', 'spine']) if (c[k] && typeof c[k] === 'object') s.push([c[k], 'img']); }
  return s;
}
async function fmtPack(project, { thumbnail, snapshots } = {}) {
  const p = JSON.parse(JSON.stringify(project)), files = {}, seen = new Map();
  p.v = FMT_LATEST;
  for (const [o, k] of fmtImageSlots(p)) {
    const m = typeof o[k] === 'string' && FMT_DATA_URL.exec(o[k]);
    if (!m) continue;
    const bytes = fmtB64ToBytes(m[2]), id = fmtHex(await crypto.subtle.digest('SHA-256', bytes)), name = 'assets/' + id + '.' + FMT_EXT[m[1]];
    if (!seen.has(name)) { seen.set(name, 1); files[name] = [bytes, { level: 0 }]; }
    o[k] = FMT_REF + name;
  }
  const out = { mimetype: [strToU8(FMT_MIME), { level: 0 }], 'project.json': strToU8(JSON.stringify(p)) };
  if (thumbnail) out['thumbnail.png'] = [thumbnail, { level: 0 }];
  // named snapshots travel inside the file (kept short: the app keeps at most 30)
  (Array.isArray(snapshots) ? snapshots : []).slice(0, 30).forEach((n, i) => { if (fmtSnapOk(n)) out['snapshots/' + String(i).padStart(2, '0') + '.json'] = strToU8(JSON.stringify({ n: n.n, t: n.t, s: n.s })); });
  return zipSync({ ...out, ...files });
}
// Accepts the bytes of a .wodblok zip. Returns { project (images as data URLs), newer, missingAssets, snapshots }. Opening never changes the file.
async function fmtOpen(bytes) {
  let raw, files = null, missingAssets = 0;
  if (!fmtIsZip(bytes)) throw new FormatError('format', 'That file is not a WODBLOK project.');
  try { files = unzipSync(bytes); } catch (e) { throw new FormatError('zip', 'That file looks damaged: it could not be unpacked.'); }
  if (!files.mimetype || strFromU8(files.mimetype) !== FMT_MIME) throw new FormatError('mime', 'That zip file is not a WODBLOK project.');
  if (!files['project.json']) throw new FormatError('missing', 'That project file is missing its main part, so it may be damaged.');
  try { raw = JSON.parse(strFromU8(files['project.json'])); } catch (e) { throw new FormatError('json', 'That project file is damaged and could not be read.'); }
  fmtValidate(raw);
  if (!Number.isInteger(raw.v) || raw.v < FMT_LATEST) throw new FormatError('old', 'That project was made with an older WODBLOK and cannot be opened.');
  const project = raw, newer = raw.v > FMT_LATEST;
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
  const snapshots = [];
  if (files) for (const k of Object.keys(files).filter(k => /^snapshots\/\d+\.json$/.test(k)).sort().slice(0, 30)) {
    try { const n = JSON.parse(strFromU8(files[k])); if (fmtSnapOk(n)) { JSON.parse(n.s); snapshots.push({ n: n.n.slice(0, 40), t: +n.t, s: n.s }); } } catch (e) { /* a damaged snapshot is left out; the project still opens */ }
  }
  return { project, newer, missingAssets, snapshots };
}
// For a list of files: just the project's name and its small preview picture, without unpacking the images. Never throws; a file that cannot be read gives {}.
function fmtPeek(bytes) {
  try {
    if (!fmtIsZip(bytes)) return {};
    const f = unzipSync(bytes, { filter: e => e.name === 'project.json' || e.name === 'thumbnail.png' });
    const raw = f['project.json'] ? JSON.parse(strFromU8(f['project.json'])) : {};
    return { name: typeof raw.name === 'string' ? raw.name : '', thumbnail: f['thumbnail.png'] || null };
  } catch (e) { return {}; }
}
export {fmtPack,fmtOpen,fmtPeek,fmtIsZip,FMT_MIME,FMT_LATEST};
