// 2.56.0 (owner Oct 26 2026, docs/polish-plan.md release 2): a corner pulls both ways (Shift keeps the proportions, Alt grows from the middle); pulled past the
// opposite side a piece turns over on that axis; a shape with effects stays drawn while it is dragged out of its old box.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const last = async page => { const s = JSON.parse(await H.getState(page)); return s.els[s.els.length - 1]; };
const mid = async (page, sel) => { const b = await page.locator(sel).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
async function pull(page, h, dx, dy, mods = []) {
  const [x, y] = await mid(page, `#fpov [data-fh="${h}"]`);
  for (const m of mods) await page.keyboard.down(m);
  await page.mouse.move(x, y); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(x + dx * i / 8, y + dy * i / 8);
  await page.mouse.up();
  for (const m of mods) await page.keyboard.up(m);
  await H.settle(page);
}
const inkAt = (page, x, y, r) => page.screenshot({ clip: { x: x - r, y: y - r, width: 2 * r, height: 2 * r } }).then(b => page.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 300) n++; return n; }, b.toString('base64')));

test('a corner pulls width and height freely; Shift keeps the proportions; Alt keeps the middle', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addShape(page, 'rect');
  const q0 = await last(page);
  await pull(page, 'se', 60, 10);
  const q1 = await last(page);
  expect(q1.wx).toBeGreaterThan(1.3); expect(q1.wy || 1).toBeLessThan(1.4); expect(q1.wy || 1).toBeGreaterThan(1.0);   // both changed, by different amounts
  expect(q1.s).toBe(q0.s);
  await page.keyboard.press('Control+z'); await H.settle(page);
  await pull(page, 'se', 60, 10, ['Shift']);
  const q2 = await last(page);
  expect(q2.wx || 1).toBe(1); expect(q2.wy || 1).toBe(1); expect(q2.s).toBeGreaterThan(q0.s);   // proportions kept: only the size changed
  await page.keyboard.press('Control+z'); await H.settle(page);
  await pull(page, 'se', 40, 40, ['Alt']);
  const q3 = await last(page);
  expect(q3.x).toBeCloseTo(q0.x, 0); expect(q3.y).toBeCloseTo(q0.y, 0);   // grown from the middle
  expect(errors).toEqual([]);
});

test('pulled past the opposite side a shape turns over: across it flips, down it flips and turns half round', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addShape(page, 'tri');
  const [ex] = await mid(page, '#fpov [data-fh="e"]'), [wx] = await mid(page, '#fpov [data-fh="w"]');
  await pull(page, 'e', -(ex - wx) * 2, 0);
  const q1 = await last(page);
  expect(q1.f).toBe(-1); expect(q1.r || 0).toBe(0);
  await page.keyboard.press('Control+z'); await H.settle(page);
  const [, sy] = await mid(page, '#fpov [data-fh="s"]'), [, ny] = await mid(page, '#fpov [data-fh="n"]');
  await pull(page, 's', 0, -(sy - ny) * 2);
  const q2 = await last(page);
  expect(q2.f).toBe(-1); expect(Math.abs(q2.r)).toBe(180);
  expect(errors).toEqual([]);
});

test('a shape with effects stays drawn while it is dragged out of its old box', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addShape(page, 'star');
  await page.click('#mnb-effects'); await page.locator('#mnbm-effects .mnbs', { hasText: 'Blur' }).hover(); await page.locator('.mnbsub [data-cmd]').first().click(); await H.settle(page);
  await page.click('.fxwin .fxwa'); await H.settle(page);
  const b = await page.locator('#art').boundingBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  await page.mouse.move(cx, cy); await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(cx - i * 12, cy - i * 20);
  await page.waitForTimeout(250);
  const n = await inkAt(page, cx - 120, cy - 200, 30);
  await page.mouse.up();
  expect(n).toBeGreaterThan(400);   // the star's ink is there, not only the selection lines
  expect(errors).toEqual([]);
});
