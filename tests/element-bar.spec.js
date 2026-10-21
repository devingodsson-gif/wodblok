// Element update, step 2 (2.1.2): the element bar sits left of the centre of the view bar, the colour tray right of it. One button per element kind;
// a button opens its kind's panel. The placed-item controls moved: the stamp strip into the Stamp panel, pictures and crop into a new Image panel,
// the layer's list and the selected element's controls into the Elements panel (was the Shape list).
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, noPattern, addShape } = require('./helpers/harness');

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};

test('the element bar has one button per kind, left of centre; the tray starts right of centre', async ({ page }) => {
  const { errors } = await openApp(page);
  const btn = page.locator('#elb .elbb');
  await expect(btn).toHaveCount(6);   // 2.7.0: no pointer and no Image button
  expect(await btn.evaluateAll(bs => bs.map(b => b.getAttribute('aria-label')))).toEqual(['Paint', 'Motif', 'Shape', 'Text', 'Stamp', 'Pattern']);
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

test('a bar button opens its panel and Add there makes the element, just above the selected one; the button shows pressed while its tool is armed (2.6.0)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  const kinds = async () => JSON.parse(await getState(page)).els.map(q => q.k);
  await expect(page.locator('#elb [data-k="select"]')).toHaveCount(0);   // 2.7.0: no pointer button
  await expect(page.locator('#elb [data-k="image"]')).toHaveCount(0);    // and no Image button
  await expect(page.locator('#elb .elbb[aria-pressed="true"]')).toHaveCount(0);
  await page.click('#elb [data-k="pattern"]'); await settle(page);
  expect(await kinds()).toEqual([]);                      // the button makes nothing
  await expect(page.locator('#elb [data-k="pattern"]')).toHaveAttribute('aria-pressed', 'true');
  await page.click('.elk[data-k="pattern"] [data-add]'); await settle(page);
  expect(await kinds()).toEqual(['pattern']);
  await addShape(page);
  expect(await kinds()).toEqual(['pattern', 'shape']);
  await page.click('#elb [data-k="text"]'); await settle(page);
  expect(await kinds()).toEqual(['pattern', 'shape']);
  await page.click('.elk[data-k="text"] [data-add]'); await settle(page);
  expect(await kinds()).toEqual(['pattern', 'shape', 'text']);
  await page.click('#elb [data-k="motif"]'); await settle(page);
  expect((await kinds()).includes('motif')).toBe(false);   // 2.4.0: the Motif button makes nothing, a pick arms it
  await expect(page.locator('#elb [data-k="motif"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#elb .elbb[aria-pressed="true"]')).toHaveCount(1);
  await page.keyboard.press('Escape'); await settle(page);            // Escape (or V) puts the tool away
  await expect(page.locator('#elb .elbb[aria-pressed="true"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the Stamp button makes nothing; it opens the Stamp properties, and a picked stamp is placed by clicks on the canvas', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="stamp"]'); await settle(page);
  expect(JSON.parse(await getState(page)).els).toHaveLength(0);
  await expect(page.locator('#elb [data-k="stamp"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#lfpst')).toBeVisible();
  await page.locator('#lfpst [data-t] >> nth=0').click(); await settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width * 0.3, b.y + b.height * 0.3); await settle(page);
  await page.mouse.click(b.x + b.width * 0.7, b.y + b.height * 0.6); await settle(page);
  expect(JSON.parse(await getState(page)).els.map(q => q.k)).toEqual(['stamp', 'stamp']);
  await openPanel(page, 'lyrs');
  await expect(page.locator('#lyl2 .lyr')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('the Shape button makes nothing; it shows the presets (and the pen), and a preset makes the shape', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="shape"]'); await settle(page);
  expect(JSON.parse(await getState(page)).els).toHaveLength(0);
  await expect(page.locator('#shp_pre')).toBeVisible();
  await expect(page.locator('#shp_pen')).toBeVisible();
  await expect(page.locator('#shp_f')).toBeHidden();
  await page.click('#shp_pre [data-g="hex"]'); await settle(page);
  const els = JSON.parse(await getState(page)).els;
  expect(els.map(q => q.k + ':' + q.sh)).toEqual(['shape:hex']);
  await expect(page.locator('#shp_f')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Import image in the Shape panel asks for a picture, then makes a Rectangle Shape filled with it; the Fill group shows it', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  const f = path.join(testInfo.outputDir, 'dot.png');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(f, Buffer.from(PNG, 'base64'));
  await page.click('#elb [data-k="shape"]'); await settle(page);
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#shp_imp')]);
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

test('Shape properties have a clear Import image button: from the Shape button it makes a Shape that shows the picture; on a selected Shape it fills that Shape', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  const f = path.join(testInfo.outputDir, 'dot2.png');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(f, Buffer.from(PNG, 'base64'));
  await page.click('#elb [data-k="shape"]'); await settle(page);
  await expect(page.locator('#shp_imp')).toBeVisible();
  await expect(page.locator('#shp_imp')).toHaveClass(/primary/);
  let [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#shp_imp')]);
  await fc.setFiles(f); await settle(page);
  let els = JSON.parse(await getState(page)).els;
  expect(els.map(q => q.k)).toEqual(['shape']);   // still a Shape, no Image element
  expect(els[0]).toMatchObject({ sh: 'rect', fl: 'img' });
  // a second Shape, filled with the picture through its own Fill group
  await addShape(page, 'ellipse');
  await page.click('#shp_fk [data-f="img"]'); await settle(page);
  await expect(page.locator('#lfaimp')).toHaveClass(/primary/);
  [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('#lfaimp')]);
  await fc.setFiles(f); await settle(page);
  els = JSON.parse(await getState(page)).els;
  expect(els.map(q => q.k + ':' + q.sh + ':' + q.fl)).toEqual(['shape:rect:img', 'shape:ellipse:img']);
  expect(errors).toEqual([]);
});
