// 2.76.1 (owner Oct 29 2026): the Export panel opens as a floating window in the middle of the app when it has no remembered place.
const { test, expect } = require('@playwright/test');
const { openApp, settle } = require('./helpers/harness');

test('Export from the top bar opens floating in the middle of the window', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
  await page.evaluate(() => window.__wbTest.commands.run ? window.__wbTest.commands.run('panel.xrec') : window.__wbTest.commands['panel.xrec']());
  await settle(page);
  const g = page.locator('.wg.fl:has(section.pn[data-p="xrec"])');
  await expect(g).toBeVisible();
  const b = await g.boundingBox(), v = page.viewportSize();
  expect(Math.abs(b.x + b.width / 2 - v.width / 2)).toBeLessThan(6);
  expect(Math.abs(b.y + b.height / 2 - v.height / 2)).toBeLessThan(40);
  expect(errors).toEqual([]);
});
