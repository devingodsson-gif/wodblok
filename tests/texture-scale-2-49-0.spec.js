// 2.49.0 (owner Oct 26 2026: textures render soft): the Texture effect's Scale slider stops at 200% (it was 300%), and a value beyond that is held at 200.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, addShape } = require('./helpers/harness');

const setRange = (page, sel, v) => page.evaluate(([s, v]) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);

test('the Texture effect Scale slider stops at 200% and holds a larger value at 200', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  const g = '.fxg[data-fxk="motif"]';
  await page.locator(`${g} .fxadd`).scrollIntoViewIfNeeded();
  await page.click(`${g} .fxadd`);
  await page.locator('.rowm .ddi', { hasText: 'Texture' }).first().click();
  await settle(page);
  await expect(page.locator(`${g} .fxsc`)).toHaveAttribute('max', '200');
  await expect(page.locator(`${g} .fxsc`)).toHaveAttribute('min', '25');
  await setRange(page, `${g} .fxsc`, 300); await settle(page);
  expect(await page.locator(`${g} .fxsc`).inputValue()).toBe('200');
  expect(JSON.stringify(JSON.parse(await getState(page)))).not.toContain('"sc":300');
  expect(errors).toEqual([]);
});
