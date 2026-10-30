// 2.51.0 (owner Oct 26 2026: the texture library works exactly like the Shapes library): select mode, drag a tile onto a folder, sets that can be renamed and hidden,
// Export to a zip of pictures, and Add texture taking several pictures and a zip of pictures.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const { zipSync, unzipSync } = require('fflate');
const { openApp, settle, addShape, stampMenu } = require('./helpers/harness');

const G = '.fxg[data-fxk="motif"]';
// 2.55.0: the Texture effect shows its texture as a row; the library opens from Replace in a popover (90-panel-modes.js)
const T = '.rpop';
const openLib = async page => { if (!(await page.locator('.rpop .txtr').count())) { const b = page.locator('.fxg:not([hidden]) .fxs[data-e="texture"]:not([hidden]) .fxtr .rpgo').first(); await b.scrollIntoViewIfNeeded(); await b.click(); await page.locator('.rpop .txtr').waitFor(); } };
const PIC = path.join(__dirname, 'fixtures', 'picture.png');
const lib = page => page.evaluate(() => { const s = JSON.parse(localStorage.getItem('wb_settings') || '{}').values || {}; const v = s.wb250_textures || localStorage.getItem('wb250_textures'); return v ? JSON.parse(v) : null; });
async function addTexture(page) {
  await addShape(page); await settle(page);
  await page.locator(`${G} .fxadd`).scrollIntoViewIfNeeded(); await page.click(`${G} .fxadd`);
  await page.locator('.rowm .ddi', { hasText: 'Texture' }).first().click(); await settle(page);
}
const steady = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
// a scroll closes an open menu, so scroll to the button first
const menuOf = async (page, key, item) => { await openLib(page); const b = page.locator(`${T} .txtr .lmo[data-fm="${key}"]`); await b.scrollIntoViewIfNeeded(); await steady(page); await b.click(); await page.locator('.rowm').getByRole('menuitem', { name: item, exact: true }).click(); };
// the styled dropdowns stand in for the native select: set the value through the page
const pick = (page, sel, v) => page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);
const names = async page => { await openLib(page); return page.locator(`${T} .txtr .lfr .lfn`).allTextContents(); };
async function makeFolder(page, name) {
  await openLib(page); await page.click(`${T} [data-txnew]`); await page.fill(`${T} .txtr .fform input`, name); await page.click(`${T} .txtr [data-fok]`);
  await openLib(page); await expect(page.locator(`${T} .txtr .lfr[data-k="${name}"]`)).toHaveCount(1);
}

test('a set can be renamed and hidden; hidden sets collect in a row of their own and come back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addTexture(page);
  expect(await names(page)).toContain('Natural');
  await menuOf(page, 's:Natural', 'Hide from the list');
  await expect(page.locator('#pmsg')).toHaveText('Hid “Natural”.');
  expect(await names(page)).not.toContain('Natural');
  await openLib(page); await expect(page.locator(`${T} .txtr [data-txhid] .lfc`)).toHaveText('1');
  await openLib(page); await expect(page.locator(`${T} .txtr .lfr[data-k="s:Natural"]`)).toHaveCount(0);
  await openLib(page); await page.click(`${T} .txtr [data-txhid]`);
  await openLib(page); await expect(page.locator(`${T} .txtr .lrw.hid .lfr[data-k="s:Natural"]`)).toHaveCount(1);
  expect((await lib(page)).h).toEqual(['Natural']);
  await menuOf(page, 's:Natural', 'Show in the list');
  await openLib(page); await expect(page.locator(`${T} .txtr [data-txhid]`)).toHaveCount(0);
  expect(await names(page)).toContain('Natural');
  // rename, then put the name back
  await menuOf(page, 's:Natural', 'Rename');
  await openLib(page); await page.fill(`${T} .txtr .fform input`, 'Grown'); await page.click(`${T} .txtr [data-fok]`);
  const rows = await names(page);
  expect(rows).toContain('Grown'); expect(rows).not.toContain('Natural');
  expect(rows.slice(1)).toEqual([...rows.slice(1)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })));
  await menuOf(page, 's:Natural', 'Reset name');
  expect(await names(page)).toContain('Natural');
  expect(errors).toEqual([]);
});

