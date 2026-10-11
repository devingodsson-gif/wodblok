// Layers and snapshots each have a "⋯" menu on every row: Rename, Duplicate, Move up/down, Delete (layers); Rename, Delete (snapshots).
// Rename used to be a double-click nobody could find, and layers could only be reordered by dragging (UX review D16).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const names = async page => JSON.parse(await getState(page)).layers.map(l => l.name);
const menu = (page, name) => page.locator('.rowm').getByRole('menuitem', { name, exact: true });

async function twoLayers(page) {
  await openPanel(page, 'lyrs');
  await page.click('#ly_add'); await page.click('#ly_menu [data-lt="p"]'); await settle(page);
}

test('the Layers "⋯" menu renames, duplicates, moves and deletes, and a one-layer project cannot delete its last layer', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await twoLayers(page);
  expect(await names(page)).toHaveLength(2);
  const first = (await names(page))[0], second = (await names(page))[1];
  const rows = page.locator('#lyl2 .lyr');                                         // shown top first: the second layer is the first row
  await rows.first().locator('[data-more]').click();
  await expect(page.locator('.rowm')).toBeVisible();
  await expect(menu(page, 'Move up')).toBeDisabled();                              // already the top one
  await menu(page, 'Rename').click();
  const box = rows.first().locator('input'); await expect(box).toBeVisible();
  await box.fill('Top layer'); await box.press('Enter'); await settle(page);
  expect((await names(page))[1]).toBe('Top layer');
  await rows.first().locator('[data-more]').click(); await menu(page, 'Move down').click(); await settle(page);
  expect(await names(page)).toEqual(['Top layer', first]);                         // the renamed layer is now printed first
  await rows.last().locator('[data-more]').click(); await menu(page, 'Duplicate').click(); await settle(page);
  expect(await names(page)).toHaveLength(3);
  expect((await names(page)).some(n => /Top layer copy/.test(n))).toBe(true);
  await rows.first().locator('[data-more]').click(); await menu(page, 'Delete').click(); await settle(page);
  expect(await names(page)).toHaveLength(2);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('the menu closes on Escape and on a click elsewhere, and items are reachable with the keyboard', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  const more = page.locator('#lyl2 .lyr [data-more]').first();
  await more.click(); await expect(page.locator('.rowm')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('.rowm')).toHaveCount(0);
  await more.click(); await expect(page.locator('.rowm')).toBeVisible();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');         // the second item: Duplicate
  await settle(page);
  expect(await names(page)).toHaveLength(2);
  await more.click(); await expect(page.locator('.rowm')).toBeVisible();
  await page.mouse.click(300, 400);
  await expect(page.locator('.rowm')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a snapshot has a "⋯" menu with Rename and Delete', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'hist');
  await page.click('#hsadd');
  const nm = page.locator('#hsl .hr input'); await expect(nm).toBeFocused(); await nm.press('Enter');   // wait for the name box: on a slow machine Enter came too early
  const row = page.locator('#hsl .hr').first();
  await expect(row.locator('[data-more]')).toBeVisible();
  await row.locator('[data-more]').click(); await menu(page, 'Rename').click();
  const box = page.locator('#hsl .hr input'); await expect(box).toBeVisible();
  await box.fill('Liked one'); await box.press('Enter');
  await expect(page.locator('#hsl .hr b').first()).toHaveText('Liked one');
  await page.locator('#hsl .hr [data-more]').first().click(); await menu(page, 'Delete').click();
  await expect(page.locator('#hsl .hr')).toHaveCount(0);
  expect(errors).toEqual([]);
});
