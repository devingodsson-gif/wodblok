// 2.63.0 (owner Oct 27 2026, docs/text-plan.md): a text on the canvas is a box its letters fill. A new text gets a box; the corners and sides pull the box and the
// letters are laid out again to fill it; Size, Box width and height, Padding, Fit and Overflow are gone from the panel.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const txt = async page => JSON.parse(await H.getState(page)).els.find(x => x.tx);
const big = q => Math.max(...q.Lt.map(l => l[4]));
async function pull(page, k, dx, dy) {
  const h = await page.locator(`#fpov [data-fh="${k}"]`).boundingBox(), x = h.x + h.width / 2, y = h.y + h.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(x + dx * i / 6, y + dy * i / 6);
  await page.mouse.up(); await H.settle(page); await page.waitForTimeout(400); await H.settle(page);
}

test('a new text is a box its letters fill; pulling a corner makes the box and the letters bigger; a side changes the box width only', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  await H.placeArmed(page, 'text');
  const q0 = await txt(page);
  expect(q0.tx).toMatchObject({ wd: 60, ht: 20, ft: 'f' });
  await H.showPanel(page, 'text');
  for (const id of ['tx_sz', 'tx_wd', 'tx_ht', 'tx_pd']) await expect(page.locator('#' + id)).toBeHidden();
  await expect(page.locator('#tx_ft')).toBeHidden();
  // the box selected on the canvas: pull its lower right corner out
  await page.keyboard.press('Escape'); await H.settle(page);
  const g = await page.locator('#art use').first().boundingBox(); await page.mouse.click(g.x + g.width / 2, g.y + g.height / 2); await H.settle(page);
  await pull(page, 'se', 80, 60);
  const q1 = await txt(page);
  expect(q1.tx.wd).toBeGreaterThan(q0.tx.wd); expect(q1.tx.ht).toBeGreaterThan(q0.tx.ht);
  expect(big(q1)).toBeGreaterThan(big(q0));
  // a side: only the width
  await pull(page, 'w', -40, 0);
  const q2 = await txt(page);
  expect(q2.tx.wd).toBeGreaterThan(q1.tx.wd); expect(q2.tx.ht).toBeCloseTo(q1.tx.ht, 1);
  expect(q2.f || 1).toBe(1);
  await page.keyboard.press('Control+z'); await H.settle(page); await page.waitForTimeout(300);
  expect((await txt(page)).tx.wd).toBeCloseTo(q1.tx.wd, 1);
  expect(errors).toEqual([]);
});
