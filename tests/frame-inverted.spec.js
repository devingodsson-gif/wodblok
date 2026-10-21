// An inverted stamp used as a frame: no light line between neighbouring tiles (1.35.0).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, unlockStamp, pickShape, stampInstance, clickStamp, getState } = require('./helpers/harness');

const lines = async (page) => {
  const buf = await page.locator('#art').screenshot();
  return page.evaluate(async b64 => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
    const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
    const d = x.getImageData(0, 0, bm.width, bm.height).data, lum = (i, j) => { const k = (j * bm.width + i) * 4; return .3 * d[k] + .59 * d[k + 1] + .11 * d[k + 2]; };
    // a row of tiles, away from the carved dot in the middle of each tile: scan across the two boundaries between three neighbouring tiles; every pixel is the dark tile colour, so the brightest one shows a seam
    const y = Math.round(bm.height * 0.1); let max = 0, min = 255;
    for (const bx of [bm.width / 3, 2 * bm.width / 3]) for (let i = Math.round(bx) - 6; i <= Math.round(bx) + 6; i++) { const v = lum(i, y); max = Math.max(max, v); min = Math.min(min, v); }
    return { max, min };
  }, buf.toString('base64'));
};

test('an inverted stamp repeated edge to edge shows no light line between its tiles', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlockStamp(page); await pickShape(page);
  await clickStamp(page, await stampInstance(page));   // a shape in the middle of the stamp, which the inversion carves out
  await showPanel(page, 'stmp');
  await page.evaluate(() => { const c = document.getElementById('neg'); c.checked = true; c.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle(page);
  expect(JSON.parse(await getState(page)).tiles[0].neg, 'the stamp is inverted').toBeTruthy();
  await page.evaluate(() => { const e = document.getElementById('stmpop'); e.value = 0; e.dispatchEvent(new Event('input', { bubbles: true })); });   // no outline overlay on the picture
  await openPanel(page, 'layers');
  await page.evaluate(() => document.querySelector('#pelist .mr').click());
  await page.evaluate(() => { const e = document.getElementById('pesz'); e.value = 100; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });   // full size: neighbouring cells touch
  await settle(page);
  const r = await lines(page);
  expect(r.max - r.min, JSON.stringify(r)).toBeLessThan(25);
  expect(errors).toEqual([]);
});
