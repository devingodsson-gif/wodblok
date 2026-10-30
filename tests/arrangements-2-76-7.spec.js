// 2.76.7 (owner Oct 29 2026, docs/pattern-plan.md step 4): more arrangements and edges. Scatter keeps a minimum distance; a Spiral layout; Stripes, Bands, Chevron,
// Herringbone, Ogee and Fish scale; the 17 wallpaper groups (Wallpaper tile shape, each with a small picture); Edges: whole pieces only, and a margin.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));
const setPat = (page, o) => page.evaluate(o => { const s = JSON.parse(window.__wbTest.state()), p = s.els.find(q => q.k === 'pattern'); Object.assign(p, o); window.__wbTest.apply(JSON.stringify(s)); }, o);
const vb = page => page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
// the pieces as drawn: the middle of each shape piece on the canvas (data-mx, data-my of its group)
const pieces = page => page.evaluate(() => [...document.querySelectorAll('#dyn [data-mv*="."]')].map(g => [+g.dataset.mx, +g.dataset.my]));
async function shapes(page, o = {}) {
  await H.openPanel(page, 'layers'); await H.settle(page);
  await H.patSource(page, 'motif', 0); await H.settle(page);
  const p = (await st(page)).els.find(q => q.k === 'pattern');
  await setPat(page, { src: p.src.filter(s => s.k === 'motif'), ...o }); await H.settle(page);
}
const count = page => page.evaluate(() => document.querySelectorAll('#dyn [data-mv*="."]').length);

test('Scatter with a minimum distance keeps every two pieces apart', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await shapes(page, { lay: 'scatter', cn: 6, rn: 6, sd: 3, md: 0 });
  const close = ps => { let m = 1e9; for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) m = Math.min(m, Math.hypot(ps[i][0] - ps[j][0], ps[i][1] - ps[j][1])); return m };
  const [W, Hh] = await vb(page), cell = Math.min(W / 6, Hh / 6);
  await setPat(page, { md: 80 }); await H.settle(page);
  const ps = await pieces(page);
  expect(ps.length).toBeGreaterThan(10);
  expect(close(ps)).toBeGreaterThanOrEqual(cell * .8 - .5);
  expect(errors).toEqual([]);
});

test('every new layout and arrangement places pieces', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await shapes(page, { lay: 'spiral', cn: 5, rn: 5 });
  expect(await count(page)).toBe(25);
  for (const [ts, ar] of [['square', 'stripes'], ['square', 'bands'], ['square', 'chevron'], ['square', 'herring'], ['diamond', 'ogee'], ['circle', 'scale']]) {
    await setPat(page, { lay: 'tile', ts, ar, ps: 14, sp: 0 }); await H.settle(page);
    expect(await count(page), ts + ' ' + ar).toBeGreaterThan(8);
  }
  expect(errors).toEqual([]);
});

test('the 17 wallpaper groups: each places its copies and shows its picture', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await shapes(page, { lay: 'tile', ts: 'wall', ar: 'p1', ps: 10, sp: 0 });
  const opts = await page.locator('#pear option').evaluateAll(a => a.map(o => o.value));
  expect(opts).toEqual(['p1', 'p2', 'pm', 'pg', 'cm', 'pmm', 'pmg', 'pgg', 'cmm', 'p4', 'p4m', 'p4g', 'p3', 'p3m1', 'p31m', 'p6', 'p6m']);
  const per = { p1: 1, p2: 2, pm: 2, pg: 2, cm: 4, pmm: 4, pmg: 4, pgg: 4, cmm: 8, p4: 4, p4m: 8, p4g: 8, p3: 3, p3m1: 6, p31m: 6, p6: 6, p6m: 12 };
  for (const g of opts) {
    await setPat(page, { ar: g }); await H.settle(page);
    expect(await count(page), g).toBeGreaterThan(per[g] * 2);
    await expect(page.locator('#pewpv svg path'), g).toHaveCount(per[g] * 4);   // the picture: every copy over 2 x 2 cells
  }
  // a mirrored group puts mirrored pieces; a group of turns only turned ones
  const flips = () => page.evaluate(() => [...document.querySelectorAll('#dyn [data-mv*="."] > [transform*="scale(-"]')].length);
  await setPat(page, { ar: 'pm' }); await H.settle(page); expect(await flips()).toBeGreaterThan(0);
  await setPat(page, { ar: 'p4' }); await H.settle(page); expect(await flips()).toBe(0);
  expect(errors).toEqual([]);
});

