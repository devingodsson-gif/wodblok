// 2.50.0 (owner Oct 26 2026): textures are pictures. The Texture effect picks one from the texture library (the folder tree with a tile per texture),
// Add texture at the top imports a picture, Rotate and Flip turn the texture, and an imported texture is saved in the project and kept in the library.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const { unzipSync, strFromU8 } = require('fflate');
const { openApp, settle, getState, addShape, openProjectFile } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const G = '.fxg[data-fxk="motif"]';
const sheetOf = d => (d.els || []).find(q => q.k === 'motif' && !q.bgd);
const texOf = d => { const e = sheetOf(d).fx.find(f => f.k === 'texture'); return d.texLib.find(x => x.id === e.x); };
const setRange = (page, sel, v) => page.evaluate(([s, v]) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, [sel, v]);
async function addTexture(page) {
  await addShape(page); await settle(page);
  await page.locator(`${G} .fxadd`).scrollIntoViewIfNeeded(); await page.click(`${G} .fxadd`);
  await page.locator('.rowm .ddi', { hasText: 'Texture' }).first().click(); await settle(page);
}
// the texture pictures drawn for the shape: their hrefs, so a change of picture can be seen
const drawn = page => page.$$eval('#txd image', es => es.map(e => e.getAttribute('href').length + ':' + e.getAttribute('href').slice(-40)).join('|'));

test('the library shows Yours and every built-in set as folders with a tile per texture; a tile picks the texture', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addTexture(page);
  const rows = await page.locator(`${G} .txtr .lfr .lfn`).allTextContents();
  expect(rows[0]).toBe('Yours');
  for (const s of ['Cloth and weave', 'Metal and made', 'Natural', 'Paper and board', 'Print faults and wear', 'Stone and mineral']) expect(rows).toContain(s);
  expect(rows.slice(1)).toEqual([...rows.slice(1)].sort((a, b) => a.localeCompare(b)));   // your folders and the sets together, A to Z
  await expect(page.locator(`${G} [data-txadd]`)).toHaveText('Add texture');
  // the set of the texture in use is open, and its tile has the accent
  await expect(page.locator(`${G} .txtr [data-tx="cotton"].on`)).toHaveCount(1);
  await page.click(`${G} .txtr .lfr[data-k="s:Stone and mineral"]`);
  await expect(page.locator(`${G} .txtr .lfr[data-k="s:Stone and mineral"]`)).toHaveAttribute('aria-expanded', 'true');
  await page.click(`${G} .txtr [data-tx="marble"]`); await settle(page);
  expect(texOf(await st(page)).t).toBe('marble');
  await expect(page.locator(`${G} .txtr [data-tx="marble"].on`)).toHaveCount(1);
  // every tile has its picture once it has been read
  await expect.poll(() => page.locator(`${G} .txtr .lib button[data-tx] img`).count()).toBeGreaterThanOrEqual(11);
  // Find narrows the tiles to the names that match
  await page.fill(`${G} .txq`, 'denim');
  await expect(page.locator(`${G} .txtr [data-tx]`)).toHaveCount(1);
  await expect(page.locator(`${G} .txtr [data-tx="denim"]`)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Rotate and Flip turn the texture: they are kept on the texture and change the picture drawn', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addTexture(page);
  await page.click(`${G} .txtr [data-tx="cotton"]`); await settle(page);
  await page.click(`${G} .txtr .lfr[data-k="s:Natural"]`); await page.click(`${G} .txtr [data-tx="wood"]`); await settle(page);
  const before = await drawn(page);
  expect(before.length).toBeGreaterThan(0);
  await setRange(page, `${G} .fxsr`, 90); await settle(page);
  expect(texOf(await st(page))).toMatchObject({ t: 'wood', rot: 90, fh: 0, fv: 0 });
  const turned = await drawn(page);
  expect(turned).not.toBe(before);
  await page.locator(`${G} .fxsfh`).check({ force: true }); await settle(page);
  expect(texOf(await st(page))).toMatchObject({ rot: 90, fh: 1 });
  expect(await drawn(page)).not.toBe(turned);
  await page.locator(`${G} .fxsfv`).check({ force: true }); await settle(page);
  expect(texOf(await st(page)).fv).toBe(1);
  await page.keyboard.press('Control+z'); await settle(page);
  expect(texOf(await st(page)).fv).toBe(0);
  expect(errors).toEqual([]);
});

test('Add texture imports a picture into Yours and uses it; the project saves it and opens with it; the library keeps it', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addTexture(page);
  await page.setInputFiles(`${G} .txfile`, path.join(__dirname, 'fixtures', 'picture.png'));
  await expect(page.locator('#pmsg')).toHaveText('Added the texture “picture”.');
  await settle(page);
  let d = await st(page);
  const t = texOf(d).t;
  expect(t).toMatch(/^u/);
  await expect(page.locator(`${G} .txtr .lfr[data-k=""] .lfc`)).toHaveText('1');
  await expect(page.locator(`${G} .txtr [data-tx="${t}"].on`)).toHaveCount(1);
  expect((await drawn(page)).length).toBeGreaterThan(0);
  // it is used, so it cannot be deleted from the library
  await page.click(`${G} .txtr [data-txx="${t}"]`);
  await expect(page.locator('#pmsg')).toContainText('used in this project');
  // the saved project carries the picture as a file of its own
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#fileb'); await page.click('#psv');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  await page.keyboard.press('Escape');
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  const files = unzipSync(new Uint8Array(Buffer.from(dl.base64, 'base64'))), p = JSON.parse(strFromU8(files['project.json']));
  expect(Object.keys(p.texImgs)).toEqual([t]);
  expect(p.texImgs[t].n).toBe('picture');
  expect(p.texImgs[t].src).toMatch(/^wbasset:assets\/[0-9a-f]{64}\.(webp|jpg)$/);
  expect(files[p.texImgs[t].src.slice('wbasset:'.length)]).toBeTruthy();
  const file = testInfo.outputPath('with-texture.wodblok'); fs.writeFileSync(file, Buffer.from(dl.base64, 'base64'));
  // a fresh browser (an empty library) opens the project with its texture, and the texture goes into Yours
  const ctx2 = await page.context().browser().newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC' }), page2 = await ctx2.newPage();
  await openApp(page2, { seed: 4 });
  await openProjectFile(page2, file);
  const d2 = JSON.parse(await getState(page2));
  expect(d2.texLib.some(x => x.t === t)).toBe(true);
  const lib = await page2.evaluate(() => { const s = JSON.parse(localStorage.getItem('wb_settings') || '{}').values || {}; const v = s.wb250_textures || localStorage.getItem('wb250_textures'); return v ? JSON.parse(v) : null; });
  expect(lib.t.map(x => x.id)).toEqual([t]);
  await ctx2.close();
  expect(errors).toEqual([]);
});
