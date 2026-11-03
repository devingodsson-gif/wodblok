// 2.87.5 (docs/pro-basics-plan.md step 5): colour output. Export > Separations… makes one greyscale plate per tray ink used (the paper is not an ink), named after
// the ink, with registration marks; a tray colour can be marked as a spot ink; CMYK TIFF and PDF; View > Proof colours.
const { test, expect } = require('@playwright/test');
const { unzipSync } = require('fflate');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));
const run = (page, id) => page.evaluate(id => window.__wbTest.commands.run(id), id);
const dl = (page, i) => page.evaluate(i => window.__wbDownloads[i], i);
// two shapes side by side: the left in the default ink (k2), the right in a third tray colour (k3)
async function setup(page) {
  const r = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page); await H.addShape(page); await H.settle(page);
  const d = await st(page), W = await page.locator('#art').evaluate(e => e.viewBox.baseVal.width), m = d.els.filter(q => q.k === 'motif');
  d.proj.ts.push('k3'); d.proj.cw[0].c.k3 = '#c0392b'; d.proj.cw[0].m.k3 = 'Brick Red';
  Object.assign(m[0], { x: W * .25, y: W * .5, s: W * .3, wy: 1, r: 0 }); Object.assign(m[1], { x: W * .75, y: W * .5, s: W * .3, wy: 1, r: 0, ink: '@k3' });
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await H.settle(page); await page.keyboard.press('Escape');
  return { ...r, W };
}
// grey value of the plate at a fraction (fx, fy) of the design area inside the plate's margin (m pixels)
const greyAt = (page, b64, pts, m) => page.evaluate(async ([b64, pts, m]) => {
  const bin = atob(b64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
  const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
  const x = c.getContext('2d'); x.drawImage(bm, 0, 0); const W = bm.width - 2 * m, H = bm.height - 2 * m;
  return pts.map(([fx, fy]) => x.getImageData(Math.round(m + fx * W), Math.round(m + fy * H), 1, 1).data[0]);
}, [b64, pts, m]);

test('Separations makes one plate per ink, named after it, with the right pixels; marks add a margin', async ({ page }) => {
  const { errors, W } = await setup(page);
  await run(page, 'export.separations'); await expect(page.locator('#sepd')).toBeVisible();
  await expect(page.locator('#sepb .sepi')).toHaveCount(2);
  await page.locator('#sept [data-v="solid"]').click(); await page.locator('#sepr [data-v="150"]').click();
  await expect(page.locator('#seplr')).toBeHidden();
  await page.locator('#sepm').click(); await expect(page.locator('#sepm')).toHaveAttribute('aria-pressed', 'false');
  const h0 = (await page.evaluate(() => window.__wbTest.histLabels())).length;
  await page.locator('#sepok').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 30000 });
  const z = await dl(page, 0); expect(z.filename).toMatch(/-separations\.zip$/);
  const files = unzipSync(Buffer.from(z.base64, 'base64')), names = Object.keys(files).sort();
  expect(names.length).toBe(2);
  expect(names[0]).toMatch(/-01-Dark-Tyrian-Blue\.png$/); expect(names[1]).toMatch(/-02-Brick-Red\.png$/);
  const fy = .5 * W / (await page.locator('#art').evaluate(e => e.viewBox.baseVal.height));
  const p1 = await greyAt(page, Buffer.from(files[names[0]]).toString('base64'), [[.25, fy], [.75, fy], [.5, .05]], 0);
  const p2 = await greyAt(page, Buffer.from(files[names[1]]).toString('base64'), [[.25, fy], [.75, fy], [.5, .05]], 0);
  expect(p1).toEqual([0, 255, 255]); expect(p2).toEqual([255, 0, 255]);
  // with marks: a half-inch margin round the plate
  await run(page, 'export.separations'); await page.locator('#sepm').click(); await page.locator('#sepok').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 1, null, { timeout: 30000 });
  const f2 = unzipSync(Buffer.from((await dl(page, 1)).base64, 'base64')), n2 = Object.keys(f2).sort();
  const size = await page.evaluate(async b64 => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k); const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })); return [bm.width, bm.height]; }, Buffer.from(f2[n2[0]]).toString('base64'));
  const L = Math.round(300 / 25.4 * 150);   // a canvas with no size: 300 mm on its long side
  expect(Math.max(...size)).toBe(L + 150);
  await page.waitForTimeout(600); expect((await page.evaluate(() => window.__wbTest.histLabels())).length).toBe(h0);   // exporting is no History step
  expect(errors).toEqual([]);
});

