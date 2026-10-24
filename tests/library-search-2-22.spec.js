const { test, expect } = require('@playwright/test');
const { openApp, settle, openPanel } = require('./helpers/harness');
// 2.22.0: the motif library has a search field; a word lists matching motifs from every folder; clearing it restores the folders.
test('library search finds motifs by name across folders and clears back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'motifs');
  const tiles = () => page.locator('#lib button[data-m]').count();
  const folders = await page.locator('#lib .lrw').count();
  expect(folders).toBeGreaterThan(0);
  const name = await page.evaluate(() => { const b = document.querySelector('#lib button[data-m]'); return b ? b.getAttribute('aria-label') : null; });
  await page.fill('#lq', 'zzzzqq'); await settle(page);
  expect(await tiles()).toBe(0);
  await expect(page.locator('#lib .lmt')).toHaveText('No shapes found');
  await page.fill('#lq', ''); await settle(page);
  expect(await page.locator('#lib .lrw').count()).toBe(folders);
  if (name) {
    await page.click('#lib .lfr'); await settle(page);
    const first = (await page.locator('#lib button[data-m]').first().getAttribute('aria-label'));
    await page.fill('#lq', first.slice(0, 3)); await settle(page);
    expect(await tiles()).toBeGreaterThan(0);
    expect(await page.locator('#lib .lrw').count()).toBe(0);
  }
  expect(errors).toEqual([]);
});
