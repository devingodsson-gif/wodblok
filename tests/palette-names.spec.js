// Every one of Wada's 348 combinations has its own name (src/data/wada-names.js), shown in the saved trays (Colours tool) with the book number.
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

test('the saved trays list the names with the book numbers and loading one fills the tray', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  await page.click('.stf[data-f="wada2"]');
  const rows = page.locator('#stl .str');
  await expect(rows.first().locator('small')).toHaveText(/^No\. \d+$/);
  const counts = await page.locator('.stf').count();
  expect(counts).toBe(0);                                                     // inside a folder: just its trays
  await page.click('#stnav [data-up]');
  const total = await page.$$eval('.stf[data-f^="wada"] small', s => s.reduce((a, x) => a + +x.textContent, 0));
  expect(total).toBe(348);
  await page.fill('#stq', names[2]);
  await page.locator('#stl .str', { hasText: names[2] }).first().click();
  const proj = await page.evaluate(() => JSON.parse(window.__wbTest.state()).proj), w = proj.cw[proj.cwa];
  expect([w.m[proj.ts[0]], w.m[proj.ts[1]]]).toEqual(['Pale Lemon Yellow', 'Raw Sienna']);   // combination No. 3, paper first
  expect(errors).toEqual([]);
});
