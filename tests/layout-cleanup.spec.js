// 1.27.0 Layout clean-up: Ink edges in the Canvas tool. (The Impression and Variation test went in 2.1.12 with the old Arrangement groups.)
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

test('Ink edges live in the Canvas tool, not in Layout', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await openPanel(page, 'canvas');
  await expect(page.locator('section.pn[data-p="canvas"] #rgh')).toHaveCount(1);
  await expect(page.locator('section.pn[data-p="canvas"] #psq')).toHaveCount(1);
  await expect(page.locator('section.pn[data-p="layers"] #rgh')).toHaveCount(0);
  expect(errors).toEqual([]);
});
