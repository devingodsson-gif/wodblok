// 2.51.3 (owner Oct 26 2026: every library works exactly like the Shapes library): the saved trays are the shared folder tree, as rows with a strip of colours:
// nested folders, select mode with Move to, drag onto a folder, Wada's combinations as three sets that can be hidden, the right-click menu and Export.
const { test, expect } = require('@playwright/test');
const { unzipSync } = require('fflate');
const { openApp, openPanel, settle } = require('./helpers/harness');

const T = '#stl', SET2 = 's:Wada · 2 colours';
const store = page => page.evaluate(() => JSON.parse(localStorage.getItem('wb_settings') ? (JSON.parse(localStorage.getItem('wb_settings')).values.wb251_trays || 'null') : 'null') || JSON.parse(localStorage.getItem('wb251_trays') || 'null') || { f: [], t: [] });
const steady = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
async function saveTray(page, name) { await page.click('#tysave'); await page.fill('#tysvn', name); await page.press('#tysvn', 'Enter'); await settle(page); }
async function makeFolder(page, name) {
  await page.click('[data-stnew]'); await page.fill(`${T} .fform input`, name); await page.click(`${T} [data-fok]`);
}
const rows = page => page.locator(`${T} button[data-st]`);
const menuOf = async (page, key, item) => { const b = page.locator(`${T} .lmo[data-fm="${key}"]`); await b.scrollIntoViewIfNeeded(); await steady(page); await b.click(); await page.locator('.rowm').getByRole('menuitem', { name: item, exact: true }).click(); };

test('trays are rows in Yours; folders nest; select mode moves them; Take out puts them back', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  await saveTray(page, 'Harbour'); await saveTray(page, 'Dusk');
  await expect(rows(page)).toHaveCount(2);
  await makeFolder(page, 'Sea');
  await expect(page.locator(`${T} .lfr[data-k="Sea"]`)).toHaveCount(1);
  await makeFolder(page, 'Deep');                                              // the open folder is Sea, so this nests
  await expect(page.locator(`${T} .lfr[data-k="Sea/Deep"]`)).toHaveCount(1);
  await page.click('[data-stsel]');
  await page.locator(`${T} button[data-st][aria-label="Harbour"]`).click();
  await page.evaluate(() => { const e = document.querySelector('.stmv'); e.value = 'Sea/Deep'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
  await settle(page);
  expect((await store(page)).t.find(t => t.n === 'Harbour').f).toBe('Sea/Deep');
  await expect(page.locator(`${T} .lfr[data-k="Sea/Deep"] .lfc`)).toHaveText('1');
  await page.locator(`${T} button[data-st][aria-label="Harbour"]`).click();
  await page.click('.stout'); await settle(page);
  expect((await store(page)).t.find(t => t.n === 'Harbour').f).toBe('');
  expect(errors).toEqual([]);
});

test('a tray row can be dragged onto a folder; clicking loads it; the menu renames and deletes', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  await saveTray(page, 'Harbour');
  await makeFolder(page, 'Sea');
  const tile = rows(page).first(), row = page.locator(`${T} .lfr[data-k="Sea"]`);
  await tile.scrollIntoViewIfNeeded(); await settle(page);
  const a = await tile.boundingBox(), b = await row.boundingBox();
  await page.mouse.move(a.x + 60, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + 40, b.y + b.height / 2, { steps: 8 }); await expect(row).toHaveClass(/dropt/); await page.mouse.up(); await settle(page);
  expect((await store(page)).t[0].f).toBe('Sea');
  const t = rows(page).first(); await t.scrollIntoViewIfNeeded(); await steady(page);
  await t.click({ button: 'right' });
  await page.locator('.rowm').getByRole('menuitem', { name: 'Rename', exact: true }).click();
  await page.fill(`${T} .fform input`, 'Harbour 2'); await page.click(`${T} [data-fok]`); await settle(page);
  expect((await store(page)).t[0].n).toBe('Harbour 2');
  await t.click({ button: 'right' });
  await page.locator('.rowm').getByRole('menuitem', { name: 'Delete', exact: true }).click(); await settle(page);
  await expect(page.locator('#pmsg')).toHaveText('Deleted the tray “Harbour 2”.');
  expect((await store(page)).t.length).toBe(0);
  expect(errors).toEqual([]);
});

test('Wada\'s combinations are three sets: they can be hidden, a built-in tray can be copied to yours, and Export writes a zip', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  await expect(page.locator('#stcnt')).toHaveText('348');
  await menuOf(page, SET2, 'Hide from the list');
  await expect(page.locator(`${T} .lfr[data-k="${SET2}"]`)).toHaveCount(0);
  await page.click(`${T} [data-sthid]`);
  await menuOf(page, SET2, 'Show in the list');
  await page.click(`${T} .lfr[data-k="${SET2}"]`);
  const first = rows(page).first(); await first.scrollIntoViewIfNeeded(); await steady(page);
  const name = (await first.locator('b').textContent()).trim();
  await first.click({ button: 'right' });
  await page.locator('.rowm').getByRole('menuitem', { name: 'Copy to your trays', exact: true }).click(); await settle(page);
  expect((await store(page)).t.map(t => t.n)).toEqual([name]);
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('[data-stexp]');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  expect(dl.name || dl.filename).toMatch(/wodblok-trays\.zip$/);
  const keys = Object.keys(unzipSync(new Uint8Array(Buffer.from(dl.base64, 'base64'))));
  expect(keys.some(k => k.startsWith('Yours/') && k.endsWith('.wodblok-tray'))).toBe(true);
  expect(keys.filter(k => k.startsWith('Wada')).length).toBe(348);
  expect(errors).toEqual([]);
});
