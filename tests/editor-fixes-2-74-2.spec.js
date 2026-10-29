// 2.74.2 (owner Oct 29 2026): a tall shape with Roughen turned towards flat is not cut off ("the shape disappeared through an invisible edge"),
// and a Pattern's arrows are not drawn while a stamp is open in its own view.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, addShape, unlockStamp } = require('./helpers/harness');

// dark pixels of the canvas as it shows on screen
const dark = async page => {
  const b64 = (await page.locator('#art').screenshot()).toString('base64');
  return page.evaluate(async b64 => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
    const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
    const p = g.getImageData(0, 0, bm.width, bm.height).data; let n = 0; for (let i = 0; i < p.length; i += 4) if (p[i] + p[i + 1] + p[i + 2] < 200) n++; return n;
  }, b64);
};

test('a tall shape with Roughen turned nearly flat keeps all of itself', async ({ page }) => {
  const { errors } = await openApp(page, { pattern: false });
  const u = await addShape(page, 'rect');
  const set = async fx => {
    const s = JSON.parse(await getState(page)), q = s.els.find(e => e.u === u), S = Math.min(s.dim.c[0], s.dim.c[1]);
    Object.assign(q, { s: 300, wx: .12, wy: 1, r: 80, ink: '#000000' }); if (fx) q.fx = [{ u: 'fxr', k: 'rough', on: true, amt: 10, sz: 20, sd: 5 }]; else delete q.fx;
    await page.evaluate(x => window.__wbTest.apply(x), JSON.stringify(s)); await page.keyboard.press('Escape'); await settle(page, { quiet: 8 });
  };
  await set(false); const plain = await dark(page);
  await set(true); const rough = await dark(page);
  expect(plain).toBeGreaterThan(500);
  expect(rough).toBeGreaterThan(plain * .7);   // before 2.74.2 the effect worked in the unturned box, so most of the turned shape was cut away
  expect(errors).toEqual([]);
});

test('an empty Pattern shows its arrows on the canvas, and not while a stamp is open in its tab', async ({ page }) => {
  const { errors } = await openApp(page);   // the start's Pattern prints a stamp
  const s = JSON.parse(await getState(page));
  s.els.push({ u: 'pe1', k: 'pattern', n: 'Empty', lay: 'tile', ts: 'square', ps: 12, sp: 0, cn: 5, rn: 5, sz: 100, af: 1, rt: 0, ds: 'cycle', sd: 1, src: [], x: 300, y: 300, s: 300, r: 0, f: 1 });
  await page.evaluate(x => window.__wbTest.apply(x), JSON.stringify(s)); await settle(page);
  expect(await page.locator('#fpov [data-pa]').count()).toBeGreaterThan(0);
  await unlockStamp(page); await settle(page);
  expect(await page.locator('#fpov [data-pa]').count()).toBe(0);
  expect(errors).toEqual([]);
});
