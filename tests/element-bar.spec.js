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
  await expect(btn).toHaveCount(9);
  expect(await btn.evaluateAll(bs => bs.map(b => b.getAttribute('aria-label')))).toEqual(['Select', 'Paint', 'Motif', 'Shape', 'Pen', 'Image', 'Text', 'Stamp', 'Pattern']);
  await expect(page.locator('#elb [data-k="paint"]')).toBeHidden();   // the brush is put away for now
  for (const pn of ['stmp', 'layers']) await expect(page.locator(`.rail [data-pn="${pn}"]`)).toBeHidden();   // element panels have no rail button
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
  await page.click('#elb [data-k="pattern"]'); await settle(page);
  expect(await kinds()).toEqual(['pattern']);
  await page.click('#elb [data-k="shape"]'); await settle(page);
  expect(await kinds()).toEqual(['pattern', 'shape']);
  await page.click('#elb [data-k="text"]'); await settle(page);
  expect(await kinds()).toEqual(['pattern', 'shape', 'text']);
  await page.click('#elb [data-k="motif"]'); await settle(page);
  expect((await kinds()).includes('motif')).toBe(true);
  await expect(page.locator('#elb [data-k="motif"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#elb .elbb[aria-pressed="true"]')).toHaveCount(1);
  await page.click('#elb [data-k="select"]'); await settle(page);
  await expect(page.locator('#elb [data-k="select"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#elb .elbb[aria-pressed="true"]')).toHaveCount(1);
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

test('Image asks for a picture, then makes a Rectangle Shape filled with it; the Fill group shows it', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  const f = path.join(testInfo.outputDir, 'dot.png');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(f, Buffer.from(PNG, 'base64'));
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#elb [data-k="image"]')]);
  await fc.setFiles(f);
  await settle(page);
  const els = JSON.parse(await getState(page)).els;
  expect(els).toHaveLength(1);
  expect(els[0]).toMatchObject({ k: 'shape', sh: 'rect', fl: 'img' });
  expect(els[0].a).toBeTruthy();
  await expect(page.locator('#shp_fk [data-f="img"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#lfars [data-a]')).toHaveCount(1);
  expect(await page.$$eval('#dyn use[href^="#sai"]', u => u.length)).toBe(1);
  expect(errors).toEqual([]);
});
