// 2.40.0: smart guides. A dragged element snaps its edges and middle to the canvas and to the other elements, and to equal spacing; a line
// marks each match and the equal gaps are marked. Alt turns snapping off; Settings > Guides has the switches; the command toggles it.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, addShape, canvasToClient } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const shapes = d => d.els.filter(q => q.k === 'motif' && !q.bgd);
// three shapes: two squares across the upper part, a smaller one below (a: [x, y, size] as fractions of the canvas width and height)
async function setup(page, a = [[.2, .3, .2], [.7, .3, .2], [.45, .7, .15]]) {
  const { errors } = await openApp(page, { seed: 4, background: true });
  for (let i = 0; i < a.length; i++) { await addShape(page, 'rect'); await settle(page); }
  const d = await st(page), [cw, ch] = await page.locator('#art').evaluate(a => [a.viewBox.baseVal.width, a.viewBox.baseVal.height]);   // 2.53.0: the Background is a Sheet, with no size of its own
  shapes(d).forEach((q, i) => Object.assign(q, { x: cw * a[i][0], y: ch * a[i][1], s: cw * a[i][2], wy: 1, r: 0 }));
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await settle(page);
  await page.keyboard.press('Escape'); await settle(page);
  return { errors, cw, ch };
}
// press on canvas point (x, y), move to (tx, ty) (canvas units) plus a few screen pixels (ox, oy); the button stays down
async function dragTo(page, x, y, tx, ty, ox = 0, oy = 0, mods = []) {
  const a = await canvasToClient(page, x, y), t = await canvasToClient(page, tx, ty);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  for (const m of mods) await page.keyboard.down(m);
  await page.mouse.move(t.x + ox - 12, t.y + oy + 9, { steps: 3 }); await page.mouse.move(t.x + ox, t.y + oy, { steps: 3 });
  await page.waitForTimeout(60);
}
const drop = async (page, mods = []) => { await page.mouse.up(); for (const m of mods) await page.keyboard.up(m); await settle(page); };
const marks = page => page.evaluate(() => ({ lines: document.querySelectorAll('#fpov .sgl').length, gaps: document.querySelectorAll('#fpov .sgs').length }));

