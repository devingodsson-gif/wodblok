// 2.90.1 and 2.90.2 (owner Nov 3 and 4 2026, docs/mockups-plan.md steps 1 and 2): Window > Mockup is a live panel. Add mockup brings in a photo; the design is drawn onto its print area
// (four corners, Edit corners), Repeat or Once at a Scale, with the photo's light by Shading; Export mockup saves a PNG at the photo's size. Nothing goes in the project.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const path = require('path');
// a photo: a grey room and a white panel in the middle (the print area), 600 x 400
const photo = page => page.evaluate(() => { const c = document.createElement('canvas'); c.width = 600; c.height = 400; const x = c.getContext('2d'); x.fillStyle = '#8a8580'; x.fillRect(0, 0, 600, 400);
  x.fillStyle = '#ffffff'; x.fillRect(150, 100, 300, 200); return c.toDataURL('image/png').split(',')[1]; });
// the view's pixel at a fraction of its width and height
const px = (page, fx, fy) => page.evaluate(([fx, fy]) => { const c = document.getElementById('mkc'); const d = c.getContext('2d').getImageData(Math.round(c.width * fx), Math.round(c.height * fy), 1, 1).data; return [d[0], d[1], d[2]]; }, [fx, fy]);
const viewKey = page => page.evaluate(() => { const c = document.getElementById('mkc'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0; return h; });
const waitView = async (page, prev) => { await page.waitForFunction(p => { const c = document.getElementById('mkc'); if (!c || !c.width) return false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0; return h !== p; }, prev, { timeout: 15000 }); await page.waitForTimeout(300); };

test('Add mockup, the design on its print area, Repeat and Once, Shading, corners and Export mockup', async ({ page }) => {
  test.setTimeout(120000);
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.addShape(page); await H.settle(page);
  const doc0 = await H.getState(page);
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock'));
  await page.waitForSelector('section.pn[data-p="mock"]:not([hidden])');
  // 2.90.2: the first product shows until a mockup is chosen; a product's print area is its own (no Edit corners)
  await expect(page.locator('#mkvw')).toBeVisible(); await waitView(page, 0);
  await expect(page.locator('#mkcn')).toBeHidden();
  const k0 = await viewKey(page);
  await page.setInputFiles('#mkpane .mkfile', { name: 'Room.png', mimeType: 'image/png', buffer: Buffer.from(await photo(page), 'base64') });
  await expect(page.locator('#mkpane [data-mk^="m"]')).toHaveCount(1);
  await expect(page.locator('#mkpane [data-mk^="m"] b')).toHaveText('Room');
  await waitView(page, k0);
  // outside the print area the photo shows as it is; inside, the design (not the white panel)
  const out = await px(page, .05, .05); expect(Math.abs(out[0] - 0x8a)).toBeLessThan(6);
  const k1 = await viewKey(page);
  // a canvas that is not a repeat tile starts on Once; Repeat and Once change the view
  await expect(page.locator('#mkfl [data-f="one"]')).toHaveClass(/on/);
  await page.locator('#mkfl [data-f="rep"]').click(); await waitView(page, k1);
  const k2 = await viewKey(page);
  await page.locator('#mkfl [data-f="one"]').click(); await waitView(page, k2);
  await page.locator('#mkfl [data-f="rep"]').click(); await page.waitForTimeout(400);
  // Shading 0 and Scale change it too, and are kept
  const k3 = await viewKey(page);
  const sh = page.locator('#mksh').locator('xpath=..').locator('.num input'); await sh.fill('0'); await sh.press('Enter'); await waitView(page, k3);
  const k4 = await viewKey(page);
  const sc = page.locator('#mksc').locator('xpath=..').locator('.num input'); await sc.fill('60'); await sc.press('Enter'); await waitView(page, k4);
  const ui = await page.evaluate(() => JSON.parse(localStorage.getItem('wb2901_mockui') || JSON.parse(localStorage.getItem('wb_settings') || '{}').values?.wb2901_mockui || 'null'));
  if (ui) { expect(ui.sh).toBe(0); expect(ui.sr).toBe(60); expect(ui.fill).toBe('rep'); }
  // Edit corners: four squares; dragging the top left one moves the print area
  await page.locator('#mkcn').check();
  await expect(page.locator('#mkov [data-mkq]')).toHaveCount(4);
  const k5 = await viewKey(page), h0 = await page.locator('#mkov [data-mkq="0"]').boundingBox();
  await page.mouse.move(h0.x + h0.width / 2, h0.y + h0.height / 2); await page.mouse.down();
  await page.mouse.move(h0.x - 20, h0.y - 20, { steps: 4 }); await page.mouse.up();
  await waitView(page, k5);
  const h1 = await page.locator('#mkov [data-mkq="0"]').boundingBox(); expect(h1.x).toBeLessThan(h0.x - 10);
  // Export mockup: a PNG at the photo's own size
  await page.locator('#mkx').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 60000 });
  const png = Buffer.from((await page.evaluate(() => window.__wbDownloads[0])).base64, 'base64');
  expect(png.slice(1, 4).toString()).toBe('PNG'); expect(png.readUInt32BE(16)).toBe(600); expect(png.readUInt32BE(20)).toBe(400);
  // the project is untouched; the command is in the registry
  expect(await H.getState(page)).toBe(doc0);
  expect(errors).toEqual([]);
});

