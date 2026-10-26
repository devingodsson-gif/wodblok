// 2.38.0: Filter mode. A shape with {flt:1} draws no ink; its effects work on what is drawn under it, inside its outline. Clicks go through it.
// Inside a group it filters only the group's members under it. Halftone and the other outline effects read the picture's darkness.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, addShape } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const apply = async (page, d) => { await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await settle(page); };
// the exported Preview picture, with a reader for a pixel at canvas fractions
const shot = async page => {
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  if (await page.locator('section.pn[data-p="xrec"]:not([hidden])').count() === 0) await openPanel(page, 'xrec');
  await page.locator('#xrl .xrr', { hasText: 'Preview' }).locator('[data-act="exp"]').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  return page.evaluate(async () => {
    const x = window.__wbDownloads[0], bin = atob(x.base64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
    const bm = await createImageBitmap(new Blob([u], { type: x.type })), W = bm.width, H = bm.height, c = new OffscreenCanvas(W, H), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
    const p = g.getImageData(0, 0, W, H).data; let dark = 0; for (let i = 0; i < p.length; i += 4) if (p[i] + p[i + 1] + p[i + 2] < 300) dark++;
    const at = (fx, fy) => { const i = (Math.floor(fy * H) * W + Math.floor(fx * W)) * 4; return [p[i], p[i + 1], p[i + 2]]; };
    return { W, H, dark, px: [[.5, .5], [.06, .06], [.25, .3], [.75, .3], [.5, .75]].map(([a, b]) => at(a, b)) };
  });
};
const sat = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b);
// the canvas size (2.53.0: the Background is a Sheet, which has no size of its own)
const cv = page => page.locator('#art').evaluate(a => [a.viewBox.baseVal.width, a.viewBox.baseVal.height]);
// a canvas-sized Rectangle filter (m: a Rectangle's motif key, taken from a Rectangle the test added)
const fullFilter = (fx, cw, ch, m) => ({ u: 'flt1', k: 'motif', m, x: cw / 2, y: ch / 2, s: cw, wy: ch / cw, r: 0, f: 1, flt: 1, fx });

test('the Filter switch: shown for a shape, not for the Background; it hides Fill and Outline', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, background: true });
  await addShape(page); await settle(page);
  await openPanel(page, 'motifs'); await settle(page);
  await expect(page.locator('#mf_fltr')).toBeVisible();
  await expect(page.locator('#mf_fk')).toBeVisible(); await expect(page.locator('#mf_o')).toBeVisible();
  await page.locator('#mf_flt').check(); await settle(page);
  expect((await st(page)).els.find(q => q.k === 'motif' && !q.bgd).flt).toBe(1);
  await expect(page.locator('#mf_fk')).toBeHidden(); await expect(page.locator('#mf_o')).toBeHidden();
  await page.locator('#mf_flt').uncheck(); await settle(page);
  expect((await st(page)).els.find(q => q.k === 'motif' && !q.bgd).flt).toBeUndefined();
  await expect(page.locator('#mf_fk')).toBeVisible();
  // the Background (a Sheet, 2.53.0) has no Filter switch (picked from the list, the bottom row): it shows its Fill in the Sheet panel
  await showPanel(page, 'lyrs'); await page.locator('#lyl2 .lyr').last().locator('.lyn').click(); await settle(page);
  await expect(page.locator('section.pn[data-p="sheet"] #mf_fk')).toBeVisible();
  await expect(page.locator('#mf_fltr')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a heart filter greys only what is under the heart; strength 0 changes nothing', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, background: true });
  await addShape(page, 'heart'); await settle(page);
  const d = await st(page), bg = d.els.find(q => q.bgd), [cw, ch] = await cv(page);
  bg.ink = '#e83a3a';
  Object.assign(d.els.find(q => q.k === 'motif' && !q.bgd), { x: cw / 2, y: ch / 2, s: cw * 0.5, r: 0, flt: 1, fx: [{ u: 'g1', k: 'grade', on: true, sat: -100 }] });
  await apply(page, d);
  const a = await shot(page);
  expect(sat(a.px[0])).toBeLessThan(20);       // the middle, inside the heart: grey
  expect(sat(a.px[1])).toBeGreaterThan(100);   // the corner, outside: still red
  const d2 = await st(page); d2.els.find(q => q.flt).op = 0; await apply(page, d2);
  const b = await shot(page);
  expect(sat(b.px[0])).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});

