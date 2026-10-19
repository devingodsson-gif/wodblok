// An inverted stamp used as a frame: no light line between neighbouring tiles (1.35.0).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, unlockStamp, pickShape, stampInstance, clickStamp, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const lines = async (page) => {
  const buf = await page.locator('#art').screenshot();
  return page.evaluate(async b64 => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
    const x = c.getContext('2d'); x.drawImage(bm, 0, 0);
    const d = x.getImageData(0, 0, bm.width, bm.height).data, lum = (i, j) => { const k = (j * bm.width + i) * 4; return .3 * d[k] + .59 * d[k + 1] + .11 * d[k + 2]; };
    // the left strip, away from the carved dot in the middle of each tile: every pixel is the dark tile colour, so the brightest one shows a seam
    let max = 0, min = 255; for (let j = 14; j < bm.height - 14; j++) { const v = lum(1, j); max = Math.max(max, v); min = Math.min(min, v); }
    return { max, min };
  }, buf.toString('base64'));
};

test('an inverted stamp as a frame shows no light line between its tiles', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlockStamp(page); await pickShape(page);
  await clickStamp(page, await stampInstance(page));   // a shape in the middle of the stamp, which the inversion carves out
  await openPanel(page, 'stamp');
  await page.evaluate(() => { const c = document.getElementById('neg'); c.checked = true; c.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle(page);
  expect(JSON.parse(await getState(page)).tiles[0].neg, 'the stamp is inverted').toBeTruthy();
  await openPanel(page, 'lyrs');
  await page.evaluate(() => document.querySelector('#lmode [data-m="f"]').click());
  await settle(page);
  const r = await lines(page);
  expect(r.max - r.min, JSON.stringify(r)).toBeLessThan(25);
  expect(errors).toEqual([]);
});
