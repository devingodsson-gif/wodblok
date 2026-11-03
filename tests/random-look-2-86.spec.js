// 2.86.0 (owner, Nov 2 2026): a Look called Random: no plan, every part drawn at random ("much like the old school randomize ... just go wild").
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');
const st = async page => JSON.parse(await getState(page));
const roll = async page => { await page.click('#rzdo'); await page.waitForTimeout(300); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };

test('Random is in the Look list; its rolls are each different, mixed and never empty', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 7, background: true });
  await openPanel(page, 'rand');
  expect(await page.evaluate(() => [...document.querySelectorAll('#rzlook option')].map(o => o.value))).toContain('random');
  await page.evaluate(() => window.__wbTest.kv.set('wb167_rzlook', 'random'));
  const seen = new Set(), sigs = [];
  for (let i = 0; i < 6; i++) {
    await roll(page);
    expect(await page.textContent('#pmsg')).toMatch(/Randomized: Random/);
    const d = await st(page), real = d.els.filter(q => !q.bgd);
    expect(real.length, 'roll ' + i + ' is not empty').toBeGreaterThanOrEqual(2);
    real.forEach(q => seen.add(q.k));
    sigs.push(real.map(q => q.k + ':' + (q.nm || '')).join(','));
  }
  expect(new Set(sigs).size, 'no two rolls alike').toBe(6);
  expect(seen.size, 'kinds used across the rolls: ' + [...seen]).toBeGreaterThanOrEqual(2);
  expect(errors).toEqual([]);
});
