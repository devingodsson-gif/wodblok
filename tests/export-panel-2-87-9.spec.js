// 2.87.9 (docs/pro-basics-plan.md step 9): the Export panel rearranged. Quick export at the top (Export now first, then the format and size, then the
// one-click exports), Print and colour in the middle (print file, separations, CMYK, Proof colours, print proof), Export recipes at the bottom.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const groups = page => page.locator('section.pn[data-p="xrec"] > details.g > summary').allTextContents();

test('the groups are Quick export, Print and colour, then Recipes; Export now exports with one click', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.openPanel(page, 'xrec'); await H.settle(page);
  expect((await groups(page)).map(t => t.trim())).toEqual(['Quick export', 'Print and colour', 'Recipes']);
  await expect(page.locator('details.g:has(> summary:text-is("Recipes")) #xrsave')).toHaveCount(1);   // Save recipe sits with the recipes
  await page.locator('#xrnow').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 30000 });
  expect((await page.evaluate(() => window.__wbDownloads[0].filename))).toMatch(/\.png$/);
  expect(errors).toEqual([]);
});

test('Print and colour opens Print file and Separations, exports CMYK, shows the bleed and spot inks, and its tick is Proof colours', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.addShape(page); await H.settle(page);
  const d = JSON.parse(await H.getState(page)); d.dim.bl = 3 / 25.4; d.proj.spot = [d.proj.ts[1]];
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await H.settle(page);
  await H.openPanel(page, 'xrec'); await H.settle(page);
  await expect(page.locator('#xpinfo')).toHaveText('Bleed 3 mm · 1 spot ink');
  await page.locator('#xpfile').click(); await expect(page.locator('#prfd')).toBeVisible(); await page.keyboard.press('Escape');
  await page.locator('#xpsep').click(); await expect(page.locator('#sepd')).toBeVisible(); await page.keyboard.press('Escape');
  await page.locator('#xpcmt').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 30000 });
  expect((await page.evaluate(() => window.__wbDownloads[0].filename))).toMatch(/-cmyk\.tiff$/);
  await page.locator('label.chk:has(#xpprf)').click();
  await expect(page.locator('#prfg image')).toHaveCount(1, { timeout: 15000 });
  await page.evaluate(() => window.__wbTest.commands.run('view.proof'));
  await expect(page.locator('#xpprf')).not.toBeChecked();
  expect(errors).toEqual([]);
});
