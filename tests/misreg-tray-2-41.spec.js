// 2.41.0: Misregistration's second copy is a tray colour (a link that follows the tray, or a fixed colour; empty = the same ink),
// and a Random slider moves the copy by a seeded random offset (Reroll draws another).
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, addShape } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const shapeOf = d => (d.els || []).find(q => q.k === 'motif' && !q.bgd);
const floods = page => page.evaluate(() => [...document.querySelectorAll('feFlood')].map(f => f.getAttribute('flood-color')));
const offs = page => page.evaluate(() => [...document.querySelectorAll('filter feOffset')].map(f => [f.getAttribute('dx'), f.getAttribute('dy')].join(',')));
async function setup(page) {
  const o = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  await page.locator('.fxg[data-fxk="motif"] .fxadd').scrollIntoViewIfNeeded();
  await page.click('.fxg[data-fxk="motif"] .fxadd');
  await page.locator('.rowm .ddi', { hasText: 'Print' }).first().hover();
  await page.locator('.rowsub .ddi', { hasText: 'Misregistration' }).click(); await settle(page);
  return o;
}

test('the second copy has a colour well: fixed cyan to start, a tray colour on pick, and a tray edit recolours it', async ({ page }) => {
  const { errors } = await setup(page);
  const well = page.locator('.fxg[data-fxk="motif"] .fxs[data-e="misreg"] [data-qw="col"]');
  await expect(well).toBeVisible();
  expect((await st(page)).els.find(q => q.k == 'motif' && !q.bgd).fx[0].col).toBe('#00aeef');
  expect(await floods(page)).toContain('#00aeef');
  await well.scrollIntoViewIfNeeded(); await page.waitForTimeout(200);   // the panel finishes scrolling before the popover opens (a scroll closes it)
  await well.locator('.cwsb').click();
  await page.locator('.cwp .cwpc[data-s]').nth(1).click(); await settle(page);
  let d = await st(page), f = shapeOf(d).fx[0];
  expect(f.col).toMatch(/^@\w+$/);
  const id = f.col.slice(1), hex = d.proj.cw[d.proj.cwa].c[id];
  expect(await floods(page)).toContain(hex.slice(0, 7));
  // the tray colour changes: the copy follows
  d.proj.cw[d.proj.cwa].c[id] = '#12ab34';
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await settle(page);
  expect(await floods(page)).toContain('#12ab34');
  // the default entry: the same ink, no flood
  await well.locator('.cwsb').click();
  await page.locator('.cwp .cwpd').click(); await settle(page);
  expect(shapeOf(await st(page)).fx[0].col).toBe('');
  expect((await floods(page)).includes('#12ab34')).toBe(false);
  expect(errors).toEqual([]);
});

test('Random moves the copy by a seeded offset; Reroll draws another; the same seed lands the same', async ({ page }) => {
  const { errors } = await setup(page);
  const sl = page.locator('.fxg[data-fxk="motif"] .fxs[data-e="misreg"] [data-q="rnd"]');
  await expect(sl).toHaveValue('0');
  const o0 = await offs(page);
  await sl.fill('80'); await sl.dispatchEvent('input'); await settle(page);
  const o1 = await offs(page);
  expect(o1).not.toEqual(o0);
  const sd = shapeOf(await st(page)).fx[0].sd;
  await page.locator('.fxg[data-fxk="motif"] .fxs[data-e="misreg"] [data-qrr]').click(); await settle(page);
  expect(shapeOf(await st(page)).fx[0].sd).not.toBe(sd);
  expect(await offs(page)).not.toEqual(o1);
  // the same seed again gives the same offset
  const d = await st(page); shapeOf(d).fx[0].sd = sd;
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await settle(page);
  expect(await offs(page)).toEqual(o1);
  // at 0 the offset is Offset along Angle only, whatever the seed
  await sl.fill('0'); await sl.dispatchEvent('input'); await settle(page);
  expect(await offs(page)).toEqual(o0);
  expect(errors).toEqual([]);
});
