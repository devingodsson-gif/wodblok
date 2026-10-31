// 2.79.3 (owner Oct 31 2026, docs/small-updates-plan.md step 3): panels side by side; the Stamp panel beside the left panel in a stamp's tab.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const dockOf = (page, p) => page.evaluate(p => { const t = document.querySelector(`.dk .wtab[data-t="${p}"]`); return t ? t.closest('.dk').dataset.e : null; }, p);
const rect = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (!e || e.hidden) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width }; }, sel);

test('a tab dropped on the inner edge of the left dock stands beside it as a second column, and comes back there', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false, workspaces: true });
  expect(await dockOf(page, 'colors')).toBe('l');
  const L = await rect(page, '.dk-l');
  const tab = await page.locator('.dk-l .wtab[data-t="colors"]').boundingBox();
  await page.mouse.move(tab.x + tab.width / 2, tab.y + tab.height / 2); await page.mouse.down();
  await page.mouse.move(L.r + 30, 300, { steps: 6 }); await page.mouse.move(L.r + 10, 320, { steps: 4 });
  await expect(page.locator('.wzn[data-e="li"].hot')).toHaveCount(1);
  await page.mouse.up(); await H.settle(page); await page.waitForTimeout(300);   // a click right after a drop is taken for the drop's own
  expect(await dockOf(page, 'colors'), 'in the inner column').toBe('li');
  expect(await dockOf(page, 'canvas')).toBe('l');
  const L2 = await rect(page, '.dk-l'), I = await rect(page, '.dk-li');
  expect(Math.abs(I.l - L2.r), 'right beside the left dock').toBeLessThan(2);
  const art = await rect(page, '#boardP');
  expect(art.l, 'the canvas starts after both').toBeGreaterThanOrEqual(I.r - 1);
  // closed and opened again, it comes back to the column
  await page.locator('.dk-li .wg [data-act="close"]').click(); await H.settle(page);
  await expect(page.locator('.dk-li')).toBeHidden();
  await H.openPanel(page, 'colors'); await H.settle(page);
  expect(await dockOf(page, 'colors'), 'remembered').toBe('li');
  // the left dock emptied: the column becomes the left dock
  await page.locator('.dk-l .wg [data-act="close"]').first().click(); await H.settle(page);
  expect(await dockOf(page, 'colors')).toBe('l');
  await expect(page.locator('.dk-li')).toBeHidden();
  expect(errors).toEqual([]);
});

test('opening a stamp\'s tab brings the Stamp panel out beside the left panel; back on the Canvas it goes back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false, workspaces: true });
  await H.addStamp(page); await H.settle(page);
  const before = await dockOf(page, 'stmp');
  await H.unlockStamp(page, 0); await H.settle(page);
  expect(await dockOf(page, 'stmp'), 'beside the left panel').toBe('li');
  await expect(page.locator('section.pn[data-p="stmp"]')).toBeVisible();
  const L = await rect(page, '.dk-l'), I = await rect(page, '.dk-li');
  expect(Math.abs(I.l - L.r)).toBeLessThan(2);
  // another stamp's tab keeps it there
  await page.locator('#stetabs [data-sv="c"]').click(); await H.settle(page);
  expect(await dockOf(page, 'stmp'), 'back where it was').toBe(before);
  await expect(page.locator('.dk-li')).toBeHidden();
  expect(errors).toEqual([]);
});
