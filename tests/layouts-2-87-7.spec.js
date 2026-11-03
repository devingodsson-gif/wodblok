// 2.87.7 (docs/pro-basics-plan.md step 7): a layout per mode. A stamp's tab opens with Stamp on the left, Shape in the inner right column and Elements on the far
// right; the Canvas and a stamp's tab keep their own layouts; the Layout panel (top bar) saves a mode's layout as its default and resets to it; saved ones come back
// after a reload, and the Canvas's is what the app opens with.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// the dock edge a panel is in ('l', 'li', 'ri', 'r'), 'float', or null when it is closed
const where = (page, p) => page.evaluate(p => { const s = document.querySelector(`section.pn[data-p="${p}"]`); if (!s || s.hidden || !s.getClientRects().length) return null;
  const d = s.closest('.dock'); if (!d) return 'float'; return ['dk-li', 'dk-ri', 'dk-l', 'dk-r', 'dk-t', 'dk-b'].find(c => d.classList.contains(c)).slice(3); }, p);
const openStampTab = async page => { await H.openPanel(page, 'stmp'); await page.click('#smknew'); await H.settle(page); await expect(page.locator('body')).toHaveClass(/stedit/); };
const toCanvas = async page => { await page.locator('#stetabs [data-sv]').first().click(); await H.settle(page); await expect(page.locator('body')).not.toHaveClass(/stedit/); };
const run = (page, id) => page.evaluate(id => window.__wbTest.commands.run(id), id);

test('a stamp\'s tab opens with Stamp on the left, Shape beside Elements and Elements on the far right; the Canvas keeps its own', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, workspaces: 'launch' });
  await run(page, 'panel.pgrid'); await H.settle(page);
  const grid = await where(page, 'pgrid'); expect(grid).not.toBeNull();
  await H.openPanel(page, 'stmp'); const st0 = await where(page, 'stmp');
  await page.click('#smknew'); await H.settle(page); await expect(page.locator('body')).toHaveClass(/stedit/);
  expect(await where(page, 'stmp')).toBe('l'); expect(await where(page, 'motifs')).toBe('ri'); expect(await where(page, 'lyrs')).toBe('r');
  expect(await where(page, 'pgrid')).toBeNull();
  await toCanvas(page);
  expect(await where(page, 'pgrid')).toBe(grid); expect(await where(page, 'stmp')).toBe(st0); expect(await where(page, 'motifs')).toBeNull();
  expect(errors).toEqual([]);
});

test('the Layout panel saves and resets each mode\'s layout; saved layouts come back after a reload and the Canvas\'s opens the app', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, workspaces: 'launch' });
  await page.locator('#layb').click(); await H.settle(page);
  await expect(page.locator('#layn')).toHaveText('Canvas'); expect(await where(page, 'layout')).toBe('float');
  // the Canvas: Grid on as well, saved
  await run(page, 'panel.pgrid'); await H.settle(page); const grid = await where(page, 'pgrid');
  await page.locator('#lays').click(); await expect(page.locator('#pmsg')).toContainText('Saved the Canvas layout');
  // a stamp's tab: the Layout panel comes along; close the Shape panel and save that
  await openStampTab(page); await expect(page.locator('#layn')).toHaveText('Stamp tab'); expect(await where(page, 'layout')).toBe('float');
  await page.locator('section.pn[data-p="motifs"]').evaluate(s => s.closest('.wg').querySelector('[aria-label^="Close"]').click()); await H.settle(page);
  expect(await where(page, 'motifs')).toBeNull();
  await page.locator('#lays').click();
  // change it, then Reset puts the saved one back
  await run(page, 'panel.hist'); await H.settle(page); expect(await where(page, 'hist')).not.toBeNull();
  await page.locator('#layr').click(); await H.settle(page);
  expect(await where(page, 'hist')).toBeNull(); expect(await where(page, 'motifs')).toBeNull(); expect(await where(page, 'stmp')).toBe('l');
  // a reload: the app opens with the saved Canvas layout, and a stamp's tab with its saved one
  await page.reload(); await page.waitForFunction(() => window.__wbTest); await H.settle(page);
  expect(await where(page, 'pgrid')).toBe(grid); expect(await where(page, 'lyrs')).toBe('r'); expect(await where(page, 'layout')).toBeNull();
  await openStampTab(page);
  expect(await where(page, 'motifs')).toBeNull(); expect(await where(page, 'stmp')).toBe('l'); expect(await where(page, 'pgrid')).toBeNull();
  expect(errors).toEqual([]);
});

// 2.87.12 (owner, Nov 3 2026): Default layout puts the built-in layout back and keeps the saved one for Reset layout
test('Default layout puts the built-in layout back; Reset layout still brings back the saved one', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, workspaces: 'launch' });
  await page.locator('#layb').click(); await H.settle(page);
  await run(page, 'panel.pgrid'); await H.settle(page); const grid = await where(page, 'pgrid');
  await page.locator('#lays').click();
  await page.locator('#layd').click(); await H.settle(page);
  expect(await where(page, 'pgrid')).toBeNull(); expect(await where(page, 'lyrs')).toBe('r'); expect(await where(page, 'layout')).toBe('float');
  await page.locator('#layr').click(); await H.settle(page);
  expect(await where(page, 'pgrid')).toBe(grid);
  // in a stamp's tab: Stamp left, Shape beside Elements again
  await openStampTab(page); await page.locator('section.pn[data-p="motifs"]').evaluate(s => s.closest('.wg').querySelector('[aria-label^="Close"]').click()); await H.settle(page);
  await page.locator('#layd').click(); await H.settle(page);
  expect(await where(page, 'stmp')).toBe('l'); expect(await where(page, 'motifs')).toBe('ri'); expect(await where(page, 'lyrs')).toBe('r');
  expect(errors).toEqual([]);
});
