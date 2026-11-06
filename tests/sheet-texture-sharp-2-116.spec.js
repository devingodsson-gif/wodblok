// 2.116.0 (owner Nov 6 2026: "Textures seem very blurry when applied to a sheet on the book cover canvas type"): a Sheet's texture picture had 460 pixels across the
// whole canvas, whatever the zoom or the export size. It now has at least the pixels the view shows (in steps, a moment after the zoom changes) and an export makes it
// again at the export's size. Small elements keep their pictures as before.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// the texture pictures the drawing uses: their widths in pixels and in canvas units
const pics = page => page.evaluate(() => Promise.all([...new Set([...document.querySelectorAll('#art use')].map(u => u.getAttribute('href')).filter(h => /^#txi/.test(h)))].map(h => document.getElementById(h.slice(1))).filter(Boolean).map(n => new Promise(r => { const i = new Image(); i.onload = () => r({ px: i.naturalWidth, w: +n.getAttribute('width') }); i.onerror = () => r(null); i.src = n.getAttribute('href'); }))));
const vpu = page => page.evaluate(() => { const a = document.getElementById('art'); return parseFloat(a.style.width) / a.viewBox.baseVal.width * (window.devicePixelRatio || 1); });

async function textured(page) {
  const r = await H.openApp(page, { seed: 4, pattern: false });
  await H.openPanel(page, 'canvas'); await page.locator('#cfmt [data-f="book"]').click(); await H.settle(page);
  await page.click('#elb [data-k="sheet"]'); await H.settle(page);
  await page.locator('.fxg[data-fxk="sheet"] .fxadd').scrollIntoViewIfNeeded(); await page.click('.fxg[data-fxk="sheet"] .fxadd');
  await page.locator('.rowm:not(.rowsub) .ddi', { hasText: 'Texture' }).first().click(); await H.settle(page);
  await page.waitForTimeout(400); await H.settle(page);
  return r;
}

test('a Sheet\'s texture on a book cover has at least the pixels the view shows, and more after zooming in', async ({ page }) => {
  const { errors } = await textured(page);
  let p = (await pics(page)).filter(Boolean);
  expect(p.length).toBeGreaterThan(0);
  const big = q => q.reduce((a, b) => b.w > a.w ? b : a);
  let s = big(p), k = await vpu(page);
  expect(s.w, 'the picture covers the whole cover').toBeGreaterThan(900);
  expect(s.px, 'more than the old 460 pixels').toBeGreaterThan(460);
  expect(s.px / s.w, 'about the view\'s pixels per unit').toBeGreaterThan(k / 1.5);
  // zoom in: the picture is made again, finer
  const px0 = s.px;
  await page.evaluate(() => window.__wbTest.commands.run('view.zoomIn')); await page.evaluate(() => window.__wbTest.commands.run('view.zoomIn'));
  await page.waitForTimeout(600); await H.settle(page);
  s = big((await pics(page)).filter(Boolean));
  expect(s.px).toBeGreaterThan(px0 * 1.3);
  expect(errors).toEqual([]);
});

test('an export makes the Sheet\'s texture again at the export\'s size; the view keeps its own', async ({ page }) => {
  const { errors } = await textured(page);
  const view = Math.max(...(await pics(page)).filter(Boolean).map(q => q.px));
  // the SVG export (2048 pixels on the long side), saved through the app's own download
  await page.evaluate(() => window.__wbTest.commands.run('export.svg'));
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 60000 });
  const sizes = await page.evaluate(async () => { const s = atob(window.__wbDownloads[0].base64), d = new DOMParser().parseFromString(s, 'image/svg+xml');
    return Promise.all([...d.querySelectorAll('#txd image[data-e]')].map(n => new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth); i.onerror = () => r(0); i.src = n.getAttribute('href'); }))); });
  expect(Math.max(...sizes), 'about 2048 pixels per 1000 units: 2 a unit').toBeGreaterThan(Math.max(view * 1.3, 1900));
  expect(Math.max(...(await pics(page)).filter(Boolean).map(q => q.px)), 'the view is untouched').toBe(view);
  expect(errors).toEqual([]);
});
