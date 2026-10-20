// 1.10: the colour tray. Colours live in the tray (up to 16, with stable ids); paper, ink, stamps, layers, the Replace colour and texts
// link to a tray colour or keep a fixed colour of their own (the lock). Colourways are named sets of colours for the same tray places.
const { test, expect } = require('@playwright/test');
const path = require('path');
const { openApp, openPanel, showPanel, settle, getState, openProjectFile, unlockStamp } = require('./helpers/harness');

const proj = async page => JSON.parse(await getState(page)).proj;
const colours = async page => { const p = await proj(page); return p.ts.map(id => p.cw[p.cwa].c[id]); };
async function setHex(page, hex) { await page.fill('.cpk [data-f="hex"]', hex); await page.press('.cpk [data-f="hex"]', 'Enter'); }
async function closePicker(page) { await page.press('.cpk [data-f="hex"]', 'Escape'); await expect(page.locator('.cpk')).toBeHidden(); await settle(page); }
const zipNames = page => page.evaluate(() => {
  const b = atob(window.__wbDownloads[window.__wbDownloads.length - 1].base64), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  const out = [], dv = new DataView(u.buffer);
  for (let i = 0; i + 30 < u.length; i++) if (dv.getUint32(i, true) === 0x04034b50) { const n = dv.getUint16(i + 26, true), e = dv.getUint16(i + 28, true); out.push(new TextDecoder().decode(u.subarray(i + 30, i + 30 + n))); i += 29 + n + e; }
  return out;
});

// the canvas is transparent until it has a Sheet; these tests look at the paper, so the Sheet goes on first (no panel opened: that would change the canvas size)
const sheetOn = page => page.evaluate(() => { const c = document.getElementById('sh_on'); if (!c.checked) c.click(); });

test('a new project has a two-colour tray: paper and ink link to it, the dock shows seven places and a +', async ({ page }) => {
  const { errors } = await openApp(page);
  const p = await proj(page);
  expect(p.ts).toEqual(['k1', 'k2']);
  expect(p.bg).toBe('@k1'); expect(p.ink).toBe('@k2');
  await expect(page.locator('#tyc .tys')).toHaveCount(2);
  await expect(page.locator('#tyc .tye')).toHaveCount(5);
  await expect(page.locator('#tyc .tyadd')).toHaveCount(1);
  await expect(page.locator('#tycw')).toBeHidden();             // one colourway: no switcher
  expect(errors).toEqual([]);
});

test('editing a tray colour recolours what links to it; one history step; undo brings it back', async ({ page }) => {
  const { errors } = await openApp(page);
  await sheetOn(page);
  await page.click('#tyc .tys >> nth=0');
  await expect(page.locator('.cpk')).toBeVisible();
  await setHex(page, '#1E4FA3'); await closePicker(page);
  expect((await colours(page))[0]).toBe('#1e4fa3');
  expect(await page.locator('#art').first().innerHTML()).toContain('#1e4fa3');
  await page.click('#undo'); await settle(page);
  expect((await colours(page))[0]).not.toBe('#1e4fa3');
  expect(errors).toEqual([]);
});

test('the picker keeps hex, RGB, HSB and opacity in step, and remembers recent colours', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.click('#tyc .tys >> nth=1');
  await setHex(page, '#FF8000');
  await expect(page.locator('.cpk [data-f="r"]')).toHaveValue('255');
  await expect(page.locator('.cpk [data-f="g"]')).toHaveValue('128');
  await expect(page.locator('.cpk [data-f="b"]')).toHaveValue('0');
  await expect(page.locator('.cpk [data-f="h"]')).toHaveValue('30');
  await page.fill('.cpk [data-f="g"]', '0'); await page.press('.cpk [data-f="g"]', 'Enter');
  await expect(page.locator('.cpk [data-f="hex"]')).toHaveValue('#FF0000');
  await page.fill('.cpk [data-f="a"]', '50'); await page.press('.cpk [data-f="a"]', 'Enter');
  await expect(page.locator('.cpk [data-f="hex"]')).toHaveValue('#FF000080');
  await closePicker(page);
  expect((await colours(page))[1]).toBe('#ff000080');
  await page.click('#tyc .tys >> nth=0');
  await expect(page.locator('.cpkrc [data-h="#ff000080"]')).toHaveCount(1);
  await closePicker(page);
  expect(errors).toEqual([]);
});

