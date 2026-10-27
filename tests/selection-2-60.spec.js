// 2.60.0 (artist test, owner Oct 27 2026): selection mistakes were the one frustration. A short slip of the pointer does not draw a box; a text is picked on its letters,
// not anywhere in its box; a click round the canvas ends the selection; a locked element is not picked on the canvas; Shift while moving turns the smart guides off;
// the guides and the selection box are drawn in the Highlight colour (Settings > General).
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));
const shapes = d => d.els.filter(q => q.k === 'motif' && !q.bgd);
const selected = page => page.locator('#fpov [data-fh="se"]').count();
async function setup(page, a = [[.3, .3, .2], [.7, .7, .2]]) {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
  for (let i = 0; i < a.length; i++) await H.addShape(page, 'rect');
  const d = await st(page), [cw, ch] = await page.locator('#art').evaluate(a => [a.viewBox.baseVal.width, a.viewBox.baseVal.height]);
  shapes(d).forEach((q, i) => Object.assign(q, { x: cw * a[i][0], y: ch * a[i][1], s: cw * a[i][2], wy: 1, r: 0 }));
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await H.settle(page);
  await page.keyboard.press('Escape'); await H.settle(page);
  return { errors, cw, ch };
}

test('a press on empty canvas that slips a few pixels draws no box; a longer drag does', async ({ page }) => {
  const { errors, cw, ch } = await setup(page);
  const a = await H.canvasToClient(page, cw * .5, ch * .5);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(a.x + 6, a.y + 5, { steps: 3 }); await page.mouse.up(); await H.settle(page);
  expect(await page.locator('#fpov .fpmq').count()).toBe(0);
  expect(await selected(page)).toBe(0);
  // from the empty middle across the lower shape
  const t = await H.canvasToClient(page, cw * .75, ch * .75);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(t.x, t.y, { steps: 6 }); await page.mouse.up(); await H.settle(page);
  expect(await selected(page)).toBe(1);
  expect(errors).toEqual([]);
});

test('a click on the empty space round the canvas ends the selection', async ({ page }) => {
  const { errors, cw, ch } = await setup(page);
  const p = await H.canvasToClient(page, cw * .3, ch * .3);
  await page.mouse.click(p.x, p.y); await H.settle(page);
  expect(await selected(page)).toBe(1);
  const b = await page.locator('#art').boundingBox(), s = await page.locator('main.stage').boundingBox();
  expect(b.x - s.x).toBeGreaterThan(20);   // there is room beside the canvas
  await page.mouse.click(s.x + (b.x - s.x) / 2, b.y + b.height / 2); await H.settle(page);
  expect(await selected(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('a text is picked on its letters, not in the empty corner of its box; once selected, its box drags it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  await H.placeArmed(page, 'text');
  await page.keyboard.press('Escape'); await H.settle(page);
  const q = (await st(page)).els.find(x => x.tx), k = q.s / Math.max(q.n || 1, .01), w = q.bw * k, h = q.bh * k;
  expect(await selected(page)).toBe(0);
  const c = await H.canvasToClient(page, q.x + w * .47, q.y + h * .47);   // the lower right corner of the box: no letter there
  await page.mouse.click(c.x, c.y); await H.settle(page);
  expect(await selected(page)).toBe(0);
  // the middle of the first letter
  const g = await page.locator('#art use').first().boundingBox();
  await page.mouse.click(g.x + g.width / 2, g.y + g.height / 2); await H.settle(page);
  expect(await selected(page)).toBe(1);
  await page.mouse.click(c.x, c.y); await H.settle(page);   // selected: its box is its own
  expect(await selected(page)).toBe(1);
  expect(errors).toEqual([]);
});

test('Lock in the Elements list: the canvas does not pick it, the box skips it, the lock unlocks it', async ({ page }) => {
  const { errors, cw, ch } = await setup(page);
  const u = shapes(await st(page))[0].u;
  await H.showPanel(page, 'lyrs');
  const row = page.locator(`#lyl2 .lyr[data-u="${u}"]`);
  await row.locator('[data-more]').click();
  await page.locator('.rowm .ddi', { hasText: 'Lock' }).first().click(); await H.settle(page);
  expect(shapes(await st(page))[0].lk).toBe(1);
  await expect(row.locator('[data-unlk]')).toHaveAttribute('aria-label', 'Unlock');
  await page.keyboard.press('Escape'); await H.settle(page);
  const p = await H.canvasToClient(page, cw * .3, ch * .3);
  await page.mouse.click(p.x, p.y); await H.settle(page);
  expect(await selected(page)).toBe(0);
  // a box over both picks only the unlocked one
  const a = await H.canvasToClient(page, cw * .05, ch * .05), b = await H.canvasToClient(page, cw * .95, ch * .95);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 6 }); await page.mouse.up(); await H.settle(page);
  expect(await page.evaluate(() => document.querySelectorAll('#fpov .sel, #fpov [data-fh="se"]').length)).toBeGreaterThan(0);
  await row.locator('[data-unlk]').click(); await H.settle(page);
  expect(shapes(await st(page))[0].lk).toBeUndefined();
  await page.keyboard.press('Escape'); await H.settle(page);
  await page.mouse.click(p.x, p.y); await H.settle(page);
  expect(await selected(page)).toBe(1);
  expect(errors).toEqual([]);
});

test('Shift while moving turns the smart guides off', async ({ page }) => {
  const { errors, cw, ch } = await setup(page, [[.45, .7, .15]]);
  const a = await H.canvasToClient(page, cw * .45, ch * .7), t = await H.canvasToClient(page, cw * .5, ch * .7);
  const lines = () => page.locator('#fpov .sgl').count();
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(t.x - 12, t.y + 9, { steps: 3 }); await page.mouse.move(t.x + 4, t.y, { steps: 3 }); await page.waitForTimeout(60);
  expect(await lines()).toBeGreaterThan(0);
  await page.keyboard.down('Shift'); await page.mouse.move(t.x + 3, t.y, { steps: 2 }); await page.waitForTimeout(60);
  expect(await lines()).toBe(0);
  await page.mouse.up(); await page.keyboard.up('Shift'); await H.settle(page);
  expect(Math.abs(shapes(await st(page))[0].x - cw / 2)).toBeGreaterThan(1);   // not snapped
  expect(errors).toEqual([]);
});

test('Settings > General > Highlight colours the guides and the selection box: the accent by default, the opposite, or a colour', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  const hl = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--hl').trim());
  const acc = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--acc').trim());
  expect(await hl()).toBe(acc);
  await page.click('#fileb'); await page.click('#stgo'); await expect(page.locator('#stgdlg')).toBeVisible();
  await page.click('#stgnav [data-p="general"]');
  await expect(page.locator('#stghn')).toHaveText('Accent');
  await page.click('#stghl [aria-label="Magenta"]');
  expect(await hl()).toBe('#d6336c');
  await expect(page.locator('#stghn')).toHaveText('Magenta');
  await page.click('#stghl [aria-label="Opposite"]');
  const o = await hl();
  expect(o).toMatch(/^#[0-9a-f]{6}$/); expect(o).not.toBe(acc);
  await page.keyboard.press('Escape');
  await page.reload(); await page.waitForFunction(() => window.__wbTest);
  expect(await hl()).toBe(o);   // kept
  expect(errors).toEqual([]);
});
