const { test, expect } = require('@playwright/test');
const { openApp } = require('./helpers/harness');

const mode = page => page.evaluate(() => document.getElementById('rcls').dataset.m);
const open = page => page.evaluate(() => document.querySelectorAll('.wg').length);

test('Close all panels turns into Default panels when none are open, and back', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
  await expect.poll(() => open(page)).toBeGreaterThan(0);
  await page.locator('#rcls').dispatchEvent('click');                                    // 2.19.0: a locked panel (Elements) stays
  await expect.poll(() => open(page)).toBe(1);
  await page.click('.wg [data-act="lock"]');                   // unlock it, then Close all closes everything
  await page.locator('#rcls').dispatchEvent('click');
  await expect.poll(() => open(page)).toBe(0);
  await expect.poll(() => mode(page)).toBe('d');
  expect(await page.getAttribute('#rcls', 'aria-label')).toBe('Default panels');
  await page.locator('#rcls').dispatchEvent('click');
  await expect.poll(() => open(page)).toBeGreaterThan(0);
  await expect.poll(() => mode(page)).toBe('c');
  expect(await page.getAttribute('#rcls', 'aria-label')).toBe('Close all panels');
  expect(errors).toEqual([]);
});
