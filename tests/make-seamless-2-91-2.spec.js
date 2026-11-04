// 2.91.2 (owner Nov 4 2026, docs/repeats-plan.md step 2): the Image panel's Make seamless turns the selected Image's picture into a new one whose left edge meets
// its right and its top meets its bottom (the edges fade into the picture moved half across and half down; Blend sets how far in); the middle stays as it was.
// One History step; the old picture stays in Pictures.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// a made-up picture: colour ramps across and down (smooth in the middle, its opposite edges far apart), 240 x 160
const ramp = page => page.evaluate(() => { const c = document.createElement('canvas'); c.width = 240; c.height = 160; const x = c.getContext('2d'), im = x.createImageData(240, 160);
  for (let y = 0; y < 160; y++) for (let a = 0; a < 240; a++) { const i = (y * 240 + a) * 4; im.data[i] = a; im.data[i + 1] = y * 1.5; im.data[i + 2] = 120; im.data[i + 3] = 255; }
  x.putImageData(im, 0, 0); return c.toDataURL('image/png').split(',')[1]; });
const img = async page => JSON.parse(await H.getState(page)).els.filter(q => q.k === 'image');
// the picture of a Pictures card: how far its opposite edges are apart (mean of |a - b| over the colour channels), and its middle pixel
const edges = (page, id) => page.evaluate(async id => {
  const el = document.querySelector(`#impane [data-pc="${id}"] img`); const i = new Image(); i.src = el.src; await i.decode();
  const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d'); x.drawImage(i, 0, 0);
  const W = c.width, H = c.height, d = x.getImageData(0, 0, W, H).data, px = (a, b) => (b * W + a) * 4; let lr = 0, tb = 0;
  for (let y = 0; y < H; y++) for (let k = 0; k < 3; k++) lr += Math.abs(d[px(0, y) + k] - d[px(W - 1, y) + k]);
  for (let a = 0; a < W; a++) for (let k = 0; k < 3; k++) tb += Math.abs(d[px(a, 0) + k] - d[px(a, H - 1) + k]);
  const m = px(W >> 1, H >> 1); return { W, H, lr: lr / (H * 3), tb: tb / (W * 3), mid: [d[m], d[m + 1], d[m + 2]] };
}, id);

test('Make seamless: a new picture whose opposite edges meet, the middle kept, one History step; Undo puts the old picture back', async ({ page }) => {
  test.setTimeout(120000);
  const { errors } = await H.openApp(page, { pattern: false });
  await page.click('#elb [data-k="image"]'); await H.settle(page);
  await expect(page.locator('#imsm')).toBeHidden();
  await page.setInputFiles('section.pn[data-p="image"] .pcfile', { name: 'Ramp.png', mimeType: 'image/png', buffer: Buffer.from(await ramp(page), 'base64') }); await H.settle(page, { max: 30000 });
  const [q0] = await img(page);
  await expect(page.locator('#imsm')).toBeVisible();
  const e0 = await edges(page, q0.a);
  expect(e0.lr + e0.tb).toBeGreaterThan(40);   // the picture as it came does not repeat
  const h0 = (await page.evaluate(() => window.__wbTest.histLabels())).length;
  await page.locator('#im_sm').click(); await H.settle(page, { max: 30000 });
  const [q1] = await img(page);
  expect(q1.a).not.toBe(q0.a);
  await expect(page.locator(`#impane [data-pc="${q1.a}"] b`)).toHaveText(/seamless$/);
  await expect(page.locator(`#impane [data-pc="${q0.a}"]`)).toHaveCount(1);
  const e1 = await edges(page, q1.a);
  expect([e1.W, e1.H]).toEqual([e0.W, e0.H]);
  expect(e1.lr).toBeLessThan(6); expect(e1.tb).toBeLessThan(6);
  expect(Math.max(...e1.mid.map((v, i) => Math.abs(v - e0.mid[i])))).toBeLessThan(8);
  const L = await page.evaluate(() => window.__wbTest.histLabels());
  expect(L.length).toBe(h0 + 1); expect(L.at(-1)).toBe('Make seamless');
  await page.mouse.click(5, 300); await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await img(page))[0].a).toBe(q0.a);
  expect(errors).toEqual([]);
});
