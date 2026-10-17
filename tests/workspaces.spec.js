// Workspaces (Phase 5): save the arrangement of the tools under a name, set it again with one click.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

// the tools that are open, group by group (each group is a set of tabs)
const groups = page => page.evaluate(() => [...document.querySelectorAll('.wg')].map(g => [...g.querySelectorAll('.wtab')].map(t => t.dataset.t)));
const row = (page, name) => page.locator('#wxl .wxr', { hasText: name });

test('Default is the only starting workspace; choosing it sets exactly its arrangement and the Workspaces tool closes', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
  await openPanel(page, 'wspc');
  await expect(row(page, 'Default')).toBeVisible();
  await expect(page.locator('#wxl .wxr')).toHaveCount(1);                       // no other starting workspaces
  await expect(page.locator('#wxl .wxf', { hasText: 'Starting points' })).toHaveCount(0);
  await row(page, 'Default').click();
  expect((await groups(page)).map(g => g.join()).sort()).toEqual(['canvas,colors', 'lyrs,layers']);   // and the list has closed
  expect(errors).toEqual([]);
});

test('save the current arrangement, set it again, rename it, keep it after a reload, delete it', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
  await openPanel(page, 'hist');                                                  // Default is open; add the History tool to it
  await openPanel(page, 'wspc');
  const mine = (await groups(page)).flat().filter(t => t != 'wspc').sort();
  expect(mine).toEqual(['canvas', 'colors', 'hist', 'layers', 'lyrs']);
  await page.fill('#wxn', 'Mine');
  await page.click('#wxsave');
  await expect(row(page, 'Mine')).toBeVisible();
  await expect(page.locator('#wxl .wxf').first()).toContainText('Yours');
  await row(page, 'Default').click();
  expect((await groups(page)).flat().sort()).toEqual(['canvas', 'colors', 'layers', 'lyrs']);
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
  expect((await groups(page)).flat().sort()).toEqual(['canvas', 'colors', 'layers', 'lyrs']);   // Default opens again
  await openPanel(page, 'wspc');
  await expect(row(page, 'Mine two')).toBeVisible();
  await row(page, 'Mine two').locator('[data-act="del"]').click();
  await expect(row(page, 'Mine two')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the Stamp editor has its own arrangement in each workspace', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
  await setMode(page, 'stamp');
  await openPanel(page, 'wspc');
  await row(page, 'Default').click();
  expect((await groups(page)).flat()).toEqual(expect.arrayContaining(['stamp', 'colors', 'text', 'mlist', 'motifs', 'sedit']));
  await setMode(page, 'pattern');
  // the Pattern view has its own half of the same workspace, set in the same click
  expect((await groups(page)).flat()).toEqual(expect.arrayContaining(['canvas', 'colors', 'lyrs', 'layers']));
  expect(errors).toEqual([]);
});

test('folders: make one, save into it, move a workspace, export the folder, delete it and import the file back', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
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
  await row(page, 'Wide').locator('[data-act="del"]').click();
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

// where each group sits and which tab shows in it, for the view that is showing
const layout = page => page.evaluate(() => [...document.querySelectorAll('.wg:not(.fl)')].map(g => ({ edge: g.closest('.dock').dataset.e, tabs: [...g.querySelectorAll('.wtab')].map(t => t.dataset.t), on: (g.querySelector('.wtab.on') || {}).dataset && g.querySelector('.wtab.on').dataset.t })));

test('the app opens with the Default workspace: Pattern and Stamp editor arrangements as described', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
  const p = await layout(page);
  expect(p).toEqual(expect.arrayContaining([
    { edge: 'l', tabs: ['canvas', 'colors'], on: 'canvas' },
    { edge: 'r', tabs: ['lyrs', 'layers'], on: 'lyrs' },
  ]));
  expect(p.length).toBe(2);
  await setMode(page, 'stamp');
  const st = await layout(page);
  expect(st).toEqual(expect.arrayContaining([
    { edge: 'l', tabs: ['stamp', 'colors', 'text', 'mlist'], on: 'stamp' },
    { edge: 'r', tabs: ['motifs'], on: 'motifs' },
    { edge: 'b', tabs: ['sedit'], on: 'sedit' },
  ]));
  expect(st.length).toBe(3);
  expect(errors).toEqual([]);
});