test('select mode: tick tiles, move them to a folder (built-in ones also stay in their set), take them out, and done', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addTexture(page);
  await makeFolder(page, 'Mine');
  await openLib(page); await page.click(`${T} .txtr .lfr[data-k="s:Natural"]`);
  await openLib(page); await page.click(`${T} [data-txsel]`);
  await openLib(page); await expect(page.locator(`${T} .txbar`)).toBeVisible();
  await openLib(page); await expect(page.locator(`${T} .txbar .fscnt`)).toHaveText('None selected');
  const ids = await page.locator(`${T} .txtr .lib button[data-tx]`).evaluateAll(b => b.slice(0, 40).map(x => x.dataset.tx));
  const mine = ids.filter(i => !i.startsWith('u')).slice(0, 2);
  await openLib(page); await page.click(`${T} .txtr [data-tx="${mine[0]}"]`); await page.click(`${T} .txtr [data-tx="${mine[1]}"]`);
  await openLib(page); await expect(page.locator(`${T} .txbar .fscnt`)).toHaveText('2 selected');
  await openLib(page); await expect(page.locator(`${T} .txtr [data-tx].pk`)).toHaveCount(2);
  await openLib(page); await pick(page, `${T} .txmv`, 'Mine');
  await expect(page.locator('#pmsg')).toContainText('Moved 2 textures to “Mine”. Built-in textures also stay in their own set.');
  const d = await lib(page);
  expect(d.b).toEqual({ [mine[0]]: 'Mine', [mine[1]]: 'Mine' });
  await openLib(page); await expect(page.locator(`${T} .txtr .lfr[data-k="Mine"] .lfc`)).toHaveText('2');
  // selecting is not picking: the effect's texture did not change
  await openLib(page); await expect(page.locator(`${T} .txtr [data-tx="cotton"].on`)).toHaveCount(1);
  // take them out of the folder again
  await openLib(page); await page.click(`${T} .txtr .lfr[data-k="Mine"]`);
  await openLib(page); await page.click(`${T} .txbar .txsa`);
  await openLib(page); await expect(page.locator(`${T} .txbar .txsa`)).toHaveText('Select none');
  await openLib(page); await expect(page.locator(`${T} .txbar .txout`)).toBeEnabled();
  await openLib(page); await page.click(`${T} .txbar .txout`);
  expect((await lib(page)).b).toEqual({});
  await openLib(page); await page.click(`${T} .txbar .txdone`);
  await openLib(page); await expect(page.locator(`${T} .txbar`)).toBeHidden();
  expect(errors).toEqual([]);
});

test('a tile dragged onto a folder moves there', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addTexture(page);
  await makeFolder(page, 'Dropped');
  await openLib(page); await page.click(`${T} .txtr .lfr[data-k="s:Natural"]`);
  const tile = page.locator(`${T} .txtr [data-tx="wood"]`);
  await tile.scrollIntoViewIfNeeded();
  const a = await tile.boundingBox(), row = await page.locator(`${T} .txtr .lfr[data-k="Dropped"]`).boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 12, a.y + a.height / 2 + 12, { steps: 4 });
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2, { steps: 8 });
  await openLib(page); await expect(page.locator(`${T} .txtr .lfr.dropt[data-k="Dropped"]`)).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator('#pmsg')).toContainText('Moved 1 texture to “Dropped”.');
  expect((await lib(page)).b).toEqual({ wood: 'Dropped' });
  // the drop was not a click: the effect still has its own texture
  await openLib(page); await expect(page.locator(`${T} .txtr [data-tx="cotton"]`)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Export saves the library as a zip of pictures, one folder per folder; a zip of pictures comes back in with its folders', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addTexture(page);
  await openLib(page); await page.setInputFiles(`${T} .txfile`, [PIC]);
  await expect(page.locator('#pmsg')).toHaveText('Added the texture “picture”.');
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await openLib(page); await page.click(`${T} [data-txexp]`);
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  expect(dl.name || dl.filename).toMatch(/wodblok-textures\.zip$/);
  const files = unzipSync(new Uint8Array(Buffer.from(dl.base64, 'base64'))), keys = Object.keys(files);
  expect(keys.some(k => /^Yours\/picture\.(webp|jpg)$/.test(k))).toBe(true);
  expect(keys.some(k => /^Natural\/[^/]+\.webp$/.test(k))).toBe(true);
  expect(keys.every(k => /\.(webp|jpg)$/.test(k))).toBe(true);
  // a zip with a folder inside comes back as that folder
  const png = fs.readFileSync(PIC);
  const zip = Buffer.from(zipSync({ 'Linen/one.png': new Uint8Array(png), 'Linen/two.png': new Uint8Array(png), 'notes.txt': new Uint8Array([104, 105]) }));
  await openLib(page); await page.setInputFiles(`${T} .txfile`, { name: 'pack.zip', mimeType: 'application/zip', buffer: zip });
  await expect(page.locator('#pmsg')).toHaveText('Added 2 textures.');
  await openLib(page); await expect(page.locator(`${T} .txtr .lfr[data-k="Linen"] .lfc`)).toHaveText('2');
  const d = await lib(page);
  expect(d.t.filter(x => x.f === 'Linen').map(x => x.n).sort()).toEqual(['one', 'two']);
  // several pictures at once
  await openLib(page); await page.setInputFiles(`${T} .txfile`, [PIC, PIC]);
  await expect(page.locator('#pmsg')).toHaveText('Added 2 textures.');
  expect(errors).toEqual([]);
});

