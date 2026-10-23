const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// 2.27.0 "Photoshop editing habits": the keys and mouse moves that people bring from Photoshop work here.
const st = async page => JSON.parse(await H.getState(page));
const els = async (page, k) => (await st(page)).els.filter(q => q.k === k);

test('Ctrl+G groups the selected elements and Ctrl+Shift+G ungroups; Shift+G alone does nothing', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await page.keyboard.press('Escape');
  await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
  await H.showPanel(page, 'lyrs'); await page.locator('#lyl2 .lyr').nth(0).locator('.lyn').click();
  await H.settle(page); await H.showPanel(page, 'lyrs'); await page.locator('#lyl2 .lyr').nth(1).locator('.lyn').click({ modifiers: ['Control'] });
  await page.keyboard.press('Shift+G'); await H.settle(page);
  expect((await els(page, 'group')).length, 'Shift+G is not Group any more').toBe(0);
  await page.keyboard.press('Control+g'); await H.settle(page);
  expect((await els(page, 'group')).length, 'Ctrl+G groups').toBe(1);
  await page.keyboard.press('Control+Shift+G'); await H.settle(page);
  expect((await els(page, 'group')).length, 'Ctrl+Shift+G ungroups').toBe(0);
  expect((await st(page)).els.every(q => !q.g)).toBe(true);
  const c = await page.evaluate(() => window.__wbTest.commands.get('element.group').shortcut);
  expect(c).toBe('Mod+G');
  expect(errors).toEqual([]);
});

test('the Text panel field empties when the selection leaves a text, and a new text starts as "Text", not the old words', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await page.click('#elb [data-k="text"]'); await H.settle(page);             // arms text; a click on the canvas places it and the typing starts there
  const b0 = await page.locator('#art').boundingBox();
  await page.mouse.move(b0.x + b0.width * 0.4, b0.y + b0.height * 0.4);
  await page.waitForFunction(() => document.querySelector('#fpov .gh'), null, { timeout: 5000 });
  await page.mouse.click(b0.x + b0.width * 0.4, b0.y + b0.height * 0.4); await H.settle(page);
  await page.keyboard.type('Hello'); await H.settle(page);
  await page.keyboard.press('Escape'); await H.settle(page);
  const t = (await els(page, 'text'))[0], tc = await H.canvasToClient(page, t.x, t.y);
  await page.mouse.click(tc.x, tc.y); await H.settle(page);               // select it again: its words are in the field
  expect(await page.inputValue('#tx_t')).toBe('Hello');
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width * 0.92, b.y + b.height * 0.95); await H.settle(page);   // empty canvas: nothing selected
  expect(await page.inputValue('#tx_t'), 'nothing selected, nothing in the field').toBe('');
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  expect(await page.inputValue('#tx_t'), 'a new text starts fresh').toBe('Text');
  expect(errors).toEqual([]);
});