test('clicks go through a filter shape to what is under it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, background: true });
  await addShape(page, 'rect'); await settle(page);
  await addShape(page, 'rect'); await settle(page);
  const d = await st(page), bg = d.els.find(q => q.bgd), [cw, ch] = await cv(page), [under, top] = d.els.filter(q => q.k === 'motif' && !q.bgd);
  Object.assign(under, { x: cw / 2, y: ch / 2, s: cw * 0.3, wy: 1, r: 0 });
  Object.assign(top, { x: cw / 2, y: ch / 2, s: cw, wy: ch / cw, r: 0, flt: 1, fx: [{ u: 'b1', k: 'blur', on: true, amt: 5 }] });
  await apply(page, d);
  await page.keyboard.press('Escape'); await settle(page);
  await page.waitForTimeout(300);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(page);
  // one element is selected, and its box is the small square's, not the canvas-sized filter's
  const sel = await page.evaluate(() => [...document.querySelectorAll('#fpov rect.sel')].map(r => r.getBBox().width));
  expect(sel.length).toBe(1);
  expect(Math.abs(sel[0] - cw * 0.3)).toBeLessThan(cw * 0.05);
  // a click on an empty part of the canvas, inside the filter, selects nothing
  await page.mouse.click(box.x + box.width * 0.08, box.y + box.height * 0.08); await settle(page);
  expect(await page.evaluate(() => document.querySelectorAll('#fpov rect.sel').length)).toBe(0);
  expect(errors).toEqual([]);
});

test('inside a group a filter works only on the group\'s members under it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, background: true });
  await addShape(page, 'rect'); await settle(page);
  await addShape(page, 'rect'); await settle(page);
  const d = await st(page), bg = d.els.find(q => q.bgd), [cw, ch] = await cv(page), [a, b] = d.els.filter(q => q.k === 'motif' && !q.bgd);
  bg.ink = '#f4f4f4';
  Object.assign(a, { x: cw * 0.25, y: ch * 0.3, s: cw * 0.3, wy: 1, r: 0, ink: '#e83a3a' });
  Object.assign(b, { x: cw * 0.75, y: ch * 0.3, s: cw * 0.3, wy: 1, r: 0, ink: '#2a9a3a', g: 'grp1' });
  const f = { ...fullFilter([{ u: 'g1', k: 'grade', on: true, sat: -100 }], cw, ch, a.m), g: 'grp1' };
  d.els = [bg, a, { u: 'grp1', k: 'group', nm: 'Group 1' }, b, f];
  await apply(page, d);
  const p = await shot(page);
  expect(sat(p.px[2])).toBeGreaterThan(100);   // A, outside the group: still red
  expect(sat(p.px[3])).toBeLessThan(20);       // B, in the group under the filter: grey
  expect(errors).toEqual([]);
});

test('Halftone and Misregistration over a picture read its darkness; the paper stays paper', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, background: true });
  await addShape(page, 'rect'); await settle(page);
  const d = await st(page), bg = d.els.find(q => q.bgd), [cw, ch] = await cv(page), sq = d.els.find(q => q.k === 'motif' && !q.bgd);
  bg.ink = '#ffffff';
  Object.assign(sq, { x: cw / 2, y: ch / 2, s: cw * 0.6, wy: 1, r: 0, ink: '#101820' });
  await apply(page, d);
  const plain = await shot(page);
  const d2 = await st(page); d2.els.push(fullFilter([{ u: 'h1', k: 'halftone', on: true, sz: 30, tone: 55, ang: 45, spr: 40 }], cw, ch, sq.m)); await apply(page, d2);
  const ht = await shot(page);
  expect(ht.dark).toBeLessThan(plain.dark * 0.85);   // the square is dots now
  expect(ht.dark).toBeGreaterThan(plain.dark * 0.2);
  expect(ht.px[1]).toEqual(plain.px[1]);             // the paper corner has no dots
  const d3 = await st(page); d3.els.find(q => q.flt).fx = [{ u: 'm1', k: 'misreg', on: true, amt: 40, ang: 0, col: 'cyan' }]; await apply(page, d3);
  const mr = await shot(page);
  expect(mr.px[1]).toEqual(plain.px[1]);             // the paper is not tinted
  expect(mr.dark).toBeGreaterThan(plain.dark * 0.9);
  expect(errors).toEqual([]);
});
