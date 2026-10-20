// 1.0.12: the shape controls are the Element editor panel (then the Shape editor), docked, not a band under the canvas; the Layers ink default shows a two-colour swatch.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, unlockStamp, pickShape, stampInstance, clickStamp } = require('./helpers/harness');

test('the Edit group of the Shape panel is empty until a shape is selected', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await expect(page.locator('#sel')).toBeHidden();                  // no Element editor open until a shape is placed
  await unlockStamp(page); await pickShape(page);
  await clickStamp(page, await stampInstance(page));
  await showPanel(page, 'motifs');                                   // the Edit group is at the top of the Shape panel
  await expect(page.locator('#sel')).toBeVisible();
  await expect(page.locator('#sel')).not.toHaveClass(/none/);
  expect(errors).toEqual([]);
});

test('the default ink in Layers shows a swatch split between the project ink and background', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'lyrs');
  const bg = await page.evaluate(() => document.querySelector('#wl_ly .cwsb i').getAttribute('style') || '');
  expect(bg).toMatch(/linear-gradient\(135deg, ?(rgba?\([^)]*\)|#[0-9a-f]+) 50%, ?(rgba?\([^)]*\)|#[0-9a-f]+) 50%\)/);
  expect(errors).toEqual([]);
});
