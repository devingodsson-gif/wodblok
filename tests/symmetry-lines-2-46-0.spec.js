// 2.46.0: the stamp tab canvas draws the dividing lines of the chosen symmetry, and the new symmetry types work.
const { test, expect } = require('@playwright/test');
const { openApp, showPanel, settle, getState } = require('./helpers/harness');
const state = async page => JSON.parse(await getState(page));
const unlock = async page => { await showPanel(page, 'stmp'); await page.locator('#stmpl .smklk').first().click(); await settle(page); };

test('the stamp canvas shows the dividing lines of every symmetry mode, and none for Off', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page);
  await showPanel(page, 'stmp');
  const modes = await page.$$eval('#sym [data-y]', b => b.map(x => x.dataset.y));
  for (const m of ['off', 'lr', 'diag', 'diag2', 'dd', 'glide', 'brick', 'drop']) expect(modes, m).toContain(m);
  for (const m of modes) {
    await page.click(`#sym [data-y="${m}"]`); await settle(page);
    expect((await state(page)).tiles[0].sym.m).toBe(m);
    const n = await page.locator('#stoh g[transform] line, #stoh g[transform] path, #stoh g[transform] rect, #stoh g[transform] polygon').count();
    if (m === 'off') expect(n, m).toBe(0); else expect(n, m).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
});
