// 1.20: the Colours panel has a Saved colours library: one list of single colours in folders (Yours, your folders, Wada colours as a built-in set).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel } = require('./helpers/harness');

test('add colours, name them, make a folder, search, move, delete; the picker dropdown lists them first', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  await expect(page.locator('#scl .scf').first()).toContainText('Yours');
  await expect(page.locator('#scl .scf', { hasText: 'Wada colours' })).toBeVisible();
  // add a colour: it lands in Yours and the picker opens for it
  await page.click('#scadd');
  await expect(page.locator('.cpk')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.cpk')).toBeHidden();   // 2.77.0: the picker is gone before the next click (it caught a click while closing, 1 run in 4)
  await expect(page.locator('#scl .scr')).toHaveCount(1);
  await expect(page.locator('#scn')).toHaveText('1');
  // rename it from its menu
  await page.click('#scl .scr [data-more]');
  await page.click('.rowm >> text=Rename');
  await page.fill('#scl .ren input', 'Moss');
  await page.keyboard.press('Enter');
  await expect(page.locator('#scl .scr b')).toHaveText('Moss');
  // a folder, then move the colour into it
  await page.click('#scnew');
  await page.fill('#scl .scform input', 'Greens');
  await page.keyboard.press('Enter');
  await expect(page.locator('#scl .scf', { hasText: 'Greens' })).toBeVisible();
  await page.click('#scl .scf:has-text("Yours")');
  await page.click('#scl .scr [data-more]');
  await page.click('.rowm >> text=Move to “Greens”');
  await expect(page.locator('#scl .scf:has-text("Greens") .lfc')).toHaveText('1');
  // search finds it, and Wada's colours
  await page.fill('#scq', 'moss');
  await expect(page.locator('#scl .scr')).toHaveCount(1);
  await page.fill('#scq', '');
  // the picker from a tray colour lists it
  await page.click('#tyc .tys >> nth=0');
  await page.click('.cpks .ddb');
  await expect(page.locator('.cpkl')).toContainText('Moss');
  await page.keyboard.press('Escape');
  // delete the folder: the colour returns to Yours
  await page.keyboard.press('Escape');
  await page.click('#scl .scf:has-text("Greens") [data-fmore]');
  await page.click('.rowm >> text=Delete folder');
  await page.click('#scl [data-fok]');
  await expect(page.locator('#scl .scf:has-text("Yours") .lfc')).toHaveText('1');
  expect(errors).toEqual([]);
});

test('Wada colours can be copied into Yours', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  await page.click('#scl .scf:has-text("Wada colours")');
  await page.click('#scl .scr [data-more] >> nth=0');
  await page.click('.rowm >> text=Copy to Yours');
  await expect(page.locator('#scl .scf:has-text("Yours") .lfc')).toHaveText('1');
  expect(errors).toEqual([]);
});
