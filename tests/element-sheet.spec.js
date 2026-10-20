// Element update, step 3 (2.1.3): the canvas is transparent; the Sheet element is the background.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, sheetOf } = require('./helpers/harness');

const proj = async page => JSON.parse(await getState(page)).proj;
const sheet = async page => sheetOf(JSON.parse(await getState(page)));
const paperRects = page => page.$$eval('#dyn > rect', rs => rs.length);

test('a new project has no Sheet: nothing paints the paper and the canvas shows the checkerboard', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  expect(await sheet(page)).toBeUndefined();
  expect(await paperRects(page)).toBe(0);
  await expect(page.locator('#art')).toHaveClass(/cvck/);
  expect(errors).toEqual([]);
});

test('the Sheet button opens the Sheet panel; turning it on paints the paper, off makes it transparent again', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await expect(page.locator('#elb [data-k="sheet"]')).toBeEnabled();
  await page.click('#elb [data-k="sheet"]');
  await settle(page);
  await expect(page.locator('section.pn[data-p="elsheet"]')).toBeVisible();
  await page.check('#sh_on');
  await settle(page);
  expect(await sheet(page)).toMatchObject({ k: 'sheet' });
  expect(await paperRects(page)).toBe(1);
  await page.uncheck('#sh_on');
  await settle(page);
  expect(await sheet(page)).toBeUndefined();
  expect(await paperRects(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('Sheet opacity is saved on the project and drawn on the rect', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'elsheet');
  await page.check('#sh_on');
  await page.locator('#sh_op').fill('40');
  await settle(page);
  expect((await sheet(page)).o).toBe(40);
  expect(await page.$eval('#dyn > rect', r => r.getAttribute('opacity'))).toBe('0.40');
  expect(errors).toEqual([]);
});

test('undo takes the Sheet away again', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'elsheet');
  await page.check('#sh_on');
  await settle(page);
  expect(await paperRects(page)).toBe(1);
  await page.locator('#art').click({ position: { x: 5, y: 5 }, trial: true });
  await page.keyboard.press('Control+z');
  await settle(page);
  expect(await sheet(page)).toBeUndefined();
  expect(await paperRects(page)).toBe(0);
  await expect(page.locator('#sh_on')).not.toBeChecked();
  expect(errors).toEqual([]);
});
