// Task bar (Phase 5): pin commands from command search, run them from the bar, unpin, keep after reload.
const { test, expect } = require('@playwright/test');
const { openApp, settle } = require('./helpers/harness');

const pin = async (page, text) => {
  await page.click('#cmdkb'); await page.fill('#cmdki', text);
  await page.locator('#cmdkl .ckr', { hasText: text }).first().locator('.ckp').click();
  await page.keyboard.press('Escape');
};

test('the bar is not shown until something is pinned; pinned commands run from it, unpin removes them, and they survive a reload', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('#tbar')).toBeHidden();
  await pin(page, 'Fit to screen');
  await pin(page, 'Switch light / dark');
  await expect(page.locator('#tbar .tbb')).toHaveText(['Fit to screen', 'Switch light / dark']);
  const th = await page.evaluate(() => document.documentElement.dataset.theme || '');
  await page.locator('#tbar .tbb', { hasText: 'Switch light' }).click(); await settle(page);
  expect(await page.evaluate(() => document.documentElement.dataset.theme || '')).not.toBe(th);
  await page.reload(); await page.waitForSelector('#tbar .tbb');
  await expect(page.locator('#tbar .tbb')).toHaveText(['Fit to screen', 'Switch light / dark']);
  await pin(page, 'Fit to screen');                                     // the same pin button unpins
  await expect(page.locator('#tbar .tbb')).toHaveText(['Switch light / dark']);
  await pin(page, 'Switch light / dark');
  await expect(page.locator('#tbar')).toBeHidden();
  expect(errors).toEqual([]);
});
