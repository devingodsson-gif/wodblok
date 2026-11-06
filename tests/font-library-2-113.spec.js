// 2.113.0 (owner Nov 5 2026: anything imported can be renamed, in the folder system; fonts get a font library with folders): your fonts in the Text panel's Fonts group,
// the shared folder tree with rows. Add font takes font files; a click uses the font for the text; a double-click renames it (the Font menu shows the new name and the
// text keeps its font); a font a text uses cannot be deleted; the name is kept for next time. (The font is one the app ships, OFL, loaded as if it were yours.)
const path = require('path');
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const FONT = path.join(__dirname, '..', 'src', 'fonts', 'text', 'holtwood.woff');
const st = async page => JSON.parse(await H.getState(page));

test('a font added in the Fonts library is used, renamed with a double-click, kept by the text, and named so in the Font menu', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await H.openPanel(page, 'text');
  const pane = page.locator('#fnpane');
  await expect(pane.locator('[data-fnadd]')).toBeVisible();
  await expect(page.locator('section.pn[data-p="text"] label[for="tx_file"]'), 'the old Load a font file button is gone').toHaveCount(0);
  await pane.locator('.fnfile').setInputFiles(FONT); await H.settle(page);
  const row = pane.locator('[data-fn]').first();
  await expect(row).toBeVisible();
  const id = await row.getAttribute('data-fn');
  expect(id).toMatch(/^u-/);
  await expect(page.locator('#tx_f')).toHaveValue(id);
  // rename: a double-click
  await row.dblclick(); await page.waitForTimeout(400);
  const inp = pane.locator('.fform input');
  await expect(inp).toBeFocused();
  await inp.fill('Poster Slab'); await inp.press('Enter'); await H.settle(page);
  await expect(pane.locator('[data-fn] b').first()).toHaveText('Poster Slab');
  await expect(page.locator(`#tx_f option[value="${id}"]`)).toHaveText('Poster Slab');
  // the name is kept: after a reload the font loads again under it
  await page.reload(); await page.waitForFunction(() => window.__wbTest); await H.settle(page);
  await H.openPanel(page, 'text');
  await expect(page.locator(`#tx_f option[value="${id}"]`)).toHaveText('Poster Slab', { timeout: 10000 });
  await expect(page.locator('#fnpane [data-fn] b').first()).toHaveText('Poster Slab');
  expect(errors).toEqual([]);
});

test('a font no text uses can be deleted from the library; it leaves the Font menu', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await H.openPanel(page, 'text');
  const pane = page.locator('#fnpane');
  await pane.locator('.fnfile').setInputFiles(FONT); await H.settle(page);
  const id = await pane.locator('[data-fn]').first().getAttribute('data-fn');
  await page.evaluate(() => { const s = document.getElementById('tx_f'); s.value = 'cinzel'; s.dispatchEvent(new Event('input', { bubbles: true })); }); await H.settle(page);   // another font for the text (the menu is the app's own dropdown)
  // delete: the row's right-click menu, as in every library
  await pane.locator(`[data-fn="${id}"]`).click({ button: 'right' });
  await page.locator('[role="menuitem"]', { hasText: 'Delete' }).last().click(); await H.settle(page);
  await expect(pane.locator(`[data-fn="${id}"]`)).toHaveCount(0);
  await expect(page.locator(`#tx_f option[value="${id}"]`)).toHaveCount(0);
  expect(JSON.parse(await page.evaluate(() => window.__wbTest.kv.get('wb17_fonts') || '{}'))).toEqual({});
  expect(errors).toEqual([]);
});
