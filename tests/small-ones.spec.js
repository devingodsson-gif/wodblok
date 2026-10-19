// 1.0.12: the shape controls are the Element editor panel (then the Shape editor), docked, not a band under the canvas; the Layers ink default shows a two-colour swatch.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, unlockStamp, pickShape, stampInstance, clickStamp } = require('./helpers/harness');

test('the Element editor is the floating panel for a placed shape: docked at the bottom, empty until a shape is selected', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await expect(page.locator('#sel')).toBeHidden();                  // no Element editor open until a shape is placed
  await unlockStamp(page); await pickShape(page);
  await clickStamp(page, await stampInstance(page));
  await page.click('#rail-sedit');                                   // opens (or closes) docked at the bottom
  if (!(await page.locator('#sel').isVisible())) await page.click('#rail-sedit');
  await expect(page.locator('#sel')).toBeVisible();
  expect(await page.evaluate(() => !!document.getElementById('sel').closest('.dk-b'))).toBe(true);
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
