// 1.0.18 took the Apply block out of the Textures tool (D13); 1.35.0 puts it back as Apply + To (Canvas, Stamps, Layers); D4 a Pictures layer can let the paper show through the light colour of a picture.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAG0lEQVR4nGP4TyJgGOQaGHCAUQ301UAMGIQaAMSCPd+1UKgQAAAAAElFTkSuQmCC', 'base64');

test('the Textures tool has an Apply block (Canvas, Stamps) and textures can still be added where you work', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'tex');
  await page.click('#tx_add');
  await settle(page);
  await expect(page.locator('#tx_edg')).toBeVisible();
  await expect(page.locator('#tx_del')).toBeVisible();
  await expect(page.locator('#tx_apg')).toBeVisible();
  await expect(page.locator('#tx_to [data-t]')).toHaveText(['Canvas', 'Stamps']);
  // Canvas still takes a texture from the library
  await openPanel(page, 'canvas');
  const n0 = JSON.parse(await getState(page)).tex.u.length;
  await page.locator('#cv_tex [data-a="add"], [data-a="add"]:visible').first().click();
  await settle(page);
  expect(JSON.parse(await getState(page)).tex.u.length).toBe(n0 + 1);
  expect(errors).toEqual([]);
});

