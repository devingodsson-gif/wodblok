// Element update, step 10 (2.1.10): the Paint element. One element holds many strokes; the eraser only rubs out strokes of the same element; Texture and Colour grade work on it.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, openPanel, openProjectFile, settle, getState, stateText } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const paints = async page => ((await st(page)).els || []).filter(q => q.k === 'paint');
const drag = async (page, from, to) => {
  const box = await page.locator('#art').boundingBox();
  const at = (f, i) => [box.x + box.width * f[0] + i * 3, box.y + box.height * f[1]];
  await page.mouse.move(...at(from, 0));
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width * (from[0] + (to[0] - from[0]) * i / 8), box.y + box.height * (from[1] + (to[1] - from[1]) * i / 8));
  await page.mouse.up();
  await settle(page);
};
const open = async page => { await openPanel(page, 'elpaint'); await expect(page.locator('section.pn[data-p="elpaint"]:not([hidden])')).toBeVisible(); };

test('the Paint button opens the Paint panel; with the brush off a drag draws nothing', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await open(page);
  await drag(page, [0.3, 0.3], [0.6, 0.5]);
  expect(await paints(page)).toHaveLength(0);
  expect(errors).toEqual([]);
});

test('the first brush stroke makes the Paint element and later strokes go into it (no New paint button)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await open(page);
  await page.click('#pamode [data-m="brush"]');
  await drag(page, [0.3, 0.3], [0.6, 0.4]);
  let p = await paints(page);
  expect(p).toHaveLength(1);
  expect(p[0].st).toHaveLength(1);
  expect(p[0].st[0].pts.length).toBeGreaterThan(3);
  expect(p[0].st[0].w).toBe(14);
  await drag(page, [0.3, 0.5], [0.6, 0.6]);
  p = await paints(page);
  expect(p).toHaveLength(1);
  expect(p[0].st).toHaveLength(2);
  expect(await page.locator('#panew').count()).toBe(0);   // 2.2.1: no "New paint" button; the first stroke made the element
  expect(await page.locator('#art #dyn path[stroke-linecap="round"]').count()).toBeGreaterThanOrEqual(2);
  expect(errors).toEqual([]);
});

test('the eraser is a stroke of its own that masks the strokes before it, in its own Paint element only', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await open(page);
  await page.click('#pamode [data-m="brush"]');
  await drag(page, [0.3, 0.5], [0.7, 0.5]);
  await page.click('#pamode [data-m="erase"]');
  await drag(page, [0.5, 0.4], [0.5, 0.6]);
  const p = (await paints(page))[0];
  expect(p.st.map(s => !!s.er)).toEqual([false, true]);
  expect(await page.locator('#art mask[id^="pe0_"]').count()).toBe(1);
  expect(errors).toEqual([]);
});

test('Undo stroke and Clear; a Stamp tip stores the stamp; size and colour are kept on the stroke', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await open(page);
  await page.click('#pamode [data-m="brush"]');
  await page.locator('#pasz').fill('40');
  await page.click('#patip [data-t="stamp"]');
  await drag(page, [0.3, 0.4], [0.6, 0.4]);
  let p = (await paints(page))[0];
  expect(p.st[0].w).toBe(40);
  expect(p.st[0].t).toBe((await st(page)).tiles[0].id);
  expect(await page.locator('#art #dyn use[href^="#s"]').count()).toBeGreaterThan(2);
  await page.click('#patip [data-t="round"]');
  await drag(page, [0.3, 0.6], [0.6, 0.6]);
  expect((await paints(page))[0].st).toHaveLength(2);
  await page.click('#paund'); await settle(page);
  expect((await paints(page))[0].st).toHaveLength(1);
  await page.click('#paclr'); await settle(page);
  expect((await paints(page))[0].st).toHaveLength(0);
  expect(errors).toEqual([]);
});

test('Paint offers Texture and Colour grade as effects, and a grade filters the element', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await open(page);
  await page.click('#pamode [data-m="brush"]');
  await drag(page, [0.3, 0.5], [0.7, 0.5]);
  await page.locator('.fxg[data-fxk="paint"] .fxadd').scrollIntoViewIfNeeded();
  await page.click('.fxg[data-fxk="paint"] .fxadd');
  expect((await page.locator('.rowm .ddi').allTextContents()).map(s => s.replace('›', '').trim())).toEqual(['Texture', 'Colour grade', 'Noise', 'Blur', 'Print', 'Distort']);   // 2.35.0
  await page.locator('.rowm .ddi', { hasText: 'Colour grade' }).click();
  await settle(page);
  await page.locator('.fxg[data-fxk="paint"] .fxg_sat').fill('-100'); await settle(page);
  expect((await paints(page))[0].fx[0]).toMatchObject({ k: 'grade', sat: -100 });
  expect(await page.locator('#art filter[id^="fg0_"]').count()).toBe(1);
  expect(errors).toEqual([]);
});

test('a project with Paint strokes (and an eraser and an effect) saves and opens again unchanged', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await open(page);
  await page.click('#pamode [data-m="brush"]');
  await drag(page, [0.3, 0.4], [0.7, 0.4]);
  await page.click('#pamode [data-m="erase"]');
  await drag(page, [0.5, 0.3], [0.5, 0.5]);
  await page.locator('.fxg[data-fxk="paint"] .fxadd').scrollIntoViewIfNeeded();
  await page.click('.fxg[data-fxk="paint"] .fxadd');
  await page.locator('.rowm .ddi', { hasText: 'Colour grade' }).click();
  await settle(page);
  const before = await stateText(page);
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#fileb'); await page.click('#psv');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  await page.keyboard.press('Escape');
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  const tmp = path.join(ROOT, 'test-results', 'tmp', 'paint-resaved.wodblok');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, Buffer.from(dl.base64, 'base64'));
  const page2 = await page.context().newPage();
  const r2 = await openApp(page2);
  await openProjectFile(page2, tmp);
  expect(await stateText(page2)).toBe(before);
  expect(((JSON.parse(before).els) || []).find(q => q.k === 'paint').st).toHaveLength(2);
  expect(errors.concat(r2.errors)).toEqual([]);
});
