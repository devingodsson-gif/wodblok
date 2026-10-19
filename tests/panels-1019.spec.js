// 1.0.19 (UX review 2: N2, N4 label, N7): no "Last roll" paragraph, no step numbers in Import artwork, a labelled Save snapshot button, shape names not clipped.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

test('Randomize shows no "Last roll" paragraph after a roll (the status line reports it)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'rand');
  await page.click('#rzdo');
  await settle(page);
  await expect(page.locator('section.pn[data-p="rand"]')).not.toContainText('Last roll');
  await expect(page.locator('#pmsg')).toContainText('Randomized');
  expect(errors).toEqual([]);
});

test('History has a labelled Save snapshot button that still saves one', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'hist');
  await expect(page.locator('#hsadd')).toHaveText('Save snapshot');
  await page.click('#hsadd');
  await page.keyboard.press('Enter');
  await settle(page);
  await expect(page.locator('#hsl')).toContainText('Snapshot');
  expect(errors).toEqual([]);
});

test('Canvas shape names fit their buttons', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'canvas');
  const clipped = await page.evaluate(() => [...document.querySelectorAll('#cshp button span')].filter(e => e.scrollWidth > e.parentElement.clientWidth - 2).map(e => e.textContent));
  expect(clipped).toEqual([]);
  expect(errors).toEqual([]);
});
