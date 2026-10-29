// 2.39.0: Randomize uses the Noise, Blur, Print and Distort effects and Filter shapes (the Effects switch). 2.76.3: the kinds are not chosen any more; a roll draws from all four.
// They draw from a number stream of their own, so a seeded roll is the same as before apart from what Effects adds.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, rzSet } = require('./helpers/harness');

const QK = ['noise', 'grain', 'dust', 'blur', 'motion', 'halftone', 'lines', 'stipple', 'bleed', 'misreg', 'rough', 'ripple', 'wobble', 'warp', 'slip'];
const GRP = { noise: ['noise', 'grain', 'dust'], blur: ['blur', 'motion'], print: ['halftone', 'lines', 'stipple', 'bleed', 'misreg'], distort: ['rough', 'ripple', 'wobble', 'warp', 'slip'] };
const els = async page => JSON.parse(await getState(page)).els || [];
// the roll-able effects on elements, and the Filter shapes
// a roll's filter: a Filter shape, or (2.53.0) a Sheet over the whole canvas
const isF = q => !!q.flt || (q.k === 'sheet' && !q.bgd && q.fl === 'none');   // 2.76.3: a Look's Ground and Gradient Sheets are not filters
const fxOf = list => list.filter(q => !isF(q)).flatMap(q => (q.fx || []).map(e => e.k)).filter(k => QK.includes(k));
const filters = list => list.filter(isF);
const roll = async page => { await page.click('#rzdo'); await settle(page); await page.waitForTimeout(250); };

test('the Effects switch is on; with it off a roll adds no effect and no Filter, with it on some roll does', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3, pattern: false });
  await openPanel(page, 'rand');
  await expect(page.locator('[data-rz="efx"]')).toBeChecked();
  await rzSet(page, { efx: false });
  for (let i = 0; i < 3; i++) { await roll(page); const L = await els(page); expect(fxOf(L).length + filters(L).length, 'off, roll ' + i).toBe(0); }
  await rzSet(page, { efx: true });
  let added = 0;
  for (let i = 0; i < 8; i++) { await roll(page); const L = await els(page); added += fxOf(L).length + filters(L).length; }
  expect(added).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Effects alone reworks what is there; a Filter shape from the last roll is replaced, not stacked', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 8 });
  await openPanel(page, 'rand');
  await roll(page);   // a piece to work on
  await rzSet(page, { efx: true }, true);
  const before = (await els(page)).filter(q => !isF(q)).map(q => q.u);
  let seen = 0;
  for (let i = 0; i < 6; i++) {
    await roll(page);
    const L = await els(page);
    expect(filters(L).length).toBeLessThanOrEqual(1);
    expect(L.filter(q => !isF(q)).map(q => q.u)).toEqual(before);   // nothing else comes or goes
    if (fxOf(L).length || filters(L).length) seen++;
  }
  expect(seen).toBe(6);   // with only Effects on, every roll changes something
  expect(errors).toEqual([]);
});

test('on a repeat tile a roll adds no effects and no Filter shape (they do not wrap round the edges)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'canvas'); await page.click('#cfmt [data-f="tile"]'); await settle(page);
  await openPanel(page, 'rand');
  for (let i = 0; i < 4; i++) {
    await roll(page);
    const L = await els(page);
    expect(fxOf(L).length + filters(L).length).toBe(0);
  }
  expect(errors).toEqual([]);
});