test('a tray colour marked as a spot ink keeps its name on its plate; a TIFF plate is greyscale', async ({ page }) => {
  const { errors } = await setup(page);
  await H.openPanel(page, 'colors'); await H.settle(page);
  await page.locator('#tyl .tyr[data-s="k3"] [data-more]').click();
  await page.getByRole('menuitem', { name: 'Mark as spot ink' }).click(); await H.settle(page);
  expect((await st(page)).proj.spot).toEqual(['k3']);
  await expect(page.locator('#tyl .tyr[data-s="k3"] small')).toContainText('Spot');
  await run(page, 'export.separations'); await expect(page.locator('#sepb .sepi', { hasText: 'Brick Red' })).toContainText('Spot');
  await page.locator('#sepf [data-v="tiff"]').click(); await page.locator('#sepr [data-v="150"]').click(); await page.locator('#sepok').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 30000 });
  const files = unzipSync(Buffer.from((await dl(page, 0)).base64, 'base64')), names = Object.keys(files).sort();
  expect(names[1]).toMatch(/-02-spot-Brick-Red\.tiff$/);
  const t = Buffer.from(files[names[1]]), n = t.readUInt16LE(t.readUInt32LE(4)), tags = {};
  for (let i = 0; i < n; i++) { const p = t.readUInt32LE(4) + 2 + i * 12; tags[t.readUInt16LE(p)] = t.readUInt16LE(p + 8); }
  expect(tags[277]).toBe(1); expect(tags[262]).toBe(1);   // one channel, black is zero
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await st(page)).proj.spot).toBeUndefined();
  expect(errors).toEqual([]);
});

test('CMYK TIFF has four channels and PDF is DeviceCMYK; Proof colours lays a picture over the canvas and is never exported', async ({ page }) => {
  const { errors } = await setup(page);
  await run(page, 'export.cmykTiff');
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 30000 });
  const t = Buffer.from((await dl(page, 0)).base64, 'base64'), n = t.readUInt16LE(t.readUInt32LE(4)), tags = {};
  for (let i = 0; i < n; i++) { const p = t.readUInt32LE(4) + 2 + i * 12; tags[t.readUInt16LE(p)] = t.readUInt16LE(p + 8); }
  expect(tags[277]).toBe(4); expect(tags[262]).toBe(5);
  await run(page, 'export.cmykPdf');
  await page.waitForFunction(() => window.__wbDownloads.length > 1, null, { timeout: 30000 });
  const pdf = Buffer.from((await dl(page, 1)).base64, 'base64').toString('latin1');
  expect(pdf.startsWith('%PDF-')).toBe(true); expect(pdf).toContain('/DeviceCMYK');
  await run(page, 'view.proof');
  await expect(page.locator('#prfg image')).toHaveCount(1, { timeout: 15000 });
  await run(page, 'export.svg');
  await page.waitForFunction(() => window.__wbDownloads.length > 2, null, { timeout: 30000 });
  const svg = Buffer.from((await dl(page, 2)).base64, 'base64').toString('utf8');
  expect(svg).toContain('<svg'); expect(svg).not.toContain('prfg');
  await run(page, 'view.proof'); await expect(page.locator('#prfg image')).toHaveCount(0);
  expect(errors).toEqual([]);
});
