// Free place opens with the current stamp picked, so the first click on the canvas places it (UX review D2).
// Before, nothing happened on click until a stamp tile was picked, and nothing said so.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

test('Free place: the first click on the canvas places the current stamp', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await page.click('#lmode [data-m="x"]');
  await settle(page);
  await expect(page.locator('#lfpst [data-t].on')).toHaveCount(1);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await settle(page);
  const s = JSON.parse(await getState(page));
  expect(s.layers[0].pl.length).toBe(1);
  expect(s.layers[0].pl[0].t).toBe(s.tiles[0].id);
  expect(errors).toEqual([]);
});

test('Free place: Esc stops placing', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await page.click('#lmode [data-m="x"]');
  await settle(page);
  await page.keyboard.press('Escape');
  await settle(page);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await settle(page);
  expect(JSON.parse(await getState(page)).layers[0].pl.length).toBe(0);
  expect(errors).toEqual([]);
});

test('Art and Text modes: no explanatory empty-state text in the placed list (UX review D3)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await page.click('#lmode [data-m="t"]');
  await settle(page);
  await expect(page.locator('#lfpl')).not.toContainText('show up here');
  await page.click('#lmode [data-m="a"]');
  await settle(page);
  await expect(page.locator('#lfpl')).not.toContainText('Stamps you place');
  expect(errors).toEqual([]);
});