test('the view follows the design: a change on the canvas draws the mockup again', async ({ page }) => {
  test.setTimeout(90000);
  const { errors } = await H.openApp(page, { seed: 4 }); await H.addShape(page); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock'));
  await page.setInputFiles('#mkpane .mkfile', { name: 'Wall.png', mimeType: 'image/png', buffer: Buffer.from(await photo(page), 'base64') });
  await waitView(page, 0); const k = await viewKey(page);
  // a new design (Randomize): the view is made again a moment later
  await page.evaluate(() => window.__wbTest.commands.run('randomize.roll')); await H.settle(page);
  await waitView(page, k);
  expect(errors).toEqual([]);
});

test('the Products: six built-in products, the design only on the product, Real size with a canvas of real size', async ({ page }) => {
  test.setTimeout(120000);
  const { errors } = await H.openApp(page, { seed: 11 });
  await page.evaluate(() => window.__wbTest.commands.run('randomize.roll')); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock'));
  const ids = await page.locator('#mkpane [data-mk^="p-"]').evaluateAll(b => b.map(x => x.dataset.mk));
  expect(ids).toEqual(['p-tshirt', 'p-tote', 'p-cushion', 'p-fabric', 'p-wallpaper', 'p-notebook']);
  await page.locator('#mkfl [data-f="rep"]').click();
  // the cushion: the wall above it and beside it stays as the photo; its middle takes the design
  await page.locator('#mkpane [data-mk="p-cushion"]').click(); await waitView(page, 0);
  const photoPx = await page.evaluate(async () => { const i = new Image(); i.src = document.querySelector('#mkpane [data-mk="p-cushion"] img').src; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d'); x.drawImage(i, 0, 0);
    return [[.5, .02], [.02, .5], [.5, .5]].map(([fx, fy]) => [...x.getImageData(Math.round(c.width * fx), Math.round(c.height * fy), 1, 1).data].slice(0, 3)); });
  const near = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
  expect(near(await px(page, .5, .02), photoPx[0])).toBeLessThan(12);
  expect(near(await px(page, .02, .5), photoPx[1])).toBeLessThan(12);
  expect(near(await px(page, .5, .5), photoPx[2])).toBeGreaterThan(12);
  // Real size shows only when the canvas has a real size; it sets the scale (the slider is off) and changes the view
  await expect(page.locator('#mkrsr')).toBeHidden();
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); s.dim = { ...(s.dim || {}), u: 'mm', pw: 100, ph: 150, dpi: 300 }; window.__wbTest.apply(JSON.stringify(s)); }); await H.settle(page);
  await page.locator('#mkpane [data-mk="p-tote"]').click(); await page.waitForTimeout(600);
  await expect(page.locator('#mkrsr')).toBeVisible();
  const k = await viewKey(page);
  await page.locator('#mkrs').check(); await waitView(page, k);
  await expect(page.locator('#mksc')).toBeDisabled();
  expect(errors).toEqual([]);
});

