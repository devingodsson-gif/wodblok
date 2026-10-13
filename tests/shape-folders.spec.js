// Shape library folders (1.2.14): one list of every folder (built-in sets and your own, A to Z, My imports first), folders inside
// folders, the folder menu (rename, move, delete; hide for a set), moving shapes, and imports landing in the folder that is open.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in 1.2.14'); });

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
const rows = page => page.locator('#lfold .lfr .lfn').allTextContents();
async function open(page) { const r = await openApp(page); await setMode(page, 'stamp'); await openPanel(page, 'motifs'); return r; }
// pick from one of the app's styled dropdowns (they stand in for the native <select>)
async function pick(page, sel, v) {
  await page.locator(sel).locator('xpath=following-sibling::div[contains(@class,"dd2")][1]/button').click();
  await page.locator(`.ddl:not([hidden]) .ddi[data-v="${v}"]`).click();
}
async function mkFolder(page, name) { await page.click('#fnew'); await page.fill('#fname', name); await page.click('#fok'); await settle(page); }

test('the library opens on one A-Z list of every folder; folders can be made at the top and inside other folders', async ({ page }) => {
  const { errors } = await open(page);
  await expect(page.locator('#lcr')).toHaveText('All folders');
  await expect(page.locator('#lib')).toBeHidden();
  let names = await rows(page);
  expect(names[0]).toBe('My imports');
  expect(names).toContain('Wodblok shapes');                            // the built-in sets all sit inside Wodblok shapes
  expect(names).not.toContain('Flowers');
  await mkFolder(page, 'Florals');                                  // a new folder opens straight away
  await expect(page.locator('#lcr')).toHaveText('Florals');
  await mkFolder(page, 'Tulips');                                   // made inside the open folder
  await expect(page.locator('#lcr')).toHaveText('Florals/Tulips');
  await page.click('#lback');
  await expect(page.locator('#lcr')).toHaveText('Florals');
  expect(await rows(page)).toEqual(['Tulips']);
  await page.click('#lback');
  names = await rows(page);
  const rest = names.slice(1);
  expect(rest).toContain('Florals');
  expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));   // A to Z
  await page.click('#lfold [data-f="g:Wodblok shapes"]');
  expect(await rows(page)).toEqual(['Ancient Egypt', 'Birds', 'Boats & Water Travel', 'Buildings & Places', 'Christian & Biblical', 'Clothing & Accessories', 'Fire & Light', 'Flowers', 'Food & Farming', 'Geometric Shapes & Symbols', 'Greek & Mythology', 'Household & Tools', 'Landscape, Sky & Weather', 'Mammals', 'Music, Writing & Arts', 'Ornaments & Patterns', 'Reptiles, Insects & Amphibians', 'Sea Life', 'Trees, Leaves & Plants', 'Weapons & Armor']);
  await expect(page.locator('#fmore')).toBeHidden();                // Wodblok shapes cannot be renamed, moved or deleted
  // a folder inside a built-in set
  await page.click('#lfold [data-f="b:Flowers"]');
  await expect(page.locator('#lcr')).toHaveText('Wodblok shapes/Flowers');
  await expect(page.locator('#lib button[data-m]')).toHaveCount(55);
  await mkFolder(page, 'Mine');
  await expect(page.locator('#lcr')).toHaveText('Wodblok shapes/Flowers/Mine');
  await page.click('#lcr [data-f="b:Flowers"]');
  expect(await rows(page)).toEqual(['Mine']);
  await expect(page.locator('#lib button[data-m]')).toHaveCount(55);
  await page.click('#lback');
  await expect(page.locator('#lcr')).toHaveText('Wodblok shapes');
  expect(errors).toEqual([]);
});

test('a sheet imports into the folder that is open; with the folder list open, imports go to My imports', async ({ page }) => {
  const { errors } = await open(page);
  await mkFolder(page, 'Florals');
  await mkFolder(page, 'Tulips');
  await expect(page.locator('#idest')).toHaveText('Florals / Tulips');
  await page.setInputFiles('#sfile', await sheet(page));
  await expect(page.locator('#idlg')).toBeVisible();
  await expect(page.locator('#imode [data-m="sheet"]')).toHaveClass(/on/);
  await expect(page.locator('#ifold')).toHaveValue('g:Florals/Tulips');
  await expect(page.locator('#iadd')).toHaveText('Import 16 shapes');
  await page.click('#iadd');
  await settle(page);
  await expect(page.locator('#idlg')).toBeHidden();
  await expect(page.locator('#lcr')).toHaveText('Florals/Tulips');
  await expect(page.locator('#lib button[data-m]')).toHaveCount(16);
  // the count on a folder includes the folders inside it
  await page.click('#lback'); await page.click('#lback');
  await expect(page.locator('#lfold [data-f="g:Florals"] .lfc')).toHaveText('16');
  // from the folder list: a single image goes to My imports, and can be switched to a sheet in the same window
  await expect(page.locator('#idest')).toHaveText('My imports');
  await page.setInputFiles('#ifile', await sheet(page));
  await expect(page.locator('#imode [data-m="one"]')).toHaveClass(/on/);
  await expect(page.locator('#ifold')).toHaveValue('i');
  await expect(page.locator('#iadd')).toHaveText('Add shape');
  await page.click('#imode [data-m="sheet"]');
  await expect(page.locator('#iadd')).toHaveText('Import 16 shapes');
  await page.click('#imode [data-m="one"]');
  await page.click('#iadd');
  await settle(page);
  await expect(page.locator('#lcr')).toHaveText('My imports');
  await expect(page.locator('#lib button[data-m]')).toHaveCount(1);
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
  await expect(page.locator('#lcr')).toHaveText('Dots sheet');
  await expect(page.locator('#lib button[data-m]')).toHaveCount(16);
  expect(errors).toEqual([]);
});

