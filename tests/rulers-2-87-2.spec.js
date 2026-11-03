// 2.87.2 (docs/pro-basics-plan.md step 2): rulers and guides on the Canvas tab. View > Rulers (Mod+R) shows rulers in the chosen units that follow
// zoom and pan; guides are dragged out of a ruler, moved, dragged back to remove, locked, hidden, cleared, added by New guide…, snapped to, and kept
// in the project. A stamp's tab shows neither (owner, Nov 3 2026).
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));
const gd = async page => (await st(page)).proj.gd || { x: [], y: [] };
const labels = page => page.evaluate(() => window.__wbTest.histLabels());
const board = page => page.locator('#boardP').boundingBox();
// the screen position of each guide line, and of the canvas's left and top edges
const lines = page => page.evaluate(() => [...document.querySelectorAll('#rug .rgd')].map(e => { const r = e.getBoundingClientRect(); return e.classList.contains('rgv') ? ['x', r.left + r.width / 2] : ['y', r.top + r.height / 2]; }));
const art = page => page.locator('#art').boundingBox();
async function pull(page, from, to) { await page.mouse.move(from[0], from[1]); await page.mouse.down(); await page.mouse.move(to[0], to[1], { steps: 4 }); await page.mouse.up(); await H.settle(page); }

test('Mod+R shows the rulers; a guide pulled from each ruler lands where it is let go, follows zoom and pan, and goes when pulled back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await expect(page.locator('#rul')).toBeHidden();
  await page.mouse.click(5, 300); await page.keyboard.press('Control+r'); await H.settle(page);
  await expect(page.locator('#rux')).toBeVisible(); await expect(page.locator('#ruy')).toBeVisible();
  const b = await board(page), a = await art(page);
  await pull(page, [b.x + 300, b.y + 8], [b.x + 300, a.y + 100]);
  expect((await labels(page)).slice(-1)[0]).toBe('Added guide');
  await pull(page, [b.x + 8, b.y + 300], [a.x + 50, b.y + 300]);
  let g = await gd(page); expect(g.y.length).toBe(1); expect(g.x.length).toBe(1);
  const vb = await page.locator('#art').evaluate(e => e.viewBox.baseVal.width), k = vb / a.width;
  expect(g.y[0]).toBeCloseTo(100 * k, 0); expect(g.x[0]).toBeCloseTo(50 * k, 0);
  // the lines sit on the canvas where they were let go, and stay there through a zoom and a pan
  const on = async () => { const A = await art(page), L = await lines(page), s = A.width / vb;
    expect(L.find(z => z[0] == 'x')[1]).toBeCloseTo(A.x + g.x[0] * s, -0.5); expect(L.find(z => z[0] == 'y')[1]).toBeCloseTo(A.y + g.y[0] * s, -0.5); };
  await on();
  await page.evaluate(() => window.__wbTest.commands.run('view.zoomIn')); await H.settle(page); await on();
  await page.evaluate(() => window.__wbTest && document.getElementById('boardP') && (document.getElementById('boardP').scrollLeft += 40)); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await on();
  // a guide dragged back onto its ruler is removed (one History step); undo brings it back
  const L = await lines(page), y = L.find(z => z[0] == 'y')[1];
  await pull(page, [b.x + 500, y], [b.x + 500, b.y + 6]);
  g = await gd(page); expect(g.y.length).toBe(0); expect((await labels(page)).slice(-1)[0]).toBe('Removed guide');
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await gd(page)).y.length).toBe(1);
  await page.keyboard.press('Control+r'); await H.settle(page);
  await expect(page.locator('#rux')).toBeHidden();
  await expect(page.locator('#rug .rgd')).toHaveCount(2);   // the guides stay with the rulers off
  expect(errors).toEqual([]);
});

