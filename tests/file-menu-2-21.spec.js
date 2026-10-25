const { test, expect } = require('@playwright/test');
const { openApp, settle } = require('./helpers/harness');
// 2.21.0: the File menu has Save project, Save project as, Import and Export, as well as New, Open, templates and Settings.
test('the File menu lists Save, Save as, Import and Export; Export opens the Export panel; Save as asks for a file even after a save', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.click('#fileb');
  const items = await page.$$eval('#filem > button, #filem > label', b => b.map(x => x.textContent.replace(/Ctrl\+S/, '').trim()));
  expect(items).toEqual(['New project', 'New from template…', 'Clear canvas', 'Open project…', 'Open projects folder…', 'Save project', 'Save project as…', 'Save as template…', 'Import image as shape…', 'Export…', 'Settings…']);
  await page.click('#xrm'); await settle(page);
  await expect(page.locator('section.pn[data-p="xrec"]')).toBeVisible();
  await page.click('#fileb'); await page.click('#psv'); await settle(page);
  await page.waitForFunction(() => window.__wbDownloads && window.__wbDownloads.length >= 1);
  await page.click('#fileb'); await page.click('#psa'); await settle(page);
  await page.waitForFunction(() => window.__wbDownloads.length >= 2);
  expect(await page.evaluate(() => window.__wbDownloads.map(d => d.filename).every(f => /\.wodblok$/.test(f)))).toBe(true);
  expect(errors).toEqual([]);
});
