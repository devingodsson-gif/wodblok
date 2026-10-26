// 2.51.2 (owner Oct 26 2026: every library works exactly like the Shapes library): the saved-stamps library is the shared folder tree: folders, select mode, drag onto a folder,
// the right-click menu, Export to a zip of stamp files and Import of stamp files and zips.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), os = require('os'), path = require('path');
const { zipSync, unzipSync } = require('fflate');
const { openApp, openPanel, settle, stampMenu } = require('./helpers/harness');

const T = '#slgrid';
// the saved stamps, as the test runtime's account database keeps them (window.__wbDb: path -> {id: record})
const store = page => page.evaluate(() => { const d = window.__wbDb || {}, k = Object.keys(d).find(x => /\/stamps$/.test(x)); return k ? d[k] : {}; });
const tmp = (name, data) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-sl-')), f = path.join(d, name); fs.writeFileSync(f, data); return f; };
const pick = (page, sel, v) => page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);
async function save(page, ...names) { for (const n of names) { await page.fill('#slname', n); await page.click('#slsave'); await settle(page); } }
async function makeFolder(page, name) {
  await page.click('[data-slnew]'); await page.fill(`${T} .fform input`, name); await page.click(`${T} [data-fok]`);
  await expect(page.locator(`${T} .lfr[data-k="${name}"]`)).toHaveCount(1);
}
const tiles = page => page.locator(`${T} button[data-sl]`);

test('stamps sit in Yours; folders, select mode, Move to and Take out keep each stamp\'s folder', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  await save(page, 'Lion in a ring', 'Red fish');
  await expect(tiles(page)).toHaveCount(2);
  await expect(page.locator('#slcount')).toHaveText('2');
  await makeFolder(page, 'Birds');
  await page.click('[data-slsel]');
  await tiles(page).filter({ has: page.locator('img') }).first().click();
  await pick(page, '.slmv', 'Birds'); await settle(page);
  await expect(page.locator('#pmsg')).toContainText('to “Birds”');
  await expect(page.locator(`${T} .lfr[data-k="Birds"] .lfc`)).toHaveText('1');
  const moved = Object.values(await store(page)).filter(r => r.g === 'Birds');
  expect(moved.length).toBe(1);
  await page.locator(`${T} button[data-sl][aria-label="${moved[0].name}"]`).click();   // the moved stamp (Birds is open after a move)
  await page.click('.slout'); await settle(page);
  await expect(page.locator(`${T} .lfr[data-k="Birds"] .lfc`)).toHaveText('0');
  expect(Object.values(await store(page)).every(r => !r.g)).toBe(true);
  expect(errors).toEqual([]);
});

test('a stamp tile can be dragged onto a folder; the menu renames and deletes', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  await save(page, 'Lion in a ring');
  await makeFolder(page, 'Cats');
  const tile = tiles(page).first(), row = page.locator(`${T} .lfr[data-k="Cats"]`);
  await tile.scrollIntoViewIfNeeded(); await settle(page);
  const a = await tile.boundingBox(), b = await row.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + 40, b.y + b.height / 2, { steps: 8 }); await expect(row).toHaveClass(/dropt/); await page.mouse.up(); await settle(page);
  expect(Object.values(await store(page))[0].g).toBe('Cats');
  await expect(page.locator('#slgrid')).toBeVisible();
  await stampMenu(page, 'Rename'); await page.fill(`${T} .fform input`, 'Big cat'); await page.click(`${T} [data-fok]`); await settle(page);
  expect(Object.values(await store(page))[0].name).toBe('Big cat');
  await stampMenu(page, 'Delete'); await settle(page);
  await expect(page.locator('#pmsg')).toHaveText('Deleted the stamp “Big cat”.');
  expect(Object.keys(await store(page)).length).toBe(0);
  expect(errors).toEqual([]);
});

test('Export writes a zip of stamp files, one folder per folder; a zip of stamp files comes back in with its folders', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  await save(page, 'Lion in a ring');
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('[data-slexp]');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  expect(dl.name || dl.filename).toMatch(/wodblok-stamps\.zip$/);
  const files = unzipSync(new Uint8Array(Buffer.from(dl.base64, 'base64'))), keys = Object.keys(files);
  expect(keys).toEqual(['Yours/Lion in a ring.wodblok-stamp']);
  expect(JSON.parse(Buffer.from(files[keys[0]]).toString()).name).toBe('Lion in a ring');
  const one = Buffer.from(files[keys[0]]);
  const zip = Buffer.from(zipSync({ 'Cats/a.wodblok-stamp': new Uint8Array(one), 'Cats/b.wodblok-stamp': new Uint8Array(one), 'notes.txt': new Uint8Array([104, 105]) }));
  await page.setInputFiles('#slimpf', { name: 'pack.zip', mimeType: 'application/zip', buffer: zip }); await settle(page);
  await expect(page.locator('#pmsg')).toHaveText('Added 2 stamps.');
  await expect(page.locator(`${T} .lfr[data-k="Cats"] .lfc`)).toHaveText('2');
  expect(Object.values(await store(page)).filter(r => r.g === 'Cats').length).toBe(2);
  await page.setInputFiles('#slimpf', tmp('bad.wodblok-stamp', 'nope')); await settle(page);
  await expect(page.locator('#pmsg')).toContainText('not a WODBLOK stamp');
  expect(errors).toEqual([]);
});