test('New guide takes a position in units; Lock guides stops dragging; Guides hides them; Clear guides removes them', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await page.evaluate(() => window.__wbTest.commands.run('view.newGuide'));
  await expect(page.locator('#rngd')).toBeVisible(); await expect(page.locator('#rngu')).toHaveText('mm');
  await page.locator('#rngv').click(); await page.locator('#rngp').fill('50mm'); await page.locator('#rngp').press('Enter'); await H.settle(page);
  await expect(page.locator('#rngd')).toBeHidden();
  const [W, Hh] = await page.locator('#art').evaluate(e => [e.viewBox.baseVal.width, e.viewBox.baseVal.height]), k = 300 / Math.max(W, Hh);
  let g = await gd(page); expect(g.x.length).toBe(1); expect(g.x[0] * k).toBeCloseTo(50, 1);
  // bad input is marked and adds nothing; Esc closes
  await page.evaluate(() => window.__wbTest.commands.run('view.newGuide'));
  await page.locator('#rngp').fill('abc'); await page.locator('#rngok').click();
  await expect(page.locator('#rngp')).toHaveClass(/bad/); await page.keyboard.press('Escape'); await expect(page.locator('#rngd')).toBeHidden();
  expect((await gd(page)).x.length).toBe(1);
  // locked: pressing on the guide does nothing
  await page.evaluate(() => window.__wbTest.commands.run('view.lockGuides'));
  const x = (await lines(page))[0][1], b = await board(page);
  await pull(page, [x, b.y + 400], [x + 80, b.y + 400]);
  expect((await gd(page)).x[0] * k).toBeCloseTo(50, 1);
  await page.evaluate(() => window.__wbTest.commands.run('view.lockGuides'));
  await expect(page.locator('#rul')).not.toHaveClass(/rulk/);   // unlocked: the guide takes the pointer again (drawn on the next frame)
  await pull(page, [x, b.y + 400], [x + 80, b.y + 400]);
  expect((await gd(page)).x[0] * k).toBeGreaterThan(52);
  expect((await labels(page)).slice(-1)[0]).toBe('Moved guide');
  await page.keyboard.press("Control+'"); await H.settle(page);
  await expect(page.locator('#rug .rgd')).toHaveCount(0);
  await page.keyboard.press("Control+'"); await H.settle(page);
  await expect(page.locator('#rug .rgd')).toHaveCount(1);
  await page.evaluate(() => window.__wbTest.commands.run('view.clearGuides')); await H.settle(page);
  expect((await st(page)).proj.gd).toBeUndefined();
  expect(errors).toEqual([]);
});

test('a dragged shape snaps to a guide; guides are saved with the project; a stamp\'s tab shows no rulers or guides', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page); await page.keyboard.press('Escape'); await H.settle(page);
  const [W] = await page.locator('#art').evaluate(e => [e.viewBox.baseVal.width]);
  let d = await st(page); const q = d.els.find(e => e.k === 'motif');
  d.proj.gd = { x: [W * .2], y: [] }; Object.assign(q, { x: W * .5, y: W * .5, s: W * .2, wy: 1, r: 0 });
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await H.settle(page);
  // the shape's left edge to a few pixels right of the guide: it snaps onto it
  const a = await H.canvasToClient(page, W * .5, W * .5), t = await H.canvasToClient(page, W * .3, W * .5);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(t.x + 3, t.y, { steps: 6 }); await page.mouse.up(); await H.settle(page);
  d = await st(page); const q2 = d.els.find(e => e.k === 'motif');
  expect(q2.x - q2.s / 2).toBeCloseTo(W * .2, 1);
  expect(d.proj.gd.x[0]).toBeCloseTo(W * .2, 2);   // kept in the document, so saving and opening keep it
  await page.keyboard.press('Escape'); await page.mouse.click(5, 300); await page.keyboard.press('Control+r'); await H.settle(page);
  await expect(page.locator('#rul')).toBeVisible();
  await H.openPanel(page, 'stmp'); await page.click('#smknew'); await H.settle(page);
  await expect(page.locator('body')).toHaveClass(/stedit/);
  await expect(page.locator('#rul')).toBeHidden();
  expect(errors).toEqual([]);
});
