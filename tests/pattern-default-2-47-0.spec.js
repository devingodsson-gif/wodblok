// 2.47.0: a new Pattern lays its stamps edge to edge (size 100% of a cell): the stamp's side equals the distance between two points.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, noPattern, addKind } = require('./helpers/harness');

test('a new pattern is 100% of its cell, so neighbouring stamps touch', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="pattern"]'); await addKind(page, 'pattern'); await settle(page);
  const p = JSON.parse(await getState(page)).els.find(q => q.k === 'pattern');
  expect(p.sz).toBe(100);
  expect(errors).toEqual([]);
});
