// 2.88.1 (bug 1 of docs/full-review-2.88.md): a book cover prints at its own size. The unit fields, Separations, CMYK and Print file measure the whole cover
// sheet (both covers, the spine and the bleed) as the book cover's own Print cover export does; the print PDF's trim box sits the cover's bleed inside its bleed box.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));
const box = (pdf, k) => (new RegExp('/' + k + ' \\[([^\\]]+)\\]').exec(pdf) || [])[1].trim().split(/\s+/).map(Number);
async function cover(page) {
  const r = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page);
  await H.openPanel(page, 'canvas'); await page.locator('#cfmt [data-f="book"]').click(); await H.settle(page);
  const g = await page.evaluate(() => { const t = document.getElementById('bksum').textContent.match(/([\d.]+)\s*×\s*([\d.]+)/); return [+t[1], +t[2]]; });
  return { ...r, g };
}

test('the unit fields measure the cover sheet', async ({ page }) => {
  const { errors, g } = await cover(page);
  const W = await page.locator('#art').evaluate(e => e.viewBox.baseVal.width), q = (await st(page)).els.find(e => e.k === 'motif');
  const c = await H.canvasToClient(page, q.x, q.y);   // select the shape on the canvas
  await page.mouse.click(c.x, c.y); await H.settle(page);
  const wmm = +(await page.locator('#lfuw').inputValue()), want = q.s * (q.wx || 1) / W * g[0] * 25.4;
  expect(wmm).toBeCloseTo(want, 0);
  expect(errors).toEqual([]);
});

test('the print PDF is the cover sheet: bleed box the whole sheet, trim box the cover bleed inside it', async ({ page }) => {
  const { errors, g } = await cover(page);
  await page.evaluate(() => window.__wbTest.commands.run('export.printFile'));
  await page.locator('#prfr [data-v="150"]').click(); await page.locator('#prfok').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 60000 });
  const pdf = Buffer.from((await page.evaluate(() => window.__wbDownloads[0])).base64, 'base64').toString('latin1');
  const B = box(pdf, 'BleedBox'), T = box(pdf, 'TrimBox');
  expect((B[2] - B[0]) / 72).toBeCloseTo(g[0], 1); expect((B[3] - B[1]) / 72).toBeCloseTo(g[1], 1);
  const bleed = (T[0] - B[0]) / 72; expect(bleed).toBeGreaterThan(0.05); expect((B[2] - T[2]) / 72).toBeCloseTo(bleed, 2);
  // CMYK TIFF at the cover's own resolution (300 DPI) and size
  await page.evaluate(() => window.__wbTest.commands.run('export.cmykTiff'));
  await page.waitForFunction(() => window.__wbDownloads.length > 1, null, { timeout: 60000 });
  const t = Buffer.from((await page.evaluate(() => window.__wbDownloads[1])).base64, 'base64'), o = t.readUInt32LE(4), n = t.readUInt16LE(o), tags = {};
  for (let i = 0; i < n; i++) { const p = o + 2 + i * 12, ty = t.readUInt16LE(p + 2); tags[t.readUInt16LE(p)] = ty === 3 ? t.readUInt16LE(p + 8) : t.readUInt32LE(p + 8); }
  expect(tags[256]).toBe(Math.round(g[0] * 300)); expect(Math.abs(tags[257] - Math.round(g[1] * 300))).toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});
