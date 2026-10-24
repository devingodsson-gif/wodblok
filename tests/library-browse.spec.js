// Shape library tree (1.5.0): every folder opens and closes in place, one button opens or closes them all, what is open is
// remembered, folders answer the arrow keys and a right-click, Import is a menu in the toolbar, and a slider sets the shape size.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

async function open(page) { const r = await openApp(page); await openPanel(page, 'motifs'); return r; }
const tiles = page => page.locator('#lib button[data-m]');
const cols = page => page.evaluate(() => getComputedStyle(document.querySelector('#lib .lib')).gridTemplateColumns.split(' ').length);

test('one button opens every folder, and again closes them all; what is open is remembered', async ({ page }) => {
  const { errors } = await open(page);
  await expect(page.locator('#ltog')).toHaveAttribute('aria-label', 'Expand all folders');
  await page.click('#ltog');
  await expect(tiles(page)).toHaveCount(474);                           // every built-in shape, under its own set
  await expect(page.locator('#ltog')).toHaveAttribute('aria-label', 'Collapse all folders');
  await page.click('#ltog');
  await expect(tiles(page)).toHaveCount(0);
  await page.locator('#lib .lfr[data-f="b:Birds"]').click();
  await page.reload(); await openPanel(page, 'motifs');
  await expect(page.locator('#lib .lfr[data-f="b:Birds"]')).toHaveAttribute('aria-expanded', 'true');
  await expect(tiles(page)).toHaveCount(37);
  expect(errors).toEqual([]);
});

test('a shape in an open folder picks as the brush; the arrow keys open and close a folder; a right-click opens its menu', async ({ page }) => {
  const { errors } = await open(page);
  await page.locator('#lib .lfr[data-f="b:Birds"]').click();
  await tiles(page).nth(3).click();
  await settle(page);
  await expect(page.locator('#lib button[data-m].on')).toHaveCount(1);
  const r = page.locator('#lib .lfr[data-f="b:Flowers"]');
  await r.focus();
  await page.keyboard.press('ArrowRight');
  await expect(r).toHaveAttribute('aria-expanded', 'true');
  await expect(r).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(r).toHaveAttribute('aria-expanded', 'false');
  await r.scrollIntoViewIfNeeded(); await page.evaluate(() => new Promise(q => requestAnimationFrame(() => requestAnimationFrame(q))));
  await r.click({ button: 'right' });
  await expect(page.locator('.rowm').getByRole('menuitem', { name: 'Rename', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('Import in the toolbar offers an image or a sheet; the toolbar actions are commands', async ({ page }) => {
  const { errors } = await open(page);
  const ids = await page.evaluate(() => window.__wbTest.commands.list().map(c => c.id));
  expect(ids).toEqual(expect.arrayContaining(['library.toggleFolders', 'library.newFolder', 'library.importImage', 'library.importSheet', 'library.exportShapes']));
  await page.click('#limp');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.locator('.rowm').getByRole('menuitem', { name: 'Sheet…', exact: true }).click()]);
  expect(fc).toBeTruthy();
  expect(errors).toEqual([]);
});

test('the size slider changes how many shapes fit in a row and is remembered', async ({ page }) => {
  const { errors } = await open(page);
  await page.locator('#lib .lfr[data-f="b:Flowers"]').click();
  expect(await cols(page)).toBe(4);
  await page.locator('#lsz').fill('8');
  expect(await cols(page)).toBe(2);
  await page.locator('#lsz').fill('0');
  expect(await cols(page)).toBe(10);
  await page.locator('#lsz').fill('8');
  await page.reload(); await openPanel(page, 'motifs');
  await expect(page.locator('#lsz')).toHaveValue('8');
  expect(await cols(page)).toBe(2);
  await expect(page.locator('#lsz')).not.toHaveAttribute('title', /.+/);
  expect(errors).toEqual([]);
});
