// A single selected motif shows four corner handles that scale it and a round handle above it that turns it; one drag is one undo step (UX review C7).
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, TARGET, openApp, openProjectFile, setMode, settle, getState, motifPoint } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const items = async page => JSON.parse(await getState(page)).tiles[0].items;
async function selectOne(page) {
  await openProjectFile(page, path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok.json'));
  await setMode(page, 'stamp');
  const pt = await motifPoint(page, { pad: 60, bottom: 200, c0: true });
  expect(pt, 'a motif can be clicked').not.toBeNull();
  await page.mouse.click(pt.x, pt.y);
  await expect(page.locator('#ed [data-hd]')).toHaveCount(5);
}
const centre = async (page, sel) => { const b = await page.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

test('four corners and a round handle show on one selected motif, and not on several', async ({ page }) => {
  const { errors } = await openApp(page);
  await selectOne(page);
  expect(await page.locator('#ed [data-hd="rot"]').count()).toBe(1);
  await page.keyboard.press('Control+a');
  await expect(page.locator('#ed [data-hd]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('dragging the round handle turns the motif and a corner outward makes it larger; each is one undo step', async ({ page }) => {
  const { errors } = await openApp(page);
  await selectOne(page);
  const before = await items(page);
  const r = await centre(page, '#ed [data-hd="rot"]');
  await page.mouse.move(r.x, r.y); await page.mouse.down();
  await page.mouse.move(r.x + 120, r.y + 40, { steps: 6 }); await page.mouse.up();
  await settle(page);
  const mid = await items(page);
  const i = mid.findIndex((q, k) => q.r !== before[k].r);
  expect(i, 'one motif was turned').toBeGreaterThanOrEqual(0);
  expect(mid.filter((q, k) => q.r !== before[k].r)).toHaveLength(1);
  expect(mid[i].s).toBe(before[i].s);
  await page.waitForTimeout(700);                                                  // the history picks the finished drag up
  const c = await centre(page, '#ed [data-hd="se"]');
  await page.mouse.move(c.x, c.y); await page.mouse.down();
  await page.mouse.move(c.x + 30, c.y + 30, { steps: 6 }); await page.mouse.up();
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
