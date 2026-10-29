// A single selected motif shows four corner handles that scale it and a round handle above it that turns it; one drag is one undo step (UX review C7).
// Since step 11 the motif is a shape in an unlocked stamp on the Pattern canvas; its handles are in the overlay (#stoh).
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, unlockStamp, pickShape, stampInstance, clickStamp, canvasToClient } = require('./helpers/harness');

const items = async page => JSON.parse(await getState(page)).tiles[0].items;
async function selectOne(page) {
  await unlockStamp(page); await pickShape(page);
  await clickStamp(page, await stampInstance(page));   // the placed shape is selected
  await expect(page.locator('#stoh [data-hd]')).toHaveCount(9);   // four corners, four sides (1.37.0) and the round one
}
const centre = async (page, sel) => { const b = await page.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

test('four corners, four sides and a round handle show on one selected motif, and not on several', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await selectOne(page);
  expect(await page.locator('#stoh [data-hd="rot"]').count()).toBe(1);
  // a second shape, then a box round both: several shapes have no handles
  await clickStamp(page, await stampInstance(page), 55, 0);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  const p = await stampInstance(page), from = await canvasToClient(page, p.cx - 115, p.cy - 90), to = await canvasToClient(page, p.cx + 115, p.cy + 90);
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 3 }); await page.mouse.move(to.x, to.y, { steps: 3 }); await page.mouse.up();
  await settle(page);
  expect((await items(page)).length).toBeGreaterThan(1);
  await expect(page.locator('#stoh polygon.stes')).toHaveCount(2);
  await expect(page.locator('#stoh [data-hd]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('dragging the round handle turns the motif and a corner outward makes it larger; each is one undo step', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await selectOne(page);
  const before = await items(page);
  const r = await centre(page, '#stoh [data-hd="rot"]');
  await page.mouse.move(r.x, r.y); await page.mouse.down();
  await page.mouse.move(r.x + 120, r.y + 40, { steps: 6 }); await page.mouse.up();
  await settle(page);
  const mid = await items(page);
  const i = mid.findIndex((q, k) => q.r !== before[k].r);
  expect(i, 'one motif was turned').toBeGreaterThanOrEqual(0);
  expect(mid.filter((q, k) => q.r !== before[k].r)).toHaveLength(1);
  expect(mid[i].s).toBe(before[i].s);
  await page.waitForTimeout(700);                                                  // the history picks the finished drag up
  const c = await centre(page, '#stoh [data-hd="se"]'), nw = await centre(page, '#stoh [data-hd="nw"]');
  const dx = c.x - nw.x, dy = c.y - nw.y, k = 40 / Math.hypot(dx, dy);   // outward along the turned shape's own diagonal
  await page.keyboard.down('Shift');                                               // both sides together, as on the canvas (2.74.2; it was Ctrl)
  await page.mouse.move(c.x, c.y); await page.mouse.down();
  await page.mouse.move(c.x + dx * k, c.y + dy * k, { steps: 6 }); await page.mouse.up();
  await page.keyboard.up('Shift');
  await settle(page);
  const after = await items(page);
  expect(after[i].s).toBeGreaterThan(mid[i].s * 1.05);
  expect(after[i].r).toBe(mid[i].r);
  await page.waitForTimeout(700);
  await page.keyboard.press('Control+z'); await settle(page);
  expect((await items(page))[i].s).toBe(mid[i].s);                                 // undo took back only the resize
  expect((await items(page))[i].r).toBe(mid[i].r);
  expect(errors).toEqual([]);
});
