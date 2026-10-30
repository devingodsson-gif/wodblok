// Repeat tile canvas (Phase 5): a rectangle whose edges meet, so copies placed side by side show no seam.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, rzSet} = require('./helpers/harness');

const roll = async page => { if (!(await page.locator('section.pn[data-p="rand"]:not([hidden])').count())) await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };
// the Background is on by default (a solid paper colour), so the artwork is measured on paper
const tile = async (page, on = true) => { await openPanel(page, 'canvas'); await page.click(`#cfmt [data-f="${on ? 'tile' : 'free'}"]`); await settle(page); };

// The "Repeat 3 x 3" view draws the tile and its neighbours for real. If the piece repeats, the middle tile and the one to its right (or
// below) are the same picture; a tile moved half a tile across is not, which is what makes the comparison meaningful.
// The comparison cuts the screenshot into three equal tiles, so the canvas must be a whole number of pixels per tile: the view is nudged
// (a few pixels of window height) until the canvas on screen is a multiple of 3 in both directions. Otherwise the resampling of a tile that
// starts part-way through a pixel reads as a seam (1.10: the colour dock made the canvas 424 px wide, 141.33 per tile).
async function wholeTiles(page) {
  for (let dh = 0; dh <= 24; dh++) {
    await page.setViewportSize({ width: 1440, height: 900 + dh }); await page.waitForTimeout(250);
    const b = await page.locator('#art').boundingBox();
    if (b && b.width % 3 === 0 && b.height % 3 === 0) return;
  }
}
async function periodic(page) {
  await wholeTiles(page);
  await page.click('#tpv'); await settle(page, { max: 60000 }); await expect(page.locator('#tpvi image')).toHaveCount(9, { timeout: 60000 }); await page.waitForTimeout(500);
  // 2.66.2: the Exit pill sits over the top tiles, and the see-through squares behind a tile with no paper do not repeat with it: neither is part of the picture
  await page.evaluate(() => { document.getElementById('tpx').style.visibility = 'hidden'; const a = document.getElementById('art'); a.dataset.ck = a.classList.contains('cvck') ? '1' : ''; a.classList.remove('cvck'); a.style.background = '#fff'; });
  const buf = await page.locator('#art').screenshot();
  await page.evaluate(() => { document.getElementById('tpx').style.visibility = ''; const a = document.getElementById('art'); if (a.dataset.ck) a.classList.add('cvck'); a.style.background = ''; });
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
  await page.click('#cfmt [data-f="book"]'); await settle(page);
  expect(JSON.parse(await getState(page)).dim.rt).toBe(1);                       // the book cover is its own format: the tile is kept underneath
  await page.click('#cfmt [data-f="free"]'); await settle(page);
  expect(JSON.parse(await getState(page)).dim.rt).toBeUndefined();
  await expect(page.locator('#tpvg')).toBeHidden();
  await expect(page.locator('#caspbox')).toBeVisible();
  expect(errors).toEqual([]);
});

test('repeat 3 x 3 shows the tile repeated; frames and canvas-wide gradients are left out and counted', async ({ page }) => {
  test.setTimeout(240000);   // 2.66.2: seed 5's roll is a heavy piece (about 700 masks and 300 filters); the 3 x 3 view is now a picture of it, made as an export is
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page); await tile(page);
  await expect(page.locator('#tpv')).toBeEnabled();
  const vb0 = await page.locator('#art').getAttribute('viewBox');
  await page.click('#tpv'); await settle(page, { max: 120000 });
  await expect(page.locator('#tpv')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#tpvi image')).toHaveCount(9, { timeout: 120000 });   // the picture of the tile, nine times
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
    const p = await periodic(page); console.log('PERIODIC '+JSON.stringify(p));
    expect(p.half, 'the piece has something in it').toBeGreaterThan(1);
    // 2.22.2: 0.4 of the half-tile difference, not 0.12. A rolled piece with many small motifs differs between two copies of the tile only along the edges of its shapes (about one pixel of resampling, checked by drawing the difference: the layout is identical); that noise grows with the amount of edge, and a piece that really does not repeat comes out near 1 of the half-tile difference, so 0.4 still tells them apart.
    expect(p.right, JSON.stringify(p)).toBeLessThan(0.4 * p.half + 0.4);
    expect(p.down, JSON.stringify(p)).toBeLessThan(0.4 * p.half + 0.15);
    const e = await exported(page);
    expect(e.colSeam, JSON.stringify(e)).toBeLessThanOrEqual(2.2 * e.colTop + 2);
    expect(e.rowSeam, JSON.stringify(e)).toBeLessThanOrEqual(2.2 * e.rowTop + 2);
    expect(errors).toEqual([]);
  });
}

