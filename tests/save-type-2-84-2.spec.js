// 2.84.2 (T5): the Save dialog offers the file's own type (PNG for a .png), not a bare "file".
const { test, expect } = require('@playwright/test');
const { openApp, openPanel } = require('./helpers/harness');

test('Export as PNG asks the Save dialog for a PNG type with a name, not an untyped "file"', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5, runtime: 'none' });
  await openPanel(page, 'xrec');
  await page.evaluate(() => {
    window.__opts = null;
    window.showSaveFilePicker = async o => { window.__opts = o; return { createWritable: async () => ({ write: async () => {}, close: async () => {} }) }; };
  });
  await page.click('#xrnow');
  await expect.poll(() => page.evaluate(() => window.__opts), { timeout: 60000 }).not.toBeNull();
  const o = await page.evaluate(() => window.__opts);
  expect(o.suggestedName).toMatch(/\.png$/);
  expect(o.types).toHaveLength(1);
  expect(o.types[0].description).toBe('PNG image');
  expect(o.types[0].accept).toEqual({ 'image/png': ['.png'] });
  expect(errors).toEqual([]);
});
