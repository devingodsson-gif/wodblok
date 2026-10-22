const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// 2.25.0: Add text in a stamp tab starts the typing on the stamp, where the text is; the letters follow the keys; Esc ends it; an emptied text is taken out.
const items = async page => JSON.parse(await H.getState(page)).tiles.find(t => t.id === 1).items;

async function addTextInTab(page) {
  const o = await H.openApp(page, { seed: 4, pattern: false });
  await page.click('#rzdo'); await H.settle(page, { max: 60000 });
  const p = await H.stampInstance(page); const c = await H.canvasToClient(page, p.cx, p.cy);
  await page.mouse.dblclick(c.x, c.y); await H.settle(page);
  const n0 = (await items(page)).length;
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  await page.locator('.elk[data-k="text"] [data-add]').click(); await H.settle(page);
  return { ...o, n0 };
}

test('Add text in a stamp tab types in place: the letters follow the keys, Esc ends it, one Undo takes the typing back', async ({ page }) => {
  const { errors, n0 } = await addTextInTab(page);
  await expect(page.locator('#txin')).toBeVisible();
  expect(await page.evaluate(() => document.activeElement.id), 'the keys go to the stamp').toBe('txin');
  await page.keyboard.type('OAK'); await H.settle(page);
  expect((await items(page)).length - n0, 'three letters').toBe(3);
  await page.keyboard.press('Escape'); await H.settle(page);
  await expect(page.locator('#txin')).toBeHidden();
  expect(await page.evaluate(() => window.__wbTest.unlockedStamp()), 'still in the tab').toBe(1);
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await items(page)).length - n0, 'back to the word it started with').toBe(4);
  expect(errors).toEqual([]);
});

test('emptying a stamp text typed in place takes it out', async ({ page }) => {
  const { errors, n0 } = await addTextInTab(page);
  await page.keyboard.press('Backspace'); await page.keyboard.press('Escape'); await H.settle(page);
  expect((await items(page)).length).toBe(n0);
  expect(errors).toEqual([]);
});
