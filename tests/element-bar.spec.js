// Element update, step 2 (2.1.2): the element bar sits left of the centre of the view bar, the colour tray right of it. One button per element kind;
// a button opens its kind's panel. The placed-item controls moved: the stamp strip into the Stamp panel, pictures and crop into a new Image panel,
// the layer's list and the selected element's controls into the Elements panel (was the Shape list).
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, noPattern, addShape, addKind, placeArmed } = require('./helpers/harness');

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};

test('the element bar has one button per kind, left of centre; the tray starts right of centre', async ({ page }) => {
  const { errors } = await openApp(page);
  const btn = page.locator('#elb .elbb');
  await expect(btn).toHaveCount(6);   // 2.26.0: Select (V) comes first again; still no Image button
  expect(await btn.evaluateAll(bs => bs.map(b => b.getAttribute('aria-label')))).toEqual(['Paint', 'Shape', 'Text', 'Stamp', 'Pattern', 'Sheet']);
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
  await expect(page.locator('#elb .elbb[aria-pressed="true"]')).toHaveCount(0);   // no tool in hand
  await expect(page.locator('#elb [data-k="image"]')).toHaveCount(0);    // there is no Image button
  await page.click('#elb [data-k="pattern"]'); await settle(page);
  expect(await kinds()).toEqual([]);                      // the button makes nothing
  await expect(page.locator('#elb [data-k="pattern"]')).toHaveAttribute('aria-pressed', 'true');
  await addKind(page, 'pattern'); await settle(page);
  expect(await kinds()).toEqual(['pattern']);
  await addShape(page);
  expect(await kinds()).toEqual(['pattern', 'motif']);
  await page.click('#elb [data-k="text"]'); await settle(page);
  expect(await kinds()).toEqual(['pattern', 'motif']);
  await addKind(page, 'text'); await settle(page);
  expect(await kinds()).toEqual(['pattern', 'motif', 'text']);
  await page.click('#elb [data-k="motif"]'); await settle(page);
  expect((await kinds()).filter(k => k == 'motif').length).toBe(1);   // 2.4.0: the Motif button makes nothing more, a pick arms it
  await expect(page.locator('#elb [data-k="motif"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#elb .elbb[aria-pressed="true"]')).toHaveCount(1);
  await page.keyboard.press('Escape'); await settle(page);            // Escape (or V) puts the tool away: no tool is in hand
  await expect(page.locator('#elb .elbb[aria-pressed="true"]')).toHaveCount(0);   // no tool in hand
  expect(errors).toEqual([]);
});

test('the Stamp button arms the stamp at once (2.26.0) and opens the Stamp properties; clicks on the canvas place it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="stamp"]'); await settle(page);
  expect(JSON.parse(await getState(page)).els).toHaveLength(0);
  await expect(page.locator('#elb [data-k="stamp"]')).toHaveAttribute('aria-pressed', 'true');
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.5); await settle(page);
  await page.mouse.click(b.x + b.width * 0.3, b.y + b.height * 0.3); await settle(page);
  await page.mouse.click(b.x + b.width * 0.7, b.y + b.height * 0.6); await settle(page);
  expect(JSON.parse(await getState(page)).els.map(q => q.k)).toEqual(['stamp', 'stamp']);
  await openPanel(page, 'lyrs');
  await expect(page.locator('#lyl2 .lyr')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('Import image with nothing picked makes a Rectangle motif filled with the picture; the Fill group shows it', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  const f = path.join(testInfo.outputDir, 'dot.png');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(f, Buffer.from(PNG, 'base64'));
  await page.setInputFiles('#lfafile', f);
  await settle(page);
  const els = JSON.parse(await getState(page)).els;
  expect(els).toHaveLength(1);
  expect(els[0]).toMatchObject({ k: 'motif', fl: 'img' });
  expect(els[0].a).toBeTruthy();
  await expect(page.locator('#mf_fk [data-f="img"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#lfars [data-a]')).toHaveCount(1);
  expect(errors).toEqual([]);
});
