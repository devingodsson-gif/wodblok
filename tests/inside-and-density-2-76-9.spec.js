// 2.76.9 (owner Oct 29 2026, docs/pattern-plan.md step 6): a Pattern inside another element (Inside: a shape, Sheet, text or stamp), its pieces cut at that element's
// outline and following it when it moves; density from a picture (a halftone made of pieces) or a fade (Linear, Radial): pieces grow, shrink and thin out.
const { test, expect } = require('@playwright/test');
const path = require('path');
const H = require('./helpers/harness');
const IMG = path.join(__dirname, 'fixtures', 'picture.png');   // a made-up picture: four blocks, top left pink, top right navy (dark), bottom left tan (light), bottom right green

const st = async page => JSON.parse(await H.getState(page));
const setPat = (page, o) => page.evaluate(o => { const s = JSON.parse(window.__wbTest.state()), p = s.els.find(q => q.k === 'pattern'); Object.assign(p, o); window.__wbTest.apply(JSON.stringify(s)); }, o);
const vb = page => page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
// the pieces as drawn: middle and width of each square piece
const pieces = page => page.evaluate(() => [...document.querySelectorAll('#dyn [data-mv*="."]')].map(g => { const r = g.querySelector('rect'); return [+g.dataset.mx, +g.dataset.my, r ? +r.getAttribute('width') : 0] }));
async function squares(page, o = {}) {
  await H.openPanel(page, 'layers'); await H.settle(page);
  await H.patSource(page, 'motif', 0); await H.settle(page);   // the first Basic shape: a rectangle
  const p = (await st(page)).els.find(q => q.k === 'pattern');
  await setPat(page, { src: p.src.filter(s => s.k === 'motif'), lay: 'tile', ts: 'square', ar: 'grid', ps: 6, sp: 30, ...o }); await H.settle(page);
}
// red pixels of the canvas as it shows, counted in a box (fractions of the canvas)
const red = async (page, box) => page.evaluate(async ([b64, box]) => {
  const bin = atob(b64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
  const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
  const W = bm.width, Hh = bm.height, d = g.getImageData(0, 0, W, Hh).data; let n = 0;
  for (let y = Math.floor(box[1] * Hh); y < box[3] * Hh; y++) for (let x = Math.floor(box[0] * W); x < box[2] * W; x++) { const i = (y * W + x) * 4; if (d[i] > 200 && d[i + 1] < 60 && d[i + 2] < 60) n++ } return n;
}, [(await page.locator('#art').screenshot()).toString('base64'), box]);

test('a pattern inside a shape shows only inside its outline, and follows it when it moves', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  const [W, Hh] = await vb(page);
  await H.addShape(page, 'ellipse'); await page.keyboard.press('Escape'); await H.settle(page);
  const sh = (await st(page)).els.find(q => q.k === 'motif');
  await squares(page, { pcm: 'random', pcc: ['#ff0000'] });
  await page.evaluate(([u, W, Hh]) => { const s = JSON.parse(window.__wbTest.state()); const e = s.els.find(q => q.u === u); Object.assign(e, { x: W / 2, y: Hh / 2, s: Math.min(W, Hh) * .5, v: false }); const p = s.els.find(q => q.k === 'pattern'); p.pin = u; window.__wbTest.apply(JSON.stringify(s)); }, [sh.u, W, Hh]);
  await page.keyboard.press('Escape'); await H.settle(page, { max: 30000 });
  expect(await red(page, [.38, .4, .62, .6])).toBeGreaterThan(200);         // inside the (hidden) ellipse
  expect(await red(page, [0, 0, .2, .2])).toBe(0);                          // a corner, outside it
  await page.evaluate(([u, W]) => { const s = JSON.parse(window.__wbTest.state()); s.els.find(q => q.u === u).x = W * .25; window.__wbTest.apply(JSON.stringify(s)); }, [sh.u, W]);
  await H.settle(page, { max: 30000 });
  expect(await red(page, [.1, .4, .35, .6])).toBeGreaterThan(200);          // it moved with the shape
  expect(await red(page, [.7, .4, .95, .6])).toBe(0);
  expect(errors).toEqual([]);
});

test('density from a picture: pieces are bigger on its dark part, smaller on its light part; Count thins them out', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await page.click('#elb [data-k="image"]'); await H.settle(page);
  await page.setInputFiles('section.pn[data-p="image"] .pcfile', IMG); await H.settle(page, { max: 30000 });
  await page.keyboard.press('Escape'); await H.settle(page);
  const a = (await st(page)).els.find(q => q.k === 'image').a;   // the picture the Image element shows
  await squares(page, { dm: 'img', da: a, dv: 90, dk: 'size' });
  await page.waitForTimeout(500); await H.settle(page);
  const [W, Hh] = await vb(page), q = (ps, x0, y0) => ps.filter(([x, y]) => x > x0 * W && x < (x0 + .5) * W && y > y0 * Hh && y < (y0 + .5) * Hh);
  const avg = a => a.reduce((s, p) => s + p[2], 0) / Math.max(1, a.length);
  let ps = await pieces(page);
  const dark = q(ps, .5, 0), light = q(ps, 0, .5);   // navy top right, tan bottom left
  expect(dark.length).toBeGreaterThan(3); expect(light.length).toBeGreaterThan(3);
  expect(avg(dark)).toBeGreaterThan(avg(light) * 1.5);
  await setPat(page, { dk: 'count' }); await H.settle(page);
  ps = await pieces(page);
  expect(q(ps, .5, 0).length).toBeGreaterThan(q(ps, 0, .5).length * 1.5);
  expect(errors).toEqual([]);
});

test('a linear fade: pieces grow across the pattern, and Invert turns it round', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await squares(page, { dm: 'lin', dg: 0, dv: 100, dk: 'size' });
  const [W] = await vb(page), side = (ps, l) => ps.filter(([x]) => l ? x < W * .25 : x > W * .75), avg = a => a.reduce((s, p) => s + p[2], 0) / Math.max(1, a.length);
  let ps = await pieces(page);
  expect(avg(side(ps, false))).toBeGreaterThan(avg(side(ps, true)) * 2);
  await setPat(page, { di: 1 }); await H.settle(page);
  ps = await pieces(page);
  expect(avg(side(ps, true))).toBeGreaterThan(avg(side(ps, false)) * 2);
  expect(errors).toEqual([]);
});

test('the panel: Inside lists the other elements, Density sets its mode and shows its settings', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.addShape(page, 'ellipse'); await page.keyboard.press('Escape'); await H.settle(page);
  await squares(page);
  const opts = await page.locator('#pepin option').allTextContents();
  expect(opts[0]).toBe('None'); expect(opts.length).toBe(2);
  await page.evaluate(() => { const s = document.getElementById('pepin'); s.selectedIndex = 1; s.dispatchEvent(new Event('change', { bubbles: true })); }); await H.settle(page);   // (the list shows as the app's own dropdown)
  expect((await st(page)).els.find(q => q.k === 'pattern').pin).toBeTruthy();
  await page.click('#pedm [data-d="rad"]'); await H.settle(page);
  expect((await st(page)).els.find(q => q.k === 'pattern').dm).toBe('rad');
  await expect(page.locator('#pedb')).toBeVisible(); await expect(page.locator('#pedgr')).toBeHidden();
  await page.click('#pedk [data-k="both"]'); await H.settle(page);
  expect((await st(page)).els.find(q => q.k === 'pattern').dk).toBe('both');
  expect(errors).toEqual([]);
});
