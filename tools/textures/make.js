#!/usr/bin/env node
// `npm run textures` (2.50.0): turns every picture dropped in textures/<set>/ into the kind the build takes: a grayscale WebP at most 1024 pixels
// on its long side, named in lower case (spaces become -). A PNG or JPEG is replaced by its WebP; a WebP that is already small and grayscale is left alone.
// --seam also blends the edges so the picture repeats without a seam (for a picture that was not made to repeat).
const fs = require('fs'), path = require('path');
const { chromium } = require('@playwright/test');
const ROOT = path.join(__dirname, '..', '..'), DIR = path.join(ROOT, 'textures'), SIZE = 1024, Q = 0.8, MAX = 600 * 1024;
const slug = f => f.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
(async () => {
  const seam = process.argv.includes('--seam'), todo = [];
  for (const set of fs.existsSync(DIR) ? fs.readdirSync(DIR) : []) {
    const d = path.join(DIR, set); if (!fs.statSync(d).isDirectory()) continue;
    for (const f of fs.readdirSync(d)) if (/\.(png|jpe?g|webp|gif|bmp)$/i.test(f)) todo.push([set, f]);
  }
  const exe = process.env.WB_CHROMIUM && fs.existsSync(process.env.WB_CHROMIUM) ? { executablePath: process.env.WB_CHROMIUM } : {};
  const browser = await chromium.launch(exe), page = await browser.newPage();
  let n = 0;
  for (const [set, f] of todo) {
    const file = path.join(DIR, set, f), id = slug(f), out = path.join(DIR, set, id + '.webp'), bytes = fs.readFileSync(file);
    const type = /\.png$/i.test(f) ? 'image/png' : /\.jpe?g$/i.test(f) ? 'image/jpeg' : /\.gif$/i.test(f) ? 'image/gif' : /\.bmp$/i.test(f) ? 'image/bmp' : 'image/webp';
    const r = await page.evaluate(async ([src, S, q, seam]) => {
      const img = new Image(); img.src = src; await img.decode();
      const k = Math.min(1, S / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.max(8, Math.round(img.naturalWidth * k)), h = Math.max(8, Math.round(img.naturalHeight * k));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
      const d = x.getImageData(0, 0, w, h); let gray = true; const g = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) { const R = d.data[i * 4], G = d.data[i * 4 + 1], B = d.data[i * 4 + 2]; if (Math.abs(R - G) > 2 || Math.abs(G - B) > 2) gray = false; g[i] = 0.2126 * R + 0.7152 * G + 0.0722 * B; }
      if (seam) { const wx = new Float32Array(w), wy = new Float32Array(h); for (let i = 0; i < w; i++) wx[i] = Math.sin(Math.PI * i / w) ** 2; for (let i = 0; i < h; i++) wy[i] = Math.sin(Math.PI * i / h) ** 2;
        { const s = new Float32Array(g); for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) g[y * w + X] = s[y * w + X] * wx[X] + s[y * w + (X + (w >> 1)) % w] * (1 - wx[X]); }
        { const s = new Float32Array(g); for (let y = 0; y < h; y++) for (let X = 0; X < w; X++) g[y * w + X] = s[y * w + X] * wy[y] + s[((y + (h >> 1)) % h) * w + X] * (1 - wy[y]); } }
      for (let i = 0; i < w * h; i++) { const v = Math.round(g[i]); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
      x.putImageData(d, 0, 0);
      return { url: cv.toDataURL('image/webp', q), small: k === 1, gray };
    }, ['data:' + type + ';base64,' + bytes.toString('base64'), SIZE, Q, seam]);
    if (type === 'image/webp' && r.small && r.gray && !seam && bytes.length <= MAX && f === id + '.webp') continue;
    fs.writeFileSync(out, Buffer.from(r.url.slice(r.url.indexOf(',') + 1), 'base64'));
    if (path.resolve(out) !== path.resolve(file)) fs.unlinkSync(file);
    n++; console.log('textures/' + set + '/' + id + '.webp', Math.round(fs.statSync(out).size / 1024) + ' KB');
  }
  await browser.close();
  console.log(n ? n + ' picture' + (n > 1 ? 's' : '') + ' made ready' : 'Every texture picture is ready');
})().catch(e => { console.error(e); process.exit(1); });
