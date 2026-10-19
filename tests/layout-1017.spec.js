// 1.0.17: a floated panel does not cover the zoom controls; the book cover guide labels sit on solid chips.
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

test('the book cover guide labels sit on solid chips', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'canvas');
  await page.click('#cfmt [data-f="book"]'); await settle(page);
  await page.check('#bkgd'); await settle(page);
  const labels = await page.evaluate(() => [...document.querySelectorAll('#guig text')].map(t => ({ t: t.textContent, chip: t.previousElementSibling && t.previousElementSibling.tagName === 'rect' && t.previousElementSibling.getAttribute('fill') === '#fff' })));
  expect(labels.map(l => l.t).sort()).toEqual(['BACK', 'BARCODE', 'FRONT', 'SPINE'].sort());
  expect(labels.every(l => l.chip)).toBe(true);
  expect(errors).toEqual([]);
});
