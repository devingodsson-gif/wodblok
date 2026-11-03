// 2.89.0 (owner Nov 3 2026): one icon beside the Pattern panel's Tile shape picks a random tile shape and one of its arrangements together; never the pair
// showing; one History step; only with the Tiling layout.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const pat = async page => JSON.parse(await H.getState(page)).els.find(q => q.k === 'pattern');
const labels = page => page.evaluate(() => window.__wbTest.histLabels());

test('the dice beside Tile shape picks a new tile shape and arrangement, one History step each, and Undo puts it back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addPattern(page); await H.showPanel(page, 'layers'); await H.settle(page);
  await expect(page.locator('#petrn')).toBeVisible();
  const opts = await page.evaluate(() => [...document.getElementById('pets').options].map(o => o.value));
  const seen = new Set(), p0 = await pat(page);
  let prev = (p0.ts || 'auto') + '|' + (p0.ar || '');
  for (let i = 0; i < 5; i++) {
    const h0 = (await labels(page)).length;
    await page.locator('#petrn').click(); await H.settle(page); await page.waitForTimeout(500);
    const p = await pat(page), now = p.ts + '|' + p.ar;
    expect(now).not.toBe(prev); expect(opts).toContain(p.ts); expect(p.ts).not.toBe('auto');
    await expect(page.locator('#pets')).toHaveValue(p.ts); await expect(page.locator('#pear')).toHaveValue(p.ar);
    const L = await labels(page); expect(L.length).toBe(h0 + 1); expect(L[L.length - 1]).toBe('Random tiling');
    seen.add(now); prev = now;
  }
  expect(seen.size).toBeGreaterThan(2);
  await page.mouse.click(5, 300); await page.keyboard.press('Control+z'); await H.settle(page);
  const back = await pat(page); expect(back.ts + '|' + back.ar).not.toBe(prev);
  // another layout: the Tiling controls, the dice with them, are hidden
  await page.locator('#pelay [data-l="radial"]').click(); await H.settle(page);
  await expect(page.locator('#petrn')).toBeHidden();
  expect(errors).toEqual([]);
});
