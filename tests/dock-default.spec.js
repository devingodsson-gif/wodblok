// Every tool opens docked on the right by default (Randomize used to open as a floating window, and the Stamp editor started
// with three floating windows). Pop out still floats any tool on request.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'the v100 baseline opens Randomize as a floating window'); });

test('Randomize opens docked on the right in the Pattern view and in the Stamp editor', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'rand');
  await expect(page.locator('.dk-r .wg:has(section.pn[data-p="rand"]:not([hidden]))')).toHaveCount(1);
  expect(await page.locator('.wg.fl').count()).toBe(0);
  await setMode(page, 'stamp');
  await openPanel(page, 'rand');
  await expect(page.locator('.dk-r .wg:has(section.pn[data-p="rand"]:not([hidden]))')).toHaveCount(1);
  expect(await page.locator('.wg.fl').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('no tool starts as a floating window (except the Shape editor, which is floating by design), in either view, and every other tool opens in the right dock', async ({ page }) => {
  const { errors } = await openApp(page);
  for (const mode of ['pattern', 'stamp']) {
    await setMode(page, mode);
    expect(await page.locator('.wg.fl').count(), mode).toBe(0);
    const tools = await page.locator('.rail [data-pn]:not([hidden])').evaluateAll(b => b.map(x => x.dataset.pn));
    expect(tools.length).toBeGreaterThan(8);
    for (const p of tools) {
      if (p === 'sedit') continue;   // the Shape editor floats by default: see shape-editor.spec.js
      await openPanel(page, p);
      await expect(page.locator(`.dk-r .wg:has(section.pn[data-p="${p}"]:not([hidden]))`), `${mode}: ${p}`).toHaveCount(1);
    }
    expect(await page.locator('.wg.fl').count(), mode).toBe(0);
  }
  expect(errors).toEqual([]);
});
