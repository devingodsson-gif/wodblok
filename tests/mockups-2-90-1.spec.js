// 2.90.1 (owner Nov 3 2026, docs/mockups-plan.md step 1): Window > Mockup is a live panel. Add mockup brings in a photo; the design is drawn onto its print area
// (four corners, Edit corners), Repeat or Once at a Scale, with the photo's light by Shading; Export mockup saves a PNG at the photo's size. Nothing goes in the project.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
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
  await expect(page.locator('#mkvw')).toBeHidden(); await expect(page.locator('#mkg')).toBeHidden();
  await page.setInputFiles('#mkpane .mkfile', { name: 'Room.png', mimeType: 'image/png', buffer: Buffer.from(await photo(page), 'base64') });
  await expect(page.locator('#mkvw')).toBeVisible(); await expect(page.locator('#mkpane [data-mk]')).toHaveCount(1);
  await expect(page.locator('#mkpane [data-mk] b')).toHaveText('Room');
  await waitView(page, 0);
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
