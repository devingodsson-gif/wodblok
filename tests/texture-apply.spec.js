// Textures tool: Apply puts the chosen texture on the Canvas, the open stamp or the selected layer, and the picture changes at once.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));

test('Apply adds the selected texture to the target chosen: Canvas or Stamps', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'tex');
  await page.click('#tx_add');
  await settle(page);
  const n0 = (await st(page)).tex.u.length;
  await page.click('#tx_apply');                                  // Canvas is the default target
  await settle(page);
  expect((await st(page)).tex.u.length).toBe(n0 + 1);
  await page.click('#tx_to [data-t="st_tex"]');
  await expect(page.locator('#tx_to [data-t="st_tex"]')).toHaveAttribute('aria-pressed', 'true');
  const s0 = (await st(page)).tiles[0].tu.length;
  await page.click('#tx_apply');
  await settle(page);
  expect((await st(page)).tiles[0].tu.length).toBe(s0 + 1);
  expect(errors).toEqual([]);
});
