// 2.1.11: Randomize builds elements: Patterns (also on the Frame layout), Paint strokes, and effects on them.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

async function only(page, ft) {
  await page.evaluate(ft => {
    document.querySelectorAll('[data-ft]').forEach(c => { if (c.type === 'range') c.value = 0; else c.checked = false; c.dispatchEvent(new Event('input', { bubbles: true })); });
    const m = document.querySelector(`[data-ft="${ft}"]`); m.value = 100; m.dispatchEvent(new Event('input', { bubbles: true }));
  }, ft);
}
const doc = async page => JSON.parse(await getState(page));
const els = d => d.els;

test('a full roll makes element layers: patterns with effects, and a frame pattern', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 21 });
  await openPanel(page, 'rand');
  let d;
  for (let i = 0; i < 6; i++) { await page.click('#rzdo'); await settle(page, { max: 90000 }); d = await doc(page); if (els(d).some(p => p.lay === 'frame')) break; }
  expect(els(d).filter(p => p.k === 'pattern' && p.lay !== 'frame').length).toBeGreaterThan(0);
  expect(els(d).some(p => p.lay === 'frame')).toBe(true);
  expect(d.tex.u).toEqual([]);
  expect(els(d).some(p => (p.fx || []).length)).toBe(true);
  expect(errors).toEqual([]);
});

test('after rolls nothing points at a missing definition (effects wrap stamps that carry block edges)', async ({ page }) => {
  const { danglingRefs } = require('./helpers/speed');
  const { errors } = await openApp(page, { seed: 21 });
  await openPanel(page, 'rand');
  for (let i = 0; i < 4; i++) { await page.click('#rzdo'); await settle(page, { quiet: 10, max: 60000 }); expect(await danglingRefs(page)).toEqual({}); }
  expect(errors).toEqual([]);
});
