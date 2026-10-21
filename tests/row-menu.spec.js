// Elements and snapshots each have a "⋯" menu on every row: Rename, Duplicate, Move up/down, Delete (elements); Rename, Delete (snapshots).
// Rename used to be a double-click nobody could find, and rows could only be reordered by dragging (UX review D16).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, noPattern, showPanel } = require('./helpers/harness');

const names = async page => JSON.parse(await getState(page)).els.map(q => q.nm || q.u);
const menu = (page, name) => page.locator('.rowm').getByRole('menuitem', { name, exact: true });

async function twoElements(page) {
  await noPattern(page);
  await openPanel(page, 'stmp');
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  const box = await page.locator('#art').boundingBox();
  for (const f of [[0.3, 0.3], [0.65, 0.6]]) { await page.mouse.click(box.x + box.width * f[0], box.y + box.height * f[1]); await settle(page); }
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  await openPanel(page, 'lyrs');
  await settle(page);
}

test('the Elements "⋯" menu renames, duplicates, moves and deletes', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await twoElements(page);
  expect(await names(page)).toHaveLength(2);
  const [first] = await names(page);
  const rows = page.locator('#lyl2 .lyr');                                         // shown top first: the second element is the first row
  await showPanel(page, 'lyrs'); await rows.first().locator('[data-more]').click();
  await expect(page.locator('.rowm')).toBeVisible();
  await menu(page, 'Rename').click();
  const box = rows.first().locator('input'); await expect(box).toBeVisible();
  await box.fill('Top one'); await box.press('Enter'); await settle(page);
  expect((await names(page))[1]).toBe('Top one');
  await showPanel(page, 'lyrs'); await rows.first().locator('[data-more]').click(); await menu(page, 'Move down').click(); await settle(page);
  expect(await names(page)).toEqual(['Top one', first]);                           // the renamed element is now printed first
  await showPanel(page, 'lyrs'); await rows.last().locator('[data-more]').click(); await menu(page, 'Duplicate').click(); await settle(page);
  expect(await names(page)).toHaveLength(3);
  await showPanel(page, 'lyrs'); await rows.first().locator('[data-more]').click(); await menu(page, 'Delete').click(); await settle(page);
  expect(await names(page)).toHaveLength(2);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('the menu closes on Escape and on a click elsewhere, and items are reachable with the keyboard', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await twoElements(page);
  const more = page.locator('#lyl2 .lyr [data-more]').first();
  await showPanel(page, 'lyrs'); await more.click(); await expect(page.locator('.rowm')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('.rowm')).toHaveCount(0);
  await showPanel(page, 'lyrs'); await more.click(); await expect(page.locator('.rowm')).toBeVisible();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');         // the second item: Duplicate
  await settle(page);
  expect(await names(page)).toHaveLength(3);
  await showPanel(page, 'lyrs'); await more.click(); await expect(page.locator('.rowm')).toBeVisible();
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
