#!/usr/bin/env node
// Renders the app icons from the brand mark (rounded square with a turned square) into src/web/. Run when the mark changes:
// node tools/make-icons.js   (needs the Playwright Chromium that the tests use). The PNGs are committed.
const path = require('path'), fs = require('fs');
const { chromium } = require('@playwright/test');
const OUT = path.join(__dirname, '..', 'src', 'web');
const BG = '#1b1a18', ACC = '#c9a66b';
// full-bleed square for iOS and "maskable" (the system rounds it; the mark stays inside the central 80%), rounded for the others
const svg = (size, kind) => {
  const k = size / 24;
  const rr = kind === 'rounded' ? `<rect x="${2.5 * k}" y="${2.5 * k}" width="${19 * k}" height="${19 * k}" rx="${5.5 * k}" fill="${ACC}"/>` : '';
  const m = kind === 'rounded' ? 1 : 0.95, c = 12 * k;
  const full = kind === 'rounded' ? '' : `<rect width="${size}" height="${size}" fill="${ACC}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${full}${rr}<rect x="${c - 3.4 * k * m}" y="${c - 3.4 * k * m}" width="${6.8 * k * m}" height="${6.8 * k * m}" rx="${1 * k * m}" transform="rotate(45 ${c} ${c})" fill="none" stroke="${BG}" stroke-width="${2 * k * m}"/></svg>`;
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
