// 2.3.1: the Sheet is gone; the canvas has a Background (the project's Paper colour) set in the Canvas panel, with an option for none.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const proj = async page => JSON.parse(await getState(page)).proj;
const bgRects = page => page.$$eval('#dyn > rect', rs => rs.map(r => r.getAttribute('fill')));

test('a new project has a Background: the first tray colour, linked, drawn under everything; there is no Sheet', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  const pj = await proj(page);
  expect(pj.bgOn).toBeUndefined();
  expect(String(pj.bg)).toMatch(/^@|^#/);
  expect((await bgRects(page)).length).toBe(1);
  expect(JSON.parse(await getState(page)).els.filter(q => q.k === 'sheet')).toHaveLength(0);
  await expect(page.locator('#elb [data-k="sheet"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the Canvas panel has a Background with an on/off switch; off draws nothing', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'canvas');
  await expect(page.locator('#bg_on')).toBeChecked();
  await page.uncheck('#bg_on'); await settle(page);
  expect((await proj(page)).bgOn).toBe(false);
  expect((await bgRects(page)).length).toBe(0);
  await page.check('#bg_on'); await settle(page);
  expect((await proj(page)).bgOn).toBeUndefined();
  expect((await bgRects(page)).length).toBe(1);
  expect(errors).toEqual([]);
});
