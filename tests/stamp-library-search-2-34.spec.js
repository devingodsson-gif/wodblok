const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');
// 2.34.0: the saved-stamp Library has a "Find a stamp" field; words filter the saved stamps by name, clearing restores the list.
test('Find a stamp filters the saved stamps by name and clears back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  for (const n of ['Lion in a ring', 'Red fish']) {
    await page.fill('#slname', n); await page.click('#slsave'); await settle(page);
  }
  const cards = () => page.locator('#slgrid button[data-sl]:not([data-sl^="bs:"])').count();
  expect(await cards()).toBe(2);
  await page.fill('#slq', 'lion'); await settle(page);
  expect(await cards()).toBe(1);
  await expect(page.locator('#slcount')).toHaveText('2');   // the count is the whole library
  await page.fill('#slq', 'zzzzqq'); await settle(page);
  expect(await cards()).toBe(0);
  await expect(page.locator('#slgrid .lmt')).toHaveText('No stamps found');
  await page.fill('#slq', ''); await settle(page);
  expect(await cards()).toBe(2);
  await expect(page.locator('#slcount')).toHaveText('2');
  expect(errors).toEqual([]);
});
