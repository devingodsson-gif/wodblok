const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// 2.24.0 "Nothing lost, nothing out of reach": every element can be found and reached, and nothing is thrown away without a word.
const st = async page => JSON.parse(await H.getState(page));

test('after Randomize, stamps placed on their own are in the Elements list and can be clicked', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 23, pattern: false });
  await page.click('#rzdo'); await H.settle(page, { max: 60000 });
  const s = await st(page);
  const free = s.els.filter(e => e.k === 'stamp');
  expect(free.length, 'seed 23 places stamps on their own').toBeGreaterThan(0);
  await page.click('.rail [data-pn="lyrs"]'); await H.settle(page);
  expect(await page.locator('#lyl2 [data-u].lyr').count(), 'one list row per element').toBe(s.els.length);
  const c = await H.canvasToClient(page, free[0].x, free[0].y);
  await page.mouse.click(c.x, c.y); await H.settle(page);
  expect(await page.locator('#fpov [data-fh]').count(), 'the clicked stamp shows its handles').toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
