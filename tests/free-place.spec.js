// Placing a stamp on the canvas: pick it in the Stamp panel, then click the canvas (UX review D2, D3; rewritten for element layers in 2.1.12).
// A new layer starts with a Pattern; the Pattern is taken away first so the layer holds only what the test places.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, noPattern } = require('./helpers/harness');

test('Placing: the first click on the canvas places the stamp picked in the Stamp panel', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'stmp');
  await page.click('#lfpst [data-t]');
  await expect(page.locator('#lfpst [data-t].on')).toHaveCount(1);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await settle(page);
  const s = JSON.parse(await getState(page));
  expect(s.els.length).toBe(1);
  expect(s.els[0].t).toBe(s.tiles[0].id);
  expect(errors).toEqual([]);
});

test('Placing: Esc stops placing', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'stmp');
  await page.click('#lfpst [data-t]');
  await page.keyboard.press('Escape');
  await settle(page);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await settle(page);
  expect(JSON.parse(await getState(page)).els.length).toBe(0);
  expect(errors).toEqual([]);
});

test('Elements list: no explanatory empty-state text (UX review D3)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'lyrs');
  await expect(page.locator('#lyl2')).not.toContainText('show up here');
  await expect(page.locator('#lyl2')).not.toContainText('Stamps you place');
  expect(errors).toEqual([]);
});
