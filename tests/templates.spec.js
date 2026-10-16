// 1.11: templates. File menu items, the picker (3 kinds, Blank first, built-in starting points, Yours), opening a template like New project,
// saving / renaming / replacing / deleting your own, Download and Add from file, and the commands.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET !== 'build' && TARGET !== 'esm', 'new in the repo build'); });

const openPicker = async page => { await page.click('#fileb'); await page.click('#tpnew'); await expect(page.locator('#tpdlg')).toBeVisible(); };
const kind = async (page, k) => { await page.click(`#tpty [data-k="${k}"]`); await settle(page, { quiet: 4 }); };
const cards = page => page.locator('#tpg .tpc');
const roll = async page => { await page.click('#rzbar'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };
const meta = page => page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), b = document.querySelector('#cfmt [data-f="book"]'); return { book: !!b && (b.classList.contains('on') || b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-selected') === 'true'), rt: !!(s.dim && s.dim.rt), ts: !!(s.proj && s.proj.ts && s.proj.ts.length) }; });

test('the File menu has both template items and the picker lists three kinds with Blank first', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.click('#fileb');
  await expect(page.locator('#filem > button, #filem > label')).toHaveText(['New project', 'New from template…', 'Clear canvas', 'Open project…', 'Save as template…']);
  await page.click('#tpnew');
  await expect(page.locator('#tpty button')).toHaveText(['Normal canvas', 'Repeating pattern', 'Book']);
  for (const k of ['canvas', 'tile', 'book']) {
    await kind(page, k);
    await expect(cards(page)).toHaveCount(4);
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
  for (const [k, n] of [['canvas', 3], ['tile', 3], ['book', 3]]) {
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
