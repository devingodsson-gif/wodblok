// 2.12.0: selecting an element jumps to its panel; a picked motif is a ghost on the pointer and a click makes it, with or without a stamp on the canvas;
// a stamp's tab has Add motif and Add text; the rail order.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, addShape, unlockStamp } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));

test('selecting an element on the canvas jumps to its panel', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  await addShape(page);                                // the Shape panel is shown for the new shape
  await page.click('#rcls'); await page.keyboard.press('Escape'); await settle(page);
  await expect(page.locator('section.pn[data-p="mlist"]')).toBeHidden();
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await settle(page);   // the shape is in the middle of the canvas
  await expect(page.locator('section.pn[data-p="mlist"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('with nothing on the canvas a picked motif is still a ghost on the pointer, and a click makes it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  await page.click('#elb [data-k="motif"]'); await settle(page);
  await page.locator('#lib .lfr[data-f^="b:"]').first().click();
  await page.locator('#lib button[data-m]').first().click(); await settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.4); await settle(page);
  await expect(page.locator('#stoh .stgh')).toHaveCount(1);
  await page.mouse.click(b.x + b.width * 0.4, b.y + b.height * 0.4); await settle(page);
  expect((await st(page)).els.filter(q => q.k === 'motif')).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('a stamp tab has Add motif and Add text, each puts one in the stamp', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlockStamp(page);
  const n = async () => (await st(page)).tiles[0].items.length;
  const n0 = await n();
  await openPanel(page, 'motifs');
  await expect(page.locator('.elk[data-k="motif"] [data-add]')).toBeVisible();
  await page.click('.elk[data-k="motif"] [data-add]'); await settle(page);
  expect(await n()).toBe(n0 + 1);
  await openPanel(page, 'text');
  await expect(page.locator('.elk[data-k="text"] [data-add]')).toBeVisible();
  await page.fill('#tx_t', 'Hi');
  await page.click('.elk[data-k="text"] [data-add]'); await settle(page, { max: 30000 });
  expect(await n()).toBeGreaterThan(n0 + 1);
  expect(errors).toEqual([]);
});
