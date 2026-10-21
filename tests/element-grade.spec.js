// Element update, step 8b (2.1.8): the Colour grade effect, on every kind of element (here the Sheet and a placed stamp).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, noPattern, sheetOf } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};
const addEffect = async (page, kind, label) => {
  await page.locator(`.fxg[data-fxk="${kind}"] .fxadd`).scrollIntoViewIfNeeded();
  await page.click(`.fxg[data-fxk="${kind}"] .fxadd`);
  await page.locator('.rowm .ddi', { hasText: label }).first().click();
  await settle(page);
};
const gradeFilters = (page, prefix) => page.evaluate(p => document.querySelectorAll(`#art filter[id^="${p}"]`).length, prefix);

test('every kind offers Colour grade in its Add effect menu', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await page.click('#elb [data-k="sheet"]');
  await page.check('#sh_on'); await settle(page);
  await page.locator('.fxg[data-fxk="sheet"] .fxadd').scrollIntoViewIfNeeded();
  await page.click('.fxg[data-fxk="sheet"] .fxadd');
  const items = (await page.locator('.rowm .ddi').allTextContents()).map(s => s.trim());
  expect(items).toContain('Colour grade');
  expect(items).not.toContain('Pressure offset');
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('Colour grade on the Sheet draws a filter only once something is adjusted, and not when switched off', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await page.click('#elb [data-k="sheet"]');
  await page.check('#sh_on'); await settle(page);
  await addEffect(page, 'sheet', 'Colour grade');
  const fx = sheetOf(await st(page)).fx;
  expect(fx[0]).toMatchObject({ k: 'grade', on: true, ex: 0, sat: 0, hue: 0 });
  expect(await gradeFilters(page, 'fgsheet')).toBe(0);
  await page.locator('.fxg[data-fxk="sheet"] .fxg_ex').fill('40'); await settle(page);
  expect(sheetOf(await st(page)).fx[0].ex).toBe(40);
  expect(await gradeFilters(page, 'fgsheet')).toBe(1);
  await page.locator('.fxg[data-fxk="sheet"] .fxl [data-fon]').first().click(); await settle(page);
  expect(await gradeFilters(page, 'fgsheet')).toBe(0);
  expect(errors).toEqual([]);
});

test('Colour grade on a placed stamp grades that stamp only', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'stmp');
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.5, 0.5);
  await page.click('#lfpst [data-t]');
  await openPanel(page, 'lyrs');
  await page.click('#lyl2 .lyr');
  await settle(page);
  await openPanel(page, 'stmp');
  await addEffect(page, 'stamp', 'Colour grade');
  await page.locator('.fxg[data-fxk="stamp"] .fxg_sat').fill('-100'); await settle(page);
  const q = (await st(page)).els[0];
  expect(q.fx[0]).toMatchObject({ k: 'grade', sat: -100 });
  expect(await gradeFilters(page, 'fg0_')).toBe(1);
  expect(errors).toEqual([]);
});
