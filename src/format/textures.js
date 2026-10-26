import {zipRead} from './libzip.js';
// Texture library files (2.51.0): the library leaves as a zip of pictures, one folder per library folder, like the shape export, and a zip of
// pictures (or any picture) comes back in. Pure code, no browser needed.

const MIME = {webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg'};

// a texture picture kept as a data URL -> its bytes and file extension
function txzBytes(src) {
  const m = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(String(src || ''));
  if (!m) return null;
  const bin = atob(m[2]), data = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) data[i] = bin.charCodeAt(i);
  return { data, ext: m[1] == 'jpeg' ? '.jpg' : '.' + m[1] };
}

// a zip -> [{name, dir, data, type}] for its pictures; anything else in it is left out
function txzRead(bytes) {
  const r = zipRead(bytes, /\.(webp|png|jpe?g)$/i);
  return r && r.map(e => ({ name: e.name, dir: e.dir, data: e.data, type: MIME[e.file.slice(e.file.lastIndexOf('.') + 1).toLowerCase()] || 'image/png' }));
}

export {txzBytes,txzRead};
