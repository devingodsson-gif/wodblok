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
  await expect(btn).toHaveCount(8);
  expect(await btn.evaluateAll(bs => bs.map(b => b.getAttribute('aria-label')))).toEqual(['Select', 'Sheet', 'Paint', 'Shape', 'Image', 'Text', 'Stamp', 'Pattern']);
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

test('every button but Select makes an element at once, just above the selected one, and shows pressed while its tool is armed (2.3.0)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  const kinds = async () => JSON.parse(await getState(page)).els.map(q => q.k);
  await expect(page.locator('#elb [data-k="select"]')).toHaveAttribute('aria-pressed', 'true');
  await page.click('#elb [data-k="sheet"]'); await settle(page);
  expect(await kinds()).toEqual(['sheet']);
  await page.click('#elb [data-k="pattern"]'); await settle(page);
  expect(await kinds()).toEqual(['sheet', 'pattern']);
  await page.click('#elb [data-k="paint"]'); await settle(page);
  expect(await kinds()).toEqual(['sheet', 'pattern', 'paint']);
  await expect(page.locator('#elb [data-k="paint"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#elb .elbb[aria-pressed="true"]')).toHaveCount(1);
  await page.click('#elb [data-k="select"]'); await settle(page);
  await expect(page.locator('#elb [data-k="select"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#elb .elbb[aria-pressed="true"]')).toHaveCount(1);
  await page.click('#elb [data-k="shape"]'); await settle(page);
  expect((await kinds()).includes('shape')).toBe(true);
  expect(errors).toEqual([]);
});

test('the Stamp button puts the current stamp on the canvas as an element at once, listed in Elements', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="stamp"]'); await settle(page);
  const pl = JSON.parse(await getState(page)).els;
  expect(pl.map(q => q.k)).toEqual(['stamp']);
  await openPanel(page, 'lyrs');
  await expect(page.locator('#lyl2 .lyr')).toHaveCount(1);
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
