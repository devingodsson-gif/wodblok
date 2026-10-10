// New stamp (+) used to throw "isDef is not defined" and add nothing (UX review B1; the bug is also in v100).
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState } = require('./helpers/harness');

test('New stamp adds a blank stamp, selects it, and raises no page error', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  const before = JSON.parse(await getState(page)).tiles.length;
  await page.click('#addT');
  await settle(page);
  const s = JSON.parse(await getState(page));
  expect(s.tiles.length).toBe(before + 1);
  expect(s.tiles[s.tiles.length - 1].items.length).toBe(0);
  expect(errors).toEqual([]);
  await page.keyboard.press('Control+z');
  await settle(page);
  expect(JSON.parse(await getState(page)).tiles.length).toBe(before);
});
