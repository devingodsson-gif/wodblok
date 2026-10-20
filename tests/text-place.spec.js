// Text: on the canvas the text follows the cursor with its box drawn round it, a click puts it down, and it stays on the cursor to put down again (1.38.0).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, unlockStamp, stampInstance, canvasToClient } = require('./helpers/harness');

const groups = async page => new Set(JSON.parse(await getState(page)).tiles[0].items.map(i => i.tg)).size;
// move over the first printed instance of the unlocked stamp, dx/dy in client pixels from its middle
const hover = async (page, dx = 0, dy = 0) => { const p = await stampInstance(page), c = await canvasToClient(page, p.cx, p.cy), x = c.x + dx, y = c.y + dy; await page.mouse.move(x - 5, y - 5); await page.mouse.move(x, y); return [x, y]; };

test('Unlocked stamp: typing arms the text; each click on the canvas puts a copy in the stamp; right-click stops', async ({ page }) => {
  const { errors } = await openApp(page);
  await unlockStamp(page); await openPanel(page, 'text');
  await expect(page.locator('#tx_go')).toHaveText('Add text');
  await page.fill('#tx_t', 'Wod');
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'true');
  expect(await groups(page)).toBe(0);                            // nothing is on the stamp until you click
  const [x1, y1] = await hover(page, -30, 0); await page.mouse.click(x1, y1); await settle(page, { max: 30000 });
  expect(await groups(page)).toBe(1);
  const [x2, y2] = await hover(page, 30, 0); await page.mouse.click(x2, y2); await settle(page, { max: 30000 });
  expect(await groups(page)).toBe(2);                            // still armed
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.click(x2, y2 + 60, { button: 'right' }); await settle(page);
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'false');
  expect(await groups(page)).toBe(2);
  expect(errors).toEqual([]);
});

test('Text layer: the text on the cursor has its box drawn round it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await openPanel(page, 'text'); await settle(page);
  await page.fill('#tx_t', 'ONE TWO');
  await page.waitForTimeout(500);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width / 2 - 5, b.y + b.height / 2 - 5); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await expect(page.locator('#fpov rect.gh')).toHaveCount(1, { timeout: 10000 });
  const w = +(await page.locator('#fpov rect.gh').getAttribute('width'));
  expect(w).toBeGreaterThan(10);
  expect(errors).toEqual([]);
});
