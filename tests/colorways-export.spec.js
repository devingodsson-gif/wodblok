const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'Colorways export is new in the modular build'); });

test('Colorways batch export helpers sanitize filenames and bound raster dimensions', async ({ page }) => {
  const { errors } = await openApp(page);
  const result = await page.evaluate(() => {
    const api = window.__wbTest.colorwaysExport;
    return {
      clean: api.fileBase('  Night / Ink: 02  '),
      empty: api.fileBase('///'),
      small: api.sizeOf(10),
      large: api.sizeOf(20000),
      dims: api.dimsOf(2048),
      controls: ['cw-format','cw-size','cw-dpi','cw-export-selected','cw-export-all'].every(id => !!document.getElementById(id))
    };
  });
  expect(result.clean).toBe('Night-Ink-02');
  expect(result.empty).toBe('Colorway');
  expect(result.small).toBe(256);
  expect(result.large).toBe(8192);
  expect(result.dims).toHaveLength(2);
  expect(result.controls).toBe(true);
  expect(errors).toEqual([]);
});

test('selected Colorways export creates one ZIP without changing the current project', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colorways');
  await page.click('#cw-add');
  await page.click('#cw-add');
  await page.locator('#cw-list .cw-pick').nth(1).check();
  const before = await page.evaluate(() => window.__wbTest.state());
  await page.click('#cw-export-selected');
  await page.waitForFunction(() => window.__wbDownloads.length === 1, null, { timeout: 60000 });
  const result = await page.evaluate(() => ({
    download: window.__wbDownloads[0],
    after: window.__wbTest.state(),
    note: document.getElementById('cw-export-note').textContent
  }));
  expect(result.download.filename).toMatch(/-colorways\.zip$/);
  expect(result.download.type).toBe('application/zip');
  expect(result.download.base64.slice(0, 5)).toBe('UEsDB');
  expect(result.after).toBe(before);
  expect(result.note).toMatch(/Exported 1 colorway to ZIP/);
  expect(errors).toEqual([]);
});

test('Colorways rows have independent export-selection checkboxes', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colorways');
  await page.click('#cw-add');
  await page.click('#cw-add');
  const boxes = page.locator('#cw-list .cw-pick');
  await expect(boxes).toHaveCount(2);
  await boxes.nth(1).check();
  const result = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#cw-list .cw-row')];
    const boxes = [...document.querySelectorAll('#cw-list .cw-pick')];
    return { rows: rows.length, ids: boxes.map(b => b.value), selected: boxes.filter(b => b.checked).map(b => b.value) };
  });
  expect(result.rows).toBe(2);
  expect(result.ids).toHaveLength(2);
  expect(result.selected).toEqual([result.ids[1]]);
  expect(errors).toEqual([]);
});
