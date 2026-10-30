// 2.76.10 (owner Oct 29 2026, docs/pattern-plan.md step 7): editing one piece of a pattern (Edit pieces: pick a piece on the canvas, delete, swap its source,
// recolour, move and turn it, or make it its own element), kept with its place when Size changes; a Pattern as the source of another; an accent between the pieces.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));
const pats = async page => (await st(page)).els.filter(q => q.k === 'pattern');
const setPat = (page, o, n = 'Pattern 1') => page.evaluate(([o, n]) => { const s = JSON.parse(window.__wbTest.state()), p = s.els.find(q => q.k === 'pattern' && q.n === n) || s.els.find(q => q.k === 'pattern'); Object.assign(p, o); window.__wbTest.apply(JSON.stringify(s)); }, [o, n]);
const pieces = page => page.evaluate(() => [...document.querySelectorAll('#dyn [data-mv*="."]')].map(g => { const r = g.querySelector('rect'); return [+g.dataset.mx, +g.dataset.my, r ? +r.getAttribute('width') : 0] }));
const toScreen = async (page, x, y) => { const b = await page.locator('#art').boundingBox(), v = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height] }); return [b.x + x / v[0] * b.width, b.y + y / v[1] * b.height] };
// a new Pattern of squares (the first Basic shape), selected, with Edit pieces on
async function squares(page) {
  await page.click('#elb [data-k="pattern"]'); await H.addKind(page, 'pattern'); await H.settle(page);
  await H.openPanel(page, 'layers'); await H.settle(page);
  await H.patSource(page, 'motif', 0); await H.settle(page);
  await page.click('#pesrc [data-sx="0"]'); await H.settle(page);   // keep only the shape
  await setPat(page, { lay: 'tile', ts: 'square', ar: 'grid', ps: 10, sp: 40 }); await H.settle(page);
  await page.locator('#pepe').check(); await H.settle(page);
}

test('Edit pieces: pick a piece, delete it; the edit stays with its place when Size changes, and Undo brings it back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addStamp(page); await page.keyboard.press('Escape'); await H.settle(page);
  await squares(page);
  const all = await pieces(page), n0 = all.length, c = all.reduce((m, p) => Math.hypot(p[0] - 266, p[1] - 400) < Math.hypot(m[0] - 266, m[1] - 400) ? p : m);
  const [sx, sy] = await toScreen(page, c[0], c[1]);
  await page.mouse.click(sx, sy); await H.settle(page);
  await expect(page.locator('#pepg')).toBeVisible();
  await page.click('#pepdel'); await H.settle(page);
  const pe = (await pats(page))[0].pe;
  expect(Object.values(pe)).toEqual([{ d: 1 }]);
  expect((await pieces(page)).length).toBe(n0 - 1);
  expect((await pieces(page)).some(p => Math.hypot(p[0] - c[0], p[1] - c[1]) < 1)).toBe(false);
  await setPat(page, { ps: 8 }); await H.settle(page);
  const after = await pieces(page);
  expect(Object.keys((await pats(page))[0].pe)).toEqual(Object.keys(pe));   // still the same place
  await setPat(page, { ps: 10 }); await H.settle(page);
  expect((await pieces(page)).length).toBe(n0 - 1);
  await page.keyboard.press('Control+z'); await H.settle(page); await page.keyboard.press('Control+z'); await H.settle(page); await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await pats(page))[0].pe).toBeUndefined();
  expect(after.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('a piece can be dragged, turned, recoloured and made its own element', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addStamp(page); await page.keyboard.press('Escape'); await H.settle(page);
  await squares(page);
  const all = await pieces(page), c = all[Math.floor(all.length / 2)];
  const [sx, sy] = await toScreen(page, c[0], c[1]), [tx, ty] = await toScreen(page, c[0] + 20, c[1] + 10);
  await page.mouse.move(sx, sy); await page.mouse.down(); await page.mouse.move(tx, ty, { steps: 4 }); await page.mouse.up(); await H.settle(page);
  let E = Object.values((await pats(page))[0].pe || {})[0];
  expect(E.dx).toBeCloseTo(20, 0); expect(E.dy).toBeCloseTo(10, 0);
  await page.evaluate(() => { const r = document.getElementById('pepdr'); r.value = 90; r.dispatchEvent(new Event('input', { bubbles: true })); }); await H.settle(page);
  await page.evaluate(() => { const s = document.getElementById('pepcol'); if (s.options.length > 1) { s.selectedIndex = 1; s.dispatchEvent(new Event('change', { bubbles: true })); } }); await H.settle(page);
  E = Object.values((await pats(page))[0].pe)[0];
  expect(E.dr).toBe(90);
  const n0 = (await st(page)).els.length;
  await page.click('#pepown'); await H.settle(page);
  const s = await st(page), own = s.els.find(q => q.k === 'motif' && !q.pu);
  expect(s.els.length).toBe(n0 + 1);
  expect(own.x).toBeCloseTo(c[0] + 20, 0); expect(own.y).toBeCloseTo(c[1] + 10, 0); expect(own.r).toBe(90);
  expect(Object.values(s.els.find(q => q.k === 'pattern').pe)).toEqual([{ d: 1 }]);
  expect(errors).toEqual([]);
});

test('a Pattern can print another Pattern at each of its places', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addStamp(page); await page.keyboard.press('Escape'); await H.settle(page);
  await squares(page);
  await page.locator('#pepe').uncheck();
  await setPat(page, { ps: 30, sp: 0 }); await H.settle(page);
  const inner = (await pieces(page)).length;
  await page.keyboard.press('Escape'); await H.settle(page);
  await page.click('#elb [data-k="pattern"]'); await H.addKind(page, 'pattern'); await H.settle(page);
  await H.openPanel(page, 'layers'); await H.settle(page);
  await page.locator('#peadd').scrollIntoViewIfNeeded(); await page.waitForTimeout(150);   // the menu closes when its panel scrolls
  await page.click('#peadd'); await page.locator('.rowm .ddi', { hasText: 'Pattern 1' }).click(); await H.settle(page);
  const p2 = (await pats(page)).find(q => q.n === 'Pattern 2');
  expect(p2.src.some(x => x.k === 'pattern')).toBe(true);
  await page.click('#pesrc [data-sx="0"]'); await H.settle(page);   // only the pattern
  await setPat(page, { lay: 'tile', ts: 'square', ar: 'grid', ps: 20, sp: 0 }, 'Pattern 2'); await H.settle(page);
  expect((await pieces(page)).length).toBeGreaterThan(inner * 4);
  expect(errors).toEqual([]);
});

test('an accent puts smaller pieces between the main ones', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addStamp(page); await page.keyboard.press('Escape'); await H.settle(page);
  await squares(page);
  await page.locator('#pepe').uncheck();
  const a = await pieces(page);
  await page.locator('#peac').check(); await H.settle(page);
  expect((await pats(page))[0].ac).toMatchObject({ on: 1, z: 40 });
  const b = await pieces(page), big = Math.max(...b.map(p => p[2])), small = b.filter(p => p[2] < big * .6);
  expect(b.length).toBeGreaterThan(a.length * 1.5);
  expect(small.length).toBeGreaterThan(a.length * .5);
  expect(errors).toEqual([]);
});
