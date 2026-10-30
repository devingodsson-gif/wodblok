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

// B6 (2.78.3): Group asked its button, which catches up only on the next redraw
test('right after Select all, Group is there and groups', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 8, background: true });
  await roll(page);
  const r = await page.evaluate(() => { const c = window.__wbTest.commands; c.run('edit.selectAll'); return [c.isEnabled('element.group'), c.run('element.group')]; });
  expect(r[0], 'Group available at once').toBe(true);
  await H.settle(page);
  expect(JSON.parse(await H.getState(page)).els.filter(q => q.k === 'group').length).toBe(1);
  expect(await page.evaluate(() => window.__wbTest.commands.isEnabled('element.ungroup'))).toBe(true);
  expect(errors).toEqual([]);
});

// B4 (2.78.3): an emptied Text field left the old words on the canvas
test('a text whose field is left empty goes; Undo brings it back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await page.click('#elb [data-k="text"]'); await H.settle(page); await H.placeArmed(page, 'text'); await H.showPanel(page, 'text');
  await page.fill('#tx_t', 'Hello'); await page.waitForTimeout(500); await H.settle(page);
  const texts = async () => JSON.parse(await H.getState(page)).els.filter(e => e.tx).map(e => e.tx.text);
  expect(await texts()).toEqual(['Hello']);
  await page.fill('#tx_t', ''); await page.waitForTimeout(500); await H.settle(page);
  expect(await texts(), 'while the field is empty the words stay (typing goes on)').toEqual(['Hello']);
  await page.locator('#tx_t').blur(); await H.settle(page);
  expect(await texts(), 'leaving the field empty removes the text').toEqual([]);
  await page.evaluate(() => window.__wbTest.commands.run('edit.undo')); await H.settle(page);
  expect(await texts()).toEqual(['Hello']);
  expect(errors).toEqual([]);
});
