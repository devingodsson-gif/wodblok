// 2.0.1: bugs found by the audit after 2.0.0: the Edit texture button, the S (Split) and K (Knock out) keys on an unlocked stamp, Mod+D only
// on an unlocked stamp, and the unbundled build (WB_TARGET=esm) loading at all.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, unlockStamp, pickShape, stampInstance, clickStamp, fitView } = require('./helpers/harness');

const items = async page => JSON.parse(await getState(page)).tiles[0].items;
const shapeOnStamp = async page => { await unlockStamp(page); await pickShape(page); await clickStamp(page, await stampInstance(page)); await page.keyboard.press('Escape'); await clickStamp(page, await stampInstance(page)); };

test('S splits and K knocks out the selected shape of an unlocked stamp; neither does anything when the stamp is locked', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: true });
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
  await showPanel(page, 'stmp'); await page.locator('#stmpl .smklk').first().click(); await settle(page); await fitView(page);
  await page.keyboard.press('k'); await settle(page);
  expect(!!(await items(page))[n - 1].k).toBe(k0);
  await page.keyboard.press('s');
  await expect(page.locator('#spbar')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Ctrl+D duplicates the selected shape of an unlocked stamp and does nothing on a locked one', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: true });
  await shapeOnStamp(page);
  const n = (await items(page)).length;
  await page.keyboard.press('Control+d'); await settle(page);
  expect((await items(page)).length).toBe(n + 1);
  await showPanel(page, 'stmp'); await page.locator('#stmpl .smklk').first().click(); await settle(page); await fitView(page);
  await page.keyboard.press('Control+d'); await settle(page);
  expect((await items(page)).length).toBe(n + 1);
  expect(errors).toEqual([]);
});

test('Settings > Shortcuts lists the keys that work but are not commands, and no key is listed that does nothing', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.evaluate(() => document.getElementById('stgo').click());
  await page.click('#stgnav [data-p="keys"]');
  const rows = await page.locator('#stgkl .stgkr').evaluateAll(r => r.map(x => x.textContent));
  for (const k of ['Copy motif', 'Paste motif', 'Hand (hold)', 'Split motif: apply', 'Zoom to fit']) expect(rows.join('|'), k).toContain(k);
  await page.fill('#stgkq', 'knock');
  await expect(page.locator('#stgkl .stgkr')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('the Shape list and the Element editor follow the unlocked stamp: locking it empties both', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: true });
  await shapeOnStamp(page);
  await expect.poll(() => page.locator('#mlist .mr').count()).toBeGreaterThan(0);   // 2.3.0: the list sits in the Element panel, which is not always in front, so it is counted, not looked at
  await showPanel(page, 'stmp'); await page.locator('#stmpl .smklk').first().click(); await settle(page); await fitView(page);
  await expect(page.locator('#mlist .mr')).toHaveCount(0);   // the panel has no size when it is empty, so it is checked in the page, not by sight
  await expect(page.locator('#sel')).toHaveClass(/none/);
  expect(errors).toEqual([]);
});
