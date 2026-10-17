// 1.11: templates. File menu items, the picker (3 kinds, Blank first, built-in starting points, Yours), opening a template like New project,
// saving / renaming / replacing / deleting your own, Download and Add from file, and the commands.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState } = require('./helpers/harness');

const { folderTemplates } = require('../tools/templates/folders');
const FOLDER = folderTemplates(), HAND = { canvas: 0, tile: 0, book: 0 };       // every .wodblok file in templates/<kind>/
for (const t of FOLDER) HAND[t.type]++;

test.beforeEach(() => { test.skip(TARGET !== 'build' && TARGET !== 'esm', 'new in the repo build'); });

const openPicker = async page => { await page.click('#fileb'); await page.click('#tpnew'); await expect(page.locator('#tpdlg')).toBeVisible(); };
const kind = async (page, k) => { await page.click(`#tpty [data-k="${k}"]`); await settle(page, { quiet: 4 }); };
const cards = page => page.locator('#tpg .tpc');
const roll = async page => { await page.click('#rzbar'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };
const meta = page => page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), b = document.querySelector('#cfmt [data-f="book"]'); return { book: !!b && (b.classList.contains('on') || b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-selected') === 'true'), rt: !!(s.dim && s.dim.rt), ts: !!(s.proj && s.proj.ts && s.proj.ts.length) }; });

test('the File menu has both template items and the picker lists three kinds with Blank first', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.click('#fileb');
  await expect(page.locator('#filem > button, #filem > label')).toHaveText(['New project', 'New from template…', 'Clear canvas', 'Open project…', 'Save as template…', 'Settings…']);
  await page.click('#tpnew');
  await expect(page.locator('#tpty button')).toHaveText(['Normal canvas', 'Repeating pattern', 'Book']);
  for (const k of ['canvas', 'tile', 'book']) {
    await kind(page, k);
    await expect(cards(page)).toHaveCount(1 + HAND[k]);          // Blank, and one for every file in the templates/ folder of that kind
    await expect(cards(page).first()).toHaveAttribute('aria-label', 'Blank');
    await expect(page.locator('#tpyh')).toBeHidden();
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('#tpdlg')).toBeHidden();
  expect(errors).toEqual([]);
});

test('both commands exist', async ({ page }) => {
  await openApp(page);
  const ids = await page.evaluate(() => window.__wbTest.commands.list().map(c => c.id || c[0]));
  expect(ids).toEqual(expect.arrayContaining(['template.new', 'template.save']));
});

test('every built-in opens clean, matches its kind and opens the same twice', async ({ page }) => {
  const { errors } = await openApp(page);
  for (const [k, n] of Object.keys(HAND).map(k => [k, HAND[k]])) {
    for (let i = 1; i <= n; i++) {
      await openPicker(page); await kind(page, k);
      await cards(page).nth(i).click();
      await expect(page.locator('#tpdlg')).toBeHidden();
      await settle(page, { max: 60000, quiet: 6 });
      await page.waitForTimeout(1000);
      await expect(page.locator('#pst')).not.toHaveClass(/dirty/);
      const m = await meta(page);
      expect(m.ts).toBe(true);
      if (k === 'book') expect(m.book).toBe(true);
      if (k === 'tile') expect(m.rt).toBe(true);
      if (k === 'canvas') { expect(m.book).toBe(false); expect(m.rt).toBe(false); }
      const a = await getState(page);
      await openPicker(page); await kind(page, k); await cards(page).nth(i).click();
      await settle(page, { max: 60000, quiet: 6 });
      expect(await getState(page)).toBe(a);
    }
  }
  expect(errors).toEqual([]);
});

test('unsaved work asks once before a template opens', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  await roll(page); await page.waitForTimeout(1000);
  await expect(page.locator('#pst')).toHaveClass(/dirty/);
  await openPicker(page); await kind(page, 'canvas');
  await cards(page).nth(1).click();
  await expect(page.locator('#tpdlg')).toBeVisible();
  await expect(cards(page).nth(1)).toContainText('Discard changes?');
  await cards(page).nth(1).click();
  await expect(page.locator('#tpdlg')).toBeHidden();
  expect(errors).toEqual([]);
});

