// The built-in mockup products are the photos in mockups/ (2.90.2): <id>.webp (the product, at most 300 KB), <id>-mask.png (a PNG whose alpha is where the design prints)
// and their entry in mockups/products.json ([id, name, {cm, warp, q}], in the order they show). The build calls this (tools/build.js, and tools/serve-esm.js for
// `npm run dev`). The photos were made for WODBLOK by the owner (Nov 4 2026). Where the files go (inside the page, or next to it in the hosted app) is
// tools/assets.js's choice (2.98.1): this asks it for a reference to each.
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', '..', 'mockups'), MAX = 300 * 1024;
function mockupList(out) {
  out = out || require('../assets').assetWriter('inline');
  if (!fs.existsSync(path.join(DIR, 'products.json'))) return [];
  return JSON.parse(fs.readFileSync(path.join(DIR, 'products.json'), 'utf8')).map(([id, n, o]) => {
    if (!/^[a-z0-9-]{1,40}$/.test(id)) throw new Error('mockups/' + id + ': a product id is lower case letters, digits and - only');
    const ph = fs.readFileSync(path.join(DIR, id + '.webp')), mk = fs.readFileSync(path.join(DIR, id + '-mask.png'));
    if (ph.length > MAX) throw new Error('mockups/' + id + '.webp is larger than 300 KB');
    if (!Array.isArray(o.q) || o.q.length !== 8) throw new Error('mockups/products.json: ' + id + ' needs q, its four corners');
    if (!(o.w > 0 && o.h > 0)) throw new Error('mockups/products.json: ' + id + ' needs w and h, the photo\'s size');
    return { id, n, src: out.ref('mockups', id, ph, 'webp'), mask: out.ref('mockups', id + '-mask', mk, 'png'), q: o.q, w: +o.w, h: +o.h, cm: +o.cm || 0, warp: Math.max(0, Math.min(1, +o.warp || 0)), ...(o.book ? { book: 1 } : {}) };   // 2.119.0: a book (a book cover shows its front cover on it)
  });
}
// Takes the text of src/data/mockups.js and returns it with the products in.
function withMockups(src, out) {
  const m = /const MKIMG=\[\];\n/.exec(src);
  if (!m) throw new Error('data/mockups.js: MKIMG not found');
  return src.slice(0, m.index) + 'const MKIMG=' + JSON.stringify(mockupList(out)) + ';\n' + src.slice(m.index + m[0].length);
}
module.exports = { withMockups, mockupList };
