// 2.87.3 (docs/pro-basics-plan.md step 3): Alt held as a drag begins leaves the original and drags a copy (one History step, "Duplicated"), on the canvas
// (an element or a whole selection) and in a stamp's tab. The smart guides work as in a move; Esc and Undo take the copy away.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));
const motifs = d => d.els.filter(q => q.k === 'motif');
const labels = page => page.evaluate(() => window.__wbTest.histLabels());
async function setup(page, n = 1) {
  const r = await H.openApp(page, { seed: 4, pattern: false });
  for (let i = 0; i < n; i++) { await H.addShape(page); await H.settle(page); }
  const W = await page.locator('#art').evaluate(e => e.viewBox.baseVal.width), d = await st(page);
  motifs(d).forEach((q, i) => Object.assign(q, { x: W * (.3 + .4 * i), y: W * .4, s: W * .15, wy: 1, r: 0 }));
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await H.settle(page);
  await page.keyboard.press('Escape'); await H.settle(page);
  return { ...r, W };
}
async function altDrag(page, from, to, { esc = false, ox = 0 } = {}) {
  const a = await H.canvasToClient(page, ...from), t = await H.canvasToClient(page, ...to);
  await page.mouse.move(a.x, a.y); await page.keyboard.down('Alt'); await page.mouse.down();
  await page.mouse.move(t.x + ox, t.y, { steps: 6 });
  if (esc) await page.keyboard.press('Escape');
  await page.mouse.up(); await page.keyboard.up('Alt'); await H.settle(page);
}

test('Alt-drag on the canvas leaves the shape and drags a copy, which snaps like a move; one History step; Undo and Esc take the copy away', async ({ page }) => {
  const { errors, W } = await setup(page);
  const q0 = motifs(await st(page))[0];
  // an Alt-click alone changes nothing
  const c = await H.canvasToClient(page, q0.x, q0.y); await page.keyboard.down('Alt'); await page.mouse.click(c.x, c.y); await page.keyboard.up('Alt'); await H.settle(page);
  expect(motifs(await st(page)).length).toBe(1);
  // straight down, a few pixels off to the side: the copy's middle snaps under the original's
  await altDrag(page, [q0.x, q0.y], [q0.x, q0.y + W * .5], { ox: 3 });
  let m = motifs(await st(page)); expect(m.length).toBe(2);
  expect(m[0].x).toBeCloseTo(q0.x, 1); expect(m[0].y).toBeCloseTo(q0.y, 1);
  expect(m[1].x).toBeCloseTo(q0.x, 1); expect(m[1].y).toBeGreaterThan(q0.y + W * .3);
  expect(m[1].u).not.toBe(m[0].u);
  expect((await labels(page)).slice(-1)[0]).toBe('Duplicated');
  await page.keyboard.press('Control+z'); await H.settle(page);
  m = motifs(await st(page)); expect(m.length).toBe(1); expect(m[0].y).toBeCloseTo(q0.y, 1);
  await altDrag(page, [q0.x, q0.y], [q0.x + W * .2, q0.y], { esc: true });
  m = motifs(await st(page)); expect(m.length).toBe(1); expect(m[0].x).toBeCloseTo(q0.x, 1);
  expect(errors).toEqual([]);
});

test('Alt-drag of a selection copies all of it', async ({ page }) => {
  const { errors, W } = await setup(page, 2);
  await page.mouse.click(5, 300); await page.keyboard.press('Control+a'); await H.settle(page);
  const m0 = motifs(await st(page));
  await altDrag(page, [m0[0].x, m0[0].y], [m0[0].x, m0[0].y + W * .5]);
  const m = motifs(await st(page)); expect(m.length).toBe(4);
  const moved = m.filter(q => q.y > m0[0].y + W * .3); expect(moved.length).toBe(2);
  expect(m.filter(q => Math.abs(q.y - m0[0].y) < .5).length).toBe(2);
  expect(errors).toEqual([]);
});

test('Alt-drag in a stamp\'s tab leaves the shape and drags a copy', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.openPanel(page, 'stmp'); await page.click('#smknew'); await H.settle(page);
  await H.stampTabRect(page);
  const items = async () => { const d = await st(page), t = d.tiles[d.tiles.length - 1]; return t.items; };
  const n0 = (await items()).length, q = (await items())[n0 - 1], b = await page.locator('#art').boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.keyboard.down('Alt'); await page.mouse.down(); await page.mouse.move(x + 60, y + 40, { steps: 6 }); await page.mouse.up(); await page.keyboard.up('Alt'); await H.settle(page);
  const it = await items(); expect(it.length).toBe(n0 + 1);
  expect(it[n0 - 1].x).toBeCloseTo(q.x, 1); expect(it[n0 - 1].y).toBeCloseTo(q.y, 1);
  expect(Math.hypot(it[n0].x - q.x, it[n0].y - q.y)).toBeGreaterThan(5);
  await page.waitForTimeout(600); expect((await labels(page)).slice(-1)[0]).toBe('Duplicated');
  await page.mouse.click(5, 300); await page.keyboard.press('Control+z'); await H.settle(page);
  const u = await items(); expect(u.length).toBe(n0); expect(u[n0 - 1].x).toBeCloseTo(q.x, 1);
  expect(errors).toEqual([]);
});