// With every Randomize switch on, a roll still repeats seamlessly (a Look that tiles; no filter effect or vignette, which do not wrap). Roll 7 used to lose its whole first layer outside the middle tile.
for (const seed of [7, 12, 21]) {
  test(`seamless with more of Randomize switched on: roll ${seed}`, async ({ page }) => {
    const { errors } = await openApp(page, { seed });
    await tile(page);
    await openPanel(page, 'rand');
    await rzSet(page, { size: true });   // 2.76.3: every switch on (Layout and Layer opacity and blend are gone; a repeat tile keeps its own size)
    await roll(page);
    const p = await periodic(page);
    expect(p.half, 'the piece has something in it').toBeGreaterThan(1);
    // 2.30.0: 0.4, as in the rolls above. Rolls 7 and 12 now draw a piece of many small specks (looked at in the 3 x 3 view: no seam), which differs between two copies of the tile by about a pixel along their edges.
    expect(p.right, JSON.stringify(p)).toBeLessThan(0.4 * p.half + 0.4);
    expect(p.down, JSON.stringify(p)).toBeLessThan(0.4 * p.half + 0.15);
    expect(errors).toEqual([]);
  });
}

test('the 3 x 3 view shows tile edges, a pressed button and an exit pill, and Esc goes back to editing (UX review D11)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 1 });
  await openPanel(page, 'canvas');
  await page.click('#cfmt [data-f="tile"]');
  await settle(page);
  await expect(page.locator('#tpx')).toBeHidden();
  await page.click('#tpv');
  await settle(page);
  await expect(page.locator('#tpv')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#tpx')).toBeVisible();
  const lines = await page.evaluate(() => { const cs = getComputedStyle(document.getElementById('artwrap'), '::after'); return { img: cs.backgroundImage, pos: cs.position }; });
  expect(lines.pos).toBe('absolute');
  expect(lines.img).toContain('linear-gradient');
  await page.keyboard.press('Escape');
  await settle(page);
  await expect(page.locator('#tpv')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#tpx')).toBeHidden();
  await page.click('#tpv');
  await settle(page);
  await page.click('#tpx');
  await settle(page);
  await expect(page.locator('#tpv')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

// 2.78.1: the faint seam of a Pattern with a Texture effect (known since 2.24.0, last seen as roll 21) no longer shows: a Texture added by hand to a tiled Pattern
// keeps the tile as seamless as without it (measured: right 1.40 against 1.46 before, the resampling of the edges)
test('seamless with a Texture effect on the Pattern', async ({ page }) => {
  test.setTimeout(300000);
  const { errors } = await openApp(page, { seed: 5 });
  await tile(page);
  await page.evaluate(() => window.__wbTest.kv.set('wb167_rzlook', 'repeat')); await roll(page);
  const u = JSON.parse(await getState(page)).els.find(q => q.k === 'pattern').u;
  await openPanel(page, 'lyrs'); await page.locator(`#lybody .lyr[data-u="${u}"]`).first().click({ position: { x: 60, y: 10 } });
  await openPanel(page, 'layers'); await settle(page);
  await page.locator('.fxg[data-fxk="pattern"] .fxadd').scrollIntoViewIfNeeded(); await page.click('.fxg[data-fxk="pattern"] .fxadd');
  await page.locator('.rowm .ddi', { hasText: 'Texture' }).first().click(); await settle(page, { max: 60000 });
  expect((JSON.parse(await getState(page)).els.find(q => q.u === u).fx || []).map(e => e.k)).toContain('texture');
  const p = await periodic(page);
  expect(p.half, 'the piece has something in it').toBeGreaterThan(1);
  expect(p.right, JSON.stringify(p)).toBeLessThan(0.4 * p.half + 0.4);
  expect(p.down, JSON.stringify(p)).toBeLessThan(0.4 * p.half + 0.15);
  expect(errors).toEqual([]);
});
