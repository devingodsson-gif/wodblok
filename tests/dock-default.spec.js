// 2.55.0 (owner Oct 26 2026): every tool opens docked on the LEFT by default (the Elements list starts on the right). Before: every tool opened docked on the right (Randomize used to open as a floating window, and the Stamp editor started
// with three floating windows). Pop out still floats any tool on request.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel } = require('./helpers/harness');

test('Randomize opens docked on the left', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'rand');
  await expect(page.locator('.dk-l .wg:has(section.pn[data-p="rand"]:not([hidden]))')).toHaveCount(1);
  expect(await page.locator('.wg.fl').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('no tool starts as a floating window (the Shape editor docks along the bottom), and every other tool opens in the left dock', async ({ page }) => {
  const { errors } = await openApp(page);
  for (const mode of ['pattern']) {
    expect(await page.locator('.wg.fl').count(), mode).toBe(0);
    const tools = await page.locator('.rail [data-pn]:not([hidden])').evaluateAll(b => b.map(x => x.dataset.pn));
    expect(tools.length).toBeGreaterThan(6);
    for (const p of tools) {
      if (p === 'mlist' && mode === 'pattern') continue;   // empty until a stamp is unlocked
      await openPanel(page, p);
      await expect(page.locator(`.dk-l .wg:has(section.pn[data-p="${p}"]:not([hidden]))`), `${mode}: ${p}`).toHaveCount(1);
    }
    expect(await page.locator('.wg.fl').count(), mode).toBe(0);
  }
  expect(errors).toEqual([]);
});
