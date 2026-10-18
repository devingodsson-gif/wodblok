// 1.40.0: a letter moved by hand keeps its move when the text is edited; Convert to shapes makes the letters plain shapes.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle, getState, putText } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

async function setup(page) {
  await setMode(page, 'stamp'); await openPanel(page, 'text');
  await page.fill('#tx_t', 'ab'); await putText(page);
  const r = await page.locator('#ed').boundingBox(), sc = r.height / 288, ox = r.x + (r.width - r.height) / 2;
  const items = async () => JSON.parse(await getState(page)).tiles[0].items;
  const b = (await items())[1];
  await page.mouse.click(r.x + 3, r.y + 3); await settle(page);
  const sx = ox + (b.x - 8 + 24) * sc, sy = r.y + (b.y + 24) * sc;
  await page.mouse.move(sx, sy); await page.mouse.down(); await page.mouse.move(sx + 10, sy + 40, { steps: 5 }); await page.mouse.up(); await settle(page);
  return { items, r };
}

test('a letter moved by hand keeps its move when the words change', async ({ page }) => {
  const { errors } = await openApp(page);
  const { items, r } = await setup(page);
  const moved = await items();
  expect(moved[1].y - moved[0].y).toBeGreaterThan(20);
  await page.keyboard.press('Control+a'); await settle(page);          // the whole text, so the panel edits it
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
  const { items } = await setup(page);
  await page.keyboard.press('Control+a'); await settle(page);
  await expect(page.locator('#tx_conv')).toBeVisible();
  await page.click('#tx_conv'); await settle(page);
  const s = JSON.parse(await getState(page)).tiles[0];
  expect(s.items.length).toBe(2);
  expect(s.items.some(q => q.tg)).toBe(false);
  expect(s.tgm || {}).toEqual({});
  await expect(page.locator('#tx_conv')).toBeHidden();
  expect(errors).toEqual([]);
});