test('folder menu: rename and move keep what is inside; delete sends imports back to My imports; a set can be hidden', async ({ page }) => {
  const { errors } = await open(page);
  await mkFolder(page, 'Florals');
  await mkFolder(page, 'Tulips');
  await page.setInputFiles('#sfile', await sheet(page));
  await page.click('#iadd');
  await settle(page);
  // rename the outer folder: the inner one and its shapes follow
  await page.click('#lcr [data-f="g:Florals"]');
  await page.click('#fmore');
  await page.click('.rowm button:has-text("Rename")');
  await page.fill('#fname', 'Flowers');
  await page.click('#fok');
  await settle(page);
  await expect(page.locator('#lcr')).toHaveText('Flowers');
  await expect(page.locator('#lfold [data-f="g:Flowers/Tulips"] .lfc')).toHaveText('16');
  // move Tulips to the top level
  await page.click('#lfold [data-f="g:Flowers/Tulips"]');
  await page.click('#fmore');
  await page.click('.rowm button:has-text("Move to")');
  await pick(page, '#fdest', '/');
  await page.click('#fok');
  await settle(page);
  await expect(page.locator('#lcr')).toHaveText('Tulips');
  await expect(page.locator('#lib button[data-m]')).toHaveCount(16);
  // delete it: asks first, then its imports go back to My imports
  await page.click('#fmore');
  await page.click('.rowm button:has-text("Delete folder")');
  await expect(page.locator('#fq')).toHaveText('Delete “Tulips”?');
  await page.click('#fok');
  await settle(page);
  await expect(page.locator('#lcr')).toHaveText('All folders');
  await expect(page.locator('#lfold [data-f="g:Tulips"]')).toHaveCount(0);
  await expect(page.locator('#lfold [data-f="i"] .lfc')).toHaveText('16');
  // hide a built-in set: it moves under Hidden sets
  await page.click('#lfold [data-f="g:Wodblok shapes"]');
  await page.click('#lfold [data-f="b:Birds"]');
  await page.click('#fmore');
  await page.click('.rowm button:has-text("Hide")');
  await page.click('#lback');                                       // a hidden set goes back to the folder list
  await expect(page.locator('#lfold .lfr[data-f="b:Birds"]')).toHaveCount(0);
  await expect(page.locator('#lfold .lfr[data-f="g:Wodblok shapes"]')).toHaveCount(1);
  await page.click('#lhid');
  await expect(page.locator('#lfold .lfr.hid[data-f="b:Birds"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('selected shapes move to a folder, and a shape dragged onto a folder moves there', async ({ page }) => {
  const { errors } = await open(page);
  await mkFolder(page, 'Picks');
  await page.click('#lback');
  await page.click('#lfold [data-f="g:Wodblok shapes"]');
  await page.click('#lfold [data-f="b:Flowers"]');
  await page.click('#fsel');
  await page.locator('#lib button[data-m]').nth(0).click();
  await page.locator('#lib button[data-m]').nth(1).click();
  await expect(page.locator('#fscnt')).toHaveText('2 selected');
  await pick(page, '#fmove', 'g:Picks');
  await settle(page);
  await page.click('#fdone');
  await page.click('#lback');
  await page.click('#lback');
  await expect(page.locator('#lfold [data-f="g:Picks"] .lfc')).toHaveText('2');
  // drag a third shape onto a folder inside the set
  await page.click('#lfold [data-f="g:Wodblok shapes"]');
  await page.click('#lfold [data-f="b:Flowers"]');
  await mkFolder(page, 'Sub');
  await page.click('#lcr [data-f="b:Flowers"]');
  const tile = page.locator('#lib button[data-m]').nth(5), row = page.locator('#lfold [data-f="g:b:Flowers/Sub"]');
  const a = await tile.boundingBox(), b = await row.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await expect(row).toHaveClass(/dropt/);
  await page.mouse.up();
  await settle(page);
  await expect(page.locator('#lfold [data-f="g:b:Flowers/Sub"] .lfc')).toHaveText('1');
  const items = await page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles[0].items.length);
  expect(items).toBe(0);                                              // dropping on a folder does not stamp it
  expect(errors).toEqual([]);
});

test('your own folders can be moved into Wodblok shapes, which itself cannot be changed', async ({ page }) => {
  const { errors } = await open(page);
  await mkFolder(page, 'Florals');
  await page.click('#fmore');
  await page.click('.rowm button:has-text("Move to")');
  await pick(page, '#fdest', 'g:Wodblok shapes');
  await page.click('#fok');
  await settle(page);
  await expect(page.locator('#lcr')).toHaveText('Wodblok shapes/Florals');
  await page.click('#lback');
  expect(await rows(page)).toEqual(['Ancient Egypt', 'Birds', 'Boats & Water Travel', 'Buildings & Places', 'Christian & Biblical', 'Clothing & Accessories', 'Fire & Light', 'Florals', 'Flowers', 'Food & Farming', 'Geometric Shapes & Symbols', 'Greek & Mythology', 'Household & Tools', 'Landscape, Sky & Weather', 'Mammals', 'Music, Writing & Arts', 'Ornaments & Patterns', 'Reptiles, Insects & Amphibians', 'Sea Life', 'Trees, Leaves & Plants', 'Weapons & Armor']);
  await page.click('#lback');
  expect(await rows(page)).not.toContain('Florals');
  expect(errors).toEqual([]);
});
