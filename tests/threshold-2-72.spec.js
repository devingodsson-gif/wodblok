// 2.72.0: Threshold (Print). Each pixel becomes Dark or Light by its brightness (Level), the edge is cut at Edge, Softness widens both cuts, Invert swaps them.
// Dark and Light are tray colour wells: fixed black and white to start, a tray colour on pick (it follows the tray), and no "same ink" entry.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, addShape } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const shapeOf = d => (d.els || []).find(q => q.k === 'motif' && !q.bgd);
const floods = page => page.evaluate(() => [...document.querySelectorAll('#art filter feFlood')].map(f => f.getAttribute('flood-color')));
const apply = async (page, d) => { await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await settle(page); };
// share of the canvas's pixels that are near a colour
const share = (page, hex) => page.locator('#art').screenshot().then(b => page.evaluate(async ([s, hex]) => {
  const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()), c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const D = g.getImageData(0, 0, im.width, im.height).data, t = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)); let n = 0;
  for (let i = 0; i < D.length; i += 4) if (Math.abs(D[i] - t[0]) + Math.abs(D[i + 1] - t[1]) + Math.abs(D[i + 2] - t[2]) < 12) n++;
  return n / (D.length / 4);
}, [b.toString('base64'), hex]));

async function setup(page) {
  const o = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  await page.locator('.fxg[data-fxk="motif"] .fxadd').scrollIntoViewIfNeeded();
  await page.click('.fxg[data-fxk="motif"] .fxadd');
  await page.locator('.rowm .ddi', { hasText: 'Print' }).first().hover();
  await page.locator('.rowsub .ddi', { hasText: 'Threshold' }).click(); await settle(page);
  return o;
}

test('Threshold starts black and white with its settings, and Invert swaps the two', async ({ page }) => {
  const { errors } = await setup(page);
  const f = shapeOf(await st(page)).fx[0];
  expect(f).toMatchObject({ k: 'thresh', on: true, lv: 50, edge: 50, soft: 0, inv: false, dk: '#000000', lt: '#ffffff' });
  const pane = page.locator('.fxg[data-fxk="motif"] .fxs[data-e="thresh"]');
  for (const n of ['Level', 'Edge', 'Softness']) await expect(pane.locator(`input[type=range][aria-label="${n}"]`)).toHaveCount(1);
  await expect(pane.locator('input[type=checkbox][data-q="inv"]')).toHaveCount(1);
  await expect(pane.locator('[data-qw="dk"]')).toBeVisible(); await expect(pane.locator('[data-qw="lt"]')).toBeVisible();
  expect(await floods(page)).toEqual(expect.arrayContaining(['#000000', '#ffffff']));
  // the shape is dark ink, so it prints in Dark; inverted, in Light (green here, so it can be told from the paper)
  const d = await st(page);
  shapeOf(d).fx[0].lt = '#00ff00'; await apply(page, d);
  const dark = await share(page, '#000000'), green0 = await share(page, '#00ff00');
  shapeOf(d).fx[0].inv = true; await apply(page, d);
  const green1 = await share(page, '#00ff00');
  expect(green1).toBeGreaterThan(green0 + 0.002);
  expect(green1).toBeGreaterThan(dark * 0.5);
  expect(errors).toEqual([]);
});

test('Dark and Light are tray wells with no "same ink" entry; a tray colour follows the tray', async ({ page }) => {
  const { errors } = await setup(page);
  const well = page.locator('.fxg[data-fxk="motif"] .fxs[data-e="thresh"] [data-qw="lt"]');
  await well.scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
  await well.locator('.cwsb').click();
  await expect(page.locator('.cwp .cwpd')).toHaveCount(0);
  await page.locator('.cwp .cwpc[data-s]').nth(1).click(); await settle(page);
  let d = await st(page), f = shapeOf(d).fx[0];
  expect(f.lt).toMatch(/^@\w+$/); expect(f.dk).toBe('#000000');
  const id = f.lt.slice(1);
  expect(await floods(page)).toContain(d.proj.cw[d.proj.cwa].c[id].slice(0, 7));
  d.proj.cw[d.proj.cwa].c[id] = '#12ab34'; await apply(page, d);
  expect(await floods(page)).toContain('#12ab34');
  expect(errors).toEqual([]);
});

test('Edge cuts the element where its alpha passes it; Softness softens the cut', async ({ page }) => {
  const { errors } = await setup(page);
  const fil = () => page.evaluate(() => [...document.querySelectorAll('#art filter')].map(f => f.innerHTML).find(h => h.includes('.2126 .7152 .0722')));
  const h0 = await fil();
  expect(h0).toContain('in="SourceAlpha"');
  const d = await st(page); shapeOf(d).fx[0].soft = 100; shapeOf(d).fx[0].edge = 80; await apply(page, d);
  const h1 = await fil();
  expect(h1).not.toBe(h0);
  expect(h1).toMatch(/slope="2"/);
  expect(errors).toEqual([]);
});
