const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, settle } = require('./helpers/harness');
const { installFolder } = require('./helpers/fake-folder');
const FX = path.join(ROOT, 'tests', 'fixtures');
// 2.23.0: the File menu lists the last projects opened or saved; a click opens one.
test('Open recent lists a project once it was opened, and a click opens it again', async ({ page }) => {
  const { errors } = await openApp(page, { runtime: 'none', pattern: false });
  test.skip(!(await page.evaluate(() => typeof window.showDirectoryPicker === 'function')), 'this browser has no folder picker');
  await installFolder(page, [{ name: 'diamond.wodblok', path: path.join(FX, 'project-1-diamond.wodblok') }]);
  await page.click('#fileb');
  await expect(page.locator('#pmr')).toBeHidden();                    // nothing opened yet
  await page.keyboard.press('Escape');
  await page.click('#fileb'); await page.click('#pls'); await page.locator('#pgrid .pc [data-a="open"]').first().click();
  await expect(page.locator('#pmsg')).toContainText('Opened'); await settle(page);
  await page.click('#fileb');
  await expect(page.locator('#pmr button')).toHaveCount(1);
  await expect(page.locator('#pmr button')).toHaveText(/./);
  await page.click('#pnw'); await settle(page);                        // start something else (a fresh project: nothing to confirm)
  await page.click('#fileb');
  await page.click('#pmr button'); await settle(page);
  await expect(page.locator('#pmsg')).toContainText('Opened');
  expect(errors).toEqual([]);
});
