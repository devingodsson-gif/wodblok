// Layer update, step 8 (1.46.8): the project's stamps in the Stamps panel: choose the open stamp, New (with an outline), Duplicate, Delete (two taps),
// Save to the library, Load from it (joins the selected layer), Zoom to stamp.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const state = async page => JSON.parse(await getState(page));
// the rail button of a tool that is already showing closes it, so only click when it is not showing
const show = async (page, id) => { if (await page.locator(`section.pn[data-p="${id}"]:not([hidden])`).count() === 0) await openPanel(page, id); };
const rows = page => page.locator('#stmpl .smkr');
const newStamp = async (page, name = 'Circle') => { await page.click('#smknew'); await page.locator('.rowm button, .rowm [role="menuitem"]', { hasText: name }).first().click(); await settle(page); };
const pick = async page => { await openPanel(page, 'motifs'); if (!(await page.locator('#lib button[data-m]').count())) await page.locator('#lib .lfr[data-f^="b:"]').first().click(); await page.locator('#lib button[data-m]').first().click(); await settle(page); };
const toClient = (page, x, y) => page.evaluate(([x, y]) => { const a = document.getElementById('art'), r = a.getBoundingClientRect(), vb = a.viewBox.baseVal; return { x: r.left + x / vb.width * r.width, y: r.top + y / vb.height * r.height }; }, [x, y]);
// put one shape into stamp number n (1-based, as listed), through its first well-placed instance
async function shapeIn(page, n) {
  await show(page, 'stmp');
  await rows(page).nth(n - 1).locator('.smklk').click();
  await settle(page);
  await pick(page);
  const id = (await state(page)).tiles[n - 1].id;
  const c = await page.evaluate(id => { const vb = document.getElementById('art').viewBox.baseVal; for (let y = 60; y < vb.height - 60; y += 23) for (let x = 60; x < vb.width - 60; x += 23) { const r = __wbTest.stampAt(x, y, id); if (r) return { x, y }; } return null; }, id);
  expect(c).toBeTruthy();
  const p = await toClient(page, c.x, c.y);
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.up(); await settle(page);
  await page.keyboard.press('Escape');
  await show(page, 'stmp');
}

test('New stamp asks for an outline, joins the selected layer, becomes the open stamp, starts locked and keeps the Pattern view', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  await newStamp(page, 'Circle');
  const s = await state(page);
  expect(s.tiles.length).toBe(2);
  expect(s.tiles[1].sh.k).toBe('circle');
  expect(s.tiles[1].items).toEqual([]);
  expect(s.layers[0].st).toContain(s.tiles[1].id);
  await expect(rows(page)).toHaveCount(2);
  await expect(rows(page).nth(1)).toHaveClass(/cur/);
  await expect(rows(page).nth(1).locator('.smkth')).toHaveAttribute('aria-pressed', 'true');
  await expect(rows(page).nth(1).locator('.smklk')).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => __wbTest.unlockedStamp())).toBe(null);
  await expect(page.locator('#boardS')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('clicking a stamp in the list makes it the open stamp and locks the one that was unlocked', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  await newStamp(page, 'Rectangle');
  await rows(page).nth(0).locator('.smklk').click();
  await settle(page);
  expect(await page.evaluate(() => __wbTest.unlockedStamp())).toBeTruthy();
  await rows(page).nth(1).locator('.smkn').click();
  await settle(page);
  await expect(rows(page).nth(1)).toHaveClass(/cur/);
  await expect(rows(page).nth(0)).not.toHaveClass(/cur/);
  expect(await page.evaluate(() => __wbTest.unlockedStamp())).toBe(null);
  expect(errors).toEqual([]);
});

