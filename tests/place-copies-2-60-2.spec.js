// 2.60.2 (owner Oct 27 2026): Place copies, in a selected element's own group: a copy follows the pointer and each click places one more; Esc stops.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));

test('Place copies: a ghost follows the pointer, each click places a copy there, one history step each, Esc stops', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addShape(page, 'rect');
  const [cw, ch] = await page.locator('#art').evaluate(a => [a.viewBox.baseVal.width, a.viewBox.baseVal.height]);
  const q0 = (await st(page)).els.find(x => x.k === 'motif');
  await expect(page.locator('#lfpcp')).toBeVisible();
  await page.click('#lfpcp'); await H.settle(page);
  const pts = [[.2, .2], [.8, .3], [.5, .85]];
  for (const [fx, fy] of pts) {
    const c = await H.canvasToClient(page, cw * fx, ch * fy);
    await page.mouse.move(c.x - 5, c.y - 5); await page.mouse.move(c.x, c.y);
    await expect(page.locator('#fpov .gh').first()).toBeVisible();
    await page.mouse.click(c.x, c.y); await H.settle(page);
  }
  const all = (await st(page)).els.filter(x => x.k === 'motif');
  expect(all.length).toBe(4);
  pts.forEach(([fx, fy], i) => { const q = all[i + 1]; expect(q.m).toBe(q0.m); expect(q.s).toBe(q0.s); expect(Math.abs(q.x - cw * fx)).toBeLessThan(cw * .03); expect(Math.abs(q.y - ch * fy)).toBeLessThan(ch * .03); });
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await st(page)).els.filter(x => x.k === 'motif').length).toBe(3);
  await page.keyboard.press('Escape'); await H.settle(page);
  const c = await H.canvasToClient(page, cw * .5, ch * .5); await page.mouse.click(c.x, c.y); await H.settle(page);
  expect((await st(page)).els.filter(x => x.k === 'motif').length).toBe(3);
  expect(errors).toEqual([]);
});
