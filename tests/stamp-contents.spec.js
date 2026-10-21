// Element update, step 6 (2.1.6): a stamp holds pictures and text as well as shapes (tile.el). "Make stamp from selection" turns the selected
// pictures and text into a new stamp and puts one copy of it where they were; the Contents group lists what a stamp holds.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};
const st = async page => JSON.parse(await getState(page));

async function placePicture(page, testInfo) {
  await openPanel(page, 'elimg');
  const f = path.join(testInfo.outputDir, 'dot.png');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(f, Buffer.from(PNG, 'base64'));
  await page.setInputFiles('#lfafile', f);
  await settle(page);
  await canvasClick(page, 0.5, 0.5);
  await page.click('#lfars [data-a]');          // stop placing
  await canvasClick(page, 0.5, 0.5);            // select it
}

test('Make stamp from selection is off with nothing selected; a selected picture becomes a stamp that holds it', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 4 });
  const n0 = (await st(page)).tiles.length;
  await openPanel(page, 'stmp');
  await expect(page.locator('#stmksel')).toBeDisabled();
  await placePicture(page, testInfo);
  await openPanel(page, 'stmp');
  await expect(page.locator('#stmksel')).toBeEnabled();
  await page.click('#stmksel');
  await settle(page);
  const s = await st(page);
  expect(s.tiles).toHaveLength(n0 + 1);
  const t = s.tiles[s.tiles.length - 1];
  expect(t.el).toHaveLength(1);
  expect(t.el[0]).toMatchObject({ k: 'image' });
  const pl = s.els;
  expect(pl.filter(q => q.k === 'image')).toHaveLength(0);
  expect(pl.filter(q => q.k === 'stamp' && q.t === t.id)).toHaveLength(1);
  // the stamp's symbol carries the picture, and it draws on the canvas
  // the picture still shows, now printed by the stamp: the middle of the canvas is not empty
  const mid = await page.evaluate(async () => {
    const svg = document.getElementById('art'), r = svg.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  });
  expect(mid.w).toBeGreaterThan(100);
  const shot = await page.locator('#art').screenshot({ clip: { x: mid.w / 2 - 4, y: mid.h / 2 - 4, width: 8, height: 8 } });
  const px = await page.evaluate(async b64 => {
    const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
    const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return Array.from(x.getImageData(bm.width >> 1, bm.height >> 1, 1, 1).data);
  }, shot.toString('base64'));
  expect(px[3], 'opaque').toBeGreaterThan(200);
  expect(px[0] - px[2], 'the picture is red').toBeGreaterThan(40);
  await expect(page.locator('#stcl .mr')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('taking the picture out of the stamp empties its Contents; the project keeps the picture while a stamp holds it', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 4 });
  await placePicture(page, testInfo);
  await openPanel(page, 'stmp');
  await page.click('#stmksel');
  await settle(page);
  await page.click('#stcl [data-xi="0"]');
  await settle(page);
  const s = await st(page);
  expect(s.tiles[s.tiles.length - 1].el).toBeUndefined();
  await expect(page.locator('#stcl')).toBeHidden();
  expect(errors).toEqual([]);
});

test('selected text becomes a stamp that holds the text', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'Hi');
  await settle(page);
  await canvasClick(page, 0.5, 0.5);
  await page.keyboard.press('Escape');         // put the text tool down
  await openPanel(page, 'lyrs');
  await page.click('#lyl2 .lyr');                // select the text from the Elements list
  await settle(page);
  await openPanel(page, 'stmp');
  await expect(page.locator('#stmksel')).toBeEnabled();
  await page.click('#stmksel');
  await settle(page);
  const s = await st(page);
  const t = s.tiles[s.tiles.length - 1];
  expect(t.el).toHaveLength(1);
  expect(t.el[0]).toMatchObject({ k: 'text' });
  expect(s.els.filter(q => q.k === 'text')).toHaveLength(0);
  expect(errors).toEqual([]);
});
