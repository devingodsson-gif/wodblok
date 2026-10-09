// Repeat tile canvas (Phase 5): a rectangle whose edges meet, so copies placed side by side show no seam.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const roll = async page => { await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };
const tile = async (page, on = true) => { await openPanel(page, 'canvas'); await page.click(`#cfmt [data-f="${on ? 'tile' : 'free'}"]`); await settle(page); };

// The "Repeat 3 x 3" view draws the tile and its neighbours for real. If the piece repeats, the middle tile and the one to its right (or
// below) are the same picture; a tile moved half a tile across is not, which is what makes the comparison meaningful.
async function periodic(page) {
  await page.click('#tpv'); await settle(page); await page.waitForTimeout(500);
  const buf = await page.locator('#art').screenshot();
  await page.click('#tpv'); await settle(page);
  return page.evaluate(async b64 => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), w = bm.width, h = bm.height;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
    const p = x.getImageData(0, 0, w, h).data, tw = Math.floor(w / 3), th = Math.floor(h / 3);
    const diff = (ax, ay, bx, by, cw, ch) => { let s = 0, n = 0; for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) for (let k = 0; k < 3; k++) { s += Math.abs(p[((ay + j) * w + ax + i) * 4 + k] - p[((by + j) * w + bx + i) * 4 + k]); n++; } return s / n; };
    const cw = tw - 8, ch = th - 8;
    return { right: diff(tw + 4, th + 4, 2 * tw + 4, th + 4, cw, ch), down: diff(tw + 4, th + 4, tw + 4, 2 * th + 4, cw, ch), half: diff(tw + 4, th + 4, tw + 4 + (tw >> 1), th + 4 + (th >> 1), cw - (tw >> 1), ch - (th >> 1)) };
  }, buf.toString('base64'));
}
// The exported tile, set side by side with itself: the seam (last column against the first) against how much neighbouring columns
// differ elsewhere in the picture. A loose check for gross faults (a faded or cut edge); the 3 x 3 comparison above is the exact one.
async function exported(page, px = 600) {
  if (!(await page.locator('section.pn[data-p="xrec"]:not([hidden])').count())) await openPanel(page, 'xrec');
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#xrf [data-f="png"]'); await page.fill('#xrpx', String(px)); await page.click('#xrnow');
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 60000 });
  return page.evaluate(async () => {
    const d = window.__wbDownloads[0], bin = atob(d.base64), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const bm = await createImageBitmap(new Blob([u], { type: d.type })), w = bm.width, h = bm.height;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
    const p = x.getImageData(0, 0, w, h).data, at = (i, j) => (j * w + i) * 4;
    const col = (a, b) => { let s = 0; for (let j = 0; j < h; j++) for (let k = 0; k < 3; k++) s += Math.abs(p[at(a, j) + k] - p[at(b, j) + k]); return s / (h * 3); };
    const row = (a, b) => { let s = 0; for (let i = 0; i < w; i++) for (let k = 0; k < 3; k++) s += Math.abs(p[at(i, a) + k] - p[at(i, b) + k]); return s / (w * 3); };
    const pct = (a, q) => { a = [...a].sort((m, n) => m - n); return a[Math.min(a.length - 1, Math.floor(q * a.length))]; };
    const cs = [], rs = []; for (let i = 0; i + 1 < w; i++) cs.push(col(i, i + 1)); for (let j = 0; j + 1 < h; j++) rs.push(row(j, j + 1));
    return { colSeam: col(w - 1, 0), colTop: pct(cs, 0.97), rowSeam: row(h - 1, 0), rowTop: pct(rs, 0.97) };
  });
}

test('the Format switch has Repeat tile: it is a rectangle, saved with the canvas, and undo brings the old canvas back', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'canvas');
  await expect(page.locator('#cfmt [data-f="tile"]')).toBeVisible();
  await expect(page.locator('#tpvg')).toBeHidden();
  await page.click('#cfmt [data-f="tile"]'); await settle(page);
  expect(JSON.parse(await getState(page)).dim.rt).toBe(1);
  await expect(page.locator('#cfmt [data-f="tile"]')).toHaveClass(/on/);
  await expect(page.locator('#tpvg')).toBeVisible();
  await expect(page.locator('#cshp')).toBeHidden();                              // only a rectangle
  await page.click('#cfmt [data-f="book"]'); await settle(page);
  expect(JSON.parse(await getState(page)).dim.rt).toBe(1);                       // the book cover is its own format: the tile is kept underneath
  await page.click('#cfmt [data-f="free"]'); await settle(page);
  expect(JSON.parse(await getState(page)).dim.rt).toBeUndefined();
  await expect(page.locator('#tpvg')).toBeHidden();
  await expect(page.locator('#cshp')).toBeVisible();
  expect(errors).toEqual([]);
});

test('repeat 3 x 3 shows the tile repeated; frames and canvas-wide gradients are left out and counted', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page); await tile(page);
  await expect(page.locator('#tpv')).toBeEnabled();
  const vb0 = await page.locator('#art').getAttribute('viewBox');
  await page.click('#tpv'); await settle(page);
  await expect(page.locator('#tpv')).toHaveAttribute('aria-pressed', 'true');
  const [x, y, w, h] = (await page.locator('#art').getAttribute('viewBox')).split(' ').map(Number), [, , w0, h0] = vb0.split(' ').map(Number);
  expect([x, y, w, h]).toEqual([-w0, -h0, 3 * w0, 3 * h0]);
  await page.click('#tpv'); await settle(page);
  expect(await page.locator('#art').getAttribute('viewBox')).toBe(vb0);
  expect(errors).toEqual([]);
});

// What the tile promises: the seams do not show. Several rolls give several kinds of grid (squares, hexagons, triangles, diamonds, mixed).
for (const seed of [1, 2, 3, 4, 6]) {
  test(`seamless: roll ${seed}`, async ({ page }) => {
    const { errors } = await openApp(page, { seed });
    await tile(page); await roll(page);
    const p = await periodic(page);
    expect(p.half, 'the piece has something in it').toBeGreaterThan(1);
    expect(p.right, JSON.stringify(p)).toBeLessThan(0.12 * p.half + 0.15);
    expect(p.down, JSON.stringify(p)).toBeLessThan(0.12 * p.half + 0.15);
    const e = await exported(page);
    expect(e.colSeam, JSON.stringify(e)).toBeLessThanOrEqual(2.2 * e.colTop + 2);
    expect(e.rowSeam, JSON.stringify(e)).toBeLessThanOrEqual(2.2 * e.rowTop + 2);
    expect(errors).toEqual([]);
  });
}
