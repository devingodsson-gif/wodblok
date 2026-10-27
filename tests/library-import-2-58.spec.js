// 2.58.0: Saved trays and Saved colourways take back the files they export (Import beside Export in the library's bar), one file or a zip with folders.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), os = require('os'), path = require('path');
const { zipSync, strToU8 } = require('fflate');
const H = require('./helpers/harness');

const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'wb-imp-'));
const file = (d, name, kind, n, cols) => { const f = path.join(d, name); fs.writeFileSync(f, JSON.stringify({ app: 'WODBLOK', kind, name: n, colours: cols })); return f; };

test('Saved trays: Import takes a tray file and a zip of tray files with its folders', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.openPanel(page, 'colors'); await H.settle(page);
  await expect(page.locator('#stpane [data-stimp]')).toHaveAttribute('aria-label', 'Import trays');
  const d = dir();
  await page.setInputFiles('#stpane .stimpf', file(d, 'a.wodblok-tray', 'tray', 'Harbour', [['#123456', 'Navy'], ['#f0e0d0', 'Sand']]));
  await expect(page.locator('#pmsg')).toHaveText('Added “Harbour” to the library.');
  await expect(page.locator('#stl button[data-st]', { hasText: 'Harbour' })).toHaveCount(1);
  const zip = path.join(d, 'trays.zip');
  fs.writeFileSync(zip, Buffer.from(zipSync({ 'Coast/one.wodblok-tray': strToU8(JSON.stringify({ app: 'WODBLOK', kind: 'tray', name: 'Dune', colours: [['#aa8844', 'Ochre']] })), 'two.wodblok-tray': strToU8(JSON.stringify({ app: 'WODBLOK', kind: 'tray', name: 'Kelp', colours: [['#225533', 'Kelp']] })), 'notes.txt': strToU8('x') })));
  await page.setInputFiles('#stpane .stimpf', zip);
  await expect(page.locator('#pmsg')).toHaveText('Added 2 trays.');
  await expect(page.locator('#stl .lfr[data-k="Coast"]')).toHaveCount(1);   // the zip's folder became a folder
  // a file that is not a tray is refused
  await page.setInputFiles('#stpane .stimpf', file(d, 'b.wodblok-tray', 'colourway', 'Nope', [['#000000', '']]));
  await expect(page.locator('#pmsg')).toHaveText('Could not read that file.');
  expect(errors).toEqual([]);
});

test('Saved colourways: Import takes a colourway file', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.openPanel(page, 'colors'); await H.settle(page);
  const d = dir();
  await page.setInputFiles('#cvpane .cvimpf', file(d, 'c.wodblok-colourway', 'colourway', 'Dusk', [['#334455', 'Slate'], ['#ddccbb', 'Linen']]));
  await expect(page.locator('#pmsg')).toHaveText('Added “Dusk” to the library.');
  await expect(page.locator('#cvpane [data-cv]', { hasText: 'Dusk' })).toHaveCount(1);
  expect(errors).toEqual([]);
});
