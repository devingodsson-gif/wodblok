// Layer update, step 4 (1.46.4): the Stamps tool. Outlines of the selected layer's arrangement are drawn on the canvas (opacity slider in the
// panel), several stamps can be picked for the arrangement, each stamp has a lock in the stamp list (one unlocked at a time, never saved,
// ends when another layer is selected), and a point on the canvas can be mapped into the stamp printed under it.
const { test, expect } = require('@playwright/test');
const { openApp, addStamp, openPanel, settle, getState } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const outlines = (page, cls = '') => page.locator('#stol path' + cls).count();
const addLayer = async page => { await openPanel(page, 'lyrs'); await page.click('#ly_add'); await settle(page); };

test('the Stamps panel is on the rail and lists every stamp, with the layers it is used on', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await expect(page.locator('#rail-stmp')).toHaveAttribute('aria-label', 'Stamps');
  await openPanel(page, 'stmp');
  await expect(page.locator('#stmpl .smkr')).toHaveCount(1);
  await expect(page.locator('#stmpl .smkr .smkn')).toHaveText('Stamp 1');
  await expect(page.locator('#stmpl .smkr .smkc')).toHaveText('1');
  await addStamp(page);
  await expect(page.locator('#stmpl .smkr')).toHaveCount(2);
  expect(await page.evaluate(() => __wbTest.commands.isEnabled('panel.stmp'))).toBe(true);
  expect(errors).toEqual([]);
});

test('several stamps can be picked for the arrangement of the selected layer', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addStamp(page);
  const used = async () => (await st(page)).layers[0].st.length;
  const before = await used();
  await page.locator('#stmpl .smkr .smkth').nth(1).click();
  await settle(page);
  expect(await used()).toBe(before === 2 ? 1 : 2);
  await page.locator('#stmpl .smkr .smkth').nth(1).click();
  await settle(page);
  expect(await used()).toBe(before);
  expect(errors).toEqual([]);
});

