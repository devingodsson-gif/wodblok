// 2.73.0: the Replace blend is back, on an element. Where the element overlaps the elements below it, that overlap prints in a colour (the element's Replace colour,
// the ink by default, a tray link or a fixed colour); the rest of both prints as it was. The Background is not "below": it never takes part.
const { test, expect } = require('@playwright/test');
const { openApp, showPanel, settle, getState, addShape } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const apply = async (page, d) => { await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await settle(page); };
// the colour at canvas point (x, y), read from a screenshot of the canvas
const at = async (page, pts) => {
  const b = await page.locator('#art').screenshot();
  return page.evaluate(async ([s, pts]) => {
    const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()), c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const k = im.width / 533; return pts.map(([x, y]) => [...g.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data].slice(0, 3));
  }, [b.toString('base64'), pts]);
};
const near = (c, hex) => [1, 3, 5].every((i, j) => Math.abs(c[j] - parseInt(hex.slice(i, i + 2), 16)) < 14);

async function setup(page) {
  const o = await openApp(page, { seed: 4, background: true });
  await addShape(page); await settle(page);
  const d = await st(page), m = d.els.find(q => q.k === 'motif' && !q.bgd);
  d.els = d.els.filter(q => q.bgd || q.u === m.u);
  const a = { ...m, u: 'ra', x: 200, y: 400, s: 200 }, b = { ...m, u: 'rb', x: 330, y: 400, s: 200 };
  d.els = [d.els.find(q => q.bgd), a, b]; await apply(page, d);
  return { o, d };
}

test('Replace is in the Blend list; Behind and Cancel are not', async ({ page }) => {
  const { o } = await setup(page);
  const opts = await page.locator('#ly_bl option').allInnerTexts();
  expect(opts.some(t => /^Replace/.test(t))).toBe(true);
  expect(opts.some(t => /^(Behind|Cancel)/.test(t))).toBe(false);
  expect(o.errors).toEqual([]);
});

test('the overlap prints in the Replace colour; the rest of both keeps its ink; the paper stays paper', async ({ page }) => {
  const { o, d } = await setup(page);
  const [ink, , paper] = [d.proj.cw[d.proj.cwa].c[d.proj.ink.slice(1)] || '#12354e', 0, d.proj.cw[d.proj.cwa].c[d.proj.bg.slice(1)] || '#ffefae'];
  const P = [[170, 400], [265, 400], [360, 400], [20, 20]];   // A only, the overlap, B only, paper
  let c = await at(page, P);
  expect(c.slice(0, 3).every((v, i) => i == 3 || near(v, ink.slice(0, 7)) || i == 1)).toBe(true);
  expect(near(c[1], ink.slice(0, 7))).toBe(true);
  const e = await st(page); e.els.find(q => q.u === 'rb').bl = 'replace'; e.els.find(q => q.u === 'rb').rp = '#ff0000'; await apply(page, e);
  c = await at(page, P);
  expect(near(c[0], ink.slice(0, 7))).toBe(true);        // A only: as it was
  expect(near(c[1], '#ff0000')).toBe(true);              // the overlap: the Replace colour
  expect(near(c[2], ink.slice(0, 7))).toBe(true);        // B only: as it was
  expect(near(c[3], paper.slice(0, 7))).toBe(true);      // the paper is untouched
  expect(o.errors).toEqual([]);
});

test('with no Replace colour set it prints in the ink; the colour is a tray link that follows the tray', async ({ page }) => {
  const { o } = await setup(page);
  const e = await st(page); const b = e.els.find(q => q.u === 'rb'); b.bl = 'replace'; b.rp = '@' + e.proj.ts[0]; await apply(page, e);
  expect(near((await at(page, [[265, 400]]))[0], e.proj.cw[e.proj.cwa].c[e.proj.ts[0]].slice(0, 7))).toBe(true);
  e.proj.cw[e.proj.cwa].c[e.proj.ts[0]] = '#12ab34'; await apply(page, e);
  expect(near((await at(page, [[265, 400]]))[0], '#12ab34')).toBe(true);
  expect(o.errors).toEqual([]);
});

test('choosing Replace in the Blend list shows its colour well; a picked colour is kept on the element', async ({ page }) => {
  const { o } = await setup(page);
  await showPanel(page, 'lyrs');
  await page.locator('#lyl2 .lyr[data-u="rb"] .lyn').click(); await settle(page);
  await expect(page.locator('#ly_rprow')).toBeHidden();
  await page.evaluate(() => { const e = document.getElementById('ly_bl'); e.value = 'replace'; e.dispatchEvent(new Event('change', { bubbles: true })); }); await settle(page);
  expect((await st(page)).els.find(q => q.u === 'rb').bl).toBe('replace');
  await expect(page.locator('#ly_rprow')).toBeVisible();
  const well = page.locator('#wl_rp');
  await well.scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
  await well.locator('.cwsb').click();
  await page.locator('.cwp .cwpc[data-s]').nth(1).click(); await settle(page);
  expect((await st(page)).els.find(q => q.u === 'rb').rp).toMatch(/^@\w+$/);
  expect(o.errors).toEqual([]);
});
