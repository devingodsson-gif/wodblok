// 2.84.4 (patch 3 of docs/patch-todo-2.85.md): the stamp tab.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

async function newStampTab(page) {
  await H.showPanel(page, 'stmp'); await page.click('#smknew'); await H.settle(page); await page.click('#smkedit'); await H.settle(page);
  return page.evaluate(() => window.__wbTest.unlockedStamp());
}
const items = (page, sid) => page.evaluate(sid => JSON.parse(window.__wbTest.state()).tiles.find(t => t.id === sid).items, sid);
const gridOn = page => page.evaluate(() => { for (const id of ['pgs', 'pgn']) { const s = document.getElementById(id); s.checked = true; s.dispatchEvent(new Event('change', { bubbles: true })); } });

// T8
test('in a stamp\'s tab the alignment grid divides the stamp, and a dragged shape snaps to it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  const sid = await newStampTab(page);
  await H.stampTabRect(page);
  await gridOn(page); await H.settle(page);
  const vb = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
  const d = await page.evaluate(() => document.querySelector('#fpgrid path').getAttribute('d'));
  expect(d, 'the lines run the height of the stamp').toContain(`V${vb[1]}`);
  expect(d).not.toContain('V800');
  const n = await page.evaluate(() => JSON.parse(window.__wbTest.state()).proj.pgrid ? JSON.parse(window.__wbTest.state()).proj.pgrid.n : null);
  const b = await page.locator('#art').boundingBox(), q0 = (await items(page, sid))[0];
  const x = b.x + q0.x / vb[0] * b.width, y = b.y + q0.y / vb[1] * b.height;
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 70, y + 45, { steps: 6 }); await page.mouse.up(); await H.settle(page);
  const q = (await items(page, sid))[0], cells = d.match(/M[\d.]+ 0V/g).length - 1, c = vb[0] / cells;
  const onGrid = v => Math.abs(v / (c / 2) - Math.round(v / (c / 2))) < 0.01;
  expect(q.x).not.toBe(q0.x);
  expect(onGrid(q.x) && onGrid(q.y), `${q.x}, ${q.y} on a grid of ${c}`).toBe(true);
  expect(errors).toEqual([]);
});

test('on the canvas the grid still divides the canvas', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await gridOn(page); await H.settle(page);
  const vb = await page.evaluate(() => document.getElementById('art').viewBox.baseVal.height);
  expect(await page.evaluate(() => document.querySelector('#fpgrid path').getAttribute('d'))).toContain(`V${vb}`);
  expect(errors).toEqual([]);
});

// T12
test('a shape picked on its symmetry copy shows its box and handles on that copy, and the copy\'s handles size it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  const sid = await newStampTab(page);
  await H.armRect(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * .25, b.y + b.height * .3, { steps: 3 }); await page.mouse.click(b.x + b.width * .25, b.y + b.height * .3); await H.settle(page);
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.keyboard.press('v'); await H.settle(page);
  await H.showPanel(page, 'stmp'); await page.locator('#sym [data-y="lr"]').click(); await H.settle(page);
  await page.mouse.click(b.x + b.width * .5, b.y + b.height * .9); await H.settle(page);   // nothing selected
  const boxX = () => page.evaluate(() => { const r = document.querySelector('#stoh polygon.stes').getBoundingClientRect(); return r.x + r.width / 2; });
  await page.mouse.click(b.x + b.width * .75, b.y + b.height * .3); await H.settle(page);
  await expect(page.locator('#stoh .steh')).toHaveCount(9);
  expect(await boxX(page), 'the box is on the copy (right half)').toBeGreaterThan(b.x + b.width / 2);
  const s0 = (await items(page, sid))[0].s;
  const se = await page.locator('#stoh .steh[data-hd="se"]').boundingBox(), hx = se.x + se.width / 2, hy = se.y + se.height / 2;
  const pb = await page.evaluate(() => { const r = document.querySelector('#stoh polygon.stes').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  const ox = Math.sign(hx - pb[0]) * 40, oy = Math.sign(hy - pb[1]) * 40;   // outward from the copy's middle (on a mirrored copy the original's se corner is on its left)
  await page.mouse.move(hx, hy); await page.mouse.down(); await page.mouse.move(hx + ox, hy + oy, { steps: 6 }); await page.mouse.up(); await H.settle(page);
  { const q = (await items(page, sid))[0]; expect(q.s * (q.sx || 1), 'the copy\'s corner sizes the shape').toBeGreaterThan(s0 * 1.05); }
  await page.mouse.click(b.x + b.width * .5, b.y + b.height * .9); await H.settle(page);
  await page.mouse.click(b.x + b.width * .25, b.y + b.height * .3); await H.settle(page);
  expect(await boxX(page), 'picked on the original, the box is on the original').toBeLessThan(b.x + b.width / 2);
  expect(errors).toEqual([]);
});
