// 1.27.0 Layout clean-up: a Layer type dropdown, Impression and Variation only where they take effect, Ink edges in the Canvas tool.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

const pick = (page, v) => page.locator('#lmsel').evaluate((e, x) => { e.value = x; e.dispatchEvent(new Event('change', { bubbles: true })); }, v);

test('Impression and Variation show only for layer types where they do something', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await openPanel(page, 'layers');
  const want = { p: [true, true], f: [true, true], x: [true, true], a: [false, false], t: [false, false] };
  for (const m of ['p', 'f', 'x', 'a', 't']) {
    await pick(page, m);
    await settle(page);
    await expect(page.locator('#lmsel')).toHaveValue(m);
    expect([await page.locator('#lipsec').isVisible(), await page.locator('#lrsec').isVisible()], m).toEqual(want[m]);
  }
  await expect(page.locator('#lrsec summary')).toContainText('Variation');
  expect(errors).toEqual([]);
});

test('Ink edges live in the Canvas tool, not in Layout', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await openPanel(page, 'canvas');
  await expect(page.locator('section.pn[data-p="canvas"] #rgh')).toHaveCount(1);
  await expect(page.locator('section.pn[data-p="canvas"] #psq')).toHaveCount(1);
  await expect(page.locator('section.pn[data-p="layers"] #rgh')).toHaveCount(0);
  expect(errors).toEqual([]);
});
