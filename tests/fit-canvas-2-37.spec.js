// 2.37.0: Fit to canvas and Stretch to canvas in a Shape's Align group; a Randomize roll that changes the canvas size refits the Background (2.53.0: a Sheet, which always covers the canvas).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, addShape, rzSet } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const shapeOf = d => (d.els || []).find(q => q.k === 'motif' && !q.bgd);
// the box of the drawn ink in an exported picture, as fractions of its width and height
const inkBox = async page => {
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  if (await page.locator('section.pn[data-p="xrec"]:not([hidden])').count() === 0) await openPanel(page, 'xrec');
  await page.locator('#xrl .lib > div', { hasText: 'Preview' }).locator('.rcact').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  return page.evaluate(async () => {
    const x = window.__wbDownloads[0], bin = atob(x.base64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
    const bm = await createImageBitmap(new Blob([u], { type: x.type })), W = bm.width, H = bm.height, c = new OffscreenCanvas(W, H), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
    const p = g.getImageData(0, 0, W, H).data; let x0 = W, x1 = -1, y0 = H, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (p[i] + p[i + 1] + p[i + 2] < 300) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    return { x0: x0 / W, x1: (x1 + 1) / W, y0: y0 / H, y1: (y1 + 1) / H, W, H };
  });
};
const selectShape = async page => { await openPanel(page, 'motifs'); await settle(page); };

test('Stretch to canvas makes a shape\'s outline exactly the canvas; Fit to canvas keeps its proportions; Undo puts it back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page, 'star'); await settle(page);
  const before = shapeOf(await st(page));
  // turn it, so both buttons also stand it upright
  const d = await st(page); shapeOf(d).r = 30; await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await settle(page);
  await selectShape(page);
  await expect(page.locator('#lalfit')).toBeVisible();
  await expect(page.locator('#al_str')).toBeEnabled();
  const b0 = await inkBox(page), r0 = (b0.x1 - b0.x0) * b0.W / ((b0.y1 - b0.y0) * b0.H);
  await openPanel(page, 'motifs'); await settle(page);
  await page.click('#al_str'); await settle(page);
  let q = shapeOf(await st(page));
  expect(q.r).toBe(0);
  const b1 = await inkBox(page);
  expect(b1.x0).toBeLessThan(0.01); expect(b1.y0).toBeLessThan(0.01);
  expect(b1.x1).toBeGreaterThan(0.99); expect(b1.y1).toBeGreaterThan(0.99);
  // back to the turned star, then Fit to canvas: the outline touches two opposite edges and keeps its width to height
  await page.keyboard.press('Control+z'); await settle(page);
  expect(shapeOf(await st(page)).r).toBe(30);
  const d2 = await st(page); shapeOf(d2).r = 0; await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d2)); await settle(page);
  const b2 = await inkBox(page), r2 = (b2.x1 - b2.x0) * b2.W / ((b2.y1 - b2.y0) * b2.H);
  await openPanel(page, 'motifs'); await settle(page);
  await page.click('#al_fit'); await settle(page);
  const b3 = await inkBox(page), r3 = (b3.x1 - b3.x0) * b3.W / ((b3.y1 - b3.y0) * b3.H);
  expect(Math.abs(r3 / r2 - 1)).toBeLessThan(0.03);
  const across = b3.x0 < 0.01 && b3.x1 > 0.99, down = b3.y0 < 0.01 && b3.y1 > 0.99;
  expect(across || down).toBe(true);
  expect(Math.abs((b3.x0 + b3.x1) / 2 - 0.5)).toBeLessThan(0.01);
  expect(Math.abs((b3.y0 + b3.y1) / 2 - 0.5)).toBeLessThan(0.01);
  expect(r0).toBeGreaterThan(0);
  expect(before.k).toBe('motif');
  expect(errors).toEqual([]);
});

test('the Fit buttons show for a selected shape, hide when nothing is selected, and are commands', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  await selectShape(page);
  await expect(page.locator('#lalfit')).toBeVisible();
  const ids = await page.evaluate(() => __wbTest.commands.list().map(c => c.id));
  expect(ids).toEqual(expect.arrayContaining(['shape.fitToCanvas', 'shape.stretchToCanvas']));
  await page.evaluate(() => __wbTest.commands.run('shape.stretchToCanvas')); await settle(page);
  const q = shapeOf(await st(page)), dim = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
  expect(Math.abs(q.x - dim[0] / 2)).toBeLessThan(dim[0] * 0.02);
  await page.keyboard.press('Escape'); await settle(page);
  await expect(page.locator('#lalfit')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a Randomize roll that changes the canvas size: the Background Sheet still covers the canvas', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 7, background: true });
  await openPanel(page, 'rand');
  await rzSet(page, { size: true }, true);   // 2.76.3: only Canvas size is on, so a roll reworks the ratio
  // 2.53.0: the Background is a Sheet, which is always the whole canvas, so nothing is refitted
  const look = () => page.evaluate(() => { const a = document.getElementById('art'), v = a.viewBox.baseVal, s = JSON.parse(__wbTest.state()); return { cw: v.width, ch: v.height, bg: s.els.filter(q => q.bgd && q.k === 'sheet').length, full: [...a.querySelectorAll('rect')].some(r => r.getAttribute('x') === '0' && r.getAttribute('y') === '0' && Math.abs(+r.getAttribute('width') - v.width) < .02 && Math.abs(+r.getAttribute('height') - v.height) < .02) }; });
  let changed = 0;
  for (let i = 0; i < 3; i++) {
    const a = await look();
    await page.click('#rzdo'); await settle(page); await page.waitForTimeout(300);
    const b = await look();
    if (b.cw !== a.cw || b.ch !== a.ch) changed++;
    expect(b.bg).toBe(1); expect(b.full).toBe(true);
  }
  expect(changed).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
