// Pattern editor: a placed stamp has side squares too; corners and sides grow away from the opposite one, Shift from the middle (1.37.0).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const pick = (page, v) => page.click(`#lmode [data-m="${v}"]`);
const piece = async page => JSON.parse(await getState(page)).layers[0].pl[0];
const box = p => { const w = p.s * (p.wx || 1), h = p.s * (p.wy || 1); return { l: p.x - w / 2, r: p.x + w / 2, t: p.y - h / 2, b: p.y + h / 2, w, h }; };   // a stamp's tile is square here
async function setup(page) {
  const r = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await pick(page, 'x'); await settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width * 0.4, b.y + b.height * 0.4); await settle(page);
  await page.keyboard.press('Escape'); await settle(page);
  await page.mouse.click(b.x + b.width * 0.4, b.y + b.height * 0.4); await settle(page);
  return r;
}
const pull = async (page, h, dx, dy, shift) => {
  const b = await page.locator(`#fpov [data-fh="${h}"]`).boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  if (shift) await page.keyboard.down('Shift');
  await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 3 }); await page.mouse.move(x + dx, y + dy, { steps: 3 });
  await page.mouse.up(); if (shift) await page.keyboard.up('Shift'); await settle(page);
};

test('a placed stamp has eight squares; a side one stretches only that way and the far side stays', async ({ page }) => {
  const { errors } = await setup(page);
  await expect(page.locator('#fpov [data-fh]')).toHaveCount(9);
  const a = box(await piece(page));
  await pull(page, 'e', 40, 0);
  const b = box(await piece(page));
  expect(b.w).toBeGreaterThan(a.w + 1); expect(b.h).toBeCloseTo(a.h, 0); expect(b.l).toBeCloseTo(a.l, 0);
  await pull(page, 's', 0, 30);
  const c = box(await piece(page));
  expect(c.h).toBeGreaterThan(b.h + 1); expect(c.w).toBeCloseTo(b.w, 0); expect(c.t).toBeCloseTo(b.t, 0);
  await pull(page, 'w', -30, 0);
  const d = box(await piece(page));
  expect(d.w).toBeGreaterThan(c.w + 1); expect(d.r).toBeCloseTo(c.r, 0);
  await pull(page, 'n', 0, -30);
  const e = box(await piece(page));
  expect(e.h).toBeGreaterThan(d.h + 1); expect(e.b).toBeCloseTo(d.b, 0);
  expect(errors).toEqual([]);
});

test('a corner keeps the opposite corner, and Shift grows from the middle', async ({ page }) => {
  const { errors } = await setup(page);
  const a = box(await piece(page));
  await pull(page, 'ne', 30, -30);
  const b = box(await piece(page));
  expect(b.w).toBeGreaterThan(a.w + 1); expect(b.l).toBeCloseTo(a.l, 0); expect(b.b).toBeCloseTo(a.b, 0);
  await pull(page, 'se', 25, 25, true);
  const c = box(await piece(page));
  expect(c.w).toBeGreaterThan(b.w + 1);
  expect((c.l + c.r) / 2).toBeCloseTo((b.l + b.r) / 2, 0); expect((c.t + c.b) / 2).toBeCloseTo((b.t + b.b) / 2, 0);
  await pull(page, 'e', 30, 0, true);
  const d = box(await piece(page));
  expect(d.w).toBeGreaterThan(c.w + 1); expect((d.l + d.r) / 2).toBeCloseTo((c.l + c.r) / 2, 0);
  expect(errors).toEqual([]);
});
