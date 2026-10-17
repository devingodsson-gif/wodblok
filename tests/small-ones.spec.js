// 1.0.12: no empty band under the Stamp editor (the shape controls are the Shape editor panel, floating, not a band); the Layers ink default shows a two-colour swatch.
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, TARGET, openApp, openProjectFile, openPanel, setMode, settle, motifPoint } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

test('the Stamp editor has no reserved band under it; the shape controls live in the floating Shape editor panel', async ({ page }) => {
  const { errors } = await openApp(page);
  await openProjectFile(page, path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok.json'));
  await setMode(page, 'stamp');
  const gap = await page.evaluate(() => { const b = document.getElementById('boardS').getBoundingClientRect(), f = document.querySelector('.stage .film').getBoundingClientRect(); return Math.round(f.top - b.bottom); });
  expect(gap, 'the editor reaches the stamp tray').toBeLessThanOrEqual(2);
  await expect(page.locator('#sel')).toBeHidden();                  // no Shape editor panel open until a shape is placed
  const pt = await motifPoint(page);
  expect(pt, 'a motif can be clicked').not.toBeNull();
  await page.mouse.click(pt.x, pt.y);
  await page.click('#rail-sedit');                                   // opens docked at the bottom
  await expect(page.locator('#sel')).toBeVisible();
  expect(await page.evaluate(() => !!document.getElementById('sel').closest('.dk-b'))).toBe(true);
  await expect(page.locator('#sel')).not.toHaveClass(/none/);
  expect(errors).toEqual([]);
});

test('the default ink in Layers shows a swatch split between the project ink and background', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'lyrs');
  const bg = await page.evaluate(() => document.querySelector('#wl_ly .cwsb i').getAttribute('style') || '');
  expect(bg).toMatch(/linear-gradient\(135deg, ?(rgba?\([^)]*\)|#[0-9a-f]+) 50%, ?(rgba?\([^)]*\)|#[0-9a-f]+) 50%\)/);
  expect(errors).toEqual([]);
});
