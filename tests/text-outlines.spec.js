// 1.42.0: letters come from the font file's own outlines (opentype.js), not from a traced picture.
const { test, expect } = require('@playwright/test');
const path = require('path');
const { TARGET, openApp, openPanel, settle, getState, unlockStamp, stampInstance, clickStamp } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

// the letter shapes drawn in the Text panel preview: number of path commands of each
const shapes = page => page.evaluate(() => [...document.querySelectorAll('#tx_pv path[fill-rule]')].map(p => { const d = p.getAttribute('d'); return [(d.match(/[MLQZ]/g) || []).length, d]; }));

test('a bundled font gives exact outlines: a few curves per letter, not hundreds of traced steps', async ({ page }) => {
  const { errors } = await openApp(page);
  await unlockStamp(page); await openPanel(page, 'text');
  await page.fill('#tx_t', 'Og');
  await clickStamp(page, await stampInstance(page));
  await page.waitForTimeout(600);
  const s = await shapes(page);
  expect(s.length).toBeGreaterThanOrEqual(2);
  for (const [n] of s) expect(n).toBeLessThan(60);                 // a traced letter has several hundred segments
  for (const [, d] of s) expect(d).not.toMatch(/[CcAa]/);          // only the move, line and quadratic curves a stored letter may use
  expect(errors).toEqual([]);
});

test('a font file you load gives exact outlines too', async ({ page }) => {
  const { errors } = await openApp(page);
  await unlockStamp(page); await openPanel(page, 'text');
  await page.setInputFiles('#tx_file', path.join(__dirname, '..', 'src', 'fonts', 'text', 'cinzel.woff'));
  await expect(page.locator('#tx_f option[value^="u-"]')).toHaveCount(1, { timeout: 10000 });
  await page.fill('#tx_t', 'Q');
  await page.waitForTimeout(800);
  expect(await page.locator('#tx_f').inputValue()).toMatch(/^u-/);
  const s = await shapes(page);
  expect(s.length).toBe(1);
  expect(s[0][0]).toBeLessThan(60);
  expect(errors).toEqual([]);
});
