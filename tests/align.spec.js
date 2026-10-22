// 1.28.0 Align: the 3x3 grid, centre across / down and distribute, for Free place; on a book cover the region the item is in.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, armStamp } = require('./helpers/harness');

// 2.1.2: Align lives in the Elements panel; the arrangement control in Pattern
// the layer starts with a Pattern; 'x' takes it away so clicks on the canvas place stamps freely
const pick = async (page, v) => { await showPanel(page, 'layers'); if (v === 'x') while (await page.locator('#pelist [data-pd]').count()) { await page.evaluate(() => document.querySelector('#pelist [data-pd]').click()); await settle(page); } if (v === 'x') { await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click'); await settle(page); } await showPanel(page, 'mlist'); };
const pl = async page => JSON.parse(await getState(page)).els;
const dims = async page => (await page.locator('#art').evaluate(e => (e.getAttribute('viewBox') || '0 0 1000 1000'))).split(/[ ,]+/).map(Number);
async function place(page, fx, fy) {
  await armStamp(page);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
}
async function setup(page, seed) {
  const r = await openApp(page, { seed });
  await openPanel(page, 'layers');
  await pick(page, 'x'); await settle(page);
  return r;
}

test('Align: the buttons are off with nothing selected, and the 3x3 snaps the selected stamp to its spot', async ({ page }) => {
  const { errors } = await setup(page, 4);
  await place(page, 0.4, 0.4);
  await page.keyboard.press('Escape'); await settle(page);
  await expect(page.locator('#al_00')).toBeDisabled();
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4); await settle(page);
  await expect(page.locator('#al_00')).toBeEnabled();
  const [, , W, H] = await dims(page);
  await page.evaluate(() => document.getElementById('al_11').click()); await settle(page);
  let p = (await pl(page))[0];
  expect(p.x).toBeCloseTo(W / 2, 0); expect(p.y).toBeCloseTo(H / 2, 0);
  await page.evaluate(() => document.getElementById('al_22').click()); await settle(page);
  const q = (await pl(page))[0];
  expect(q.x).toBeGreaterThan(W / 2); expect(q.y).toBeGreaterThan(H / 2);
  expect(q.x + p.s / 2).toBeLessThanOrEqual(W + 1);          // the edge of the stamp sits on the edge of the canvas
  await page.evaluate(() => document.getElementById('al_ch').click()); await settle(page);
  const c = (await pl(page))[0];
  expect(c.x).toBeCloseTo(W / 2, 0); expect(c.y).toBeCloseTo(q.y, 1);   // across only: the height is left alone
  await page.keyboard.press('Control+z'); await settle(page);
  expect((await pl(page))[0].x).toBeCloseTo(q.x, 1);          // one press, one undo step
  expect(errors).toEqual([]);
});

test('Align: several selected stamps move as one group; Distribute needs three', async ({ page }) => {
  const { errors } = await setup(page, 4);
  await place(page, 0.3, 0.3); await place(page, 0.5, 0.45); await place(page, 0.8, 0.6);
  await page.keyboard.press('Escape'); await settle(page);
  await page.keyboard.press('Control+a'); await settle(page);
  const before = await pl(page);
  await expect(page.locator('#al_dh')).toBeEnabled();
  await page.evaluate(() => document.getElementById('al_00').click()); await settle(page);
  const after = await pl(page);
  expect(after[1].x - after[0].x).toBeCloseTo(before[1].x - before[0].x, 1);    // spacing kept
  expect(after[2].y - after[0].y).toBeCloseTo(before[2].y - before[0].y, 1);
  expect(Math.min(...after.map(p => p.x - p.s / 2))).toBeLessThanOrEqual(1);   // the group sits on the left edge
  await page.evaluate(() => document.getElementById('al_dh').click()); await settle(page);
  const d = (await pl(page)).slice().sort((a, b) => a.x - b.x);
  expect(d[1].x - d[0].x).toBeCloseTo(d[2].x - d[1].x, 0);                      // same stamp size, so even gaps = even steps
  expect(errors).toEqual([]);
});

test('Align: on a book cover it aligns inside the region the stamp is in', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'canvas'); await page.click('#cfmt [data-f="book"]'); await settle(page, { max: 60000 });
  await openPanel(page, 'layers'); await pick(page, 'x'); await settle(page);
  const [, , W] = await dims(page);
  await place(page, 0.85, 0.5); await page.keyboard.press('Escape'); await settle(page);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.85, box.y + box.height * 0.5); await settle(page);
  await page.evaluate(() => document.getElementById('al_00').click()); await settle(page);
  let p = (await pl(page))[0];
  expect(p.x).toBeGreaterThan(W / 2);            // still on the front cover, not pushed to the left edge of the spread
  await page.evaluate(() => document.getElementById('al_22').click()); await settle(page);
  const q = (await pl(page))[0];
  expect(q.x + q.s / 2).toBeLessThan(W);         // inside the trim and safe area on the right
  expect(q.x).toBeGreaterThan(p.x);
  expect(errors).toEqual([]);
});