test('your templates: save, thumbnail, reload, rename, replace, delete, download, add from file', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await roll(page);
  await page.click('#fileb'); await page.click('#tpsave');
  await page.fill('#tpsn', 'Mine');
  await page.click('#tpsok');
  await expect(page.locator('#tpsd')).toBeHidden();
  await openPicker(page); await kind(page, 'canvas');
  await expect(page.locator('#tpyh')).toBeVisible();
  await expect(page.locator('#tpy .tpc')).toHaveCount(1);
  await expect(page.locator('#tpy .tpc img')).toHaveCount(1);
  await expect(page.locator('#tpg [data-more]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  // survives a reload
  await page.reload(); await page.waitForFunction(() => !!window.__wbTest);
  await openPicker(page); await kind(page, 'canvas');
  await expect(page.locator('#tpy .tpc')).toHaveCount(1);
  // rename
  await page.click('#tpy [data-more]'); await page.getByRole('menuitem', { name: /Rename/ }).click();
  await page.locator('#tpy .tpc input').fill('Renamed'); await page.keyboard.press('Enter');
  await expect(page.locator('#tpy .tpc').first()).toHaveAttribute('aria-label', 'Renamed');
  // download
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#tpy [data-more]'); await page.getByRole('menuitem', { name: /Download/ }).click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  expect(dl.filename).toMatch(/\.wodblok$/); expect(Buffer.from(dl.base64, 'base64').slice(0, 2).toString()).toBe('PK');
  // delete (two taps)
  await page.click('#tpy [data-more]'); await page.getByRole('menuitem', { name: /Delete/ }).click();
  await page.click('#tpy [data-del]');
  await expect(page.locator('#tpyh')).toBeHidden();
  // add from file
  await page.setInputFiles('#tpfile', { name: 'again.wodblok', mimeType: 'application/zip', buffer: Buffer.from(dl.base64, 'base64') });
  await expect(page.locator('#tpy .tpc')).toHaveCount(1);
  expect(errors).toEqual([]);
});

// 1.11.1: the picker's close button shared its id (tpx) with the repeat tile's "Exit 3 x 3 preview" pill, so the pill's styling
// and the repeat-tile test's lookups hit both, and the picker's own X was wired to the wrong element.
test('no id appears twice on the page, and the picker\'s own X closes it and is a plain icon button', async ({ page }) => {
  const { errors } = await openApp(page);
  const twice = await page.evaluate(() => { const n = {}; document.querySelectorAll('[id]').forEach(e => { n[e.id] = (n[e.id] || 0) + 1; }); return Object.keys(n).filter(k => n[k] > 1); });
  expect(twice).toEqual([]);
  await openPicker(page);
  const pos = await page.evaluate(() => getComputedStyle(document.getElementById('tpclose')).position);
  expect(pos).not.toBe('absolute');                           // it was floating like the Exit 3 x 3 pill
  await page.click('#tpclose');
  await expect(page.locator('#tpdlg')).toBeHidden();
  await expect(page.locator('#tpx')).toBeHidden();             // the repeat tile's pill is one element and still hidden
  expect(errors).toEqual([]);
});

test('Logo 1 and Sidon album cover are the first starting points after Blank in Normal canvas, and Logo 1 opens with its artwork', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPicker(page); await kind(page, 'canvas');
  // the templates/ folder files are listed by name after Blank, so other uploaded templates may come first: look the two up by name
  await expect(page.locator('#tpg .tpc[aria-label="Logo 1"]')).toHaveCount(1);
  await expect(page.locator('#tpg .tpc[aria-label="Sidon Album Cover"]')).toHaveCount(1);
  await page.locator('#tpg .tpc[aria-label="Logo 1"]').click();
  await expect(page.locator('#tpdlg')).toBeHidden();
  await settle(page, { max: 60000, quiet: 6 });
  const st = JSON.parse(await getState(page));
  expect(st.tiles.reduce((n, t) => n + (t.items || []).length, 0), 'the logo has its shapes').toBeGreaterThan(20);
  expect(errors).toEqual([]);
});

test('Rare Motion is the first repeating-pattern starting point and Book Cover the first book one', async ({ page }) => {
  const { errors } = await openApp(page);
  for (const [k, name] of [['tile', 'Rare Motion'], ['book', 'Book Cover']]) {
    await openPicker(page); await kind(page, k);
    await expect(cards(page).nth(1)).toHaveAttribute('aria-label', name);
    await cards(page).nth(1).click();
    await expect(page.locator('#tpdlg')).toBeHidden();
    await settle(page, { max: 60000, quiet: 6 });
    const st = JSON.parse(await getState(page));
    expect(st.tiles.reduce((n, t) => n + (t.items || []).length, 0), name + ' has its shapes').toBeGreaterThan(5);
  }
  expect(errors).toEqual([]);
});

test('every file in the templates/ folders is a starting point under the kind of its folder, by name', async ({ page }) => {
  expect(FOLDER.length, 'the four supplied templates are in the folders').toBeGreaterThanOrEqual(4);
  const { errors } = await openApp(page);
  for (const k of Object.keys(HAND)) {
    await openPicker(page); await kind(page, k);
    const want = ['Blank', ...FOLDER.filter(t => t.type === k).map(t => t.n)];
    expect(await cards(page).evaluateAll((els, n) => els.slice(0, n).map(e => e.getAttribute('aria-label')), want.length)).toEqual(want);
    await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});

test('the template picker opens when the app starts; Settings > General can turn that off', async ({ page }) => {
  const { errors } = await openApp(page, { templates: true });
  await expect(page.locator('#tpdlg')).toBeVisible();
  await expect(page.locator('#tpty .on')).toHaveText('Normal canvas');
  await expect(cards(page).first()).toHaveAttribute('aria-label', 'Blank');
  await page.click('#tpclose');                                        // closing it leaves the blank project
  await expect(page.locator('#tpdlg')).toBeHidden();
  await page.evaluate(() => document.getElementById('stgo').click());
  await page.click('#stgnav [data-p="general"]');
  await expect(page.locator('#stgtl')).toHaveAttribute('aria-pressed', 'true');
  await page.click('#stgtl');
  await expect(page.locator('#stgtl')).toHaveAttribute('aria-pressed', 'false');
  await page.reload(); await page.waitForFunction(() => window.__wbTest); await settle(page);
  await expect(page.locator('#tpdlg')).toBeHidden();
  expect(errors).toEqual([]);
});
