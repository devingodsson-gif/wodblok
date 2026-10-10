// 1.0.12: no empty band under the Stamp editor (the motif bar floats while a motif is selected); the Layers ink default shows a two-colour swatch.
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, TARGET, openApp, openProjectFile, openPanel, setMode, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

test('the Stamp editor has no reserved band under it; the motif bar floats over it only while a motif is selected', async ({ page }) => {
  const { errors } = await openApp(page);
  await openProjectFile(page, path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok.json'));
  await setMode(page, 'stamp');
  const gap = await page.evaluate(() => { const b = document.getElementById('boardS').getBoundingClientRect(), f = document.querySelector('.stage .film').getBoundingClientRect(); return Math.round(f.top - b.bottom); });
  expect(gap, 'the editor reaches the stamp tray').toBeLessThanOrEqual(2);
  await expect(page.locator('#sel')).toBeHidden();
  const pt = await page.evaluate(() => { const h = document.getElementById('boardS').getBoundingClientRect(); for (const n of document.querySelectorAll('#ed [data-i]')) { const r = n.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2; if (x > h.x + 20 && x < h.right - 20 && y > h.y + 20 && y < h.bottom - 120) return { x, y }; } return null; });
  await page.mouse.click(pt.x, pt.y);
  await expect(page.locator('#sel')).toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('sel')).position)).toBe('absolute');
  expect(errors).toEqual([]);
});

test('the default ink in Layers shows a swatch split between the project ink and background', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'lyrs');
  const bg = await page.evaluate(() => { const c = [...document.querySelectorAll('#ly_ink ~ .ddb .chip, .dd .ddb .chip')].map(e => e.getAttribute('style') || ''); return c.find(s => /linear-gradient/.test(s)) || ''; });
  expect(bg).toMatch(/linear-gradient\(135deg, ?[^,]+ 50%, ?[^)]+ 50%\)/);
  expect(errors).toEqual([]);
});