// 2.92.2 (owner Nov 4 2026, docs/own-mockups-plan.md step 1): a photo you add has its product found at once (Find product, a mask kept with it, its corners the
// product's box); Tolerance makes the mask again; Find product off goes back to corners only.
test('your own mockup: Find product makes its mask, Tolerance and Find product change it', async ({ page }) => {
  test.setTimeout(150000);
  const { errors } = await H.openApp(page, { seed: 11 });
  await page.evaluate(() => window.__wbTest.commands.run('randomize.roll')); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock'));
  await page.locator('#mkfl [data-f="rep"]').click(); await page.waitForTimeout(500);
  await expect(page.locator('#mkamr')).toBeHidden();   // a product: its mask is its own
  const k0 = await viewKey(page);
  await page.setInputFiles('#mkpane .mkfile', path.join(__dirname, '..', 'mockups', 'tshirt.webp'));
  await expect(page.locator('#mkpane [data-mk^="m"]')).toHaveCount(1); await waitView(page, k0);
  await expect(page.locator('#mkam')).toBeChecked(); await expect(page.locator('#mktolr')).toBeVisible();
  // the corners are the shirt's box; just inside its top left corner is the wall beside the collar and the shoulder: the photo, not the design
  const st = () => page.evaluate(() => { const v = window.__wbTest.kv.get('wb2901_mockups'); return JSON.parse(v).t[0]; });
  const t = await st(); expect(t.am).toBe(1); expect(t.q[0]).toBeLessThan(.06); expect(t.q[2]).toBeGreaterThan(.94);
  const photo = await page.evaluate(async () => { const i = new Image(); i.src = document.querySelector('#mkpane [data-mk^="m"] img').src; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return [...x.getImageData(Math.round(c.width * .3), Math.round(c.height * .06), 1, 1).data].slice(0, 3); });
  const near = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
  expect(near(await px(page, .3, .06), photo)).toBeLessThan(14);
  // Tolerance remakes the mask
  const k1 = await viewKey(page), tol = page.locator('#mktol').locator('xpath=..').locator('.num input'); await tol.fill('90'); await tol.press('Enter');
  await page.waitForFunction(() => JSON.parse(window.__wbTest.kv.get('wb2901_mockups')).t[0].tol === 90, null, { timeout: 15000 });
  // Find product off: corners only, so the design covers the wall there too
  await page.locator('#mkam').uncheck(); await page.waitForTimeout(1200); expect((await st()).am).toBeUndefined();
  await expect(page.locator('#mktolr')).toBeHidden();
  expect(near(await px(page, .3, .06), photo)).toBeGreaterThan(14);
  expect(errors).toEqual([]);
});

// 2.92.3 (docs/own-mockups-plan.md step 2): your own mockup has Folds (the design follows the photo's folds) and Real width (in Settings > General > Units), so Real size works for it
test('your own mockup: Folds and Real width, then Real size', async ({ page }) => {
  test.setTimeout(150000);
  const { errors } = await H.openApp(page, { seed: 11 });
  await page.evaluate(() => { window.__wbTest.kv.set('wb2871_units', 'cm'); window.__wbTest.commands.run('randomize.roll'); }); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock'));
  await page.locator('#mkfl [data-f="rep"]').click(); await page.waitForTimeout(400);
  await expect(page.locator('#mkfor')).toBeHidden(); await expect(page.locator('#mkcmr')).toBeHidden();   // a product has its own
  await page.setInputFiles('#mkpane .mkfile', path.join(__dirname, '..', 'mockups', 'fabric.webp'));
  await page.waitForFunction(() => { const v = window.__wbTest.kv.get('wb2901_mockups'); return v && JSON.parse(v).t.length && JSON.parse(v).t[0].tol != null; }, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  await expect(page.locator('#mkfor')).toBeVisible(); await expect(page.locator('#mkcmu')).toHaveText('cm');
  const rec = () => page.evaluate(() => JSON.parse(window.__wbTest.kv.get('wb2901_mockups')).t[0]);
  const k = await viewKey(page), fo = page.locator('#mkfo').locator('xpath=..').locator('.num input'); await fo.fill('80'); await fo.press('Enter'); await waitView(page, k);
  expect((await rec()).warp).toBeCloseTo(.8, 5);
  await page.locator('#mkcm').fill('110'); await page.locator('#mkcm').press('Enter'); await page.locator('#mkcm').blur(); await page.waitForTimeout(300);
  expect((await rec()).cm).toBe(110);
  // Real size shows once the canvas has a real size
  await expect(page.locator('#mkrsr')).toBeHidden();
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); s.dim = { ...(s.dim || {}), u: 'mm', pw: 200, ph: 300, dpi: 300 }; window.__wbTest.apply(JSON.stringify(s)); }); await H.settle(page);
  await expect(page.locator('#mkrsr')).toBeVisible({ timeout: 5000 });
  const k2 = await viewKey(page); await page.locator('#mkrs').check(); await waitView(page, k2);
  // clearing Real width takes it away
  await page.locator('#mkcm').fill(''); await page.locator('#mkcm').press('Enter'); await page.locator('#mkcm').blur(); await page.waitForTimeout(300);
  expect((await rec()).cm).toBeUndefined(); await expect(page.locator('#mkrsr')).toBeHidden();
  expect(errors).toEqual([]);
});
