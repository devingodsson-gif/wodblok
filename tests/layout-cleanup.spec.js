// 2.71.0: the Canvas panel has no Ink edges (Roughness, Ink squash) and the Book canvas has no Cover overlay; the project holds neither, and the book guides still work.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

test('Ink edges and Cover overlay are gone from the Canvas panel and the project', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await openPanel(page, 'canvas');
  for (const id of ['rgh', 'psq', 'cov', 'covtx', 'gdcov', 'covg']) await expect(page.locator('#' + id)).toHaveCount(0);
  for (const t of ['Ink edges', 'Cover overlay']) await expect(page.locator('summary', { hasText: t })).toHaveCount(0);
  await expect(page.locator('#rzdo')).toHaveCount(1);
  const s = JSON.parse(await getState(page));
  expect(s.pr).toBeUndefined();
  expect(errors).toEqual([]);
});

test('Randomize no longer offers Ink edges and rolls no print settings', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await expect(page.locator('[data-sub="pr.edges"]')).toHaveCount(0);
  await page.click('#rzdo'); await settle(page, { max: 90000 });
  expect(JSON.parse(await getState(page)).pr).toBeUndefined();
  expect(errors).toEqual([]);
});

test('a Book cover canvas has its guides but no Cover overlay', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await openPanel(page, 'canvas');
  await page.click('#cfmt [data-f="book"]'); await settle(page);
  await expect(page.locator('#bkgd')).toHaveCount(1);
  await expect(page.locator('summary', { hasText: 'Cover overlay' })).toHaveCount(0);
  await page.check('#bkgd'); await settle(page);
  expect(await page.locator('#guig text').count()).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