test('a stamp saved to the stamp library carries the picture of an imported texture it uses: in a fresh browser the texture is there', async ({ browser }) => {
  const { openPanel, addStamp, getState, canvasToClient } = require('./helpers/harness');
  const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC' }), p1 = await ctx1.newPage();
  const a = await openApp(p1, { seed: 4, pattern: false });
  await addTexture(p1);
  await openLib(p1); await p1.setInputFiles(`${T} .txfile`, PIC); await expect(p1.locator('#pmsg')).toHaveText('Added the texture “picture”.'); await settle(p1);
  await addStamp(p1);
  let s = JSON.parse(await getState(p1));
  const L = s.texLib.find(x => /^u/.test(x.t));
  s.tiles[s.tiles.length - 1].tu = [{ x: L.id }];
  await p1.evaluate(j => window.__wbTest.apply(j), JSON.stringify(s)); await settle(p1);
  await openPanel(p1, 'stmp'); await settle(p1);
  await p1.fill('#slname', 'Textured'); await p1.click('#slsave');
  await expect(p1.locator('#slgrid button[data-sl]:not([data-sl^="bs:"])')).toHaveCount(1);
  await p1.evaluate(() => { window.__wbDownloads.length = 0; });
  await stampMenu(p1, 'Save as file');
  await p1.waitForFunction(() => window.__wbDownloads.length > 0);
  const dl = await p1.evaluate(() => window.__wbDownloads[0]), rec = JSON.parse(dl.data);
  expect(Object.keys(rec.tximgs)).toEqual([L.t]);
  expect(rec.tximgs[L.t].src).toMatch(/^data:image\/(webp|jpeg);base64,/);
  const file = path.join(require('os').tmpdir(), 'wb-textured-' + process.pid + '.wodblok-stamp'); fs.writeFileSync(file, dl.data);
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC' }), p2 = await ctx2.newPage();
  const b = await openApp(p2, { seed: 4, pattern: false });
  await openPanel(p2, 'stmp');
  await p2.setInputFiles('#slimpf', file); await settle(p2);
  await expect(p2.locator('#slgrid button[data-sl]:not([data-sl^="bs:"])')).toHaveCount(1);
  await p2.locator('#slgrid button[data-sl]:not([data-sl^="bs:"])').first().click(); await settle(p2);
  const d2 = JSON.parse(await getState(p2)), t2 = d2.texLib.find(x => x.t === L.t);
  expect(t2).toBeTruthy();
  expect(d2.tiles.some(t => (t.tu || []).some(u => u.x === t2.id))).toBe(true);
  expect(((await lib(p2)) || { t: [] }).t.map(x => x.id)).toEqual([L.t]);   // and it is in this browser's library, in Yours
  fs.unlinkSync(file);
  expect(a.errors.concat(b.errors)).toEqual([]);
  await ctx1.close(); await ctx2.close();
});
