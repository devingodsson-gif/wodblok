// 2.59.0 (owner Oct 27 2026): Export recipes is the shared folder tree like the other libraries: Starting points is a set, yours sit in Yours and your folders,
// a click loads a recipe into Custom export, the row's own button exports, Export and Import read recipe files.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), os = require('os'), path = require('path');
const H = require('./helpers/harness');

test('Export recipes is a folder tree: Starting points set, Yours, a new folder, select mode, Import and Export; a click loads, the button exports', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.openPanel(page, 'xrec'); await H.settle(page);
  await expect(page.locator('#xrpane')).toBeVisible();
  await expect(page.locator('#xrpane [data-rcnew]')).toHaveAttribute('aria-label', 'New folder');
  await expect(page.locator('#xrpane [data-rcimp]')).toHaveAttribute('aria-label', 'Import recipes');
  await expect(page.locator('#xrpane [data-rcexp]')).toHaveAttribute('aria-label', 'Export all recipes');
  await expect(page.locator('#xrl .lfr[data-k="s:Starting points"]')).toHaveCount(1);
  expect(await page.locator('#xrl .lib > div').count()).toBe(3);   // Web, Print, Preview
  // a click on a recipe loads its settings and exports nothing
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.locator('#xrl .lib > div', { hasText: 'Preview' }).locator('button[data-rc]').click();
  await expect(page.locator('#xrpx')).toHaveValue('800');
  expect(await page.evaluate(() => window.__wbDownloads.length)).toBe(0);
  // Import: a recipe file, and one that is not a recipe
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-rc-')), f = path.join(d, 'a.wodblok-recipe');
  fs.writeFileSync(f, JSON.stringify({ app: 'WODBLOK', kind: 'recipe', name: 'Banner', fmt: 'jpg', px: 3000, sfx: 'banner' }));
  await page.setInputFiles('#xrpane .rcimpf', f);
  await expect(page.locator('#pmsg')).toHaveText('Added “Banner” to the library.');
  await expect(page.locator('#xrl .lib > div', { hasText: 'Banner' }).locator('small')).toHaveText('JPG · 3000 px');
  const bad = path.join(d, 'b.wodblok-recipe'); fs.writeFileSync(bad, JSON.stringify({ app: 'WODBLOK', kind: 'tray', name: 'No', colours: [] }));
  await page.setInputFiles('#xrpane .rcimpf', bad);
  await expect(page.locator('#pmsg')).toHaveText('Could not read that file.');
  // Export all recipes (the whole library as files)
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#xrpane [data-rcexp]');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  expect((await page.evaluate(() => window.__wbDownloads[0])).filename).toMatch(/\.zip$/);
  // a new folder, and the recipe's menu moves into it through select mode
  await page.click('#xrpane [data-rcnew]');
  await page.locator('#xrl .fform input').fill('Social'); await page.keyboard.press('Enter');
  await expect(page.locator('#xrl .lfr[data-k="Social"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});
