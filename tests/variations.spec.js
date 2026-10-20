// Shelved Oct 20 2026: the owner is redoing Presets and Variations; the panels are hidden, so these tests are skipped (not deleted).
// Variations (Phase 5): six colour alternatives of the current piece. Nothing changes until one is clicked; a click is one undo step.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const state = async page => JSON.parse(await getState(page));
const roll = async page => { if (!(await page.locator('section.pn[data-p="rand"]:not([hidden])').count())) await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };
const ready = page => page.waitForFunction(() => document.querySelectorAll('#vrg .vrb').length === 6 && document.querySelectorAll('#vrg .vrb .im img').length === 6, null, { timeout: 30000 });

test.skip('opening shows six alternatives with pictures and changes nothing; More makes new ones', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  const before = await getState(page);
  await openPanel(page, 'vars');
  await ready(page);
  const first = await page.locator('#vrg .vrb b').allTextContents();
  expect(new Set(first).size).toBe(6);
  expect(await getState(page)).toBe(before);
  await page.click('#vrmore'); await page.waitForTimeout(300); await ready(page);
  expect(await page.locator('#vrg .vrb b').allTextContents()).not.toEqual(first);
  expect(await getState(page)).toBe(before);
  expect(errors).toEqual([]);
});

test.skip('clicking one applies that palette as one undo step', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  const before = await state(page);
  await openPanel(page, 'vars'); await ready(page);
  const name = (await page.locator('#vrg .vrb b').first().textContent());
  await page.locator('#vrg .vrb').first().click(); await settle(page);
  const after = await state(page);
  expect(after.proj).not.toEqual(before.proj);
  expect(after.tiles.length).toBe(before.tiles.length);
  await page.keyboard.press('Control+z'); await settle(page);
  expect((await state(page)).proj).toEqual(before.proj);
  expect(name.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test.skip('the command opens the panel', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.evaluate(() => window.__wbTest.commands.run('panel.vars'));
  await expect(page.locator('section.pn[data-p="vars"]')).toBeVisible();
  expect(errors).toEqual([]);
});
