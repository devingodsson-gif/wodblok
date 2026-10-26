// 2.51.4 (owner Oct 26 2026: every library works exactly like the Shapes library): the template picker is the shared folder tree with cards:
// "Starting points" is a set (it can be hidden), your templates sit in Yours and your folders, with select mode, Move to, drag onto a folder and Export.
const { test, expect } = require('@playwright/test');
const { unzipSync } = require('fflate');
const { openApp, settle } = require('./helpers/harness');

const SP = '#tppane .lrw:has(.lfr[data-k="s:Starting points"]) + .lib', YO = '#tppane .lrw:has(.lfr[data-k=""]) + .lib';
const steady = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const yours = page => page.locator(YO + ' button[data-tp]');
async function openPicker(page) { await page.click('#fileb'); await page.click('#tpnew'); await expect(page.locator('#tpdlg')).toBeVisible(); await page.click('#tpty [data-k="canvas"]'); await settle(page, { quiet: 4 }); }
async function saveTemplate(page, name) { await page.click('#fileb'); await page.click('#tpsave'); await page.fill('#tpsn', name); await page.click('#tpsok'); await expect(page.locator('#tpsd')).toBeHidden(); }
const tmplIndex = page => page.evaluate(() => { const s = JSON.parse(localStorage.getItem('wb_settings') || '{}').values || {}; const v = s.wb111_templates || localStorage.getItem('wb111_templates'); return v ? JSON.parse(v) : []; });

test('templates sit in Yours; Starting points is a set that can be hidden; select mode moves a template into a folder', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await saveTemplate(page, 'Mine'); await saveTemplate(page, 'Other');
  await openPicker(page);
  await expect(page.locator(SP + ' button[data-tp]').first()).toHaveAttribute('aria-label', 'Blank');
  await expect(yours(page)).toHaveCount(2);
  await page.click('[data-tpnew]'); await page.fill('#tppane .fform input', 'Work'); await page.click('#tppane [data-fok]');
  await expect(page.locator('#tppane .lfr[data-k="Work"]')).toHaveCount(1);
  await page.click('[data-tpsel]');
  await page.locator('#tppane button[data-tp][aria-label="Mine"]').click();
  await page.evaluate(() => { const e = document.querySelector('.tpmv'); e.value = 'Work'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
  await settle(page);
  expect((await tmplIndex(page)).find(t => t.n === 'Mine').f).toBe('Work');
  await expect(page.locator('#tppane .lfr[data-k="Work"] .lfc')).toHaveText('1');
  // hide the set, then show it again
  const b = page.locator('#tppane .lmo[data-fm="s:Starting points"]'); await b.scrollIntoViewIfNeeded(); await steady(page); await b.click();
  await page.locator('.rowm').getByRole('menuitem', { name: 'Hide from the list', exact: true }).click();
  await expect(page.locator('#tppane .lfr[data-k="s:Starting points"]')).toHaveCount(0);
  await page.click('#tppane [data-tphid]');
  await expect(page.locator('#tppane .lrw.hid .lfr[data-k="s:Starting points"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('a template card can be dragged onto a folder, Export writes a zip of project files', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await saveTemplate(page, 'Mine');
  await openPicker(page);
  await page.click('[data-tpnew]'); await page.fill('#tppane .fform input', 'Work'); await page.click('#tppane [data-fok]');
  await page.evaluate(() => { const z = document.querySelector('.tpsz'); z.value = 2; z.dispatchEvent(new Event('input', { bubbles: true })); });   // small cards, so the card and the folder are both on screen
  const tile = yours(page).first(), row = page.locator('#tppane .lfr[data-k="Work"]');
  await tile.scrollIntoViewIfNeeded(); await steady(page);
  const a = await tile.boundingBox(), b = await row.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + 40, b.y + b.height / 2, { steps: 8 }); await expect(row).toHaveClass(/dropt/); await page.mouse.up(); await settle(page);
  expect((await tmplIndex(page))[0].f).toBe('Work');
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('[data-tpexp]');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  expect(dl.name || dl.filename).toMatch(/wodblok-templates\.zip$/);
  const keys = Object.keys(unzipSync(new Uint8Array(Buffer.from(dl.base64, 'base64'))));
  expect(keys).toContain('Work/Mine.wodblok');
  expect(keys.some(k => k.startsWith('Starting points/') && k.endsWith('.wodblok'))).toBe(true);
  expect(errors).toEqual([]);
});