test('Default can be replaced, then deleted: the first workspace opens, and with none left nothing opens', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
  await openPanel(page, 'hist');                                   // change the arrangement, then save it over Default
  await openPanel(page, 'wspc');
  await page.fill('#wxn', 'Default');
  await page.click('#wxsave');
  await page.reload(); await page.waitForFunction(() => window.__wbTest);
  expect((await groups(page)).flat()).toContain('hist');            // the replaced Default opens
  await openPanel(page, 'wspc');
  await page.fill('#wxn', 'Alpha');
  await page.click('#wxsave');
  await row(page, 'Default').locator('[data-act="del"]').click();
  await page.reload(); await page.waitForFunction(() => window.__wbTest);
  expect((await groups(page)).flat()).toContain('hist');            // Alpha, the first one left, opens (it kept the History tool)
  await openPanel(page, 'wspc');
  await row(page, 'Alpha').locator('[data-act="del"]').click();
  await page.reload(); await page.waitForFunction(() => window.__wbTest);
  expect(await groups(page)).toEqual([]);                           // no workspaces: no tool window opens
  expect(errors).toEqual([]);
});

test('Restore defaults brings Default back, or puts a changed Default back as it was', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
  await openPanel(page, 'wspc');
  await row(page, 'Default').locator('[data-act="del"]').click();
  await expect(row(page, 'Default')).toHaveCount(0);
  await page.click('#wxrst');
  await expect(row(page, 'Default')).toBeVisible();
  await expect(page.locator('#pmsg')).toContainText('Restored the Default workspace');
  await page.fill('#wxn', 'Default');                               // change it, then restore again
  await page.click('#wxsave');
  await page.click('#wxrst');
  await expect(page.locator('#wxl .wxr')).toHaveCount(1);           // still one Default, not two
  await row(page, 'Default').click();
  expect((await groups(page)).map(g => g.join()).sort()).toEqual(['canvas,colors', 'lyrs,layers']);
  expect(errors).toEqual([]);
});

test('the older starting workspaces are removed once, unless you changed them', async ({ page }) => {
  const g = (tabs) => ({ tabs, a: tabs[0] });
  const old = [
    { id: 'a1', name: 'Colour work', f: '', layout: { pattern: { dock: [g(['colors', 'grade', 'tex']), g(['rand'])], float: [] }, stamp: { dock: [g(['stamp', 'colors', 'grade', 'tex'])], float: [] } } },
    { id: 'a2', name: 'Layout work', f: '', layout: { pattern: { dock: [g(['lyrs'])], float: [] }, stamp: { dock: [], float: [] } } },   // changed by the person: kept
    { id: 'a3', name: 'Everything closed', f: '', layout: { pattern: { dock: [], float: [] }, stamp: { dock: [], float: [] } } },
  ];
  await page.addInitScript(o => { if (!sessionStorage.getItem('t_mig')) { sessionStorage.setItem('t_mig', '1'); localStorage.setItem('wb96_workspaces', JSON.stringify(o)); localStorage.setItem('wb96_ws_seeded', '1'); } }, old);
  const { errors } = await openApp(page, { workspaces: true });
  await openPanel(page, 'wspc');
  await expect(row(page, 'Default')).toBeVisible();
  await expect(row(page, 'Layout work')).toBeVisible();
  await expect(row(page, 'Colour work')).toHaveCount(0);
  await expect(row(page, 'Everything closed')).toHaveCount(0);
  expect(errors).toEqual([]);
});
