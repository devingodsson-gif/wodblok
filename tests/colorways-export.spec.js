const { test, expect } = require('@playwright/test');
const { TARGET, openApp } = require('./helpers/harness');

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
  expect(result.clean).toBe('Night - Ink 02');
  expect(result.empty).toBe('Colorway');
  expect(result.small).toBe(256);
  expect(result.large).toBe(8192);
  expect(result.dims).toHaveLength(2);
  expect(result.controls).toBe(true);
  expect(errors).toEqual([]);
});

test('Colorways rows have independent export-selection checkboxes', async ({ page }) => {
  const { errors } = await openApp(page);
  const result = await page.evaluate(() => {
    const api = window.__wbTest.colorways;
    api.setList([
      { id: 'cw-one', name: 'Warm Paper', colors: { bg: '#FFFFFF', ink: '#222222' } },
      { id: 'cw-two', name: 'Night Print', colors: { bg: '#111111', ink: '#EEEEEE' } }
    ]);
    const rows = [...document.querySelectorAll('#cw-list .cw-row')];
    const boxes = [...document.querySelectorAll('#cw-list .cw-pick')];
    boxes[1].checked = true;
    boxes[1].dispatchEvent(new Event('change', { bubbles: true }));
    return { rows: rows.length, ids: boxes.map(b => b.value), selected: boxes.filter(b => b.checked).map(b => b.value) };
  });
  expect(result.rows).toBe(2);
  expect(result.ids).toEqual(['cw-one','cw-two']);
  expect(result.selected).toEqual(['cw-two']);
  expect(errors).toEqual([]);
});
