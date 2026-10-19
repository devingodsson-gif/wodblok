// The first minute (UX review B4): Randomize is in the top bar, an empty project has no button on the canvas, and an empty stamp in the tray shows a plus.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState, unlockStamp } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

test('launch is still fully cleared: Pattern view, no panel open, no stamps printed', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('#boardS')).toBeHidden();
  expect(await page.evaluate(() => [...document.querySelectorAll('.dock.dk')].filter(d => d.offsetWidth * d.offsetHeight > 0).length), 'no tool windows open at launch').toBe(0);
  expect(JSON.parse(await getState(page)).tiles.every(t => !t.items.length)).toBe(true);
  expect(errors).toEqual([]);
});

test('Randomize is a labelled button in the top bar and rolls a piece', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  const btn = page.locator('#rzbar');
  await expect(btn).toBeVisible();
  await expect(btn).toContainText('Randomize');
  const before = await getState(page);
  await btn.click();
  await settle(page, { max: 60000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
  expect(await getState(page)).not.toBe(before);
  await expect(page.locator('#pmsg')).toContainText('Randomized');
  expect(errors).toEqual([]);
});

test('an empty canvas has no "+" button on it; shapes are added with the Shapes tool into an unlocked stamp', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('#empc')).toHaveCount(0);
  await unlockStamp(page);
  await openPanel(page, 'motifs');
  await expect(page.locator('section.pn[data-p="motifs"]')).toBeVisible();
  await page.locator('#lib .lfr[data-f^="b:"]').first().click();      // folders open in place (1.5.0)
  await page.locator('#lib button[data-m]').first().click();
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await page.keyboard.press('Escape');
  await settle(page);
  expect(JSON.parse(await getState(page)).tiles[0].items.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Randomize fills the canvas', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await page.click('#rzbar');
  await settle(page, { max: 60000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
  await expect(page.locator('#tabs button.empty')).toHaveCount(0);
  expect(errors).toEqual([]);
});
