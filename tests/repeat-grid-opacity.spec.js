// The Canvas panel's Repeat grid opacity slider fades the 3 x 3 seam lines: 0 hides them, 100 is solid.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

test('Repeat grid opacity slider only shows on a repeat tile and sets the seam-line strength', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  await openPanel(page, 'canvas');
  await expect(page.locator('#tlobox')).toBeHidden();
  await page.click('#cfmt [data-f="tile"]');
  await settle(page);
  await expect(page.locator('#tlobox')).toBeVisible();
  const set = async v => { await page.$eval('#tlo', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v); };
  const op = () => page.evaluate(() => document.getElementById('artwrap').style.getPropertyValue('--tlo'));
  expect(await op()).toBe('92%');
  await set(0);
  expect(await op()).toBe('0%');
  await set(100);
  expect(await op()).toBe('100%');
  await page.click('#tpv');
  await settle(page);
  const bg = await page.evaluate(() => getComputedStyle(document.getElementById('artwrap'), '::after').backgroundImage);
  expect(bg).toContain('linear-gradient');
  await page.click('#cfmt [data-f="free"]');
  await settle(page);
  await expect(page.locator('#tlobox')).toBeHidden();
  expect(errors).toEqual([]);
});
