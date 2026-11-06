// 2.117.0 (owner Nov 6 2026: "Switch icon on far right side of color tray bar to shuffle the colors positions in the tray by one, so if there are three colors color a
// switches to b, b to c and c to a"; "all colors should shift", "The entire tray should shift"): the last button of the tray dock moves every colour of the colourway
// showing, with its name, one place along the tray; the last comes round to the first. Paper and ink follow their places; a fixed (locked) colour keeps its own.
// Shift + click goes the other way. One History step; Undo puts the colours back. It is also Colour > Shift tray colours.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));
const cols = s => { const w = s.proj.cw[s.proj.cwa | 0]; return s.proj.ts.map(id => w.c[id]); };
const hist = page => page.evaluate(() => window.__wbTest.histLabels());

async function three(page) {
  const r = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), o = s.proj, w = o.cw[o.cwa | 0];
    o.ts = ['k1', 'k2', 'k3']; w.c = { k1: '#f1e4c0', k2: '#1f3b5c', k3: '#c0392b' }; w.m = { k1: 'Cream', k3: 'Red' };
    window.__wbTest.apply(JSON.stringify(s)); window.__wbTest.resetHistory(); });
  await H.settle(page);
  return r;
}

test('the shift button is the last in the tray; a click moves every colour one place along, the last to the first, names too; one History step', async ({ page }) => {
  const { errors } = await three(page);
  const btn = page.locator('#tyc #tysh');
  await expect(btn).toBeVisible();
  expect(await page.locator('#tyc > button').last().getAttribute('id'), 'at the far right').toBe('tysh');
  const s0 = await st(page), paper0 = s0.proj.bg, h0 = (await hist(page)).length;
  await btn.click(); await H.settle(page);
  let s = await st(page), w = s.proj.cw[s.proj.cwa | 0];
  expect(cols(s)).toEqual(['#c0392b', '#f1e4c0', '#1f3b5c']);
  expect(w.m).toEqual({ k1: 'Red', k2: 'Cream' });
  expect(s.proj.bg, 'paper still links to its place, which now has the next colour').toBe(paper0);
  await expect(page.locator('#tyc .tys').first()).toHaveAttribute('style', /#c0392b/);
  const h1 = await hist(page);
  expect(h1.length).toBe(h0 + 1); expect(h1[h1.length - 1]).toContain('Shifted tray colours');
  // Shift + click: back again
  await btn.click({ modifiers: ['Shift'] }); await H.settle(page);
  expect(cols(await st(page))).toEqual(['#f1e4c0', '#1f3b5c', '#c0392b']);
  // three clicks come round to the start; Undo takes one back
  for (let i = 0; i < 3; i++) { await btn.click(); await H.settle(page); }
  expect(cols(await st(page))).toEqual(['#f1e4c0', '#1f3b5c', '#c0392b']);
  await page.evaluate(() => window.__wbTest.commands.run('edit.undo')); await H.settle(page);
  expect(cols(await st(page))).toEqual(['#1f3b5c', '#c0392b', '#f1e4c0']);
  expect(errors).toEqual([]);
});

test('a fixed colour keeps its own; the other colourways are left; Colour > Shift tray colours does the same; no button with one colour', async ({ page }) => {
  const { errors } = await three(page);
  // the paper fixed (locked) to its colour, and a second colourway
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), o = s.proj, w = o.cw[o.cwa | 0];
    o.bg = '#f1e4c0|k1'; o.cw.push({ ...w, id: 'w9', n: 'Other', c: { ...w.c }, m: { ...w.m } }); window.__wbTest.apply(JSON.stringify(s)); });
  await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('tray.shift')); await H.settle(page);
  const s = await st(page);
  expect(cols(s)).toEqual(['#c0392b', '#f1e4c0', '#1f3b5c']);
  expect(s.proj.bg, 'the fixed paper is unchanged').toBe('#f1e4c0|k1');
  const other = s.proj.cw.find(w => w.n === 'Other');
  expect(other.c).toEqual({ k1: '#f1e4c0', k2: '#1f3b5c', k3: '#c0392b' });
  // one colour: nothing to shift
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), o = s.proj; o.ts = ['k1']; o.cw = [o.cw[0]]; o.cwa = 0; o.bg = '@k1'; o.ink = '@k1'; window.__wbTest.apply(JSON.stringify(s)); });
  await H.settle(page);
  await expect(page.locator('#tyc #tysh')).toHaveCount(0);
  expect(errors).toEqual([]);
});
