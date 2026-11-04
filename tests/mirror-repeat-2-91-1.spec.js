// 2.91.1 (owner Nov 4 2026, docs/repeats-plan.md step 1): Canvas > Format > Repeat has Mirror. Every other column is flipped across and every other row flipped
// down, so nothing wraps at the edges; the 3 x 3 view shows the flipped copies, and the repeat unit is 2 x 2 tiles, each quarter the mirror of its neighbour.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const dim = async page => JSON.parse(await H.getState(page)).dim;
const pick = (page, sel, v) => page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);

test('a mirror repeat: no wrap copies, flipped copies in the 3 x 3 view, and a 2 x 2 repeat unit of mirror images; Undo goes back to Grid', async ({ page }) => {
  test.setTimeout(180000);
  const { errors } = await H.openApp(page, { seed: 6, pattern: false, background: true });
  await H.addShape(page, 'ellipse'); await page.keyboard.press('Escape'); await H.settle(page);
  await H.openPanel(page, 'canvas');
  await page.click('#cfmt [data-f="tile"]'); await H.settle(page, { max: 30000 });
  await pick(page, '#cun', 'px'); await H.settle(page);
  await page.fill('#cpw', '300'); await page.fill('#cph', '200'); await page.locator('#cph').dispatchEvent('change'); await H.settle(page);
  // the grid wraps an element at the edges with copies; a mirror repeat does not
  const wraps = () => page.evaluate(() => document.querySelectorAll('#art use[href^="#tw"]').length);
  expect(await wraps()).toBeGreaterThan(0);
  await expect(page.locator('#tlrk [data-k]')).toHaveText(['Grid', 'Brick', 'Half drop', 'Mirror']);
  await page.click('#tlrk [data-k="mirror"]'); await H.settle(page, { max: 30000 });
  expect((await dim(page)).rk).toBe('mirror');
  await expect(page.locator('#tlrk [data-k="mirror"]')).toHaveClass(/on/);
  expect(await wraps()).toBe(0);
  // the 3 x 3 view: nine copies, the ones beside the tile flipped
  await page.click('#tpv'); await H.settle(page, { max: 60000 }); await expect(page.locator('#tpvi image')).toHaveCount(9, { timeout: 60000 });
  const tf = await page.locator('#tpvi image').evaluateAll(a => a.map(i => i.getAttribute('transform') || ''));
  expect(tf.filter(t => /scale\(-1 1\)/.test(t)).length).toBe(2);
  expect(tf.filter(t => /scale\(1 -1\)/.test(t)).length).toBe(2);
  expect(tf.filter(t => /scale\(-1 -1\)/.test(t)).length).toBe(4);
  await page.click('#tpv'); await H.settle(page);
  // the repeat unit: 600 x 400, the right half the left half mirrored, the bottom half the top half mirrored
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#mnb-export'); await page.locator('.pop.mnbm:visible [data-cmd="export.repeatPng"]').click();
  await page.waitForFunction(() => window.__wbDownloads.length >= 1 && window.__wbDownloads.at(-1).base64, null, { timeout: 90000 });
  const r = await page.evaluate(async () => {
    const b64 = window.__wbDownloads.at(-1).base64, bin = atob(b64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
    const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
    const W = bm.width, H = bm.height, d = g.getImageData(0, 0, W, H).data, px = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]] }, df = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0);
    let bx = 0, by = 0, n = 0, ink = 0; for (let y = 3; y < H / 2 - 3; y += 5) for (let x = 3; x < W / 2 - 3; x += 5) { n++; const p = px(x, y); if (p[3] && (p[0] + p[1] + p[2]) < 600) ink++; if (df(p, px(W - 1 - x, y)) > 30) bx++; if (df(p, px(x, H - 1 - y)) > 30) by++ }
    return { W, H, bx, by, n, ink };
  });
  expect([r.W, r.H]).toEqual([600, 400]);
  expect(r.ink).toBeGreaterThan(0);
  expect(r.bx / r.n).toBeLessThan(.02); expect(r.by / r.n).toBeLessThan(.02);
  // one History step: Undo brings Grid back
  await page.mouse.click(5, 300); await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await dim(page)).rk).toBeUndefined();
  expect(errors).toEqual([]);
});
