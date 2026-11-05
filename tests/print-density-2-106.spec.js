// 2.106.0 (B1 of docs/bug-test-2.105.md; owner Nov 5 2026: the screen matches the print): a stamp's wear is a blur cut sharply at a threshold, so a line thinner than a
// screen pixel was worn away on screen and printed whole. Stamps are now printed at no fewer than 2 pixels per stamp unit and shown scaled down.
// 2.106.1: switched off with the change it tests (taken back out: the wide project drew live, 2.4M of markup against a 120k budget; see docs/plan.md 2.106.1).
// 2.106.2: on again. The plain print is shown first and the dense one replaces it a moment later, so the test waits until both print queues are empty.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

// each printed stamp on the canvas: pixels of its print per stamp unit (its symbol's viewBox is in pixels, the use that shows it in stamp units)
const densities = page => page.evaluate(() => Array.from(document.querySelectorAll('#dyn use[href^="#bk"]')).map(u => {
  const s = document.getElementById(u.getAttribute('href').slice(1)), vb = s && s.getAttribute('viewBox');
  return vb ? +vb.split(' ')[2] / +u.getAttribute('width') : 0; }).filter(v => v > 0));
async function exportPng(page, px) {
  await H.openPanel(page, 'xrec'); await page.click('#xrf [data-f="png"]');
  await page.fill('#xrpx', String(px)); await page.locator('#xrpx').dispatchEvent('change');
  await page.evaluate(() => { window.__wbDownloads.length = 0; }); await page.click('#xrnow');
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 90000 });
  const b = await page.evaluate(() => window.__wbDownloads[0].base64); await page.evaluate(() => window.__wbTest.commands.run('panels.closeAll')); return b;
}
// mean colour difference (0 to 255) of two PNGs, both brought to the size of the first
const diff = (page, a, b) => page.evaluate(async ([a, b]) => {
  const load = async b64 => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return createImageBitmap(new Blob([u], { type: 'image/png' })); };
  const A = await load(a), B = await load(b), W = A.width, Hh = A.height;
  const g = bm => { const c = new OffscreenCanvas(W, Hh), x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(bm, 0, 0, W, Hh); return x.getImageData(0, 0, W, Hh).data; };
  const p = g(A), q = g(B); let d = 0;
  for (let i = 0; i < p.length; i += 4) d += Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]);
  return d / (p.length / 4) / 3; }, [a, b]);

test('small stamps are printed at 2 pixels or more per stamp unit, so their thin worn lines look on screen as they print', async ({ page }) => {
  test.setTimeout(180000);
  const { errors } = await H.openApp(page, { seed: 7 });
  // a Tilework roll whose tile stamps have thin frame lines (they were broken on screen and whole in print)
  await page.evaluate(() => window.__wbTest.kv.set('wb167_rzlook', 'tilework')); await H.openPanel(page, 'rand'); await page.click('#rzdo'); await H.settle(page, { max: 60000 });
  await page.evaluate(() => window.__wbTest.commands.run('panels.closeAll')); await page.waitForTimeout(150); await H.settle(page, { max: 60000 });
  await page.waitForFunction(() => !window.__wbTest.printsBusy(), null, { timeout: 60000 }); await H.settle(page, { max: 60000 });   // the dense prints come after the plain ones
  const d = await densities(page);
  expect(d.length, 'the pattern is drawn from printed stamps').toBeGreaterThan(0);
  expect(Math.min(...d), 'every stamp print has at least 2 pixels per stamp unit').toBeGreaterThanOrEqual(1.99);
  const screen = (await page.locator('#art').screenshot()).toString('base64'), print = await exportPng(page, 2160);
  const m = await diff(page, screen, print);
  console.log('screen against the 3x print, mean difference', m.toFixed(2), 'densities', Math.min(...d).toFixed(2), Math.max(...d).toFixed(2));
  // 2.105.0: 6.2 (thin lines broken on screen, whole in print)
  expect(m, 'the screen looks like the 3x print').toBeLessThan(5);
  expect(errors).toEqual([]);
});
