// 2.86.0 (owner, Nov 2 2026): a Look called Random. 2.87.0: a printed repeat of stamp blocks, like the website's gallery, in the tray's colours only.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');
const st = async page => JSON.parse(await getState(page));
const roll = async page => { await page.click('#rzdo'); await page.waitForTimeout(300); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };

test('Random is in the Look list; its rolls are each different, made of patterns, in the tray colours only', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 7, background: true });
  await openPanel(page, 'rand');
  expect(await page.evaluate(() => [...document.querySelectorAll('#rzlook option')].map(o => o.value))).toContain('random');
  await page.evaluate(() => window.__wbTest.kv.set('wb167_rzlook', 'random'));
  const seen = new Set(), sigs = [];
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => { document.getElementById('pmsg').textContent = ''; });
    await roll(page);
    await expect(page.locator('#pmsg'), 'roll ' + i).toHaveText(/Randomized: Random/, { timeout: 30000 }); await settle(page);
    const d = await st(page), real = d.els.filter(q => !q.bgd);
    expect(real.length, 'roll ' + i + ' is not empty').toBeGreaterThanOrEqual(1);
    expect(real.filter(q => q.k === 'pattern').length, 'roll ' + i + ' is made of patterns').toBeGreaterThanOrEqual(1);
    // every colour it set is a tray link (no fixed or mixed colour), on the elements and in the stamps
    const fixed = [];
    const walk = (o, p) => { if (o == null) return; if (typeof o === 'string') { if (/^#[0-9a-f]{3,8}$/i.test(o)) fixed.push(p + '=' + o); return; } if (typeof o === 'object') for (const k in o) { if (['G', 'Lt', 'svg'].includes(k)) continue; walk(o[k], p + '.' + k); } };
    walk(d.els, 'els'); walk(d.tiles, 'tiles');
    expect(fixed, 'roll ' + i + ': only tray colours').toEqual([]);
    real.forEach(q => seen.add(q.k));
    sigs.push(JSON.stringify(real.map(q => [q.k, q.ts, q.ar, q.ps, q.sp])) + JSON.stringify(d.tiles.map(t => t.items.map(x => x.m))));
  }
  expect(new Set(sigs).size, 'no two rolls alike').toBe(6);
  expect(errors).toEqual([]);
});
