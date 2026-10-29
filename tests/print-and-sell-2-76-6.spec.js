// 2.76.6 (owner Oct 29 2026, docs/pattern-plan.md step 3): patterns you can print and sell. A canvas can have a physical size (px, in or mm at a resolution);
// a pattern's piece size can be given in it; a repeat tile repeats as a grid, a brick or a half drop, and its repeat unit exports at the physical size; a PDF of the
// artwork; one Export entry in the Export menu; file names follow the project (Untitled-project when it has none).
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const dim = async page => JSON.parse(await H.getState(page)).dim;
const pick = (page, sel, v) => page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);
// the harness keeps every saved file in window.__wbDownloads ({ filename, base64 })
const mockSave = page => page.evaluate(() => { window.__wbDownloads.length = 0; });
const lastFile = page => page.evaluate(() => { const f = window.__wbDownloads.at(-1); return { name: f.filename, b64: f.base64 } });
const waitFile = (page, n) => page.waitForFunction(n => window.__wbDownloads.length >= n && window.__wbDownloads.at(-1).base64, n, { timeout: 90000 });

test('a canvas gets a physical size: unit, width and height, resolution; a ratio keeps the width; Ratio only drops it', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await H.openPanel(page, 'canvas');
  await pick(page, '#cun', 'in'); await H.settle(page);
  let d = await dim(page);
  expect(d).toMatchObject({ u: 'in', dpi: 300 }); expect(d.pw).toBeCloseTo(8, 2);
  await page.fill('#cpw', '10'); await page.fill('#cph', '12'); await page.locator('#cph').dispatchEvent('change'); await H.settle(page);
  d = await dim(page); expect([d.pw, d.ph]).toEqual([10, 12]); expect(d.c[1] / d.c[0]).toBeCloseTo(1.2, 3);
  await expect(page.locator('#cphi')).toHaveText('3000 × 3600 px');
  await pick(page, '#cdpi', '150'); await H.settle(page);
  await expect(page.locator('#cphi')).toHaveText('1500 × 1800 px');
  await pick(page, '#cun', 'mm'); await H.settle(page);
  d = await dim(page); expect(d.pw).toBeCloseTo(254, 0); expect(d.ph).toBeCloseTo(304.8, 0);
  await pick(page, '#casp', '4'); await H.settle(page);   // 1:1 square keeps the width
  d = await dim(page); expect(d.ph).toBeCloseTo(d.pw, 0);
  await pick(page, '#cun', ''); await H.settle(page);
  d = await dim(page); expect(d.u).toBeUndefined(); expect(d.pw).toBeUndefined();
  await expect(page.locator('#cphb')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a pattern piece can be sized in inches once the canvas has a physical size', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.openPanel(page, 'canvas'); await pick(page, '#cun', 'in'); await H.settle(page);
  await page.fill('#cpw', '10'); await page.fill('#cph', '10'); await page.locator('#cph').dispatchEvent('change'); await H.settle(page);
  await H.openPanel(page, 'layers'); await H.settle(page);
  await expect(page.locator('#pepur')).toBeVisible();
  await expect(page.locator('#pepuu')).toHaveText('in');
  await page.fill('#pepu', '2'); await page.locator('#pepu').dispatchEvent('change'); await H.settle(page);
  const p = JSON.parse(await H.getState(page)).els.find(q => q.k === 'pattern');
  expect(p.ps).toBeCloseTo(20, 1);
  expect(errors).toEqual([]);
});

test('a brick repeat: the wrap follows it, and the repeat unit is the tile on two rows, the second moved half across', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 6, pattern: false, background: true });
  await H.addShape(page, 'ellipse'); await page.keyboard.press('Escape'); await H.settle(page);
  await H.openPanel(page, 'canvas');
  await page.click('#cfmt [data-f="tile"]'); await H.settle(page, { max: 30000 });
  await pick(page, '#cun', 'px'); await H.settle(page);
  await page.fill('#cpw', '300'); await page.fill('#cph', '200'); await page.locator('#cph').dispatchEvent('change'); await H.settle(page);
  await page.click('#tlrk [data-k="brick"]'); await H.settle(page, { max: 30000 });
  expect((await dim(page)).rk).toBe('brick');
  const vb = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
  expect(await page.evaluate(w => [...document.querySelectorAll('#art use[href^="#tw"]')].some(u => Math.abs(Math.abs(+u.getAttribute('x')) - w / 2) < .01), vb[0])).toBe(true);
  await mockSave(page);
  await page.click('#mnb-export'); await page.locator('.pop.mnbm:visible [data-cmd="export.repeatPng"]').click();
  await waitFile(page, 1);
  const f = await lastFile(page);
  expect(f.name).toBe('Untitled-project-repeat.png');
  const r = await page.evaluate(async b64 => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
    const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
    const W = bm.width, H = bm.height, h = H / 2, d = g.getImageData(0, 0, W, H).data, px = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]] };
    let bad = 0, n = 0; for (let y = 5; y < h - 5; y += 7) for (let x = 5; x < W - 5; x += 7) { const a = px(x, y + h), b = px((x - W / 2 + W) % W, y); n++; if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 30) bad++ }
    return { W, H, bad, n };
  }, f.b64);
  expect([r.W, r.H]).toEqual([300, 400]);
  expect(r.bad / r.n).toBeLessThan(.02);
  expect(errors).toEqual([]);
});

test('Export PDF is at the canvas\'s physical size and named after the project', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, background: true });
  await page.fill('#pnm', 'Fern study'); await page.locator('#pnm').dispatchEvent('change'); await H.settle(page);
  await H.openPanel(page, 'canvas'); await pick(page, '#cun', 'in'); await H.settle(page);
  await page.fill('#cpw', '4'); await page.fill('#cph', '6'); await page.locator('#cph').dispatchEvent('change'); await pick(page, '#cdpi', '72'); await H.settle(page);
  await mockSave(page);
  await page.click('#mnb-export'); await page.locator('.pop.mnbm:visible [data-cmd="export.pdf"]').click();
  await waitFile(page, 1);
  const f = await lastFile(page), s = Buffer.from(f.b64, 'base64').toString('latin1');
  expect(f.name).toBe('Fern-study.pdf');
  expect(s.startsWith('%PDF')).toBe(true);
  expect(s).toMatch(/MediaBox\s*\[\s*0 0 288(\.0+)? 432(\.0+)?\s*\]/);
  expect(errors).toEqual([]);
});

test('the Export menu has one Export entry, and Print size exports at the physical size', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, background: true });
  await page.click('#mnb-export');
  const cmds = await page.locator('.pop.mnbm:visible [data-cmd]').evaluateAll(a => a.map(b => b.dataset.cmd));
  expect(cmds).toContain('file.export'); expect(cmds).not.toContain('panel.xrec'); expect(cmds).not.toContain('export.now');
  await page.keyboard.press('Escape');
  await H.openPanel(page, 'canvas'); await pick(page, '#cun', 'px'); await H.settle(page);
  await page.fill('#cpw', '640'); await page.fill('#cph', '480'); await page.locator('#cph').dispatchEvent('change'); await H.settle(page);
  await H.showPanel(page, 'xrec'); await H.settle(page);
  await expect(page.locator('#xrpsr')).toBeVisible();
  await page.locator('#xrps').check();
  await expect(page.locator('#xrd')).toHaveText('640 × 480 px');
  expect(errors).toEqual([]);
});
