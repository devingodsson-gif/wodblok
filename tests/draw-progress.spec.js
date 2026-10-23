// After a file is opened or the canvas shape changes, stamps are still being printed; a thin progress bar runs over the stage
// until the drawing is done (UX review C5). Nothing is frozen, and the bar always ends.
const path = require('path');
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

const FIX = path.join(__dirname, 'fixtures', 'project-1-diamond.wodblok');

test('opening a file shows the progress bar while it draws, then removes it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 2 });
  await page.setInputFiles('#pfile', FIX);
  await page.waitForSelector('.stage > .fzbar', { timeout: 5000 });
  await page.waitForFunction(() => !document.querySelector('.stage > .fzbar'), null, { timeout: 40000 });
  await settle(page);
  expect(await page.evaluate(() => document.querySelectorAll('#art use').length)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

