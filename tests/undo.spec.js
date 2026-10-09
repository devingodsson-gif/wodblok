// Undo and redo through several Randomize rolls in a row (fixed in v107; before, Undo stalled after the second roll).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

async function roll(page) {
  await page.click('#rzdo');
  await settle(page, { max: 60000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
}
const press = async (page, keys) => { await page.keyboard.press(keys); await settle(page); };

test('undo walks back through several rolls to the start, and redo walks forward again', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 7 });
  await openPanel(page, 'rand');
  const states = [await getState(page)];
  for (let i = 0; i < 3; i++) { await roll(page); states.push(await getState(page)); }
  expect(new Set(states).size).toBe(4);
  for (let i = 2; i >= 0; i--) { await press(page, 'Control+z'); expect(await getState(page), `undo to step ${i}`).toBe(states[i]); }
  await press(page, 'Control+z');
  expect(await getState(page)).toBe(states[0]);
  for (let i = 1; i <= 3; i++) { await press(page, 'Control+Shift+z'); expect(await getState(page), `redo to step ${i}`).toBe(states[i]); }
  expect(errors).toEqual([]);
});
