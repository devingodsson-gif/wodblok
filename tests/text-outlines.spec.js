// 1.42.0: letters come from the font file's own outlines (opentype.js), not from a traced picture.
const { test, expect } = require('@playwright/test');
const path = require('path');
const { TARGET, openApp, openPanel, setMode, settle, getState, putText } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

// every stored letter shape: [key, number of path commands]
const shapes = async page => {
  const st = JSON.parse(await getState(page));
  const found = [];
  const walk = (o, k) => { if (!o || typeof o !== 'object') return; if (typeof o.svg === 'string' && /^t\|/.test(k || '')) found.push([k, (o.svg.match(/[MLQZ]/g) || []).length, o.svg]); for (const [kk, v] of Object.entries(o)) walk(v, kk); };
  walk(st, '');
  return found;
};

test('a bundled font gives exact outlines: a few curves per letter, not hundreds of traced steps', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp'); await openPanel(page, 'text');
  await page.fill('#tx_t', 'Og');
  await putText(page);
  const s = await shapes(page);
  expect(s.length).toBeGreaterThanOrEqual(2);
  for (const [k, n] of s) expect(n, k).toBeLessThan(60);          // a traced letter has several hundred segments
  for (const [, , svg] of s) expect(svg).not.toMatch(/[CcAa]\s*-?\d/);   // only the move, line and quadratic curves a stored letter may use
  expect(errors).toEqual([]);
});

test('a font file you load gives exact outlines too', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp'); await openPanel(page, 'text');
  await page.setInputFiles('#tx_file', path.join(__dirname, '..', 'src', 'fonts', 'text', 'cinzel.woff'));
  await expect(page.locator('#tx_f option[value^="u-"]')).toHaveCount(1, { timeout: 10000 });
  await page.fill('#tx_t', 'Q');
  await putText(page);
  await settle(page);
  const s = await shapes(page);
  expect(s.length).toBe(1);
  expect(s[0][0]).toContain('t|u-');
  expect(s[0][1]).toBeLessThan(60);
  expect(errors).toEqual([]);
});
