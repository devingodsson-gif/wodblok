// The app's own files (2.98.1, docs/asset-split-plan.md): the one place the build decides where a picture, font or data file of the app goes.
// Every kind of built-in content (mockups first; textures, fonts, shapes and templates next) asks it for a reference instead of building a data address itself:
//   const out = assetWriter('inline')               the single-file app (npm run build, the tests, the preview): the file goes inside the page, as a data: address
//   const out = assetWriter('split', 'dist/web')    the hosted app (npm run build:web): the file goes next to the page, in assets/<kind>/<name>.<hash>.<ext>,
//                                                   and the reference is that relative address; the hash is the content's, so a changed file has a new name
//                                                   and the old one can be kept by browsers for ever (src/web/_headers)
//   out.ref(kind, name, bytes, ext)   ->  'data:image/webp;base64,...'  or  'assets/mockups/tshirt.1a2b3c4d.webp'
// The app reads a reference only through src/platform/assets.js. Adding a kind of content is: give its build step this writer and keep what ref returns.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const TYPES = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', woff: 'font/woff', woff2: 'font/woff2', json: 'application/json', bin: 'application/octet-stream', zip: 'application/zip' };
const safe = s => String(s).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '') || 'file';
function assetWriter(mode, outDir) {
  if (mode !== 'inline' && mode !== 'split') throw new Error('assetWriter: mode is inline or split');
  if (mode === 'split' && !outDir) throw new Error('assetWriter: split needs the output folder');
  const written = [];
  return {
    mode,
    written,   // the files a split build wrote: [{kind, file, bytes}]
    ref(kind, name, bytes, ext) {
      const type = TYPES[ext];
      if (!type) throw new Error('assetWriter: unknown file type .' + ext);
      const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
      if (mode === 'inline') return 'data:' + type + ';base64,' + buf.toString('base64');
      const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10), rel = 'assets/' + safe(kind) + '/' + safe(name) + '.' + hash + '.' + ext;
      const file = path.join(outDir, rel);
      if (!fs.existsSync(file)) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buf); written.push({ kind, file: rel, bytes: buf.length }); }
      return rel;
    },
  };
}
module.exports = { assetWriter };
