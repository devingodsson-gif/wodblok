// 2.87.6 (docs/pro-basics-plan.md step 6): print files. Canvas > Canvas size > Bleed, in the chosen units; Export > Print file… writes a PDF with its trim and
// bleed boxes, crop and registration marks and spot inks as Separation plates, a TIFF with the bleed and marks, or a layered PSD with one layer per element.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));
const run = (page, id) => page.evaluate(id => window.__wbTest.commands.run(id), id);
const dl = (page, i) => page.evaluate(i => window.__wbDownloads[i], i);
const MM = 72 / 25.4;
async function setup(page, spot = false) {
  const r = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page); await H.addShape(page); await H.settle(page);
  const d = await st(page), W = await page.locator('#art').evaluate(e => e.viewBox.baseVal.width), m = d.els.filter(q => q.k === 'motif');
  d.proj.ts.push('k3'); d.proj.cw[0].c.k3 = '#c0392b'; d.proj.cw[0].m.k3 = 'Brick Red'; if (spot) d.proj.spot = ['k3'];
  Object.assign(m[0], { x: W * .25, y: W * .5, s: W * .3, wy: 1, r: 0 }); Object.assign(m[1], { x: W * .75, y: W * .5, s: W * .3, wy: 1, r: 0, ink: '@k3' });
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await H.settle(page); await page.keyboard.press('Escape');
  return r;
}
async function bleed(page, v) { await H.openPanel(page, 'canvas'); const f = page.locator('#cbl'); await f.click(); await f.fill(v); await f.press('Enter'); await H.settle(page); }
const box = (pdf, k) => (new RegExp('/' + k + ' \\[([^\\]]+)\\]').exec(pdf) || [])[1].trim().split(/\s+/).map(Number);
async function printFile(page, set, n) {
  await run(page, 'export.printFile'); await expect(page.locator('#prfd')).toBeVisible();
  for (const s of set) await page.locator(s).click();
  await page.locator('#prfok').click();
  await page.waitForFunction(n => window.__wbDownloads.length > n, n, { timeout: 60000 });
  return dl(page, n);
}
const tiffTags = t => { const o = t.readUInt32LE(4), n = t.readUInt16LE(o), tags = {}; for (let i = 0; i < n; i++) { const p = o + 2 + i * 12, ty = t.readUInt16LE(p + 2); tags[t.readUInt16LE(p)] = ty === 3 ? t.readUInt16LE(p + 8) : t.readUInt32LE(p + 8); } return tags; };

test('Bleed is typed in the units, is one History step and stays in the document', async ({ page }) => {
  const { errors } = await setup(page);
  await bleed(page, '3');
  expect((await st(page)).dim.bl).toBeCloseTo(3 / 25.4, 4);
  expect((await page.evaluate(() => window.__wbTest.histLabels())).slice(-1)[0]).toBe('Bleed');
  await expect(page.locator('#cblr .unu')).toHaveText('mm');
  await page.locator('#cbl').fill('abc'); await page.locator('#cbl').press('Enter'); await expect(page.locator('#cbl')).toHaveClass(/bad/);
  expect((await st(page)).dim.bl).toBeCloseTo(3 / 25.4, 4);
  expect(errors).toEqual([]);
});

test('a print PDF has its trim, bleed and media boxes, the marks, and a spot ink as its own Separation', async ({ page }) => {
  const { errors } = await setup(page, true);
  await bleed(page, '3mm');
  const d = await printFile(page, ['#prfr [data-v="150"]'], 0);
  expect(d.filename).toMatch(/-print\.pdf$/);
  const pdf = Buffer.from(d.base64, 'base64').toString('latin1');
  const T = box(pdf, 'TrimBox'), B = box(pdf, 'BleedBox'), M = box(pdf, 'MediaBox');
  expect(Math.max(T[2] - T[0], T[3] - T[1])).toBeCloseTo(300 * MM, 0);          // a canvas with no size: 300 mm on its long side
  expect(T[0] - B[0]).toBeCloseTo(3 * MM, 0); expect(B[2] - T[2]).toBeCloseTo(3 * MM, 0);
  expect(B[0] - M[0]).toBeCloseTo(36, 0);                                           // half an inch of margin for the marks
  expect(pdf).toContain('/Separation /All'); expect(pdf).toContain('/Separation /Brick_Red');
  expect((pdf.match(/ l S\n/g) || []).length).toBeGreaterThanOrEqual(16);          // 8 crop marks and 4 registration crosses
  // CMYK, no marks: the picture is DeviceCMYK and the media box is the bleed box
  const d2 = await printFile(page, ['#prfc [data-v="cmyk"]', '#prfk', '#prfg2'], 1);
  const p2 = Buffer.from(d2.base64, 'base64').toString('latin1');
  expect(p2).toContain('/DeviceCMYK'); expect(box(p2, 'MediaBox')).toEqual(box(p2, 'BleedBox'));
  expect(errors).toEqual([]);
});

test('a print TIFF is the sheet with bleed and margin; a layered PSD has one layer per element and, with Ink channels, one spot channel per ink', async ({ page }) => {
  const { errors } = await setup(page);
  await bleed(page, '0.125in');
  const t = Buffer.from((await printFile(page, ['#prff [data-v="tiff"]', '#prfr [data-v="150"]'], 0)).base64, 'base64'), g = tiffTags(t);
  const L = Math.round(300 / 25.4 * 150), b = Math.round(.125 * 150), s = 75;
  expect(Math.max(g[256], g[257])).toBe(L + 2 * b + 2 * s); expect(g[277]).toBe(3); expect(g[262]).toBe(2);
  const p = Buffer.from((await printFile(page, ['#prff [data-v="psd"]', '#prfi'], 1)).base64, 'base64');
  expect(p.toString('latin1', 0, 4)).toBe('8BPS'); expect(p.readUInt16BE(12)).toBe(5);   // red, green, blue and two ink channels
  const res = 26 + 4 + p.readUInt32BE(26), resLen = p.readUInt32BE(res), lms = res + 4 + resLen, count = p.readInt16BE(lms + 8);
  expect(Math.abs(count)).toBe(2);
  expect(p.indexOf('Brick Red', 0, 'latin1')).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
