// The whole-application bug test of Oct 30 2026 (docs/bug-test-2.78.md) and its fix plan (2.78.2 to 2.79.0).
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const look = (page, k) => page.evaluate(k => window.__wbTest.kv.set('wb167_rzlook', k), k);
const roll = async page => { if (!(await page.locator('section.pn[data-p="rand"]:not([hidden])').count())) await H.openPanel(page, 'rand'); await page.click('#rzdo'); await page.waitForTimeout(250); await H.settle(page, { max: 60000 }); };

// B1: selecting a pattern rounded its Size and Spacing to the sliders' steps and wrote them back, two History steps for a click
test('selecting any element changes neither the document nor History', async ({ page }) => {
  test.setTimeout(400000);
  const { errors } = await H.openApp(page, { seed: 9, background: true });
  for (const k of ['modern', 'repeat', 'textile', 'tilework', 'letters', 'poster', 'badge', 'halftone']) {
    await look(page, k); await roll(page);
    const a = await H.getState(page), h = await page.evaluate(() => window.__wbTest.histLabels().join('|'));
    await H.openPanel(page, 'lyrs');
    for (const q of JSON.parse(a).els) {
      const r = page.locator(`#lybody .lyr[data-u="${q.u}"]`).first(); if (!(await r.count())) continue;
      await r.click({ position: { x: 60, y: 10 } }); await H.settle(page); await page.waitForTimeout(300);
      expect(diff(JSON.parse(a), JSON.parse(await H.getState(page))), `${k}: selecting ${q.k} ${q.n || q.nm || ''} changed the document`).toEqual([]);
      expect(await page.evaluate(() => window.__wbTest.histLabels().join('|')), `${k}: selecting ${q.k} ${q.n || q.nm || ''} added a History step`).toBe(h);
    }
  }
  expect(errors).toEqual([]);
});

function diff(x, y, p = '', out = []) {
  if (out.length > 10) return out;
  if (typeof x !== typeof y) { out.push(p); return out; }
  if (x && typeof x === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y || {})])) diff(x[k], (y || {})[k], p + '.' + k, out); return out; }
  if (x !== y) out.push(p + ': ' + JSON.stringify(x) + ' → ' + JSON.stringify(y));
  return out;
}
