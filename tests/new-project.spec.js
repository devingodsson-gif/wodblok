// File > New project with unsaved work asks for a second click. Before, the File menu closed after the first click and nothing
// visible happened (UX review B3). Now the menu stays open showing "Click again to discard changes", and the status bar says why.
// (Starting a new project resets History, so Undo cannot bring the old project back: the guard has to stay.)
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

async function roll(page) {
  await openPanel(page, 'rand');
  await page.click('#rzdo');
  await settle(page, { max: 60000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
}

test('first click with unsaved work keeps the menu open and says what the next click does; the second click starts the new project', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  const before = await getState(page);
  await page.click('#fileb');
  await page.click('#pnw');
  await expect(page.locator('#filem')).toBeVisible();
  await expect(page.locator('#pnw')).toHaveText('Click again to discard changes');
  await expect(page.locator('#pmsg')).toContainText('unsaved changes');
  expect(await getState(page)).toBe(before);
  await page.click('#pnw');
  await settle(page, { max: 30000 });
  expect(JSON.parse(await getState(page)).tiles.length).toBe(1);
  await expect(page.locator('#filem')).toBeHidden();
  await expect(page.locator('#pnw')).toHaveText('New project');
  expect(errors).toEqual([]);
});

test('the New project button in the Projects dialog shows the same cue', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  await page.click('#pls');
  await page.click('#pnw2');
  await expect(page.locator('#pnw2')).toHaveText('Click again to discard changes');
  await page.click('#pnw2');
  await settle(page, { max: 30000 });
  expect(JSON.parse(await getState(page)).tiles.length).toBe(1);
  expect(errors).toEqual([]);
});

test('with nothing to lose (the project was just saved), one click is enough', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  await page.click('#psv');
  await expect(page.locator('#pmsg')).toContainText('Saved');
  await page.click('#fileb');
  await page.click('#pnw');
  await expect(page.locator('#pmsg')).toContainText('Started a new');
  expect(errors).toEqual([]);
});
