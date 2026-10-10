// Text on a stamp stays readable under symmetry; mirroring it is a choice (UX review D6).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

test('with 4-way symmetry the letters are drawn once; Mirror text with symmetry draws the copies', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'Ab');
  await page.click('#tx_go');
  await settle(page, { max: 30000 });
  await openPanel(page, 'stamp');
  await page.click('#sym [data-y="quad"]');
  await settle(page);
  const n = JSON.parse(await getState(page)).tiles[0].items.filter(q => q.tg).length;
  expect(n).toBeGreaterThan(0);
  await expect(page.locator('#symtxr')).toBeVisible();
  await expect(page.locator('#symtx')).not.toBeChecked();
  const once = await page.evaluate(() => document.querySelectorAll('#ed [data-i]').length);
  await page.check('#symtx');
  await settle(page);
  const mirrored = await page.evaluate(() => document.querySelectorAll('#ed [data-i]').length);
  expect(mirrored).toBeGreaterThan(once);
  expect(JSON.parse(await getState(page)).tiles[0].sym.tx).toBe(1);
  expect(errors).toEqual([]);
});
