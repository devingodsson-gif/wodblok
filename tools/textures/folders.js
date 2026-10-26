// The built-in textures are the pictures in textures/<set>/<id>.webp (2.50.0). The build calls this (tools/build.js, and tools/serve-esm.js for `npm run dev`),
// so changing a texture is: put the picture in the folder (run `npm run textures` first to turn a PNG or JPEG into the right kind of WebP).
// textures/span.json says how many repeats at Scale 100% a picture holds (default 1).
// Sets and textures keep the order of sets.json (Randomize counts on it); a folder or a picture that is not listed there comes after, A to Z.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), DIR = path.join(ROOT, 'textures'), MAX = 600 * 1024;
const SETS = require('./sets.json');
const spanOf = () => { try { const o = JSON.parse(fs.readFileSync(path.join(DIR, 'span.json'), 'utf8')); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
const cmp = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
function textureList() {
  if (!fs.existsSync(DIR)) return [];
  const SPAN = spanOf(), known = SETS.map(s => s[0]), dirs = fs.readdirSync(DIR).filter(d => fs.statSync(path.join(DIR, d)).isDirectory());
  const order = [...known.filter(d => dirs.includes(d)), ...dirs.filter(d => !known.includes(d)).sort(cmp)], out = [];
  for (const set of order) {
    const files = fs.readdirSync(path.join(DIR, set)).filter(f => !f.startsWith('.'));
    const bad = files.filter(f => !/\.webp$/i.test(f) && /\.(png|jpe?g|gif|bmp|tiff?)$/i.test(f));
    if (bad.length) throw new Error('textures/' + set + '/' + bad[0] + ' is not a WebP: run `npm run textures` first');
    const ids = files.filter(f => /\.webp$/i.test(f)).map(f => f.replace(/\.webp$/i, '')), mine = Object.keys((SETS.find(s => s[0] === set) || [0, {}])[1]);
    for (const id of [...mine.filter(i => ids.includes(i)), ...ids.filter(i => !mine.includes(i)).sort(cmp)]) {
      if (!/^[a-z0-9-]{1,40}$/.test(id)) throw new Error('textures/' + set + '/' + id + '.webp: a texture file name is lower case letters, digits and - only');
      const b = fs.readFileSync(path.join(DIR, set, id + '.webp'));
      if (b.length > MAX) throw new Error('textures/' + set + '/' + id + '.webp is larger than 600 KB: run `npm run textures` to make it smaller');
      const sp = Math.max(1, Math.min(8, +SPAN[id] || 1));
      out.push({ id, set, src: 'data:image/webp;base64,' + b.toString('base64'), ...(sp !== 1 ? { span: sp } : {}) });
    }
  }
  return out;
}
// Takes the text of src/data/textures.js and returns it with the pictures in.
function withTextures(src) {
  const m = /const TXIMG=\[\];\n/.exec(src);
  if (!m) throw new Error('data/textures.js: TXIMG not found');
  return src.slice(0, m.index) + 'const TXIMG=' + JSON.stringify(textureList()) + ';\n' + src.slice(m.index + m[0].length);
}
module.exports = { withTextures, textureList };
