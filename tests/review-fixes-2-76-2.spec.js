// 2.76.2 (owner Oct 29 2026, from the 2.76 review): an Image prints in PNG exports and SVG exports carry the picture itself; an Image with a filter effect
// stays on the canvas when it is not selected; Randomize keeps clear of your own elements; Select all leaves the Background out; Book cover keeps the art on the front.
const { test, expect } = require('@playwright/test');
const path = require('path');
const H = require('./helpers/harness');
const IMG = path.join(__dirname, 'fixtures', 'picture.png');   // a made-up picture: four blocks of colour, one of them (200, 60, 120)

const addImage = async page => {
  await page.click('#elb [data-k="image"]'); await H.settle(page);
  await page.setInputFiles('section.pn[data-p="image"] .pcfile', IMG); await H.settle(page, { max: 30000 });
  await page.keyboard.press('Escape'); await H.settle(page);
};
// pixels of the picture's pink block in a PNG (bytes as base64) or in the canvas as it shows
const pinkIn = (page, b64) => page.evaluate(async b64 => {
  const bin = atob(b64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
  const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
  const p = g.getImageData(0, 0, bm.width, bm.height).data; let n = 0;
  for (let i = 0; i < p.length; i += 4) if (Math.abs(p[i] - 200) < 30 && Math.abs(p[i + 1] - 60) < 30 && Math.abs(p[i + 2] - 120) < 30) n++; return n;
}, b64);
const pinkOnCanvas = async page => pinkIn(page, (await page.locator('#art').screenshot()).toString('base64'));
const mockSave = page => page.evaluate(() => {
  window.__files = [];
  window.showSaveFilePicker = async o => { const f = { name: o.suggestedName, parts: [] }; window.__files.push(f);
    return { createWritable: async () => ({ write: async d => { f.parts.push(d) }, close: async () => { f.done = true } }) }; };
});
const lastFile = page => page.evaluate(async () => { const f = window.__files.at(-1), u = new Uint8Array(await new Blob(f.parts).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s) });
const menu = async (page, bar, item) => { await page.click(bar); await page.locator('.pop.mnbm:visible button', { hasText: item }).first().click(); };

test('an Image is in the exported PNG, and the SVG carries the picture itself', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, runtime: 'none' });
  await addImage(page);
  await mockSave(page);
  await menu(page, '#mnb-export', 'Export PNG');
  await page.waitForFunction(() => window.__files.length && window.__files.at(-1).done, null, { timeout: 60000 });
  expect(await pinkIn(page, await lastFile(page))).toBeGreaterThan(1000);   // before 2.76.2 the picture was missing from the file
  await menu(page, '#mnb-export', 'Export SVG');
  await page.waitForFunction(() => window.__files.length > 1 && window.__files.at(-1).done, null, { timeout: 60000 });
  const svg = Buffer.from(await lastFile(page), 'base64').toString('utf8');
  expect(svg).toMatch(/<image[^>]*href="data:image\//);
  expect(svg).not.toContain('blob:');
  expect(errors).toEqual([]);
});

test('an Image with a filter effect stays on the canvas when it is not selected', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await addImage(page);
  const plain = await pinkOnCanvas(page);
  expect(plain).toBeGreaterThan(500);
  const s = JSON.parse(await H.getState(page)); s.els.find(q => q.k === 'image').fx = [{ u: 'fxb', k: 'blur', on: true }];
  await page.evaluate(x => window.__wbTest.apply(x), JSON.stringify(s)); await page.keyboard.press('Escape'); await H.settle(page, { quiet: 8, max: 30000 });
  await page.waitForTimeout(1500); await H.settle(page);
  expect(await pinkOnCanvas(page)).toBeGreaterThan(plain * .5);   // before 2.76.2 its print could not load the picture, so it vanished
  expect(errors).toEqual([]);
});

test('Select all leaves the Background out, so Select all then Delete keeps it', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, background: true });
  await H.addShape(page, 'rect'); await H.addShape(page, 'ellipse');
  await page.keyboard.press('Escape'); await H.settle(page);
  await page.keyboard.press('Control+a'); await H.settle(page);
  await page.keyboard.press('Delete'); await H.settle(page);
  const els = JSON.parse(await H.getState(page)).els;
  expect(els.map(q => q.k)).toEqual(['sheet']);
  expect(els[0].bgd).toBeTruthy();
  expect(errors).toEqual([]);
});

test('Book cover moves the art onto the front cover, and back to the middle when it is turned off', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  const u = await H.addShape(page, 'rect'); await page.keyboard.press('Escape'); await H.settle(page);
  const vb = () => page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
  const pos = async () => { const q = JSON.parse(await H.getState(page)).els.find(e => e.u === u); return [q.x, q.y]; };
  const [W0] = await vb(), p0 = await pos();
  await H.openPanel(page, 'canvas');
  await page.click('#cfmt [data-f="book"]'); await H.settle(page, { max: 30000 });
  const [W1] = await vb(), p1 = await pos();
  expect(W1).toBeGreaterThan(W0 * 1.5);
  expect(p1[0] / W1).toBeGreaterThan(.6);   // on the front (the right-hand half); before 2.76.2 it stayed at the left, on the back
  await page.click('#cfmt [data-f="free"]'); await H.settle(page, { max: 30000 });
  const p2 = await pos();
  expect(p2[0]).toBeCloseTo(p0[0], 0); expect(p2[1]).toBeCloseTo(p0[1], 0);
  expect(errors).toEqual([]);
});

test('Randomize keeps clear of your own elements', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 3, pattern: false });
  await H.addShape(page, 'rect');
  const s = JSON.parse(await H.getState(page)), mine = s.els.find(q => q.k === 'motif');
  Object.assign(mine, { x: 266.5, y: 300, s: 200, wx: 1, wy: .4, r: 0 });   // a band across the upper middle, where Looks put titles and emblems (frames, rules and borders may run behind it)
  await page.evaluate(x => window.__wbTest.apply(x), JSON.stringify(s)); await page.keyboard.press('Escape'); await H.settle(page);
  await page.evaluate(() => window.__wbTest.kv.set('wb167_rzlook', 'poster'));
  const box = q => { const w = q.k === 'text' ? (+q.bw || 1) * q.s / Math.max(q.n || 1, .01) : q.s * (q.wx || 1), h = q.k === 'text' ? (+q.bh || 1) * q.s / Math.max(q.n || 1, .01) : q.s * (q.wy || 1); return [q.x - w / 2, q.y - h / 2, q.x + w / 2, q.y + h / 2]; };
  const m = box(mine);
  for (let i = 0; i < 4; i++) {
    await page.click('#rzdo'); await page.waitForTimeout(300); await H.settle(page, { max: 60000 });
    const els = JSON.parse(await H.getState(page)).els;
    expect(els.find(q => q.u === mine.u), 'your shape is kept').toBeTruthy();
    const hits = els.filter(q => q.u !== mine.u && (q.k === 'text' || q.k === 'motif' || q.k === 'image') && !['Path', 'Frame', 'Rule', 'Binding', 'Border', 'Corner'].includes(q.nm) && q.v !== false).filter(q => { const b = box(q); return b[0] < m[2] && b[2] > m[0] && b[1] < m[3] && b[3] > m[1]; });
    expect(hits.map(q => q.k + ':' + (q.tx ? q.tx.text : q.m)), 'roll ' + i).toEqual([]);
  }
  expect(errors).toEqual([]);
});