test('lock: a stamp keeps its colour when the tray changes; unlock links it back', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 60000 });
  await unlockStamp(page);   // the Stamp settings panel works on the unlocked stamp
  await showPanel(page, 'stmp');
  // link the stamp to tray colour 1, then lock it
  await page.locator('#wl_st .cwsb').scrollIntoViewIfNeeded(); await page.click('#wl_st .cwsb'); await page.click('.cwp .cwpc[data-s] >> nth=0'); await settle(page);
  let t = JSON.parse(await getState(page)).tiles[0];
  const p0 = await proj(page), slot = p0.ts[0], h0 = p0.cw[0].c[slot];
  expect(t.ink).toBe('@' + slot);
  await page.click('#wl_st .cwlk'); await settle(page);
  t = JSON.parse(await getState(page)).tiles[0];
  expect(t.ink).toBe(h0 + '|' + slot);
  await expect(page.locator('#wl_st .cwlk')).toHaveAttribute('aria-pressed', 'true');
  await page.click(`#tyc .tys[data-s="${slot}"]`); await setHex(page, '#123456'); await closePicker(page);
  t = JSON.parse(await getState(page)).tiles[0];
  expect(t.ink).toBe(h0 + '|' + slot);                         // the tray changed, the locked stamp did not
  await page.click('#wl_st .cwlk'); await settle(page);
  t = JSON.parse(await getState(page)).tiles[0];
  expect(t.ink).toBe('@' + slot);                               // linked again: now shows the tray's colour
  expect(errors).toEqual([]);
});

test('removing a tray colour that is in use keeps what used it as a fixed colour (asks once first)', async ({ page }) => {
  const { errors } = await openApp(page);
  const h1 = (await colours(page))[0];
  await page.click('#tyc .tys >> nth=0');
  await page.click('.cpka [data-a="0"]');                       // first press: says how many things use it
  expect((await proj(page)).ts).toHaveLength(2);
  await expect(page.locator('#pmsg')).toContainText('fixed colour');
  await page.click('.cpka [data-a="0"]'); await settle(page);   // second press removes it
  const p = await proj(page);
  expect(p.ts).toHaveLength(1);
  expect(p.bg).toBe(h1);                                        // the paper kept its colour
  expect(errors).toEqual([]);
});

test('a saved project opens with its colours in the tray, linked where they were used, and opening is not a change', async ({ page }) => {
  const { errors } = await openApp(page);
  await openProjectFile(page, path.join(__dirname, 'fixtures', 'project-4-rect-4x3.wodblok'));
  await settle(page, { max: 60000 });
  const c = JSON.parse(await getState(page)), p = c.proj, w = p.cw[0];
  expect(p.ts.length).toBeGreaterThan(1);
  for (const id of p.ts) expect(w.m[id], 'tray place ' + id + ' has a colour name').toBeTruthy();
  expect(p.ts).toContain(p.bg.slice(1)); expect(p.ts).toContain(p.ink.slice(1));
  // a stamp or layer ink is a tray place that exists (or a fixed colour), never a name from an older file
  const inks = c.tiles.map(t => t.ink).concat(c.layers.map(l => l.ink)).filter(Boolean);
  for (const k of inks) expect(k[0] === '#' || p.ts.includes(k.slice(1)), 'ink ' + k).toBe(true);
  await expect(page.locator('#pst')).not.toHaveClass(/dirty/);
  expect(errors).toEqual([]);
});

