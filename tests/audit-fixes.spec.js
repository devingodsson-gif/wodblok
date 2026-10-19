// 2.0.1: bugs found by the audit after 2.0.0: the Edit texture button, the S (Split) and K (Knock out) keys on an unlocked stamp, Mod+D only
// on an unlocked stamp, and the unbundled build (WB_TARGET=esm) loading at all.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, unlockStamp, pickShape, stampInstance, clickStamp } = require('./helpers/harness');

const items = async page => JSON.parse(await getState(page)).tiles[0].items;
const shapeOnStamp = async page => { await unlockStamp(page); await pickShape(page); await clickStamp(page, await stampInstance(page)); await page.keyboard.press('Escape'); await clickStamp(page, await stampInstance(page)); };

test('Edit on a texture row opens the Textures panel on that texture without an error', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'tex');
  await page.click('#tx_add'); await settle(page);
  await page.click('#tx_apply'); await settle(page);          // a texture on the Canvas: its row has Edit
  await page.evaluate(() => document.querySelector('.txr [data-a="e"]').click());
  await expect(page.locator('section.pn[data-p="tex"]:not([hidden])')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('S splits and K knocks out the selected shape of an unlocked stamp; neither does anything when the stamp is locked', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await shapeOnStamp(page);
  const n = (await items(page)).length;
  await page.keyboard.press('s');
  await expect(page.locator('#spbar')).toBeVisible();
  await page.click('#spno');
  const k0 = !!(await items(page))[n - 1].k;
  await page.keyboard.press('k'); await settle(page);
  expect(!!(await items(page))[n - 1].k).toBe(!k0);
  await page.keyboard.press('k'); await settle(page);
  // lock the stamp again: the keys are left alone
  await showPanel(page, 'stmp'); await page.locator('#stmpl .smklk').first().click(); await settle(page);
  await page.keyboard.press('k'); await settle(page);
  expect(!!(await items(page))[n - 1].k).toBe(k0);
  await page.keyboard.press('s');
  await expect(page.locator('#spbar')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Ctrl+D duplicates the selected shape of an unlocked stamp and does nothing on a locked one', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await shapeOnStamp(page);
  const n = (await items(page)).length;
  await page.keyboard.press('Control+d'); await settle(page);
  expect((await items(page)).length).toBe(n + 1);
  await showPanel(page, 'stmp'); await page.locator('#stmpl .smklk').first().click(); await settle(page);
  await page.keyboard.press('Control+d'); await settle(page);
  expect((await items(page)).length).toBe(n + 1);
  expect(errors).toEqual([]);
});
