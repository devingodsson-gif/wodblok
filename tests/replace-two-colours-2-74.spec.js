// 2.74.0: Replace has two colours. Colour A is what the element draws (its own ink unless A is set); colour B (the paper unless set) is drawn instead wherever the pixel
// beneath is already colour A, to within Match. "Beneath" is everything drawn before the element, the Background included.
const { test, expect } = require('@playwright/test');
const { openApp, showPanel, settle, getState, addShape } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const apply = async (page, d) => { await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await settle(page); };
const at = async (page, pts) => {
  const b = await page.locator('#art').screenshot();
  return page.evaluate(async ([s, pts]) => {
    const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()), c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const k = im.width / 533; return pts.map(([x, y]) => [...g.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data].slice(0, 3));
  }, [b.toString('base64'), pts]);
};
const near = (c, hex) => [1, 3, 5].every((i, j) => Math.abs(c[j] - parseInt(hex.slice(i, i + 2), 16)) < 14);
const P = [[170, 400], [265, 400], [360, 400], [20, 20]];   // A's shape only, the overlap, the Replace shape only, paper

// two overlapping rectangles in the ink on the paper; the second ('rb') is the Replace element
async function setup(page) {
  const o = await openApp(page, { seed: 4, background: true });
  await addShape(page); await settle(page);
  const d = await st(page), m = d.els.find(q => q.k === 'motif' && !q.bgd);
  d.els = [d.els.find(q => q.bgd), { ...m, u: 'ra', x: 200, y: 400, s: 200 }, { ...m, u: 'rb', x: 330, y: 400, s: 200, bl: 'replace' }];
  await apply(page, d);
  const c = d.proj.cw[d.proj.cwa].c, ink = c[d.proj.ink.slice(1)].slice(0, 7), paper = c[d.proj.bg.slice(1)].slice(0, 7);
  return { o, d, ink, paper };
}
const rb = d => d.els.find(q => q.u === 'rb');

test('with nothing set it draws the ink, and the paper colour over what is already ink', async ({ page }) => {
  const { o, ink, paper } = await setup(page);
  const c = await at(page, P);
  expect(near(c[0], ink)).toBe(true);     // the first shape: as it was
  expect(near(c[1], paper)).toBe(true);   // the overlap: the pixel was already A (the ink), so B (the paper colour)
  expect(near(c[2], ink)).toBe(true);     // over bare paper: A, the ink
  expect(near(c[3], paper)).toBe(true);
  expect(o.errors).toEqual([]);
});

test('colour B is its own colour, and a tray link follows the tray', async ({ page }) => {
  const { o, ink } = await setup(page);
  let d = await st(page); rb(d).rp = '#ff0000'; await apply(page, d);
  let c = await at(page, P);
  expect(near(c[1], '#ff0000')).toBe(true); expect(near(c[2], ink)).toBe(true); expect(near(c[0], ink)).toBe(true);
  rb(d).rp = '@' + d.proj.ts[1]; await apply(page, d);
  const hex = d.proj.cw[d.proj.cwa].c[d.proj.ts[1]].slice(0, 7);
  expect(near((await at(page, P))[1], hex)).toBe(true);
  d.proj.cw[d.proj.cwa].c[d.proj.ts[1]] = '#12ab34'; await apply(page, d);
  expect(near((await at(page, P))[1], '#12ab34')).toBe(true);
  expect(o.errors).toEqual([]);
});

test('colour A recolours what it draws, and B shows where the pixel beneath is A', async ({ page }) => {
  const { o, ink } = await setup(page);
  const d = await st(page); rb(d).ra = '#00aa00'; rb(d).rp = '#ff0000'; await apply(page, d);
  let c = await at(page, P);
  expect(near(c[2], '#00aa00')).toBe(true);   // over paper: A, now green
  expect(near(c[1], '#00aa00')).toBe(true);   // over the ink, which is not A (green): A again
  expect(near(c[0], ink)).toBe(true);
  // the first shape is green too: now the overlap is A over A, so B
  const e = await st(page); e.els.find(q => q.u === 'ra').ink = '#00aa00'; await apply(page, e);
  c = await at(page, P);
  expect(near(c[1], '#ff0000')).toBe(true); expect(near(c[0], '#00aa00')).toBe(true); expect(near(c[2], '#00aa00')).toBe(true);
  expect(o.errors).toEqual([]);
});

test('Match decides how close to A counts as A', async ({ page }) => {
  const { o, ink } = await setup(page);
  const d = await st(page); rb(d).ra = '#1a3a52'; rb(d).rp = '#ff0000'; await apply(page, d);   // a little off the ink (#12354e)
  expect(near((await at(page, P))[1], '#ff0000')).toBe(true);        // the default Match takes it as A
  rb(d).rm = 0; await apply(page, d);
  expect(near((await at(page, P))[1], '#1a3a52')).toBe(true);        // an exact match only: it is not A, so A is drawn
  expect(o.errors).toEqual([]);
});

test('the Background counts as beneath: text-like shapes over a paper that is colour A switch to B', async ({ page }) => {
  const { o, paper } = await setup(page);
  const d = await st(page); rb(d).ra = paper; rb(d).rp = '#0000ff'; await apply(page, d);
  const c = await at(page, P);
  expect(near(c[2], '#0000ff')).toBe(true);   // over bare paper, which is A: B
  expect(o.errors).toEqual([]);
});

test('Replace shows Colour A, Colour B and Match while a selected element is on Replace', async ({ page }) => {
  const { o } = await setup(page);
  await showPanel(page, 'lyrs');
  await page.locator('#lyl2 .lyr[data-u="ra"] .lyn').click(); await settle(page);
  for (const id of ['ly_rarow', 'ly_rprow', 'ly_rmrow']) await expect(page.locator('#' + id)).toBeHidden();
  await page.locator('#lyl2 .lyr[data-u="rb"] .lyn').click(); await settle(page);
  for (const id of ['ly_rarow', 'ly_rprow', 'ly_rmrow']) await expect(page.locator('#' + id)).toBeVisible();
  await page.locator('#ly_rm').evaluate(e => { e.value = 60; e.dispatchEvent(new Event('input', { bubbles: true })); }); await settle(page);
  expect(rb(await st(page)).rm).toBe(60);
  expect(o.errors).toEqual([]);
});