test('Whole pieces keeps no piece across the edge, and the margin keeps them inside it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await shapes(page, { lay: 'tile', ts: 'square', ar: 'grid', ps: 13, sp: 10 });
  const [W, Hh] = await vb(page), S = Math.min(W, Hh) * .13;
  const cut = await pieces(page);
  expect(cut.some(([x, y]) => x - S / 2 < 0 || y - S / 2 < 0 || x + S / 2 > W || y + S / 2 > Hh)).toBe(true);   // cut at the edge: some cross it
  await H.openPanel(page, 'layers'); await page.click('#peeg [data-e="whole"]'); await H.settle(page);
  expect((await st(page)).els.find(q => q.k === 'pattern').ed).toBe('whole');
  const whole = await pieces(page);
  expect(whole.length).toBeGreaterThan(4);
  whole.forEach(([x, y]) => { expect(x - S / 2).toBeGreaterThanOrEqual(-.5); expect(y - S / 2).toBeGreaterThanOrEqual(-.5); expect(x + S / 2).toBeLessThanOrEqual(W + .5); expect(y + S / 2).toBeLessThanOrEqual(Hh + .5); });
  await setPat(page, { mg: 10 }); await H.settle(page);
  const m = Math.min(W, Hh) * .1, inner = await pieces(page);
  inner.forEach(([x, y]) => { expect(x - S / 2).toBeGreaterThanOrEqual(m - .5); expect(x + S / 2).toBeLessThanOrEqual(W - m + .5); });
  expect(errors).toEqual([]);
});

test('on a repeat tile the new arrangements and wallpaper groups stay seamless', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await shapes(page, { lay: 'tile', ts: 'square', ar: 'stripes', ps: 12, sp: 0 });
  await H.openPanel(page, 'canvas'); await page.click('#cfmt [data-f="tile"]'); await H.settle(page, { max: 30000 });
  const [W, Hh] = await vb(page);
  for (const [ts, ar] of [['square', 'stripes'], ['square', 'chevron'], ['square', 'herring'], ['diamond', 'ogee'], ['circle', 'scale'], ['wall', 'p4g'], ['wall', 'p6m']]) {
    await setPat(page, { ts, ar }); await H.settle(page, { max: 30000 });
    // seamless: the lattice was stretched so a whole number of repeats fits the tile; a piece just inside the right (bottom) edge then has its twin a tile's
    // width (height) back, just past the left (top) edge, where the arrangement also places pieces
    const ps = await pieces(page), S = Math.min(W, Hh) * .12;
    const near = (x, y) => ps.some(([a, b]) => Math.abs(a - x) < .6 && Math.abs(b - y) < .6);
    const right = ps.filter(([x, y]) => x > W - S * .9 && x < W && y > 0 && y < Hh), bottom = ps.filter(([x, y]) => y > Hh - S * .9 && y < Hh && x > 0 && x < W);
    expect(right.length + bottom.length, ts + ' ' + ar).toBeGreaterThan(0);
    right.forEach(([x, y]) => expect(near(x - W, y), ts + ' ' + ar + ' across').toBe(true));
    bottom.forEach(([x, y]) => expect(near(x, y - Hh), ts + ' ' + ar + ' down').toBe(true));
  }
  expect(errors).toEqual([]);
});
