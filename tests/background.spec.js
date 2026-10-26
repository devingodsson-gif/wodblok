// 2.27.0: the Background is an ordinary element, the first tray colour, called "Background", at the bottom of the element list. 2.53.0: it is a Sheet (always the whole canvas).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState } = require('./helpers/harness');

const state = async page => JSON.parse(await getState(page));

test('a new project starts with a Background Sheet: the whole canvas, first tray colour (linked), named, first in the list; the canvas has no Background setting', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false, background: true });
  const s = await state(page), bg = s.els.filter(q => q.n === 'Background');
  expect(bg).toHaveLength(1);
  expect(s.els[0].n, 'at the bottom of the list').toBe('Background');
  expect(bg[0].k).toBe('sheet');
  expect(bg[0].ink, 'the first tray colour, linked').toBe('@' + s.proj.ts[0]);
  const full = await page.locator('#art').evaluate(a => { const v = a.viewBox.baseVal; return [...a.querySelectorAll('rect')].some(r => r.getAttribute('x') === '0' && r.getAttribute('y') === '0' && Math.abs(+r.getAttribute('width') - v.width) < .02 && Math.abs(+r.getAttribute('height') - v.height) < .02); });
  expect(full, 'its colour covers the canvas').toBe(true);
  await openPanel(page, 'canvas');
  await expect(page.locator('#bg_on')).toHaveCount(0);
  expect(s.proj.bgOn).toBeUndefined();
  expect(errors).toEqual([]);
});

test('a click on the canvas goes through the Background; the list picks it; deleting it leaves a transparent canvas', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false, background: true });
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await settle(page);
  expect(await page.locator('#fpov .sel').count(), 'nothing is picked by clicking the canvas').toBe(0);
  await showPanel(page, 'lyrs'); await page.locator('#lyl2 .lyr').last().locator('.lyn').click(); await settle(page);
  await expect(page.locator('section.pn[data-p="sheet"]'), 'the list picks it').toBeVisible();
  await page.keyboard.press('Delete'); await settle(page);
  expect((await state(page)).els.filter(q => q.n === 'Background')).toHaveLength(0);
  expect(errors).toEqual([]);
});
