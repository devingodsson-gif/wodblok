// Layer update, step 2 (1.46.2): any layer takes stamps, pictures and text placed by hand. The layer type dropdown and buttons are gone;
// a layer's Arrangement is None, Repeat or Frame, and changing it keeps what was placed.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const layers = async page => JSON.parse(await getState(page)).layers;
const setSel = (page, id, v) => page.locator(id).evaluate((e, v) => { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};

test('there is no layer type: the dropdown is Arrangement (None, Repeat, Frame) and "+" adds a plain layer', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await openPanel(page, 'lyrs');
  await expect(page.locator('#lmsel option')).toHaveText(['None', 'Repeat', 'Frame']);
  await expect(page.locator('#ly_menu')).toHaveCount(0);
  await page.click('#ly_add');
  await settle(page);
  const ls = await layers(page);
  expect(ls.length).toBe(2);
  expect(ls[1].free).toBeFalsy();
  expect(ls[1].fr && ls[1].fr.on).toBeFalsy();
  expect(errors).toEqual([]);
});

test('a stamp is placed on a layer that has an arrangement, and the arrangement stays', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.5, 0.5);
  const l = (await layers(page))[0];
  expect(l.free).toBeFalsy();
  expect(l.pl.length).toBe(1);
  expect(l.pl[0].t).toBeTruthy();
  expect(await page.locator('#art use[href^="#bk"]').count()).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

test('a picture and then a stamp go onto the same layer; each is its own placed item', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  const f = path.join(testInfo.outputDir, 'dot.png');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(f, Buffer.from(PNG, 'base64'));
  await page.setInputFiles('#lfafile', f);
  await settle(page);
  await expect(page.locator('#lfars [data-a]')).toHaveCount(1);
  await expect(page.locator('#lfars [data-a].on')).toHaveCount(1);          // importing a picture arms it
  await canvasClick(page, 0.3, 0.3);
  await page.click('#lfars [data-a]');            // stop placing the picture
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.7, 0.7);
  const l = (await layers(page))[0];
  expect(l.pl.map(q => (q.a ? 'a' : q.t ? 't' : '?'))).toEqual(['a', 't']);
  await expect(page.locator('#lfpl .mr')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('typing in the Text tool places text on the selected layer, whatever its arrangement', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'Hi');
  await settle(page);
  await canvasClick(page, 0.5, 0.5);
  const ls = await layers(page);
  expect(ls.length).toBe(1);
  expect(ls[0].free).toBeFalsy();
  expect(ls[0].pl.some(q => q.tx)).toBe(true);
  expect(errors).toEqual([]);
});

test('changing the Arrangement keeps what was placed on the layer', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.5, 0.5);
  for (const v of ['x', 'f', 'p']) {
    await setSel(page, '#lmsel', v);
    await settle(page);
    const l = (await layers(page))[0];
    expect(l.pl.length, `after ${v}`).toBe(1);
    expect(!!l.free, `free after ${v}`).toBe(v === 'x');
    expect(!!(l.fr && l.fr.on), `frame after ${v}`).toBe(v === 'f');
    expect(l.art).toBeUndefined();
    expect(l.txt).toBeUndefined();
  }
  expect(errors).toEqual([]);
});

test('the Layers list says how many items a layer holds', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.5, 0.5);
  await expect(page.locator('#lyl2 .lyr .lym')).toContainText('1 placed');
  expect(errors).toEqual([]);
});

test('the Arrangement heading names the selected layer\'s arrangement', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await expect(page.locator('#lytn')).toHaveText('Repeat');
  await setSel(page, '#lmsel', 'f');
  await settle(page);
  await expect(page.locator('#lytn')).toHaveText('Frame');
  await setSel(page, '#lmsel', 'x');
  await settle(page);
  await expect(page.locator('#lytn')).toHaveText('None');
  expect(errors).toEqual([]);
});
