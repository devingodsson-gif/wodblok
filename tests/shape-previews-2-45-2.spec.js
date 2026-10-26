// 2.45.2: the previews in the shape library are squares (they were 65 x 24 px: a fixed button height beat the square shape of the tile).
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

test('the shape library shows square previews', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.addShape(page); await H.settle(page);
  await H.openPanel(page, 'motifs'); await H.settle(page);
  const sizes = await page.evaluate(() => [...document.querySelectorAll('section.pn[data-p="motifs"] .lib button')].filter(b => b.offsetParent).slice(0, 12).map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  expect(sizes.length).toBeGreaterThan(3);
  for (const [w, h] of sizes) { expect(w).toBeGreaterThan(30); expect(Math.abs(w - h)).toBeLessThanOrEqual(1); }
  expect(errors).toEqual([]);
});
