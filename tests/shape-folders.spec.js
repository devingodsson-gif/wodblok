// Shape library folders: one tree of every folder (built-in sets and your own, A to Z, Yours first) that open in place (1.5.0),
// folders inside folders, each folder's menu (rename, move, delete; hide for a set), moving shapes, and imports landing in the active folder.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

// a made-up 4 x 4 sheet of black dots, drawn in the page (no image file needed)
async function sheet(page) {
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 400; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 400, 400); x.fillStyle = '#000';
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(i * 100 + 50, j * 100 + 50, 28, 0, 7); x.fill(); }
    return c.toDataURL('image/png').split(',')[1];
  });
  return { name: 'dots.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
}
const rows = page => page.locator('#lib .lrw[style="--d:0"]:not(:has(#lhid)) .lfn').allTextContents();   // the folders at the top of the tree
const row = (page, v) => page.locator(`#lib .lfr[data-f="${v}"]`);
const active = page => page.locator('#lib .lrw.act .lfn');
const tiles = page => page.locator('#lib button[data-m]');
const steady = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
// a folder's own menu (its ⋯ button)
async function menu(page, v, item) {
  const b = page.locator(`#lib .lrw:has(> .lfr[data-f="${v}"]) .lmo`);
  for (let i = 0; ; i++) {                                              // the tree can redraw while this runs (slow machine): try again, three times at most
    try { await b.scrollIntoViewIfNeeded(); await steady(page); await b.click(); break; }   // a scroll closes an open menu, so scroll first
    catch (e) { if (i >= 2) throw e; await steady(page); }
  }
  await page.locator('.rowm').getByRole('menuitem', { name: item, exact: true }).click();
}
async function open(page) { const r = await openApp(page); await openPanel(page, 'motifs'); return r; }
// pick from one of the app's styled dropdowns (they stand in for the native <select>)
async function pick(page, sel, v) {   // 2.3.3: the styled list closed itself while the Library redrew; the select is set through the page instead
  await page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);
}
async function mkFolder(page, name) { await page.click('#fnew'); await page.fill('#fname', name); await page.click('#fok'); await settle(page); }

