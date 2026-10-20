// 1.0.18 took the Apply block out of the Textures tool (D13); 1.35.0 puts it back as Apply + To (Canvas, Stamps, Layers); D4 a Pictures layer can let the paper show through the light colour of a picture.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAG0lEQVR4nGP4TyJgGOQaGHCAUQ301UAMGIQaAMSCPd+1UKgQAAAAAElFTkSuQmCC', 'base64');

test('the Textures tool has an Apply block (Canvas, Stamps, Layers) and textures can still be added where you work', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'tex');
  await page.click('#tx_add');
  await settle(page);
  await expect(page.locator('#tx_edg')).toBeVisible();
  await expect(page.locator('#tx_del')).toBeVisible();
  await expect(page.locator('#tx_apg')).toBeVisible();
  await expect(page.locator('#tx_to [data-t]')).toHaveText(['Canvas', 'Stamps', 'Layers']);
  // Canvas still takes a texture from the library
  await openPanel(page, 'canvas');
  const n0 = JSON.parse(await getState(page)).tex.u.length;
  await page.locator('#cv_tex [data-a="add"], [data-a="add"]:visible').first().click();
  await settle(page);
  expect(JSON.parse(await getState(page)).tex.u.length).toBe(n0 + 1);
  expect(errors).toEqual([]);
});

test('"Paper shows through" puts a light-colour filter on the layer that holds pictures and saves it in the layer', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await page.click('#ly_add');
  await openPanel(page, 'elimg');
  await settle(page);
  await page.setInputFiles('#lfafile', { name: 'a.png', mimeType: 'image/png', buffer: PNG });
  await settle(page);
  const bb = await page.locator('#art').boundingBox();
  await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await settle(page);
  expect(JSON.parse(await getState(page)).layers.some(l => (l.pl || []).some(p => p.a))).toBe(true);
  const box = page.locator('#lfaak');
  await expect(box).toBeVisible();
  await expect(box).not.toBeChecked();
  expect(await page.locator('#art filter[id^="ak"]').count()).toBe(0);
  await box.check();
  await settle(page);
  expect(JSON.parse(await getState(page)).layers.some(l => l.akk === true)).toBe(true);
  expect(await page.locator('#art filter[id^="ak"]').count()).toBe(1);
  expect(await page.locator('#art g[filter^="url(#ak"]').count()).toBe(1);
  await box.uncheck();
  await settle(page);
  expect(JSON.parse(await getState(page)).layers.some(l => l.akk)).toBe(false);
  expect(await page.locator('#art filter[id^="ak"]').count()).toBe(0);
  expect(errors).toEqual([]);
});
