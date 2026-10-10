// A project opened from a file is written back into that file only while its name is unchanged. Rename it, even with nothing else changed,
// and Save makes a new file and leaves the original alone (1.0.6).
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, TARGET, openApp, settle } = require('./helpers/harness');
const { installFolder } = require('./helpers/fake-folder');
const FX = path.join(ROOT, 'tests', 'fixtures');
const FILES = [{ name: 'diamond.wodblok', path: path.join(FX, 'project-1-diamond-v19.wodblok') }];

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

async function openFromFolder(page) {
  await page.click('#pls');
  await page.locator('#pgrid .pc [data-a="open"]').first().click();
  await expect(page.locator('#pmsg')).toContainText('Opened');
  await settle(page);
}
const sizes = page => page.evaluate(() => ({ ...window.__folder.files }));

test('rename an opened project and Save: a new file in the folder, the original untouched; Save again writes the new file', async ({ page }) => {
  const { errors } = await openApp(page, { runtime: 'none' });
  test.skip(!(await page.evaluate(() => typeof window.showDirectoryPicker === 'function')), 'this browser has no folder picker');
  await installFolder(page, FILES);
  await openFromFolder(page);
  const before = await sizes(page);
  await page.fill('#pnm', 'Renamed copy');
  await page.click('#psv');
  await expect(page.locator('#pmsg')).toContainText('to My patterns');
  const after = await sizes(page);
  expect(Object.keys(after).sort()).toEqual(['diamond.wodblok', 'renamed-copy.wodblok']);
  expect(after['diamond.wodblok']).toBe(before['diamond.wodblok']);                // the original was not written to
  await page.click('#psv');
  await expect(page.locator('#pmsg')).toContainText('Saved');
  expect(Object.keys(await sizes(page))).toHaveLength(2);                          // the new file again, not a third
  expect(errors).toEqual([]);
});

test('without a folder: the same name saves into the opened file, a new name asks where to save', async ({ page }) => {
  const { errors } = await openApp(page, { runtime: 'none' });
  test.skip(!(await page.evaluate(() => typeof window.showDirectoryPicker === 'function')), 'this browser has no folder picker');
  let dialogs = 0;
  await page.exposeFunction('__saveDialog', () => { dialogs++; });
  await page.evaluate(() => { window.showSaveFilePicker = async () => { window.__saveDialog(); throw Object.assign(new Error('no dialog in this test'), { name: 'AbortError' }); }; });
  await installFolder(page, FILES);
  await openFromFolder(page);
  await page.click('#pls'); await page.click('#pcf');                              // close the folder: only the opened file's link is left
  await page.click('#psv');                                                        // same name: written into the opened file
  await expect(page.locator('#pmsg')).toContainText('Saved');
  expect(dialogs).toBe(0);
  const mid = await page.evaluate(() => window.__folder.files['diamond.wodblok']);
  expect(mid).toBeGreaterThan(1000);
  await page.fill('#pnm', 'Another name');
  await page.click('#psv');                                                        // new name: the Save dialog opens, nothing is overwritten
  await expect.poll(() => dialogs).toBe(1);
  expect(await page.evaluate(() => window.__folder.files['diamond.wodblok'])).toBe(mid);
  expect(errors).toEqual([]);
});
