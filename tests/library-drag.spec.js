// Clicking a library shape arms it for stamping (UX review C7). Dragging one onto the stamp worked only in the Stamp editor, which is gone; on the canvas a shape is placed with the brush.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

test('a click on a library shape arms it as the brush and adds nothing; dragging it from the list drops nothing on the canvas', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'motifs');
  await page.click('#lib .lfr[data-f="b:Flowers"]');                 // folders open in place (1.5.0)
  const count = () => page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles[0].items.length);
  const n0 = await count();
  const tile = page.locator('#lib button[data-m]').first();
  const tb = await tile.boundingBox(), art = await page.locator('#art').boundingBox();
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
  await page.mouse.down();
  await page.mouse.move(art.x + art.width / 2, art.y + art.height / 2, { steps: 8 });
  await page.mouse.up();
  await settle(page);
  expect(await count()).toBe(n0);                                    // dragging onto the Pattern canvas places nothing (no stamp is unlocked)
  await expect(page.locator('#mdg')).toHaveCount(0);
  await tile.click();
  await settle(page);
  expect(await count()).toBe(n0);
  await expect(tile).toHaveClass(/on/);
  expect(errors).toEqual([]);
});
