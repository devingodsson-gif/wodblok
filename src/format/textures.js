import {unzipSync} from '../vendor/fflate.js';
// Texture library files (2.51.0): the library leaves as a zip of pictures, one folder per library folder, like the shape export, and a zip of
// pictures (or any picture) comes back in. Pure code, no browser needed.

const MIME = {webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg'};
const MAX_FILES = 200, MAX_BYTES = 8e6;

// a texture picture kept as a data URL -> its bytes and file extension
function txzBytes(src) {
  const m = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(String(src || ''));
  if (!m) return null;
  const bin = atob(m[2]), data = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
  return { data, ext: m[1] == 'jpeg' ? '.jpg' : '.' + m[1] };
}

// a zip -> [{name, dir: [folder names, outermost first], data, type}] for its pictures; anything else in it is left out
function txzRead(bytes) {
  let files;
  try { files = unzipSync(bytes, { filter: f => f.originalSize <= MAX_BYTES && /\.(webp|png|jpe?g)$/i.test(f.name) }); }
  catch (e) { return null; }
  const out = [];
  for (const path of Object.keys(files).sort()) {
    if (out.length >= MAX_FILES) break;
    const parts = path.split('/').filter(Boolean);
    if (!parts.length || parts.some(p => p == '__MACOSX' || p.startsWith('.'))) continue;
    const file = parts.pop(), ext = file.slice(file.lastIndexOf('.') + 1).toLowerCase();
    out.push({ name: file.replace(/\.[^.]*$/, ''), dir: parts.slice(0, 3), data: files[path], type: MIME[ext] || 'image/png' });
  }
  return out;
}

export {txzBytes,txzRead};
