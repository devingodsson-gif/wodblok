// 2.51.7 (owner Oct 26 2026: a saved colourways library, like the others): a colourway of this project is saved with its "..." menu, appears as a card in the library
// (Yours and your folders, select mode, drag, Export), and clicking a card adds it back to the project as a new colourway.
const { test, expect } = require('@playwright/test');
const { unzipSync } = require('fflate');
const { openApp, openPanel, settle } = require('./helpers/harness');

const T = '#cvpane .cvtr';
const steady = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const store = page => page.evaluate(() => { const s = JSON.parse(localStorage.getItem('wb_settings') || '{}').values || {}; const v = s.wb251_colourways || localStorage.getItem('wb251_colourways'); return v ? JSON.parse(v) : { f: [], t: [] }; });
const proj = page => page.evaluate(() => JSON.parse(window.__wbTest.state()).proj);
const cards = page => page.locator(`${T} button[data-cv]`);
async function saveFirst(page) {
  const more = page.locator('#cwg .cwc').first().locator('[data-more]'); await more.scrollIntoViewIfNeeded(); await steady(page); await more.click();
  await page.locator('.rowm').getByRole('menuitem', { name: 'Save to library', exact: true }).click(); await settle(page);
}

test('a colourway is saved to the library, filed in a folder and added back to the project as a new colourway', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  await expect(cards(page)).toHaveCount(0);
  await saveFirst(page);
  await expect(page.locator('#pmsg')).toContainText('to the library');
  await expect(cards(page)).toHaveCount(1);
  await expect(page.locator('#cvcnt')).toHaveText('1');
  const s = await store(page); expect(s.t[0].c.length).toBe((await proj(page)).ts.length);
  // folder and Move to
  await page.click('[data-cvnew]'); await page.fill(`${T} .fform input`, 'Warm'); await page.click(`${T} [data-fok]`);
  await page.click('[data-cvsel]'); await cards(page).first().click();
  await page.evaluate(() => { const e = document.querySelector('.cvmv'); e.value = 'Warm'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
  await settle(page);
  expect((await store(page)).t[0].f).toBe('Warm');
  await page.click('.cvdone');
  // add it back
  const before = (await proj(page)).cw.length;
  await cards(page).first().click(); await settle(page);
  const p = await proj(page);
  expect(p.cw.length).toBe(before + 1);
  await expect(page.locator('#pmsg')).toContainText('Added the colourway');
  // Export writes a zip with the folder
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('[data-cvexp]');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  expect(dl.name || dl.filename).toMatch(/wodblok-colourways\.zip$/);
  const keys = Object.keys(unzipSync(new Uint8Array(Buffer.from(dl.base64, 'base64'))));
  expect(keys.some(k => k.startsWith('Warm/') && k.endsWith('.wodblok-colourway'))).toBe(true);
  expect(errors).toEqual([]);
});

test('a saved colourway can be renamed and deleted from its menu', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  await saveFirst(page);
  const c = cards(page).first(); await c.scrollIntoViewIfNeeded(); await steady(page);
  await c.click({ button: 'right' });
  await page.locator('.rowm').getByRole('menuitem', { name: 'Rename', exact: true }).click();
  await page.fill(`${T} .fform input`, 'Dusk'); await page.click(`${T} [data-fok]`); await settle(page);
  expect((await store(page)).t[0].n).toBe('Dusk');
  await c.click({ button: 'right' });
  await page.locator('.rowm').getByRole('menuitem', { name: 'Delete', exact: true }).click(); await settle(page);
  await expect(page.locator('#pmsg')).toHaveText('Deleted the colourway “Dusk”.');
  expect((await store(page)).t.length).toBe(0);
  expect(errors).toEqual([]);
});
