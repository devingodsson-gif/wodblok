// 2.84.2 (T2): an Effects group with no effects always shows Add effect, even when its fold was saved closed or the last effect was removed while it was folded.
const { test, expect } = require('@playwright/test');
const { openApp, settle, noPattern, addShape } = require('./helpers/harness');

test('Add effect is reachable on an empty Effects group, whatever state the fold was left in', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await addShape(page); await settle(page);
  const g = page.locator('.fxg[data-fxk="motif"]');
  await g.locator('.fxadd').scrollIntoViewIfNeeded();
  await expect(g.locator('.fxadd')).toBeVisible();
  // an effect on, then the group folded, then the effect removed while folded
  await g.locator('.fxadd').click();
  await page.locator('.rowm .ddi', { hasText: 'Print' }).first().hover();
  await page.locator('.rowsub .ddi', { hasText: 'Threshold' }).click(); await settle(page);
  await g.locator('> summary').click(); await settle(page);
  expect(await g.evaluate(n => n.open)).toBe(false);
  await page.evaluate(() => { const q = JSON.parse(__wbTest.state()); q.els.find(e => e.k === 'motif' && !e.bgd).fx = []; return __wbTest.apply(JSON.stringify(q)); }); await settle(page);
  expect(await g.evaluate(n => n.open), 'an empty group is open').toBe(true);
  await expect(g.locator('.fxadd')).toBeVisible();
  // and a fold saved closed while empty cannot hide it either
  await g.evaluate(n => { n.open = false; });
  await page.evaluate(() => __wbTest.apply(__wbTest.state())); await settle(page);   // the next sync, as after a selection or a restore
  await expect(g.locator('.fxadd')).toBeVisible();
  expect(errors).toEqual([]);
});
