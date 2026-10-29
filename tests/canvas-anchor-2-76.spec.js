// 2.76.0 (owner Oct 29 2026): a new canvas size grows or shrinks away from the anchor (a 3 x 3 grid in Canvas size); the elements move with it so they keep their place
// against the anchor. The anchor is the middle each time the Canvas panel opens.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));
const dims = page => page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
const aspect = (page, v) => page.evaluate(v => { const s = document.getElementById('casp'); s.value = v; s.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const shape = async page => (await st(page)).els.find(q => q.k === 'motif' && !q.bgd);

test('the middle anchor keeps a centred shape centred; Top left keeps its distance from the top left corner; one undo step each', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  const u = await H.addShape(page, 'rect');
  const [W0, H0] = await dims(page);
  { const s = await st(page), q = s.els.find(e => e.u === u); q.x = W0 / 2; q.y = H0 / 2; await page.evaluate(x => window.__wbTest.apply(x), JSON.stringify(s)); await H.settle(page); }
  await H.openPanel(page, 'canvas');
  await expect(page.locator('#canc button')).toHaveCount(9);
  await expect(page.locator('#canc button.on')).toHaveAttribute('data-x', '0.5');
  await aspect(page, '9'); await H.settle(page);   // 3:2
  const [W1, H1] = await dims(page);
  expect(W1).toBeGreaterThan(H1);
  let q = await shape(page);
  expect(q.x).toBeCloseTo(W1 / 2, 0); expect(q.y).toBeCloseTo(H1 / 2, 0);
  await page.click('#canc button[aria-label="Anchor: Top left"]');
  await expect(page.locator('#canc button.on')).toHaveAttribute('aria-label', 'Anchor: Top left');
  await aspect(page, '4'); await H.settle(page);   // 1:1
  const q2 = await shape(page);
  expect(q2.x).toBeCloseTo(q.x, 1); expect(q2.y).toBeCloseTo(q.y, 1);
  await page.click('#canc button[aria-label="Anchor: Bottom right"]');
  const [W2, H2] = await dims(page);
  await aspect(page, '11'); await H.settle(page);   // 16:9
  const [W3, H3] = await dims(page), q3 = await shape(page);
  expect(q3.x).toBeCloseTo(q2.x + (W3 - W2), 1); expect(q3.y).toBeCloseTo(q2.y + (H3 - H2), 1);
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await shape(page)).x).toBeCloseTo(q2.x, 1);   // the size and the move are one step
  // the panel opens with the middle again
  await H.openPanel(page, 'colors'); await H.openPanel(page, 'canvas');
  await expect(page.locator('#canc button.on')).toHaveAttribute('aria-label', 'Anchor: Middle');
  expect(errors).toEqual([]);
});