test('outlines show for a layer with an arrangement, fade with the slider and are remembered', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  expect(await outlines(page, '.olk')).toBeGreaterThan(4);
  expect(await outlines(page, '.olu')).toBe(0);
  await expect(page.locator('#stol')).toHaveAttribute('opacity', '0.60');
  await page.evaluate(() => { const r = document.getElementById('stmpop'); r.value = 25; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#stol')).toHaveAttribute('opacity', '0.25');
  expect(await page.evaluate(() => __wbTest.kv.get('wb146_olop'))).toBe('25');
  await page.evaluate(() => { const r = document.getElementById('stmpop'); r.value = 0; r.dispatchEvent(new Event('input', { bubbles: true })); });
  expect(await outlines(page)).toBe(0);
  expect(errors).toEqual([]);
});

test('a layer with no arrangement, or a frame, draws no outlines', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  expect(await outlines(page)).toBeGreaterThan(0);
  await page.click('#lmode [data-m="x"]');
  await settle(page);
  expect(await outlines(page)).toBe(0);
  await page.click('#lmode [data-m="f"]');
  await settle(page);
  expect(await outlines(page)).toBe(0);
  await page.click('#lmode [data-m="p"]');
  await settle(page);
  expect(await outlines(page)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('the lock is in the stamp list only; one stamp is unlocked at a time and the outline turns to the accent', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addStamp(page);
  await page.locator('#stmpl .smkr .smkth').nth(1).click();
  await settle(page);
  const locks = page.locator('#stmpl .smklk');
  await expect(locks).toHaveCount(2);
  await expect(locks.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#smked')).toBeHidden();
  await expect(page.locator('#stol .olu')).toHaveCount(0);
  // nothing on the canvas carries a lock
  expect(await page.locator('#art [class*="lock"], #stol [class*="lock"]').count()).toBe(0);
  await locks.nth(0).click();
  await settle(page);
  const first = await page.evaluate(() => __wbTest.unlockedStamp());
  expect(first).toBeTruthy();
  await expect(locks.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#smked')).toHaveText(/^Editing: Stamp 1 \(used on \d+ layers?\)$/);
  expect(await outlines(page, '.olu')).toBeGreaterThan(0);
  await locks.nth(1).click();
  await settle(page);
  expect(await page.evaluate(() => __wbTest.unlockedStamp())).not.toBe(first);
  await expect(locks.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(locks.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#smked')).toHaveText(/^Editing: Stamp 2 /);
  await locks.nth(1).click();
  await settle(page);
  expect(await page.evaluate(() => __wbTest.unlockedStamp())).toBe(null);
  await expect(page.locator('#smked')).toBeHidden();
  expect(errors).toEqual([]);
});

test('the unlocked state is not saved, and selecting another layer locks the stamp again', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  const before = await getState(page);
  await openPanel(page, 'stmp');
  await page.locator('#stmpl .smklk').first().click();
  await settle(page);
  expect(await page.evaluate(() => __wbTest.unlockedStamp())).toBeTruthy();
  expect(await getState(page)).toBe(before);
  await addLayer(page);
  expect(await page.evaluate(() => __wbTest.unlockedStamp())).toBe(null);
  await openPanel(page, 'stmp');
  await expect(page.locator('#stmpl .smklk').first()).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#stol .olu')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a canvas point maps into the stamp printed under it and back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  const hit = await page.evaluate(() => {
    const vb = document.getElementById('art').viewBox.baseVal, out = [];
    for (let y = 40; y < vb.height; y += 97) for (let x = 40; x < vb.width; x += 83) {
      const r = __wbTest.stampAt(x, y);
      if (r) { const c = __wbTest.stampToCanvas(r.i, r.u, r.v); out.push({ x, y, r, c }); }
    }
    return out;
  });
  expect(hit.length).toBeGreaterThan(5);
  for (const h of hit) {
    expect(h.r.t).toBeTruthy();
    expect(h.r.u).toBeGreaterThanOrEqual(-0.5);
    expect(Math.abs(h.c.x - h.x)).toBeLessThan(0.01);
    expect(Math.abs(h.c.y - h.y)).toBeLessThan(0.01);
  }
  // the middle of an instance maps to the middle of the stamp
  const mid = await page.evaluate(() => {
    const vb = document.getElementById('art').viewBox.baseVal;
    for (let y = 40; y < vb.height; y += 7) for (let x = 40; x < vb.width; x += 7) { const r = __wbTest.stampAt(x, y); if (r) { const c = __wbTest.stampToCanvas(r.i, 120, 120); return { r, c, near: __wbTest.stampAt(c.x, c.y) }; } }
    return null;
  });
  expect(mid.near.i).toBe(mid.r.i);
  expect(Math.abs(mid.near.u - 120)).toBeLessThan(0.01);
  expect(Math.abs(mid.near.v - 120)).toBeLessThan(0.01);
  expect(errors).toEqual([]);
});

test('outlines are not part of the artwork: not in #art, the exported SVG or the saved project', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  expect(await outlines(page)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.getElementById('art').outerHTML.includes('stol'))).toBe(false);
  const state = await getState(page);
  expect(state).not.toContain('stol');
  expect(state).not.toContain('wb146');
  await page.evaluate(() => document.getElementById('sv').click());
  await page.waitForFunction(() => window.__wbDownloads.some(d => /\.svg$/.test(d.filename)), null, { timeout: 30000 });
  const svg = await page.evaluate(() => { const d = window.__wbDownloads.find(x => /\.svg$/.test(x.filename)); return d.base64 ? atob(d.base64) : String(d.data); });
  expect(svg.length).toBeGreaterThan(1000);
  expect(svg).not.toContain('stol');
  expect(errors).toEqual([]);
});

test('outlines sit on the canvas: the overlay has the size and viewBox of the artwork and stays inside it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  const a = await page.locator('#art').boundingBox(), o = await page.locator('#stolsvg').boundingBox();
  expect(Math.abs(a.x - o.x)).toBeLessThan(1.5);
  expect(Math.abs(a.y - o.y)).toBeLessThan(1.5);
  expect(Math.abs(a.width - o.width)).toBeLessThan(1.5);
  expect(Math.abs(a.height - o.height)).toBeLessThan(1.5);
  expect(await page.evaluate(() => document.getElementById('stolsvg').getAttribute('viewBox') === document.getElementById('art').getAttribute('viewBox'))).toBe(true);
  expect(errors).toEqual([]);
});
