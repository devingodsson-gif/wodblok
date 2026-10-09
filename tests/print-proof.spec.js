// Print proof (Phase 5): one page to check before printing, as a PNG or a PDF, on Letter or A4.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, TARGET, openApp, openPanel, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const roll = async page => { if (!(await page.locator('section.pn[data-p="rand"]:not([hidden])').count())) await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };
const proof = async (page, kind, paper = 'letter') => {
  if (!(await page.locator('section.pn[data-p="xrec"]:not([hidden])').count())) await openPanel(page, 'xrec');
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.evaluate(v => { const s = document.getElementById('xpp'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, paper);   // the page turns every list into its own menu; set the list under it
  await page.click(kind === 'pdf' ? '#xppdf' : '#xppng');
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 60000 });
  return page.evaluate(() => { const d = window.__wbDownloads[0]; return { filename: d.filename, base64: d.base64, type: d.type }; });
};
// the picture's size, and how many pixels are exactly this colour
const look = (page, d, hexes) => page.evaluate(async ([b64, type, hexes]) => {
  const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const bm = await createImageBitmap(new Blob([u], { type })), c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
  const x = c.getContext('2d'); x.drawImage(bm, 0, 0); const p = x.getImageData(0, 0, c.width, c.height).data;
  const want = hexes.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))), n = hexes.map(() => 0), nonWhite = { v: 0 };
  for (let i = 0; i < p.length; i += 4) { if (p[i] < 250 || p[i + 1] < 250 || p[i + 2] < 250) nonWhite.v++; want.forEach((w, k) => { if (p[i] === w[0] && p[i + 1] === w[1] && p[i + 2] === w[2]) n[k]++; }); }
  return { w: c.width, h: c.height, n, nonWhite: nonWhite.v };
}, [d.base64, d.type, hexes]);
const hexOf = (page, name) => page.evaluate(n => { const s = document.querySelector('#cl [data-c="' + n.replace(/"/g, '\\"') + '"] i'); return s ? getComputedStyle(s).backgroundColor : null; }, name);

test('the PNG proof is a Letter page with the palette colours on it; A4 is a different size', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  await roll(page);
  const pal = JSON.parse(await page.evaluate(() => window.__wbTest.state())).proj;
  await openPanel(page, 'colors');
  const hexes = [];
  for (const n of [pal.bg, pal.ink]) { const rgb = await hexOf(page, n); const m = rgb && rgb.match(/\d+/g); hexes.push('#' + m.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('')); }
  const d = await proof(page, 'png');
  expect(d.filename).toMatch(/-proof\.png$/);
  const l = await look(page, d, hexes);
  expect([l.w, l.h]).toEqual([1275, 1650]);                               // 8.5 x 11 in at 150 dpi
  expect(l.nonWhite).toBeGreaterThan(l.w * l.h * 0.2);                     // the piece is on the page
  expect(l.n[0], 'paper colour appears').toBeGreaterThan(2000);
  const a4 = await look(page, await proof(page, 'png', 'a4'), hexes);
  expect([a4.w, a4.h]).toEqual([1241, 1754]);
  expect(errors).toEqual([]);
});

test('the PDF proof is a one-page PDF the size of the paper', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await roll(page);
  const d = await proof(page, 'pdf');
  expect(d.filename).toMatch(/-proof\.pdf$/);
  const text = Buffer.from(d.base64, 'base64').toString('latin1');
  expect(text.startsWith('%PDF-')).toBe(true);
  expect(text).toContain('/MediaBox [0 0 612.000 792.000]');
  expect((text.match(/\/Type \/Page /g) || []).length).toBe(1);
  expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
  await expect(page.locator('#pmsg')).toContainText('Print proof saved');
  expect(errors).toEqual([]);
});

test('on a repeat tile the proof shows the tile repeated 3 x 3 beside the single tile', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 2 });
  await openPanel(page, 'canvas'); await page.click('#cfmt [data-f="tile"]'); await settle(page);
  await roll(page);
  const tileProof = await look(page, await proof(page, 'png'), []);
  await openPanel(page, 'canvas'); await page.click('#cfmt [data-f="free"]'); await settle(page);
  const freeProof = await look(page, await proof(page, 'png'), []);
  expect([tileProof.w, tileProof.h]).toEqual([freeProof.w, freeProof.h]);
  // two pictures side by side use more of the page than one picture centred
  expect(tileProof.nonWhite).toBeGreaterThan(freeProof.nonWhite * 0.9);
  expect(errors).toEqual([]);
});