test('saved trays: a Wada set fills the first places; your own tray is kept and found by search', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  await page.click('.stf[data-f="wada3"]');
  const first = page.locator('#stl .str').first(), name = (await first.locator('b').textContent()).trim();
  await first.click(); await settle(page);
  const p = await proj(page);
  expect(p.ts).toHaveLength(3);
  expect(p.cw[0].m[p.ts[0]]).toBeTruthy();
  await expect(page.locator('#pmsg')).toContainText(name);
  await page.click('#stnav [data-up]');
  await page.click('#tysave'); await page.fill('#tysvn', 'Qwerty Tray'); await page.press('#tysvn', 'Enter');
  await expect(page.locator('#stl .str', { hasText: 'Qwerty Tray' })).toHaveCount(1);
  await page.fill('#stq', 'qwerty');
  await expect(page.locator('#stl .str')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('colourways: a new one copies the colours; editing it leaves the first alone; switching swaps; export (in Export recipes) makes one file each', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'cways');
  await expect(page.locator('#cwg .cwc')).toHaveCount(1);
  const c0 = await colours(page);
  await page.click('#cwnew'); await page.keyboard.type('Night'); await page.keyboard.press('Enter'); await settle(page);
  await expect(page.locator('#cwg .cwc')).toHaveCount(2);
  let p = await proj(page);
  expect(p.cwa).toBe(1); expect(p.cw[1].n).toBe('Night');
  await page.click('#tyc .tys >> nth=0'); await setHex(page, '#1B1A2E'); await closePicker(page);
  expect((await colours(page))[0]).toBe('#1b1a2e');
  await expect(page.locator('#tycw')).toBeVisible();
  await expect(page.locator('#tycw span')).toHaveText('Night');
  await page.click('#cwg .cwc >> nth=0'); await settle(page);
  expect(await colours(page)).toEqual(c0);
  await page.click('#cwgo');                                     // the Colourways tool hands over to Export recipes with "All" chosen
  await expect(page.locator('section.pn[data-p="xrec"]')).toBeVisible();
  await expect(page.locator('#xrcw [data-s="all"]')).toHaveClass(/on/);
  await expect(page.locator('#xrcwall')).toHaveText('All 2');
  await page.fill('#xrpx', '300');
  await page.click('#xrnow');
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 60000 });
  const names = await zipNames(page);
  expect(names).toHaveLength(2);
  expect(names.some(n => /-Colourway-1\.png$/.test(n))).toBe(true);
  expect(names.some(n => /-Night\.png$/.test(n))).toBe(true);
  expect((await proj(page)).cwa).toBe(0);                        // export puts back the colourway that was showing
  expect(errors).toEqual([]);
});

test('the dropper picks the colour under the pointer from the finished picture', async ({ page }) => {
  const { errors } = await openApp(page);
  await sheetOn(page);
  const r = await page.locator('#art').first().boundingBox();
  await page.click('#tyc .tys >> nth=1');
  await page.click('.cpkd');
  await page.waitForFunction(() => document.querySelector('.edrov') && !document.querySelector('.edrov').classList.contains('busy'), null, { timeout: 20000 });
  await page.mouse.move(r.x + 10, r.y + 10); await page.mouse.click(r.x + 10, r.y + 10);   // a corner: plain paper
  await expect(page.locator('.edrov')).toHaveCount(0);
  await closePicker(page);
  const c = await colours(page);
  expect(c[1]).toBe(c[0]);                                        // the ink took the paper's colour
  expect(errors).toEqual([]);
});

test('dragging a colour along the dock moves it in the tray; links stay with their colour', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.click('#tyc .tyadd'); await setHex(page, '#AA3300'); await closePicker(page);
  const p0 = await proj(page);
  expect(p0.ts).toEqual(['k1', 'k2', 'k3']);
  const a = await page.locator('#tyc .tys[data-s="k3"]').boundingBox(), b = await page.locator('#tyc .tys[data-s="k1"]').boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(b.x + 2, b.y + b.height / 2, { steps: 8 }); await page.mouse.up(); await settle(page);
  const p1 = await proj(page);
  expect(p1.ts).toEqual(['k3', 'k1', 'k2']);
  expect(p1.bg).toBe('@k1');                                      // the paper still follows the same colour
  await expect(page.locator('.cpk')).toBeHidden();                // a drag does not open the picker
  expect(errors).toEqual([]);
});
