// Every one of Wada's 348 combinations has its own name (src/data/wada-names.js), shown in the Palette menu with the book number.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, openPanel } = require('./helpers/harness');

const names = new Function(fs.readFileSync(path.join(ROOT, 'src', 'data', 'wada-names.js'), 'utf8').replace(/export \{[^}]*\};/, '') + ';return WADA_NAMES;')();

test('348 different names, written in plain Latin letters', () => {
  expect(names.length).toBe(348);
  expect(new Set(names).size).toBe(348);
  for (const n of names) expect(n, n).toMatch(/^[A-Z][A-Za-z']*( [A-Z][A-Za-z']*)+$/);
});

test('the Palette menu lists the names with the book numbers and picking one still fills the colours', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  const opts = await page.locator('#pal option').allTextContents();
  expect(opts.slice(0, 4)).toEqual(['Custom mix', names[0], names[1], names[2]]);
  expect(opts.length).toBe(349);
  await page.locator('#pal').evaluate(s => { s.value = '2'; s.dispatchEvent(new Event('input')); });
  const proj = await page.evaluate(() => JSON.parse(window.__wbTest.state()).proj);
  expect(proj).toMatchObject({ bg: 'Pale Lemon Yellow', ink: 'Raw Sienna' });         // combination No. 3
  expect(errors).toEqual([]);
});
