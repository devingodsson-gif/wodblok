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

test('Send to back puts the selected motif behind the others (UX review D8)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  await page.click('.seg2 [data-v="stamp"]');
  await page.click('.rail [data-pn="motifs"]');
  const lib = page.locator('#lib > *');
  const ids = [];
  for (const n of [0, 1]) {
    await lib.nth(n).click();
    await page.mouse.click(n ? 700 : 480, 400);
    await page.keyboard.press('Escape');
    await settle(page);
  }
  const before = JSON.parse(await getState(page)).tiles[0].items.map(i => i.m);
  expect(before.length).toBe(2);
  await page.mouse.click(700, 400);   // select the second, front-most motif
  await expect(page.locator('#ssb')).toBeVisible();
  await page.click('#ssb');
  await settle(page);
  const after = JSON.parse(await getState(page)).tiles[0].items.map(i => i.m);
  expect(after).toEqual([before[1], before[0]]);
  expect(errors).toEqual([]);
});
