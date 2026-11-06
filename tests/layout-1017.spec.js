// 1.0.17: a floated panel does not cover the zoom controls; the book cover guide labels sit on solid chips.
// 2.108.0 (owner Nov 5 2026): the chips are gone; the labels sit above the cover in a screen overlay (tests/cover-guides-2-108.spec.js), and this test checks they are there.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

test('a panel floated from the dock lands clear of the colour tray, not on it', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'canvas');
  await page.locator('.dock .wb[data-act="float"], .wg [data-act="float"]').first().click();
  await expect(page.locator('.wg.fl')).toBeVisible();
  const r = await page.evaluate(() => { const f = document.querySelector('.wg.fl').getBoundingClientRect(), z = document.getElementById('tyd').getBoundingClientRect(); return { fTop: f.top, zBottom: z.bottom, overlap: f.right > z.left && f.left < z.right && f.bottom > z.top && f.top < z.bottom }; });
  expect(r.overlap, 'the floated panel covers the zoom controls').toBe(false);
  expect(errors).toEqual([]);
});

test('the book cover guide labels are shown (above the cover since 2.108.0)', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'canvas');
  await page.click('#cfmt [data-f="book"]'); await settle(page);
  await page.check('#bkgd'); await settle(page);
  await page.waitForFunction(() => document.querySelectorAll('#bkl .bkt').length > 0);
  const labels = await page.evaluate(() => [...document.querySelectorAll('#bkl .bkt')].map(t => t.textContent));
  expect(labels.sort()).toEqual(['Back', 'Barcode', 'Front', 'Spine'].sort());
  expect(await page.locator('#guig text').count(), 'no label is drawn in the artwork').toBe(0);
  expect(errors).toEqual([]);
});
