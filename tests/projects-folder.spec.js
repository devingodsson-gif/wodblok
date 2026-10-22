// The Projects folder: with no folder chosen the button says "Open projects folder"; once one is chosen it says "Projects" and lists the
// .wodblok files in that folder; "Close folder" forgets it. (UX review C1: projects are files, not browser storage.)
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, settle, getState } = require('./helpers/harness');
const { installFolder } = require('./helpers/fake-folder');
const FX = path.join(ROOT, 'tests', 'fixtures');

const FILES = [
  { name: 'diamond.wodblok', path: path.join(FX, 'project-1-diamond.wodblok') },
  { name: 'old-rect.wodblok', path: path.join(FX, 'project-4-rect-4x3.wodblok') },
];

test('the button names the next step, the folder lists its projects, a project opens, and Close folder forgets it', async ({ page }) => {
  const { errors } = await openApp(page);
  test.skip(!(await page.evaluate(() => typeof window.showDirectoryPicker === 'function')), 'this browser has no folder picker');
  await installFolder(page, FILES);
  await expect(page.locator('#pls')).toHaveText('Open projects folder');
  await page.click('#pls');
  await expect(page.locator('#plist')).toBeVisible();
  await expect(page.locator('#pls')).toHaveText('Projects');
  await expect(page.locator('#pdlgt')).toHaveText('My patterns');
  await expect(page.locator('#pgrid .pc')).toHaveCount(2);
  await expect(page.locator('#pgrid .pc b').first()).toBeVisible();
  const emptyBefore = await getState(page);
  await page.locator('#pgrid .pc [data-a="open"]').first().click();   // nothing unsaved, so one click opens it
  await expect(page.locator('#pmsg')).toContainText('Opened');
  await settle(page);
  expect(await getState(page)).not.toBe(emptyBefore);
  await expect(page.locator('#plist')).toBeHidden();
  await expect(page.locator('#pst')).not.toHaveClass(/dirty/);
  await page.click('#pls');                                            // the list again (the folder is still chosen)
  await expect(page.locator('#pgrid .pc')).toHaveCount(2);
  await page.click('#pcf');
  await expect(page.locator('#plist')).toBeHidden();
  await expect(page.locator('#pls')).toHaveText('Open projects folder');
  expect(errors).toEqual([]);
});

test('opening a project from the folder asks first when the current one has unsaved work', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  test.skip(!(await page.evaluate(() => typeof window.showDirectoryPicker === 'function')), 'this browser has no folder picker');
  await page.click('#rzdo'); await settle(page, { max: 60000 });
  await installFolder(page, FILES);
  await page.click('#pls');
  const b = page.locator('#pgrid .pc [data-a="open"]').first();
  await expect(b).toBeVisible();
  const before = await getState(page);
  await b.click();
  await expect(b).toHaveText('Discard changes?');
  expect(await getState(page)).toBe(before);
  await b.click();
  await expect(page.locator('#pmsg')).toContainText('Opened');
  expect(errors).toEqual([]);
});

async function rollAndName(page, name) {
  await page.click('#rzdo'); await settle(page, { max: 60000 });
  await page.fill('#pnm', name);
}

test('with a folder chosen, Save project writes a new file into it, the next Save writes the same file, and a second project never replaces it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5, runtime: 'none' });
  test.skip(!(await page.evaluate(() => typeof window.showDirectoryPicker === 'function')), 'this browser has no folder picker');
  let pickerCalls = 0;
  await page.exposeFunction('__saveDialog', () => { pickerCalls++; });
  await page.evaluate(() => { window.showSaveFilePicker = async () => { window.__saveDialog(); throw Object.assign(new Error('no dialog in this test'), { name: 'AbortError' }); }; });
  await installFolder(page, [FILES[0]]);
  await page.click('#pls'); await page.click('#pclose');
  await rollAndName(page, 'My pattern');
  await page.click('#psv');
  await expect(page.locator('#pmsg')).toContainText('to My patterns');
  await expect.poll(() => page.evaluate(() => Object.keys(window.__folder.files).sort())).toEqual(['diamond.wodblok', 'my-pattern.wodblok']);
  const first = await page.evaluate(() => window.__folder.files['my-pattern.wodblok']);
  expect(first).toBeGreaterThan(1000);
  await rollAndName(page, 'My pattern');
  await page.click('#psv');
  await expect(page.locator('#pmsg')).toContainText('Saved');
  expect(await page.evaluate(() => Object.keys(window.__folder.files).length)).toBe(2);   // same file written again
  await expect(page.locator('#pst')).not.toHaveClass(/dirty/);
  await page.click('#fileb'); await page.click('#pnw');
  await settle(page);
  await rollAndName(page, 'My pattern');
  await page.click('#psv');
  await expect.poll(() => page.evaluate(() => Object.keys(window.__folder.files).sort())).toEqual(['diamond.wodblok', 'my-pattern-2.wodblok', 'my-pattern.wodblok']);
  expect(pickerCalls).toBe(0);                                                            // the Save dialog never opened
  expect(errors).toEqual([]);
});

test('if the folder cannot be written, Save project falls back to the normal Save', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  test.skip(!(await page.evaluate(() => typeof window.showDirectoryPicker === 'function')), 'this browser has no folder picker');
  await installFolder(page, [FILES[0]], { writable: false });
  await page.click('#pls'); await page.click('#pclose');
  await rollAndName(page, 'Fallback');
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#psv');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  expect(await page.evaluate(() => window.__wbDownloads[0].filename)).toMatch(/fallback\.wodblok$/);
  expect(await page.evaluate(() => Object.keys(window.__folder.files))).toEqual(['diamond.wodblok']);
  expect(errors).toEqual([]);
});
