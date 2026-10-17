// 1.0.17: a floated panel does not cover the zoom controls; the stamp tray collapses to a thin strip (and is remembered); the book cover guide labels sit on solid chips.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

test('the stamp tray collapses to a thin strip, gives the picture the room, and stays collapsed after a reload', async ({ page }) => {
  const { errors } = await openApp(page);
  const h = () => page.evaluate(() => Math.round(document.querySelector('.stage .film').getBoundingClientRect().height));
  const board = () => page.evaluate(() => Math.round(document.getElementById('boardP').getBoundingClientRect().height));
  const full = await h(), boardFull = await board();
  expect(full).toBeGreaterThan(60);
  await page.click('#filmt');
  expect(await h()).toBeLessThan(40);
  await expect(page.locator('#filmt')).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(board).toBeGreaterThan(boardFull + 30);
  await page.reload(); await page.waitForFunction(() => document.fonts.status === 'loaded'); await settle(page);
  expect(await h()).toBeLessThan(40);
  await page.click('#filmt');
  expect(await h()).toBe(full);
  expect(errors).toEqual([]);
});

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
