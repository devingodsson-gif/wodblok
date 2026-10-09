// Export recipes (Phase 5): saved export settings; click one to export with it; export all as one zip.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const row = (page, name) => page.locator('#xrl .xrr', { hasText: name });
const downloads = page => page.evaluate(() => window.__wbDownloads.map(d => ({ filename: d.filename, type: d.type, size: (d.base64 || '').length })));
// pixel size of a downloaded PNG or JPG
const pixels = (page, i) => page.evaluate(async i => {
  const d = window.__wbDownloads[i], bin = atob(d.base64), u = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
  const bm = await createImageBitmap(new Blob([u], { type: d.type })); return [bm.width, bm.height];
}, i);

test('a starting recipe exports a picture of the right size, with its ending in the file name', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'xrec');
  await expect(page.locator('#xrd')).toHaveText(/\d+ × \d+ px/);
  await row(page, 'Preview').click();                                          // JPG, 800 px long side
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  const d = await downloads(page);
  expect(d[0].filename).toMatch(/-preview\.jpg$/);
  const [w, h] = await pixels(page, 0);
  expect(Math.max(w, h)).toBe(800);
  expect(Math.abs(w / h - 2 / 3)).toBeLessThan(0.01);
  await expect(page.locator('#pmsg')).toContainText('Exported');
  expect(errors).toEqual([]);
});

test('the settings: format, long side and ending; SVG needs no size; "Export now" uses them', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'xrec');
  await page.fill('#xrpx', '1000'); await page.fill('#xrsfx', 'my web');
  await expect(page.locator('#xrd')).toHaveText('666 × 1000 px');
  await page.click('#xrnow');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  expect((await downloads(page))[0].filename).toMatch(/-my-web\.png$/);
  expect(await pixels(page, 0)).toEqual([666, 1000]);
  await page.click('#xrf [data-f="svg"]');
  await expect(page.locator('#xrpx')).toBeDisabled();
  await expect(page.locator('#xrd')).toHaveText('Vector, any size');
  await page.click('#xrnow');
  await page.waitForFunction(() => window.__wbDownloads.length > 1);
  expect((await downloads(page))[1].filename).toMatch(/\.svg$/);
  // too large a size is held to the limit
  await page.click('#xrf [data-f="png"]'); await page.fill('#xrpx', '99999'); await page.locator('#xrpx').blur();
  await expect(page.locator('#xrpx')).toHaveValue('8192');
  expect(errors).toEqual([]);
});

test('save a recipe, use it, rename it, keep it after a reload, delete it', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'xrec');
  await page.click('#xrf [data-f="jpg"]'); await page.fill('#xrpx', '1200'); await page.fill('#xrsfx', 'mine');
  await page.fill('#xrn', 'Mine'); await page.click('#xrsave');
  await expect(row(page, 'Mine')).toBeVisible();
  await expect(row(page, 'Mine').locator('small')).toHaveText('JPG · 1200 px');
  await page.click('#xrf [data-f="png"]'); await page.fill('#xrpx', '300');   // change the settings, then use the recipe
  await row(page, 'Mine').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  expect((await downloads(page))[0].filename).toMatch(/-mine\.jpg$/);
  expect(Math.max(...await pixels(page, 0))).toBe(1200);
  await expect(page.locator('#xrpx')).toHaveValue('1200');                      // clicking a recipe also loads its settings
  await row(page, 'Mine').locator('[data-act="ren"]').click();
  await page.locator('#xrl .xrr input').fill('Mine two'); await page.keyboard.press('Enter');
  await expect(row(page, 'Mine two')).toBeVisible();
  await page.reload(); await page.waitForFunction(() => window.__wbTest);
  await openPanel(page, 'xrec');
  await expect(row(page, 'Mine two')).toBeVisible();
  await row(page, 'Mine two').locator('[data-act="del"]').click();
  await expect(row(page, 'Mine two')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Export all makes every recipe in one zip', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'xrec');
  await page.fill('#xrn', 'Tiny'); await page.fill('#xrpx', '300'); await page.click('#xrsave');
  await page.click('#xrall');
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 60000 });
  const d = await downloads(page);
  expect(d).toHaveLength(1);
  expect(d[0].filename).toMatch(/-exports\.zip$/);
  const names = await page.evaluate(() => {
    const b = atob(window.__wbDownloads[0].base64), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    const out = []; const dv = new DataView(u.buffer);
    for (let i = 0; i + 30 < u.length; i++) if (dv.getUint32(i, true) === 0x04034b50) { const n = dv.getUint16(i + 26, true), e = dv.getUint16(i + 28, true); out.push(new TextDecoder().decode(u.subarray(i + 30, i + 30 + n))); i += 29 + n + e; }
    return out;
  });
  expect(names.length).toBe(4);                                                  // the three starting recipes and Tiny
  expect(names.some(n => /-web\.png$/.test(n))).toBe(true);
  expect(names.some(n => /-print\.png$/.test(n))).toBe(true);
  expect(names.some(n => /-preview\.jpg$/.test(n))).toBe(true);
  expect(errors).toEqual([]);
});
