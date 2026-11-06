// 2.119.0 (docs/full-check-2.117.md step 3; owner Nov 6 2026: "front cover"): on a book cover, the book products (Notebook, Angled book) show the front cover
// only, trim to trim; other products still show the whole canvas (B4). The warp's triangles no longer leave light seams (B5). An exported mockup is made from a
// design whose textures are made for the export's size (B7, through ser; covered by sheet-texture-sharp-2-116 for the export path itself).
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

// a book cover: paper on the whole wrap, and a big dark block on the back cover only
async function cover(page) {
  const r = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.openPanel(page, 'canvas'); await page.locator('#cfmt [data-f="book"]').click(); await H.settle(page);
  await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), a = document.getElementById('art').viewBox.baseVal, m = s.els.find(e => e.k === 'motif');
    Object.assign(m, { x: a.width * .246, y: a.height / 2, s: a.height * .5, r: 0 });   // the back cover's middle, well clear of the spine
    window.__wbTest.apply(JSON.stringify(s)); });
  await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock')); await H.settle(page);
  return r;
}
// the share of the print area that is the dark ink (the block), and the light seams, on the view
const look = (page, id) => page.evaluate(async id => {
  document.querySelector(`#mkpane [data-mk="${id}"]`).click();
  await new Promise(r => setTimeout(r, 1800));
  const c = document.getElementById('mkc'), x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data, s = JSON.parse(window.__wbTest.state()), w = s.proj.cw[s.proj.cwa | 0];
  const ink = w.c[s.proj.ts[1]], rgb = [1, 3, 5].map(i => parseInt(ink.slice(i, i + 2), 16));
  let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - rgb[0]) + Math.abs(d[i + 1] - rgb[1]) + Math.abs(d[i + 2] - rgb[2]) < 60) n++;
  return n / (d.length / 4);
}, id);

test('on a book cover the Notebook and the Angled book show the front cover only; the T-shirt still shows the whole wrap', async ({ page }) => {
  const { errors } = await cover(page);
  expect(await look(page, 'p-notebook'), 'no back cover on the notebook').toBeLessThan(.002);
  expect(await look(page, 'p-notebook-angle'), 'nor on the angled book').toBeLessThan(.002);
  expect(await look(page, 'p-wallpaper'), 'the wallpaper shows the whole wrap, block and all').toBeGreaterThan(.02);
  expect(errors).toEqual([]);
});

test('a flat colour on the T-shirt shows no light seams where the warp\'s triangles meet', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, background: true });
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), w = s.proj.cw[s.proj.cwa | 0]; w.c[s.proj.ts[0]] = '#7a1f2b'; window.__wbTest.apply(JSON.stringify(s)); }); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock')); await H.settle(page);
  await page.locator('#mkpane [data-mk="p-tshirt"]').click(); await page.waitForTimeout(1500); await H.settle(page);
  const r = await page.evaluate(() => { const c = document.getElementById('mkc'), x = c.getContext('2d'), W = c.width, H = c.height, d = x.getImageData(0, 0, W, H).data;
    let n = 0, tot = 0; const L = (i, j) => { const o = (j * W + i) * 4; return d[o] * .3 + d[o + 1] * .59 + d[o + 2] * .11; };
    for (let j = 3; j < H - 3; j++) for (let i = 3; i < W - 3; i++) { const o = (j * W + i) * 4; if (!(d[o] > d[o + 1] + 40)) continue; tot++; const v = L(i, j);
      if ((v > L(i - 2, j) + 6 && v > L(i + 2, j) + 6) || (v > L(i, j - 2) + 6 && v > L(i, j + 2) + 6)) n++; }
    return n / tot * 1e4; });
  expect(r, 'thin light lines per 10,000 pixels of the design (148 before 2.119.0)').toBeLessThan(20);
  expect(errors).toEqual([]);
});