test('the library is one tree: folders open in place, several at once, and folders can be made at the top and inside others', async ({ page }) => {
  const { errors } = await open(page);
  const names = await rows(page);
  expect(names[0]).toBe('Yours');
  expect(names).toContain('Flowers');                                   // the built-in sets sit in the same list as your folders
  await expect(tiles(page)).toHaveCount(0);                             // every folder starts closed
  await mkFolder(page, 'Florals');                                      // made at the top; it opens and becomes the active folder
  await expect(row(page, 'g:Florals')).toHaveAttribute('aria-expanded', 'true');
  await expect(active(page)).toHaveText('Florals');
  await mkFolder(page, 'Tulips');                                       // made inside the active folder
  await expect(active(page)).toHaveText('Tulips');
  await expect(page.locator('#lib .lrw:has(> [data-f="g:Florals/Tulips"])')).toHaveAttribute('style', '--d:1');
  const top = await rows(page), rest = top.slice(1);
  expect(rest).toContain('Florals');
  expect(rest).not.toContain('Tulips');
  expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));   // A to Z
  // two sets open at once: each shows its shapes under it, and every other folder stays in the list
  await row(page, 'b:Flowers').click();
  await expect(tiles(page)).toHaveCount(55);
  await row(page, 'b:Birds').click();
  await expect(tiles(page)).toHaveCount(55 + 37);
  expect(await rows(page)).toEqual(top);
  // a folder inside a set
  await menu(page, 'b:Flowers', 'New folder inside');
  await page.fill('#fname', 'Mine'); await page.click('#fok'); await settle(page);
  await expect(row(page, 'g:b:Flowers/Mine')).toBeVisible();
  await expect(tiles(page)).toHaveCount(55 + 37);
  // closing one leaves the other open
  await row(page, 'b:Birds').click();
  await expect(tiles(page)).toHaveCount(55);
  await expect(row(page, 'b:Birds')).toHaveAttribute('aria-expanded', 'false');
  // close everything
  await page.click('#ltog');
  await expect(tiles(page)).toHaveCount(0);
  await expect(page.locator('#lib .lfr[aria-expanded="true"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a sheet imports into the active folder; with no folder active, imports go to Yours', async ({ page }) => {
  const { errors } = await open(page);
  await mkFolder(page, 'Florals');
  await mkFolder(page, 'Tulips');
  await page.setInputFiles('#sfile', await sheet(page));
  await expect(page.locator('#idlg')).toBeVisible();
  await expect(page.locator('#imode [data-m="sheet"]')).toHaveClass(/on/);
  await expect(page.locator('#ifold')).toHaveValue('g:Florals/Tulips');
  await expect(page.locator('#iadd')).toHaveText('Import 16 shapes');
  await page.click('#iadd');
  await settle(page);
  await expect(page.locator('#idlg')).toBeHidden();
  await expect(active(page)).toHaveText('Tulips');
  await expect(tiles(page)).toHaveCount(16);
  await expect(page.locator('#lib [data-f="g:Florals"] .lfc')).toHaveText('16');   // a folder's count includes the folders inside it
  // with everything closed: a single image goes to Yours, and can be switched to a sheet in the same window
  await page.click('#ltog');
  await page.setInputFiles('#ifile', await sheet(page));
  await expect(page.locator('#imode [data-m="one"]')).toHaveClass(/on/);
  await expect(page.locator('#ifold')).toHaveValue('i');
  await expect(page.locator('#iadd')).toHaveText('Add shape');
  await page.click('#imode [data-m="sheet"]');
  await expect(page.locator('#iadd')).toHaveText('Import 16 shapes');
  await page.click('#imode [data-m="one"]');
  await page.click('#iadd');
  await settle(page);
  await expect(active(page)).toHaveText('Yours');
  await expect(tiles(page)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('the import window can save into another folder, or a new one', async ({ page }) => {
  const { errors } = await open(page);
  await page.setInputFiles('#sfile', await sheet(page));
  await pick(page, '#ifold', '+');
  await expect(page.locator('#ifnew')).toBeVisible();
  await page.fill('#ifnew', 'Dots sheet');
  await page.click('#iadd');
  await settle(page);
  await expect(active(page)).toHaveText('Dots sheet');
  await expect(tiles(page)).toHaveCount(16);
  expect(errors).toEqual([]);
});

test('folder menu: rename and move keep what is inside; delete sends imports back to Yours; a set can be hidden', async ({ page }) => {
  const { errors } = await open(page);
  await mkFolder(page, 'Florals');
  await mkFolder(page, 'Tulips');
  await page.setInputFiles('#sfile', await sheet(page));
  await page.click('#iadd');
  await settle(page);
  // rename the outer folder: the inner one and its shapes follow, and both stay open
  await menu(page, 'g:Florals', 'Rename');
  await expect(page.locator('#fname')).toHaveValue('Florals');
  await page.fill('#fname', 'Flowers');
  await page.click('#fok');
  await settle(page);
  await expect(row(page, 'g:Flowers')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#lib [data-f="g:Flowers/Tulips"] .lfc')).toHaveText('16');
  await expect(tiles(page)).toHaveCount(16);
  // move Tulips to the top level
  await menu(page, 'g:Flowers/Tulips', 'Move to…');
  await pick(page, '#fdest', '/');
  await page.click('#fok');
  await settle(page);
  await expect(page.locator('#lib .lrw:has(> [data-f="g:Tulips"])')).toHaveAttribute('style', '--d:0');
  await expect(tiles(page)).toHaveCount(16);
  // delete it: asks first, then its imports go back to Yours
  await menu(page, 'g:Tulips', 'Delete folder');
  await expect(page.locator('#fq')).toHaveText('Delete “Tulips”?');
  await page.click('#fok');
  await settle(page);
  await expect(row(page, 'g:Tulips')).toHaveCount(0);
  await expect(page.locator('#lib [data-f="i"] .lfc')).toHaveText('16');
  // hide a built-in set: it moves under Hidden sets
  await menu(page, 'b:Birds', 'Hide from the list');
  await expect(page.locator('#lib .lrw:not(.hid) .lfr[data-f="b:Birds"]')).toHaveCount(0);
  await page.click('#lhid');
  await expect(page.locator('#lib .lrw.hid .lfr[data-f="b:Birds"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('selected shapes move to a folder, and a shape dragged onto a folder moves there', async ({ page }) => {
  const { errors } = await open(page);
  await mkFolder(page, 'Picks');
  await page.click('#ltog');
  await row(page, 'b:Flowers').click();
  await page.click('#fsel');
  await tiles(page).nth(0).click();
  await tiles(page).nth(1).click();
  await expect(page.locator('#fscnt')).toHaveText('2 selected');
  await pick(page, '#fmove', 'g:Picks');
  await settle(page);
  await page.click('#fdone');
  await expect(page.locator('#lib [data-f="g:Picks"] .lfc')).toHaveText('2');
  // drag a third shape onto a folder inside the set
  await menu(page, 'b:Flowers', 'New folder inside');
  await page.fill('#fname', 'Sub'); await page.click('#fok'); await settle(page);
  const tile = tiles(page).nth(5), r = row(page, 'g:b:Flowers/Sub');
  const a = await tile.boundingBox(), b = await r.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await expect(r).toHaveClass(/dropt/);
  await page.mouse.up();
  await settle(page);
  await expect(page.locator('#lib [data-f="g:b:Flowers/Sub"] .lfc')).toHaveText('1');
  const items = await page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles[0].items.length);
  expect(items).toBe(0);                                              // dropping on a folder does not stamp it
  expect(errors).toEqual([]);
});
