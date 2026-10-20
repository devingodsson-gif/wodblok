// 2.1.11: Randomize builds elements: Patterns (also on the Frame layout), a Sheet with a Texture effect, Paint strokes, and effects on them.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, sheetOf } = require('./helpers/harness');

async function only(page, ft) {
  await page.evaluate(ft => {
    document.querySelectorAll('[data-ft]').forEach(c => { if (c.type === 'range') c.value = 0; else c.checked = false; c.dispatchEvent(new Event('input', { bubbles: true })); });
    const m = document.querySelector(`[data-ft="${ft}"]`); m.value = 100; m.dispatchEvent(new Event('input', { bubbles: true }));
  }, ft);
}
const doc = async page => JSON.parse(await getState(page));
const els = d => d.els;

test('a full roll makes element layers: patterns with effects, a frame pattern and a Sheet', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 21 });
  await openPanel(page, 'rand');
  let d;
  for (let i = 0; i < 6; i++) { await page.click('#rzdo'); await settle(page, { max: 90000 }); d = await doc(page); if (els(d).some(p => p.lay === 'frame')) break; }
  expect(els(d).filter(p => p.k === 'pattern' && p.lay !== 'frame').length).toBeGreaterThan(0);
  expect(els(d).some(p => p.lay === 'frame')).toBe(true);
  expect(sheetOf(d)).toBeTruthy();
  expect(d.tex.u).toEqual([]);
  expect(els(d).some(p => (p.fx || []).length)).toBe(true);
  expect(errors).toEqual([]);
});

test('Sheet texture on its own roll puts the Texture effect on the Sheet', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 23 });
  await openPanel(page, 'rand');
  await only(page, 'tx');
  let fx = [];
  for (let i = 0; i < 8 && !fx.length; i++) { await page.click('#rzdo'); await settle(page, { max: 90000 }); const d = await doc(page); fx = ((sheetOf(d) || {}).fx || []).filter(e => e.k === 'texture'); expect(d.tex.u).toEqual([]); }
  expect(fx.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('after rolls nothing points at a missing definition (effects wrap stamps that carry block edges)', async ({ page }) => {
  const { danglingRefs } = require('./helpers/speed');
  const { errors } = await openApp(page, { seed: 21 });
  await openPanel(page, 'rand');
  for (let i = 0; i < 4; i++) { await page.click('#rzdo'); await settle(page, { quiet: 10, max: 60000 }); expect(await danglingRefs(page)).toEqual({}); }
  expect(errors).toEqual([]);
});
