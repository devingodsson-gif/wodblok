const { test, expect } = require('@playwright/test');
const { TARGET, openApp } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const mode = page => page.evaluate(() => document.getElementById('rcls').dataset.m);
const open = page => page.evaluate(() => document.querySelectorAll('.wg').length);

test('Close all panels turns into Default panels when none are open, and back', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
  await expect.poll(() => open(page)).toBeGreaterThan(0);
  await page.click('#rcls');
  await expect.poll(() => open(page)).toBe(0);
  await expect.poll(() => mode(page)).toBe('d');
  expect(await page.getAttribute('#rcls', 'aria-label')).toBe('Default panels');
  await page.click('#rcls');
  await expect.poll(() => open(page)).toBeGreaterThan(0);
  await expect.poll(() => mode(page)).toBe('c');
  expect(await page.getAttribute('#rcls', 'aria-label')).toBe('Close all panels');
  expect(errors).toEqual([]);
});

test('without a Default workspace the button stays Close all panels', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.click('#rcls');
  await page.click('#rcls');
  expect(await page.getAttribute('#rcls', 'aria-label')).toBe('Close all panels');
  expect(await open(page)).toBe(0);
  expect(errors).toEqual([]);
});
