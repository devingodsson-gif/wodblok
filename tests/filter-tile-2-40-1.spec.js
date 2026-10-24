// 2.40.1: on a repeat tile a Filter shape's outline wraps like every other element: the part that runs off one edge comes back on the opposite one.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, addShape } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const shot = async page => {
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  if (await page.locator('section.pn[data-p="xrec"]:not([hidden])').count() === 0) await openPanel(page, 'xrec');
  await page.locator('#xrl .xrr', { hasText: 'Preview' }).locator('[data-act="exp"]').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  return page.evaluate(async () => {
    const x = window.__wbDownloads[0], bin = atob(x.base64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
    const bm = await createImageBitmap(new Blob([u], { type: x.type })), W = bm.width, H = bm.height, c = new OffscreenCanvas(W, H), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
    const p = g.getImageData(0, 0, W, H).data, at = (fx, fy) => { const i = (Math.floor(fy * H) * W + Math.floor(fx * W)) * 4; return [p[i], p[i + 1], p[i + 2]]; };
    return { left: at(.03, .5), right: at(.97, .5), middle: at(.5, .5), far: at(.5, .05) };
  });
};
const sat = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b);

test('a Filter shape that runs off the right edge of a repeat tile comes back on the left', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, background: true });
  await openPanel(page, 'canvas'); await page.click('#cfmt [data-f="tile"]'); await settle(page);
  await addShape(page, 'rect'); await settle(page);
  const d = await st(page), bg = d.els.find(q => q.bgd), cw = +bg.s, ch = cw * (+bg.wy || 1);
  bg.ink = '#e83a3a';
  // a filter shape a fifth of the canvas wide, centred on the right edge: it covers the last tenth and, wrapped, the first tenth
  Object.assign(d.els.find(q => q.k === 'motif' && !q.bgd), { x: cw, y: ch / 2, s: cw * .2, wy: 1.5, r: 0, flt: 1, fx: [{ u: 'g1', k: 'grade', on: true, sat: -100 }] });
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await settle(page);
  const a = await shot(page);
  expect(sat(a.right)).toBeLessThan(20);      // under the shape at the right edge: grey
  expect(sat(a.left)).toBeLessThan(20);       // the part that wrapped round: grey as well
  expect(sat(a.middle)).toBeGreaterThan(100); // clear of it: still red
  expect(sat(a.far)).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});
