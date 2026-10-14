// 1.0.4: Save project writes the .wodblok file (and nothing else); the top bar has no Export button (images are exported from the Export
// tool); a new, untouched document shows no unsaved dot.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

async function roll(page) {
  await page.click('#rzbar');
  await settle(page, { max: 60000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
}

test('a fresh launch shows no unsaved dot, and making a change shows it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  await page.waitForTimeout(1800);                                   // the dot repaints every 0.8 s
  await expect(page.locator('#pst')).not.toHaveClass(/dirty/);
  await roll(page);
  await page.waitForTimeout(1000);
  await expect(page.locator('#pst')).toHaveClass(/dirty/);
  expect(errors).toEqual([]);
});

test('the top bar has Save project but no Export; the File menu has only project items; the Export tool holds the image exports', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('#expb')).toHaveCount(0);
  await expect(page.locator('#psv')).toHaveText('Save project');
  await page.click('#fileb');
  await expect(page.locator('#filem > button, #filem > label')).toHaveText(['New project', 'Clear canvas', 'Open project…']);
  await page.keyboard.press('Escape');
  await openPanel(page, 'xrec');
  await page.locator('.xrmore summary').click(); // secondary one-off exports are intentionally collapsed
  for (const id of ['png', 'sv', 'cpy', 'xrnow']) await expect(page.locator('#' + id)).toBeVisible();
  expect(errors).toEqual([]);
});

test('Save project downloads a .wodblok file and clears the dot; the next change brings the dot back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#psv');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  expect(dl.filename).toMatch(/\.wodblok$/);
  const files = Object.keys(require('fflate').unzipSync(new Uint8Array(Buffer.from(dl.base64, 'base64'))));
  expect(files).toContain('project.json');
  await page.waitForTimeout(1000);
  await expect(page.locator('#pst')).not.toHaveClass(/dirty/);
  await roll(page);
  await page.waitForTimeout(1000);
  await expect(page.locator('#pst')).toHaveClass(/dirty/);
  expect(errors).toEqual([]);
});

test('where the browser can write files, the first Save asks where and the next Save writes into the same file', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5, runtime: 'none' });
  await page.evaluate(() => {
    window.__pickerCalls = 0; window.__written = [];
    const handle = { createWritable: async () => ({ write: async d => { window.__written.push(d); }, close: async () => {} }) };
    window.showSaveFilePicker = async () => { window.__pickerCalls++; return handle; };
  });
  await roll(page);
  await page.click('#psv');
  await expect(page.locator('#pmsg')).toContainText('Saved');
  expect(await page.evaluate(() => window.__pickerCalls)).toBe(1);
  await roll(page);
  await page.click('#psv');
  await expect.poll(() => page.evaluate(() => window.__written.length)).toBe(2);
  expect(await page.evaluate(() => window.__pickerCalls)).toBe(1);
  expect(errors).toEqual([]);
});
