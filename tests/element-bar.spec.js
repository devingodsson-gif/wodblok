// Element update, step 2 (2.1.2): the element bar sits left of the centre of the view bar, the colour tray right of it. One button per element kind;
// a button opens its kind's panel. The placed-item controls moved: the stamp strip into the Stamp panel, pictures and crop into a new Image panel,
// the layer's list and the selected element's controls into the Elements panel (was the Shape list).
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, noPattern } = require('./helpers/harness');

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};

test('the element bar has one button per kind, left of centre; the tray starts right of centre', async ({ page }) => {
  const { errors } = await openApp(page);
  const btn = page.locator('#elb .elbb');
  await expect(btn).toHaveCount(7);
  expect(await btn.evaluateAll(bs => bs.map(b => b.getAttribute('aria-label')))).toEqual(['Sheet', 'Paint', 'Shape', 'Image', 'Text', 'Stamp', 'Pattern']);
  await expect(page.locator('#elb [data-k="sheet"]')).toBeEnabled();
  await expect(page.locator('#elb [data-k="paint"]')).toBeEnabled();
  for (const pn of ['elsheet', 'stmp', 'layers']) await expect(page.locator(`.rail [data-pn="${pn}"]`)).toBeHidden();   // element panels have no rail button
  const vb = await page.locator('.viewbar').boundingBox(), el = await page.locator('#elb').boundingBox(), ty = await page.locator('#tyc').boundingBox();
  const mid = vb.x + vb.width / 2;
  expect(el.x + el.width).toBeLessThanOrEqual(mid);
  expect(el.x + el.width).toBeGreaterThan(mid - 20);
  expect(ty.x).toBeGreaterThanOrEqual(mid);
  expect(ty.x).toBeLessThan(mid + 20);
  expect(errors).toEqual([]);
});

test('each working button opens its panel and shows pressed while that panel is in front', async ({ page }) => {
  const { errors } = await openApp(page);
  for (const [k, pn] of [['sheet', 'elsheet'], ['shape', 'motifs'], ['image', 'elimg'], ['text', 'text'], ['stamp', 'stmp'], ['pattern', 'layers'], ['paint', 'elpaint']]) {
    await page.click(`#elb [data-k="${k}"]`);
    await settle(page);
    await expect(page.locator(`section.pn[data-p="${pn}"]`)).toBeVisible();
    await expect(page.locator(`#elb [data-k="${k}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#elb .elbb[aria-pressed="true"]')).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

test('a stamp is placed from the Stamp panel, listed in Elements, and the Stamp panel says which one is being edited', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="stamp"]');
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.5, 0.5);
  await page.click('#lfpst [data-t]');          // stop placing
  const pl = JSON.parse(await getState(page)).layers[0].pl;
  expect(pl.length).toBe(1);
  await openPanel(page, 'mlist');
  await expect(page.locator('#lfpl .mr')).toHaveCount(1);
  await page.click('#lfpl .mr');
  await settle(page);
  await page.click('#elb [data-k="stamp"]');
  await expect(page.locator('.elmode[data-k="stamp"]')).toBeVisible();
  await expect(page.locator('.elmode[data-k="stamp"] b')).toHaveText('Stamp 1');
  expect(errors).toEqual([]);
});

test('a picture is imported and placed from the Image panel; its Crop group shows when it is selected', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 4 });
  await page.click('#elb [data-k="image"]');
  await expect(page.locator('#elcrg')).toBeHidden();
  const f = path.join(testInfo.outputDir, 'dot.png');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(f, Buffer.from(PNG, 'base64'));
  await page.setInputFiles('#lfafile', f);
  await settle(page);
  await canvasClick(page, 0.5, 0.5);
  await page.click('#lfars [data-a]');          // stop placing
  await canvasClick(page, 0.5, 0.5);            // select it
  await expect(page.locator('#elcrg')).toBeVisible();
  await expect(page.locator('.elmode[data-k="image"]')).toBeVisible();
  expect(errors).toEqual([]);
});
