const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// 2.25.0: Add text in a stamp tab starts the typing on the stamp, where the text is; the letters follow the keys; Esc ends it; an emptied text is taken out.
let sid = 1;   // 2.30.0: the stamp the roll put under the pointer
const items = async page => JSON.parse(await H.getState(page)).tiles.find(t => t.id === sid).items;

async function addTextInTab(page) {
  // 2.77.0: a roll makes a Look since 2.76.3 (often with no stamps), so the test's own Pattern and its first stamp are used instead
  const o = await H.openApp(page, { seed: 4 });
  const p = await H.stampInstance(page, JSON.parse(await H.getState(page)).tiles[0].id); const c = await H.canvasToClient(page, p.cx, p.cy);
  await page.mouse.dblclick(c.x, c.y); await H.settle(page);
  sid = await page.evaluate(() => window.__wbTest.unlockedStamp());
  const n0 = (await items(page)).length;
  await page.click('#elb [data-k="text"]'); await H.settle(page);   // 2.26.0: the bar button does what Add does
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
  expect(await page.evaluate(() => window.__wbTest.unlockedStamp()), 'still in the tab').toBe(sid);
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
