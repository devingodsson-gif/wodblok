// 2.44.0: the rail is gone (owner, Oct 25 2026). Its panels moved into the top bar: Canvas and Grid in the Image menu, the element list first in
// Elements, History in Edit and as a button beside undo, Colours in Colour, Export recipes in Export, Randomize behind a gear beside the Randomize button.
const { test, expect } = require('@playwright/test');
const { openApp, settle } = require('./helpers/harness');

const shows = (page, p) => page.locator(`section.pn[data-p="${p}"]`);

test('no rail on screen; the canvas area starts at the window edge', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('.rail')).toBeHidden();
  await expect(page.locator('#rmore')).toHaveCount(0);
  expect(await page.evaluate(() => document.querySelector('.stage').getBoundingClientRect().left)).toBe(0);
  expect(errors).toEqual([]);
});

test('every panel the rail had is in a menu', async ({ page }) => {
  const { errors } = await openApp(page);
  const where = { 'mnb-image': ['panel.canvas', 'panel.pgrid'], 'mnb-elements': ['panel.lyrs'], 'mnb-edit': ['panel.hist'], 'mnb-colour': ['panel.colors'], 'mnb-export': ['panel.xrec'], 'mnb-effects': ['panel.rand'], 'mnb-window': ['panels.closeAll'] };
  for (const [bar, ids] of Object.entries(where)) {
    await page.click('#' + bar);
    const menu = await page.locator('#' + bar).getAttribute('aria-controls');
    for (const id of ids) await expect(page.locator(`#${menu} [data-cmd="${id}"]`), id).toBeEnabled();
    await page.keyboard.press('Escape');
  }
  // the element list is the first item of Elements; Image > Open Canvas opens the Canvas panel
  await page.click('#mnb-elements');
  expect(await page.locator('#mnbm-elements [data-cmd]').first().getAttribute('data-cmd')).toBe('panel.lyrs');
  await page.keyboard.press('Escape');
  await page.click('#mnb-image');
  await page.click('#mnbm-image [data-cmd="panel.canvas"]'); await settle(page);
  await expect(shows(page, 'canvas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('History and the Randomize gear open their panels, show pressed while open, and close on a second press', async ({ page }) => {
  const { errors } = await openApp(page);
  for (const [b, p] of [['hstb', 'hist'], ['rzopt', 'rand']]) {
    await expect(page.locator('#' + b)).toHaveAttribute('aria-pressed', 'false');
    await page.click('#' + b); await settle(page);
    await expect(shows(page, p)).toBeVisible();
    await expect(page.locator('#' + b)).toHaveAttribute('aria-pressed', 'true');
    await page.click('#' + b); await settle(page);
    await expect(shows(page, p)).toBeHidden();
    await expect(page.locator('#' + b)).toHaveAttribute('aria-pressed', 'false');
  }
  // a command (here from the menu) opens a panel and never closes it
  await page.click('#hstb'); await settle(page);
  await page.click('#mnb-edit'); await page.click('#mnbm-edit [data-cmd="panel.hist"]'); await settle(page);
  await expect(shows(page, 'hist')).toBeVisible();
  expect(errors).toEqual([]);
});
