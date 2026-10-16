#!/usr/bin/env node
// Renders the app icons from the brand mark (the bare bronze WB letters) into src/web/. Run when the mark changes:
// node tools/make-icons.js   (needs the Playwright Chromium that the tests use). The PNGs are committed.
const path = require('path'), fs = require('fs');
const { chromium } = require('@playwright/test');
const OUT = path.join(__dirname, '..', 'src', 'web');
const BG = '#1b1a18', ACC = '#c9a66b';
// The bare bronze WB letters, no tile. "any" icons are transparent; the maskable and Apple icons need a background, so they get the dark brand colour,
// with the mark inside the central 80% safe zone.
const { PATH } = require('./brand-mark');
const svg = (size, kind) => {
  const k = size / 24;
  const m = kind === 'rounded' ? 1.5 : 1.09; // the mark is 15 of 24 units wide
  const full = kind === 'rounded' ? '' : `<rect width="${size}" height="${size}" fill="${BG}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${full}<path transform="scale(${k}) translate(12 12) scale(${m}) translate(-12 -12)" fill="${ACC}" d="${PATH}"/></svg>`;
};
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  const jobs = [['icon-192.png', 192, 'rounded', true], ['icon-512.png', 512, 'rounded', true], ['icon-maskable-512.png', 512, 'full', false], ['apple-touch-icon.png', 180, 'full', false]];
  for (const [f, size, kind, transparent] of jobs) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<body style="margin:0;background:${transparent ? 'transparent' : BG}">${svg(size, kind)}</body>`);
    await p.screenshot({ path: path.join(OUT, f), omitBackground: transparent });
    console.log('wrote', f);
  }
  await b.close();
})();
