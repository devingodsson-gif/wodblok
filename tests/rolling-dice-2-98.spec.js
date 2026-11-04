// 2.98.0 (owner Nov 4 2026): the Randomize button's dice tumbles through its faces while it spins and lands on a face from one to six
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const pips = page => page.evaluate(() => document.querySelectorAll('#rzdo svg circle').length);
test('a roll shows several faces while the dice spins and lands on one from 1 to 6', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 3 });
  expect(await pips(page)).toBe(5);   // the dice at rest, before any roll
  await page.evaluate(() => { window.__faces = []; const sv = document.querySelector('#rzdo svg'); new MutationObserver(() => window.__faces.push(sv.querySelectorAll('circle').length)).observe(sv, { childList: true }); });
  await page.locator('#rzdo').click(); await H.settle(page); await page.waitForTimeout(700);
  const f = await page.evaluate(() => window.__faces);
  expect(f.length).toBeGreaterThanOrEqual(5);
  f.forEach((n, i) => { expect(n).toBeGreaterThanOrEqual(1); expect(n).toBeLessThanOrEqual(6); if (i) expect(n).not.toBe(f[i - 1]); });
  expect(await pips(page)).toBe(f.at(-1));
  expect(errors).toEqual([]);
});
