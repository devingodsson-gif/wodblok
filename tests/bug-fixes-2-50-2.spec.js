// 2.50.2 (whole-app bug test, Oct 26 2026): a roll's elements never take the name of one of yours.
const { test, expect } = require('@playwright/test');
const { openApp, settle, openPanel, getState } = require('./helpers/harness');

test('after a roll that keeps your Pattern 1, no two elements share a name', async ({ page }) => {
  test.setTimeout(180000);
  const { errors } = await openApp(page, { seed: 5 });   // starts with your own Pattern 1
  await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 60000 });
  const names = JSON.parse(await getState(page)).els.map(e => e.n).filter(Boolean);
  expect(names).toContain('Pattern 1');
  expect(names.length, JSON.stringify(names)).toBe(new Set(names).size);
  expect(errors).toEqual([]);
});
