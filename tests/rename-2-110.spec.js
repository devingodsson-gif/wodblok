// 2.110.0 (owner Nov 5 2026: anything imported can be renamed, as a change to the whole folder system; he chose a double-click): a double-click on one of your
// items in any library opens Rename (the shared tree, 87-library-tree.js, and the shape library, 21-motif-library-ui.js). The click on one of your items waits a
// moment so a double-click does not also add or apply it; a single click still does, and built-in items are at once.
const path = require('path');
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const IMG = path.join(__dirname, 'fixtures', 'picture.png');
const st = async page => JSON.parse(await H.getState(page));
const images = async page => (await st(page)).els.filter(q => q.k === 'image').length;

test('a picture in the library is renamed with a double-click, and is not added by it', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await page.click('#elb [data-k="image"]'); await H.settle(page);
  await page.setInputFiles('section.pn[data-p="image"] .pcfile', IMG); await H.settle(page, { max: 30000 });
  expect(await images(page)).toBe(1);
  await page.keyboard.press('Escape'); await H.settle(page);   // nothing selected: a click on a picture adds it
  const tile = page.locator('#impane [data-pc]').first();
  await expect(tile).toBeVisible();
  await tile.dblclick(); await page.waitForTimeout(500); await H.settle(page);
  expect(await images(page), 'the double-click did not add the picture').toBe(1);
  const inp = page.locator('#impane .fform input');
  await expect(inp).toBeFocused();
  await inp.fill('Sea wall'); await inp.press('Enter'); await H.settle(page);
  await expect(page.locator('#pmsg')).toContainText('Sea wall');
  await expect(page.locator('#impane [data-pc] b').first()).toHaveText('Sea wall');
  // a single click still adds it, a moment later
  await page.locator('#impane [data-pc]').first().click(); await page.waitForTimeout(500); await H.settle(page);
  expect(await images(page), 'a single click adds the picture').toBe(2);
  expect(errors).toEqual([]);
});

test('an imported shape is renamed with a double-click; a built-in one is not', async ({ page }) => {
  const { errors } = await H.openApp(page);
  await page.evaluate(() => window.__wbTest.kv.set('wb2_cust', JSON.stringify({ 'i|t1': { n: 'Blob', svg: '<path d="M-20 -20L20 -20L20 20Z" fill="FILL" fill-rule="evenodd"/>', imp: 1 } })));
  await page.reload(); await page.waitForFunction(() => window.__wbTest); await H.settle(page);
  await H.openPanel(page, 'motifs');
  const imp = page.locator('#lib .lfr[data-f="i"]');
  if ((await imp.getAttribute('aria-expanded')) !== 'true') await imp.click();
  const sh = page.locator('#lib button[data-m="i|t1"]');
  await expect(sh).toBeVisible();
  await sh.dblclick(); await page.waitForTimeout(400);
  await expect(page.locator('#fname')).toBeFocused();
  await expect(page.locator('#fname')).toHaveValue('Blob');
  expect(await page.evaluate(() => !!document.querySelector('#lib button[data-m="i|t1"].on')), 'the double-click did not arm the shape').toBe(false);
  await page.fill('#fname', 'Leaf'); await page.press('#fname', 'Enter'); await H.settle(page);
  await expect(page.locator('#lib button[data-m="i|t1"]')).toHaveAttribute('aria-label', 'Leaf');
  // a built-in shape: a double-click opens nothing
  const b0 = page.locator('#lib button[data-m^="b"]').first();
  if (await b0.count()) { await b0.dblclick(); await page.waitForTimeout(400); await expect(page.locator('#fform')).toBeHidden(); }
  expect(errors).toEqual([]);
});
