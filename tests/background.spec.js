// 2.27.0: the Background is an ordinary Shape: a Rectangle the size of the canvas, the first tray colour, called "Background", at the bottom of the element list.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState } = require('./helpers/harness');

const state = async page => JSON.parse(await getState(page));

test('a new project starts with a Background shape: canvas-sized, first tray colour (linked), named, first in the list; the canvas has no Background setting', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  const s = await state(page), bg = s.els.filter(q => q.nm === 'Background');
  expect(bg).toHaveLength(1);
  expect(s.els[0].nm, 'at the bottom of the list').toBe('Background');
  expect(bg[0].k).toBe('shape'); expect(bg[0].sh).toBe('rect');
  expect(bg[0].ink, 'the first tray colour, linked').toBe('@' + s.proj.ts[0]);
  const b = await page.locator('#art').evaluate(a => { const v = a.viewBox.baseVal; return { width: v.width, height: v.height }; });
  expect(bg[0].s).toBeCloseTo(b.width, 0); expect(bg[0].s * bg[0].wy).toBeCloseTo(b.height, 0);
  expect([bg[0].x, bg[0].y]).toEqual([+(b.width / 2).toFixed(1), +(b.height / 2).toFixed(1)]);
  await openPanel(page, 'canvas');
  await expect(page.locator('#bg_on')).toHaveCount(0);
  expect(s.proj.bgOn).toBeUndefined();
  expect(errors).toEqual([]);
});

test('a click on the canvas goes through the Background; the list picks it; deleting it leaves a transparent canvas', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await settle(page);
  expect(await page.locator('#fpov .sel').count(), 'nothing is picked by clicking the canvas').toBe(0);
  await showPanel(page, 'lyrs'); await page.locator('#lyl2 .lyr').last().locator('.lyn').click(); await settle(page);
  expect(await page.locator('#fpov .sel').count(), 'the list picks it').toBe(1);
  await page.keyboard.press('Delete'); await settle(page);
  expect((await state(page)).els.filter(q => q.nm === 'Background')).toHaveLength(0);
  expect(errors).toEqual([]);
});
