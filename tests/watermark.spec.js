// Export watermark (1.16): a checkbox on the Export panel puts the Wodblok mark top-left and "Made with Wodblok" bottom-right of PNG, JPG and TIFF exports.
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { openApp, openPanel } = require('./helpers/harness');

// the n-th download as an ImageData-like summary: size, and where it differs from the first download
const compare = page => page.evaluate(async () => {
  const load = async d => { const bin = atob(d.base64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
    const bm = await createImageBitmap(new Blob([u], { type: d.type })), c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
    const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
  const a = await load(window.__wbDownloads[0]), b = await load(window.__wbDownloads[1]), w = a.width, h = a.height;
  const diff = (x0, y0, x1, y1) => { let n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * w + x) * 4; if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) > 24) n++; } return n; };
  const q = Math.round(w * .25), r = Math.round(h * .25);
  return { w, h, same: a.width === b.width && a.height === b.height, topLeft: diff(0, 0, q, r), bottomRight: diff(w - Math.round(w * .5), h - r, w, h), topRight: diff(w - q, 0, w, r), centre: diff(q, r * 2, w - q, h - r * 2) };
});

test('the Watermark checkbox is off by default and marks only the two corners of a PNG', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'xrec');
  await expect(page.locator('#xrwm')).not.toBeChecked();
  await page.fill('#xrpx', '1000');
  await page.click('#xrnow');                                                   // without
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  await page.check('#xrwm');
  await page.click('#xrnow');                                                   // with
  await page.waitForFunction(() => window.__wbDownloads.length > 1);
  const c = await compare(page);
  expect(c.same).toBe(true);
  expect(c.topLeft).toBeGreaterThan(200);                                       // the mark
  expect(c.bottomRight).toBeGreaterThan(200);                                   // "Made with Wodblok"
  expect(c.topRight).toBe(0);
  expect(c.centre).toBe(0);
  if (process.env.WM_OUT) fs.writeFileSync(process.env.WM_OUT, Buffer.from(await page.evaluate(() => window.__wbDownloads[1].base64), 'base64'));
  expect(errors).toEqual([]);
});

test('SVG exports stay clean and the checkbox is greyed out for them; the choice is kept', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'xrec');
  await page.check('#xrwm');
  expect(await page.evaluate(() => localStorage.getItem('wb116_watermark') ?? 'kv')).toBeTruthy();
  await page.click('#xrf [data-f="svg"]');
  await expect(page.locator('#xrwm')).toBeDisabled();
  await page.click('#xrnow');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  const svg = await page.evaluate(() => atob(window.__wbDownloads[0].base64));
  expect(svg).not.toMatch(/Made with/);
  await page.click('#xrf [data-f="png"]');
  await expect(page.locator('#xrwm')).toBeEnabled();
  await expect(page.locator('#xrwm')).toBeChecked();
  expect(errors).toEqual([]);
});

test('Quick PNG gets the watermark too', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'xrec');
  await page.click('#png');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  await page.check('#xrwm');
  await page.click('#png');
  await page.waitForFunction(() => window.__wbDownloads.length > 1);
  const c = await compare(page);
  expect(c.topLeft).toBeGreaterThan(200);
  expect(c.bottomRight).toBeGreaterThan(200);
  expect(c.centre).toBe(0);
  expect(errors).toEqual([]);
});