test('a shape snaps its middle to the middle of the canvas, with a line; Alt drags freely; the guides go when it is let go', async ({ page }) => {
  const { errors, cw, ch } = await setup(page);
  await dragTo(page, cw * .45, ch * .7, cw * .5, ch * .7, 4, 0);
  expect((await marks(page)).lines).toBeGreaterThan(0);
  await drop(page);
  expect(shapes(await st(page))[2].x).toBeCloseTo(cw / 2, 0);
  expect(await marks(page)).toEqual({ lines: 0, gaps: 0 });
  await dragTo(page, cw * .5, ch * .7, cw * .5, ch * .7, 4, 0, ['Alt']);
  expect(await marks(page)).toEqual({ lines: 0, gaps: 0 });
  await drop(page, ['Alt']);
  expect(Math.abs(shapes(await st(page))[2].x - cw / 2)).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

test('edges line up with another element; the middle between two elements snaps with the two equal gaps marked', async ({ page }) => {
  const { errors, cw, ch } = await setup(page);
  // the small square's left edge onto the left square's left edge (x .1 of the width), a few pixels short
  const sz = cw * .15;
  await dragTo(page, cw * .45, ch * .7, cw * .1 + sz / 2, ch * .7, 4, 0);
  expect((await marks(page)).lines).toBeGreaterThan(0);
  await drop(page);
  expect(shapes(await st(page))[2].x - sz / 2).toBeCloseTo(cw * .1, 0);
  // into the gap between the squares, at their height: the middle between them (.45) and their middles (.3)
  const p = shapes(await st(page))[2];
  await dragTo(page, p.x, p.y, cw * .45, ch * .3, 3, 3);
  expect(await marks(page)).toEqual({ lines: 1, gaps: 2 });
  await drop(page);
  const q = shapes(await st(page))[2];
  expect(q.x).toBeCloseTo(cw * .45, 0); expect(q.y).toBeCloseTo(ch * .3, 0);
  expect(errors).toEqual([]);
});

test('several selected elements snap as one box; Escape puts them back and clears the guides', async ({ page }) => {
  const { errors, cw, ch } = await setup(page);
  for (const [x, y] of [[.2, .3], [.7, .3], [.45, .7]]) { const c = await canvasToClient(page, cw * x, ch * y); await page.keyboard.down('Shift'); await page.mouse.click(c.x, c.y); await page.keyboard.up('Shift'); await settle(page); }
  // the three together span .1 to .8 across: their middle (.45) goes to the canvas middle
  const d0 = shapes(await st(page));
  await dragTo(page, cw * .2, ch * .3, cw * .25, ch * .3, 4, 0);
  expect((await marks(page)).lines).toBeGreaterThan(0);
  await page.keyboard.press('Escape'); await settle(page);
  expect(await marks(page)).toEqual({ lines: 0, gaps: 0 });
  await page.mouse.up(); await settle(page);
  expect(shapes(await st(page)).map(q => q.x)).toEqual(d0.map(q => q.x));
  await dragTo(page, cw * .2, ch * .3, cw * .25, ch * .3, 4, 0);
  await drop(page);
  const xs = shapes(await st(page)).map(q => q.x);
  expect((Math.min(...xs) - cw * .1 + Math.max(...xs) + cw * .1) / 2).toBeCloseTo(cw / 2, 0);
  expect(errors).toEqual([]);
});

test('pulling a side snaps it to another element\'s edge', async ({ page }) => {
  const { errors, cw, ch } = await setup(page, [[.2, .3, .2], [.7, .3, .2]]);
  const a = await canvasToClient(page, cw * .2, ch * .3);
  await page.mouse.click(a.x, a.y); await settle(page);
  // the right side of the left square (x .3) toward the right square's left edge (x .6)
  await dragTo(page, cw * .3, ch * .3, cw * .6, ch * .3, -4, 0);
  expect((await marks(page)).lines).toBeGreaterThan(0);
  await drop(page);
  const q = shapes(await st(page))[0], w = +q.s * (+q.wx || 1);
  expect(q.x + w / 2).toBeCloseTo(cw * .6, 0);
  expect(q.x - w / 2).toBeCloseTo(cw * .1, 0);
  expect(errors).toEqual([]);
});

test('Settings > Guides: the switches, the distance, and the command', async ({ page }) => {
  const { errors, cw, ch } = await setup(page);
  await page.evaluate(() => __wbTest.commands.run('settings.open')); await settle(page);
  await page.locator('#stgnav [data-p="guides"]').click();
  for (const id of ['stgsg', 'stgsc', 'stgse', 'stgss']) await expect(page.locator('#' + id)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#stgsd [data-v="6"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#stgse').click();
  await expect(page.locator('#stgss')).toBeDisabled();
  await page.locator('#stgse').click();
  await page.locator('#stgsg').click();
  await expect(page.locator('#pgsg')).not.toBeChecked();
  for (const id of ['stgsc', 'stgse', 'stgss']) await expect(page.locator('#' + id)).toBeDisabled();
  // the command turns it back on and the open page follows
  await page.evaluate(() => __wbTest.commands.run('view.smartGuides')); await settle(page);
  await expect(page.locator('#stgsg')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#pgsg')).toBeChecked();   // the Grid panel's tick box is the same switch
  // Snap to canvas off: the canvas middle no longer pulls
  await page.locator('#stgsc').click();
  await page.keyboard.press('Escape'); await settle(page);
  await dragTo(page, cw * .45, ch * .7, cw * .5, ch * .7, 4, 0);
  await drop(page);
  expect(Math.abs(shapes(await st(page))[2].x - cw / 2)).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});
