// Workspaces (Phase 5): save the arrangement of the tools under a name, set it again with one click.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

// the tools that are open, group by group (each group is a set of tabs)
const groups = page => page.evaluate(() => [...document.querySelectorAll('.wg')].map(g => [...g.querySelectorAll('.wtab')].map(t => t.dataset.t)));
const row = (page, name) => page.locator('#wxl .wxr', { hasText: name });

test('the starting workspaces set exactly their own arrangement (at most two groups) and the Workspaces tool closes', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'wspc');
  await expect(page.locator('#wxl .wxf', { hasText: 'Starting points' })).toBeVisible();
  await row(page, 'Colour work').click();
  await expect(page.locator('#pmsg')).toContainText('Colour work');
  const g = await groups(page);
  expect(g).toEqual([['colors', 'grade', 'tex'], ['rand']]);                  // the colour tools together, Randomize on its own, and the list has closed
  expect(g.length).toBeLessThanOrEqual(2);
  await openPanel(page, 'wspc');
  await row(page, 'Layout work').click();
  expect((await groups(page)).length).toBeLessThanOrEqual(2);
  await openPanel(page, 'wspc');
  await row(page, 'Everything closed').click();
  expect(await groups(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('save the current arrangement, set it again, rename it, keep it after a reload, delete it', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'canvas'); await openPanel(page, 'layers');
  await openPanel(page, 'wspc');
  const mine = (await groups(page)).flat().filter(t => t != 'wspc').sort();
  expect(mine).toEqual(['canvas', 'layers']);
  await page.fill('#wxn', 'Mine');
  await page.click('#wxsave');
  await expect(row(page, 'Mine')).toBeVisible();
  await expect(page.locator('#wxl .wxf').first()).toContainText('Yours');
  await row(page, 'Everything closed').click();
  expect((await groups(page)).flat()).toEqual([]);
  await openPanel(page, 'wspc');
  await row(page, 'Mine').click();
  expect((await groups(page)).flat().sort()).toEqual(mine);
  await openPanel(page, 'wspc');
  // rename
  await row(page, 'Mine').locator('[data-more]').click();
  await page.click('.rowm >> text=Rename');
  await page.locator('#wxl .wxr input').fill('Mine two');
  await page.keyboard.press('Enter');
  await expect(row(page, 'Mine two')).toBeVisible();
  // it is kept with the settings: still there after a reload (the app starts with no tools open)
  await page.reload();
  await page.waitForFunction(() => window.__wbTest);
  expect(await groups(page)).toEqual([]);
  await openPanel(page, 'wspc');
  await expect(row(page, 'Mine two')).toBeVisible();
  await row(page, 'Mine two').locator('[data-act="del"]').click();
  await expect(row(page, 'Mine two')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the Stamp editor has its own arrangement in each workspace', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await openPanel(page, 'wspc');
  await row(page, 'Layout work').click();
  const g = await groups(page);
  expect(g.flat()).toEqual(expect.arrayContaining(['motifs', 'mlist', 'stamp', 'grid']));
  await setMode(page, 'pattern');
  // the Pattern view keeps what it had: Layout work sets it as well, in the same click
  expect((await groups(page)).flat()).toEqual(expect.arrayContaining(['lyrs', 'layers', 'canvas', 'pgrid']));
  expect(errors).toEqual([]);
});

test('folders: make one, save into it, move a workspace, export the folder, delete it and import the file back', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'canvas');
  await openPanel(page, 'wspc');
  await page.click('#wxnew');
  await page.fill('#wxl .wxform input', 'Print');
  await page.keyboard.press('Enter');
  await expect(page.locator('#wxl .wxf', { hasText: 'Print' })).toBeVisible();
  await page.fill('#wxn', 'Wide');
  await page.click('#wxsave');                                            // goes into the active folder
  await expect(page.locator('#wxl .wxf:has-text("Print") .lfc')).toHaveText('1');
  await row(page, 'Wide').locator('[data-more]').click();
  await page.click('.rowm >> text=Move to Yours');
  await expect(page.locator('#wxl .wxf:has-text("Print") .lfc')).toHaveText('0');
  await row(page, 'Wide').locator('[data-more]').click();
  await page.click('.rowm >> text=Move to “Print”');
  // export the folder to a file
  await page.evaluate(() => { window.showSaveFilePicker = undefined; });   // no Save dialog: the file downloads
  const dl = page.waitForEvent('download');
  await page.click('#wxl .wxf:has-text("Print") [data-fmore]');
  await page.click('.rowm >> text=Export…');
  const file = await (await dl).path();
  const json = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  expect(json.kind).toBe('wodblok-workspaces');
  expect(json.items.map(i => [i.name, i.f])).toEqual([['Wide', 'Print']]);
  // delete the folder, then import the file: the folder and workspace come back
  await page.click('#wxl .wxf:has-text("Print") [data-fmore]');
  await page.click('.rowm >> text=Delete folder');
  await page.click('#wxl [data-fok]');
  await page.click('#wxl [data-act="del"]');
  await expect(row(page, 'Wide')).toHaveCount(0);
  await page.setInputFiles('#wxfile', file);
  await expect(page.locator('#wxl .wxf:has-text("Print") .lfc')).toHaveText('1');
  await page.click('#wxl .wxf:has-text("Print")');
  await expect(row(page, 'Wide')).toBeVisible();
  // a file that is not a workspace file is refused with a message
  await page.setInputFiles('#wxfile', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"a":1}') });
  await expect(page.locator('#pmsg')).toContainText('no workspaces');
  expect(errors).toEqual([]);
});
