// 1.40.0: a letter moved by hand keeps its move when the text is edited; Convert to shapes makes the letters plain shapes.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, showPanel, unlockStamp, canvasToClient, stampInstance, clickStamp } = require('./helpers/harness');

// text goes into the unlocked stamp: type it in the Text panel, then click an instance of the stamp on the canvas
async function setup(page) {
  await unlockStamp(page); await showPanel(page, 'text');
  await page.fill('#tx_t', 'ab'); await settle(page);
  const p = await stampInstance(page);
  await clickStamp(page, p);
  const items = async () => JSON.parse(await getState(page)).tiles[0].items;
  await expect.poll(async () => (await items()).filter(q => q.tg).length, { timeout: 15000 }).toBe(2);
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  const at = async (q, dx = 0, dy = 0) => { const c = await page.evaluate(([i, u, v]) => __wbTest.stampToCanvas(i, u, v), [p.i, q.x + dx, q.y + dy]); return canvasToClient(page, c.x, c.y); };
  // Alt picks one letter instead of the whole text; drag it 40 stamp units down
  const b = (await items())[1], from = await at(b), to = await at(b, 0, 40);
  await page.keyboard.down('Alt');
  await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 3 }); await page.mouse.move(to.x, to.y, { steps: 3 }); await page.mouse.up();
  await page.keyboard.up('Alt'); await settle(page);
  return { items, at };
}
// a plain click on a letter selects the whole text, which the Text panel then edits
const selectText = async (page, items, at) => { await page.keyboard.press('Escape'); await page.mouse.click(...Object.values(await at((await items())[0])).slice(0, 2)); await settle(page); await expect(page.locator('#tx_ed')).toBeVisible(); };

test('a letter moved by hand keeps its move when the words change', async ({ page }) => {
  const { errors } = await openApp(page);
  const { items, at } = await setup(page);
  const moved = await items();
  expect(moved[1].y - moved[0].y).toBeGreaterThan(20);
  await selectText(page, items, at);          // the whole text, so the panel edits it
  await page.click('#tx_tc [data-c="u"]');
  await expect.poll(async () => (await items())[0].m, { timeout: 15000 }).not.toBe(moved[0].m);
  await settle(page);
  const after = await items();
  expect(after.length).toBe(2);
  expect(after[1].y - after[0].y).toBeGreaterThan(20);
  expect(errors).toEqual([]);
});

test('Convert to shapes frees the letters from the text', async ({ page }) => {
  const { errors } = await openApp(page);
  const { items, at } = await setup(page);
  await selectText(page, items, at);
  await expect(page.locator('#tx_conv')).toBeVisible();
  await page.click('#tx_conv'); await settle(page);
  const s = JSON.parse(await getState(page)).tiles[0];
  expect(s.items.length).toBe(2);
  expect(s.items.some(q => q.tg)).toBe(false);
  expect(s.tgm || {}).toEqual({});
  await expect(page.locator('#tx_conv')).toBeHidden();
  expect(errors).toEqual([]);
});
