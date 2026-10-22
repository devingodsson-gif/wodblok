// Ctrl/Cmd + = - 0 zoom the picture instead of the whole browser page, and a Mac sees Cmd, not Ctrl (UX review C12).
const { test, expect } = require('@playwright/test');
const { openApp, settle } = require('./helpers/harness');

const zoom = page => page.evaluate(() => parseInt(document.getElementById('zl').textContent, 10));

test('Ctrl + = and Ctrl + - zoom the canvas, Ctrl + 0 fits it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 1 });
  const fit = await zoom(page);
  await page.keyboard.press('Control+=');
  await settle(page);
  const bigger = await zoom(page);
  expect(bigger).toBeGreaterThan(fit);
  await page.keyboard.press('Control+-');
  await page.keyboard.press('Control+-');
  await settle(page);
  expect(await zoom(page)).toBeLessThan(bigger);
  await page.keyboard.press('Control+0');
  await settle(page);
  expect(await zoom(page)).toBe(fit);
  // the browser's own page zoom must not run: the key event is cancelled
  const prevented = await page.evaluate(() => { const e = new KeyboardEvent('keydown', { key: '=', ctrlKey: true, bubbles: true, cancelable: true }); document.body.dispatchEvent(e); return e.defaultPrevented; });
  expect(prevented).toBe(true);
  expect(errors).toEqual([]);
});

test('typing in a field is left alone', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 1 });
  await page.focus('#pnm');
  const prevented = await page.evaluate(() => { const e = new KeyboardEvent('keydown', { key: '=', ctrlKey: true, bubbles: true, cancelable: true }); document.getElementById('pnm').dispatchEvent(e); return e.defaultPrevented; });
  expect(prevented).toBe(false);
  expect(errors).toEqual([]);
});

test('on a Mac the labels say Cmd', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' }));
  const { errors } = await openApp(page, { seed: 1 });
  expect(await page.getAttribute('#undo', 'title')).toBe('Undo (Cmd+Z)');
  await page.click('#fileb');
  await expect(page.locator('#psvm')).toContainText('Cmd+S');   // the File menu shows the shortcut beside the item
  await page.keyboard.press('Escape');
  expect(await page.getAttribute('#cmdkb', 'title')).toContain('Cmd+K');
  expect(errors).toEqual([]);
});

test('on Windows and Linux the labels still say Ctrl', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 1 });
  expect(await page.getAttribute('#undo', 'title')).toBe('Undo (Ctrl+Z)');
  expect(errors).toEqual([]);
});
