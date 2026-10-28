// 2.39.0: Randomize uses the Noise, Blur, Print and Distort effects and Filter shapes (the Effects switch and its kinds).
// They draw from a number stream of their own, so a seeded roll is the same as before apart from what Effects adds.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const QK = ['noise', 'grain', 'dust', 'blur', 'motion', 'halftone', 'lines', 'stipple', 'bleed', 'misreg', 'rough', 'ripple', 'wobble', 'warp', 'slip'];
const GRP = { noise: ['noise', 'grain', 'dust'], blur: ['blur', 'motion'], print: ['halftone', 'lines', 'stipple', 'bleed', 'misreg'], distort: ['rough', 'ripple', 'wobble', 'warp', 'slip'] };
const els = async page => JSON.parse(await getState(page)).els || [];
// the roll-able effects on elements, and the Filter shapes
// a roll's filter: a Filter shape, or (2.53.0) a Sheet over the whole canvas
const isF = q => !!q.flt || (q.k === 'sheet' && !q.bgd);
const fxOf = list => list.filter(q => !isF(q)).flatMap(q => (q.fx || []).map(e => e.k)).filter(k => QK.includes(k));
const filters = list => list.filter(isF);
async function only(page, fts, subs) {
  await page.evaluate(([fts, subs]) => {
    document.querySelectorAll('[data-ft]').forEach(c => { if (c.type === 'range') c.value = fts.includes(c.dataset.ft) ? 100 : 0; else c.checked = fts.includes(c.dataset.ft); c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); });
    if (subs) document.querySelectorAll('[data-sub^="efx."]').forEach(c => { c.checked = subs.includes(c.dataset.sub.split('.')[1]); c.dispatchEvent(new Event('change', { bubbles: true })); });
  }, [fts, subs]);
}
const roll = async page => { await page.click('#rzdo'); await settle(page); await page.waitForTimeout(250); };

test('the Effects switch: on at 100 with every kind ticked', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  await openPanel(page, 'rand');
  await expect(page.locator('[data-ft="efx"]')).toHaveValue('100');
  for (const k of ['noise', 'blur', 'print', 'distort', 'filter']) await expect(page.locator(`[data-sub="efx.${k}"]`)).toBeChecked();
  await page.click('[data-rzx="efx"]');
  await expect(page.locator('[data-rzs="efx"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a seeded roll is the same with Effects on, apart from the effects and Filter shapes it adds', async ({ browser }) => {
  const state = async efx => {
    const page = await browser.newPage();
    const { errors } = await openApp(page, { seed: 5 });
    await openPanel(page, 'rand');
    await page.evaluate(v => { const c = document.querySelector('[data-ft="efx"]'); c.value = v; c.dispatchEvent(new Event('input', { bubbles: true })); }, efx);
    await roll(page);
    const d = JSON.parse(await getState(page));
    expect(errors).toEqual([]);
    await page.close();
    return d;
  };
  const a = await state(100), b = await state(0);
  expect(fxOf(b.els).length + filters(b.els).length).toBe(0);
  const added = fxOf(a.els).length + filters(a.els).length;
  expect(added).toBeGreaterThan(0);
  a.els = a.els.filter(q => !q.flt).map(q => { if (!q.fx) return q; const fx = q.fx.filter(e => !QK.includes(e.k)); const r = { ...q, fx }; if (!fx.length) delete r.fx; return r; });
  expect(JSON.stringify(a.els)).toBe(JSON.stringify(b.els));
});

test('Effects alone reworks what is there; a Filter shape from the last roll is replaced, not stacked', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 8 });
  await openPanel(page, 'rand');
  await roll(page);   // a piece to work on
  await only(page, ['efx']);
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

test('only the ticked kinds are used; Filter shapes alone carry a colour grade', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 2 });
  await openPanel(page, 'rand');
  await roll(page);
  await only(page, ['efx'], ['blur']);
  for (let i = 0; i < 4; i++) {
    await roll(page);
    const L = await els(page);
    for (const k of fxOf(L)) expect(GRP.blur).toContain(k);
    expect(filters(L).length).toBe(0);
  }
  await only(page, ['efx'], ['filter']);
  for (let i = 0; i < 3; i++) {
    await roll(page);
    const L = await els(page), f = filters(L);
    expect(fxOf(L)).toEqual([]);
    expect(f.length).toBe(1);
    expect(f[0].fx.map(e => e.k)).toEqual(['grade']);
  }
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

