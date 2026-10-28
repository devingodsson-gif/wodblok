// 2.73.0: the Replace blend is back, on an element (2.74.0 made it two colours, see replace-two-colours-2-74.spec.js). This file keeps the Blend list and the colour wells.
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

test('choosing Replace in the Blend list shows its colour wells; a picked colour B is kept on the element', async ({ page }) => {
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
