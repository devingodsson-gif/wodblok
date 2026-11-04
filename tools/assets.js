// The app's own files (2.98.1, docs/asset-split-plan.md): the one place the build decides where a picture, font or data file of the app goes.
// Every kind of built-in content (mockups first; textures, fonts, shapes and templates next) asks it for a reference instead of building a data address itself:
//   const out = assetWriter('inline')               the single-file app (npm run build, the tests, the preview): the file goes inside the page, as a data: address
//   const out = assetWriter('split', 'dist/web')    the hosted app (npm run build:web): the file goes next to the page, in assets/<kind>/<name>.<hash>.<ext>,
//                                                   and the reference is that relative address; the hash is the content's, so a changed file has a new name
//                                                   and the old one can be kept by browsers for ever (src/web/_headers)
//   out.ref(kind, name, bytes, ext)   ->  'data:image/webp;base64,...'  or  'assets/mockups/tshirt.1a2b3c4d.webp'  (or '...bin~3', a file in 3 pieces)
// The app reads a reference only through src/platform/assets.js. Adding a kind of content is: give its build step this writer and keep what ref returns;
// data the app needs at start-up goes through dataFile (below) instead.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const TYPES = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml', woff: 'font/woff', woff2: 'font/woff2', json: 'application/json', bin: 'application/octet-stream', zip: 'application/zip', js: 'text/javascript' };
// 2.100.1: a file larger than PART is written in pieces (the host takes files of at most 25 MiB): <name>.<hash>.<ext>.1, .2, ... and its reference ends ~<count>;
// src/platform/assets.js fetches the pieces and joins them (such a file is read as bytes only, never by address)
const PART = 24 * 1024 * 1024;
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
      if (buf.length > PART) {
        const n = Math.ceil(buf.length / PART);
        for (let i = 0; i < n; i++) {
          const pr = rel + '.' + (i + 1), file = path.join(outDir, pr);
          if (!fs.existsSync(file)) { fs.mkdirSync(path.dirname(file), { recursive: true }); const b = buf.subarray(i * PART, Math.min(buf.length, (i + 1) * PART)); fs.writeFileSync(file, b); written.push({ kind, file: pr, bytes: b.length }); }
        }
        return rel + '~' + n;
      }
      const file = path.join(outDir, rel);
      if (!fs.existsSync(file)) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buf); written.push({ kind, file: rel, bytes: buf.length }); }
      return rel;
    },
  };
}
// A data file whose value the app needs from its first moment (2.98.4: the built-in shapes and templates). `src` is the data module's text, holding
// `const NAME=<JSON>;` then its export line. Inline, it is returned as it is; split, the JSON becomes assets/data/<name>.<hash>.json and the constant holds that
// reference, which src/main.js waits for (assetPreload) before start-up; the app reads it with assetData.
function dataFile(writer, name, constName, src) {
  const m = new RegExp('const ' + constName + '=(\\[.*\\]);\\nexport', 's').exec(src);
  if (!m) throw new Error('dataFile: const ' + constName + '=[...] not found');
  if (writer.mode === 'inline') return src;
  const ref = writer.ref('data', name, Buffer.from(m[1]), 'json');
  return src.slice(0, m.index) + 'const ' + constName + '=' + JSON.stringify(ref) + ';\nexport' + src.slice(m.index + m[0].length);
}
module.exports = { assetWriter, dataFile };
