// Canvas, with a stamp unlocked: four side squares pull the width or height; a corner or side grows away from the opposite one; Shift grows from the middle (1.37.0, moved from the Stamp editor to the Pattern canvas in step 11).
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, unlockStamp, pickShape, stampInstance, clickStamp } = require('./helpers/harness');

const item = async page => { const it = JSON.parse(await getState(page)).tiles[0].items; return it[it.length - 1]; };
const box = q => { const rx = 48 * q.s * (q.sx || 1), ry = 48 * q.s * (q.sy || 1); return { l: q.x - rx, r: q.x + rx, t: q.y - ry, b: q.y + ry, w: 2 * rx, h: 2 * ry }; };
const place = async page => {
  await unlockStamp(page); await pickShape(page);
  await clickStamp(page, await stampInstance(page));   // the placed shape is selected, with its handles
};
const pull = async (page, h, dx, dy, shift) => {
  const b = await page.locator(`#stoh [data-hd="${h}"]`).boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  if (shift) await page.keyboard.down('Shift');
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 3 }); await page.mouse.move(x + dx, y + dy, { steps: 3 });
  await page.mouse.up(); if (shift) await page.keyboard.up('Shift'); await settle(page);
};

test('eight squares: the side ones pull only the width or the height, and the far side stays put', async ({ page }) => {
  const { errors } = await openApp(page); await place(page);
  await expect(page.locator('#stoh [data-hd]')).toHaveCount(9);   // four corners, four sides, the round one
  const a = box(await item(page));
  await pull(page, 'e', 40, 0);
  let q = await item(page), b = box(q);
  expect(b.w).toBeGreaterThan(a.w + 1); expect(b.h).toBeCloseTo(a.h, 0); expect(b.l).toBeCloseTo(a.l, 0);
  await pull(page, 's', 0, 30);
  q = await item(page); const c = box(q);
  expect(c.h).toBeGreaterThan(b.h + 1); expect(c.w).toBeCloseTo(b.w, 0); expect(c.t).toBeCloseTo(b.t, 0);
  await pull(page, 'w', -30, 0);
  const d = box(await item(page));
  expect(d.w).toBeGreaterThan(c.w + 1); expect(d.r).toBeCloseTo(c.r, 0);
  await pull(page, 'n', 0, -30);
  const e = box(await item(page));
  expect(e.h).toBeGreaterThan(d.h + 1); expect(e.b).toBeCloseTo(d.b, 0);
  expect(errors).toEqual([]);
});

test('a corner keeps the opposite corner where it is, and Shift grows from the middle', async ({ page }) => {
  const { errors } = await openApp(page); await place(page);
  const a = box(await item(page));
  await pull(page, 'ne', 30, 0);   // a corner moved sideways only changes the width (2.15.0)
  let q = await item(page); const b = box(q);
  expect(b.w).toBeGreaterThan(a.w + 1); expect(b.l).toBeCloseTo(a.l, 0); expect(b.b).toBeCloseTo(a.b, 0);
  await pull(page, 'se', 20, 0, true);
  const c = box(await item(page));
  expect(c.w).toBeGreaterThan(b.w + 1);
  expect((c.l + c.r) / 2).toBeCloseTo((b.l + b.r) / 2, 0); expect((c.t + c.b) / 2).toBeCloseTo((b.t + b.b) / 2, 0);
  await pull(page, 'e', 25, 0, true);
  const d = box(await item(page));
  expect(d.w).toBeGreaterThan(c.w + 1); expect((d.l + d.r) / 2).toBeCloseTo((c.l + c.r) / 2, 0);
  expect(errors).toEqual([]);
});

test('a turned motif is stretched along its own width', async ({ page }) => {
  const { errors } = await openApp(page); await place(page);
  await page.evaluate(() => { const r = document.getElementById('srt'); r.value = 90; r.dispatchEvent(new Event('input', { bubbles: true })); }); await settle(page);
  const a = await item(page);
  expect(a.r).toBe(90);
  await pull(page, 'e', 0, 40);   // its east side now points down the screen
  const b = await item(page);
  expect(b.sx).toBeGreaterThan((a.sx || 1) + .01); expect(b.sy || 1).toBeCloseTo(a.sy || 1, 2);
  expect(b.y).toBeGreaterThan(a.y);
  expect(errors).toEqual([]);
});
