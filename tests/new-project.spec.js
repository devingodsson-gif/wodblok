// File > New project with unsaved work asks first. 2.76.8 (docs/pattern-plan.md step 5): it asks "Save changes first?" in a dialog (Save, Don't save, Cancel);
// before, a second click discarded the work (UX review B3 made that click visible). Starting a new project resets History, so the guard has to stay.
const { test, expect } = require('@playwright/test');
const path = require('path');
const { ROOT, openApp, openPanel, settle, getState } = require('./helpers/harness');
const { installFolder } = require('./helpers/fake-folder');

async function roll(page) {
  await openPanel(page, 'rand');
  await page.click('#rzdo');
  await settle(page, { max: 60000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
}

test('with unsaved work New project asks Save changes first?: Cancel keeps the work, Don\'t save starts the new project', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  const before = await getState(page);
  await page.click('#fileb'); await page.click('#pnw');
  await expect(page.locator('#nwd')).toBeVisible();
  await expect(page.locator('#filem')).toBeHidden();
  expect(await getState(page)).toBe(before);
  await page.click('#nwdcx'); await expect(page.locator('#nwd')).toBeHidden();
  expect(await getState(page)).toBe(before);
  await page.click('#fileb'); await page.click('#pnw'); await page.click('#nwdno');
  await settle(page, { max: 30000 });
  expect(JSON.parse(await getState(page)).tiles.length).toBe(0);   // 2.10.0: a new project has no stamp
  expect(errors).toEqual([]);
});

test('Save in the dialog saves the project, then starts the new one', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#fileb'); await page.click('#pnw'); await page.click('#nwdok');
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 30000 });
  await settle(page, { max: 30000 });
  expect(await page.evaluate(() => window.__wbDownloads[0].filename)).toMatch(/\.wodblok$/);
  expect(JSON.parse(await getState(page)).tiles.length).toBe(0);
  expect(errors).toEqual([]);
});

test('the New project button in the Projects dialog asks the same', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  await installFolder(page, [{ name: 'x.wodblok', path: path.join(ROOT, 'tests', 'fixtures', 'project-1-diamond.wodblok') }]);
  await page.click('#fileb'); await page.click('#pls');
  await page.click('#pnw2');
  await expect(page.locator('#nwd')).toBeVisible();
  await page.click('#nwdno');
  await settle(page, { max: 30000 });
  expect(JSON.parse(await getState(page)).tiles.length).toBe(0);
  expect(errors).toEqual([]);
});

test('with nothing to lose (the project was just saved), one click is enough', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  await page.click('#fileb'); await page.click('#psv');
  await expect(page.locator('#pmsg')).toContainText(/Saved|Downloaded/);
  await page.click('#fileb');
  await page.click('#pnw');
  await expect(page.locator('#pmsg')).toContainText('Started a new');
  expect(errors).toEqual([]);
});
