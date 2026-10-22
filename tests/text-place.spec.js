// Text: Add text makes the text (2.12.0: no more text on the cursor and clicking the canvas). In an open stamp's tab each press puts a copy in the middle of the stamp.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, unlockStamp, addStampText } = require('./helpers/harness');

const groups = async page => new Set(JSON.parse(await getState(page)).tiles[0].items.map(i => i.tg).filter(Boolean)).size;

test('Stamp tab: Add text puts the text in the middle of the stamp, each press another copy; typing alone adds nothing', async ({ page }) => {
  const { errors } = await openApp(page);
  await unlockStamp(page); await openPanel(page, 'text');
  await expect(page.locator('#tx_go')).toBeHidden();
  await page.fill('#tx_t', 'Wod');
  await page.waitForTimeout(400); await settle(page);
  expect(await groups(page)).toBe(0);
  await addStampText(page); await settle(page, { max: 30000 });
  expect(await groups(page)).toBe(1);
  await page.keyboard.press('Escape');
  await addStampText(page); await settle(page, { max: 30000 });
  expect(await groups(page)).toBe(2);
  expect(errors).toEqual([]);
});