test('Duplicate makes a copy that edits separately from the original', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await shapeIn(page, 1);
  const n0 = (await state(page)).tiles[0].items.length;
  expect(n0).toBeGreaterThan(0);
  await page.click('#smkdup');
  await settle(page);
  let s = await state(page);
  expect(s.tiles.length).toBe(2);
  expect(s.tiles[1].items.length).toBe(n0);
  expect(s.tiles[1].id).not.toBe(s.tiles[0].id);
  expect(s.layers[0].st).toContain(s.tiles[1].id);
  await expect(rows(page).nth(1)).toHaveClass(/cur/);
  await shapeIn(page, 2);
  s = await state(page);
  expect(s.tiles[0].items.length).toBe(n0);
  expect(s.tiles[1].items.length).toBe(n0 + 1);
  expect(errors).toEqual([]);
});

test('Delete takes two taps, removes the stamp from every layer and free item that uses it, and never the last stamp', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  await page.click('#smkdel');
  expect((await state(page)).tiles.length).toBe(1);
  await newStamp(page, 'Rectangle');
  // a free copy of stamp 2 placed on the layer
  await openPanel(page, 'layers');
  const id2 = (await state(page)).tiles[1].id;
  await page.locator(`#lfpst [data-t="${id2}"]`).click();
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await settle(page);
  expect(((await state(page)).layers[0].pl || []).filter(p => p.t === id2).length).toBe(1);
  await page.keyboard.press('Escape');
  await openPanel(page, 'stmp');
  await page.click('#smkdel');
  await expect(page.locator('#smkdel')).toHaveClass(/sure/);
  expect((await state(page)).tiles.length).toBe(2);
  await page.click('#smkdel');
  await settle(page);
  const s = await state(page);
  expect(s.tiles.length).toBe(1);
  expect(s.layers[0].st).not.toContain(id2);
  expect((s.layers[0].pl || []).filter(p => p.t === id2).length).toBe(0);
  await expect(rows(page)).toHaveCount(1);
  expect(errors).toEqual([]);
  // one undo step brings it back
  await page.keyboard.press('Control+z');
  await settle(page);
  expect((await state(page)).tiles.length).toBe(2);
});

test('a stamp is saved to the library from the Stamps panel and a loaded one joins the layer', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await shapeIn(page, 1);
  await page.click('#smksave');
  await settle(page);
  await page.click('#smklib');
  await expect(page.locator('section.pn[data-p="slib"]:not([hidden])')).toBeVisible();
  await expect(page.locator('#slgrid .slc')).toHaveCount(1, { timeout: 15000 });
  await page.locator('#slgrid [data-sa="add"]').first().click();
  await settle(page);
  const s = await state(page);
  expect(s.tiles.length).toBe(2);
  expect(s.layers[0].st).toContain(s.tiles[1].id);
  expect(s.tiles[1].items.length).toBe(s.tiles[0].items.length);
  expect(errors).toEqual([]);
});

test('Zoom to stamp brings one printed copy of the open stamp to the middle of the screen and fills it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  const w0 = (await page.locator('#art').boundingBox()).width;
  await page.click('#smkzoom');
  await settle(page);
  const w1 = (await page.locator('#art').boundingBox()).width;
  expect(w1).toBeGreaterThan(w0 * 1.5);
  const b = await page.locator('#boardP').boundingBox();
  const near = await page.evaluate(() => { let best = null; for (let i = 0; i < 400; i++) { const p = __wbTest.stampToCanvas(i, 120, 120); if (!p) break; const a = document.getElementById('art'), r = a.getBoundingClientRect(), vb = a.viewBox.baseVal, x = r.left + p.x / vb.width * r.width, y = r.top + p.y / vb.height * r.height; best = best || { x, y }; const bd = Math.hypot(best.x - innerWidth / 2, best.y - innerHeight / 2), d = Math.hypot(x - innerWidth / 2, y - innerHeight / 2); if (d < bd) best = { x, y }; } return best; });
  expect(Math.abs(near.x - (b.x + b.width / 2))).toBeLessThan(b.width * 0.2);
  expect(Math.abs(near.y - (b.y + b.height / 2))).toBeLessThan(b.height * 0.2);
  expect(errors).toEqual([]);
});
