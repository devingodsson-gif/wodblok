// Position across / down (1.30.0). The radial arrangements of the old layer engine went with the layers in 2.2.2; a Pattern has its own layouts (element-pattern spec).
const { test, expect } = require('@playwright/test');
const fs = require('fs'), os = require('os'), path = require('path');
const { zipSync, unzipSync, strToU8, strFromU8 } = require('fflate');
const { openApp, openPanel, settle, getState, openProjectFile, noPattern } = require('./helpers/harness');

const setv = (page, id, v, ev = 'input') => page.locator('#' + id).evaluate((e, [v, ev]) => { e.value = v; e.dispatchEvent(new Event(ev, { bubbles: true })); }, [v, ev]);
// a layer starts with a Pattern; 'x' takes it away and picks the first stamp so clicks on the canvas place stamps freely
const vb = page => page.locator('#art').evaluate(e => e.getAttribute('viewBox').split(' ').map(Number));
const pick = async (page, v) => { await noPattern(page); if (v === 'x') { await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click'); await settle(page); } };

test('Position across / down sets where the selected stamp sits, and a group moves together', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers'); await pick(page, 'x'); await settle(page);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3); await settle(page);
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5); await settle(page);
  await page.keyboard.press('Escape'); await settle(page);
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5); await settle(page);
  await openPanel(page, 'mlist');
  await expect(page.locator('#lfpx')).toBeVisible();
  const [, , W, H] = await vb(page);
  await setv(page, 'lfpx', 25); await setv(page, 'lfpy', 80); await settle(page);
  const pl = JSON.parse(await getState(page)).els;
  expect(pl[1].x).toBeCloseTo(W * 0.25, 0); expect(pl[1].y).toBeCloseTo(H * 0.8, 0);
  expect(errors).toEqual([]);
});
