// Layer update, step 1 (1.46.1): any layer may hold items (free stamps, pictures, text boxes) in any mix, with or without an arrangement,
// and the file format (21) keeps them. The screens still make one kind of layer at a time; this checks the data and the drawing.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('url');
const { ROOT, openApp, openProjectFile, getState, settle } = require('./helpers/harness');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const nativeImport = new Function('u', 'return import(u)');
const FIX = path.join(ROOT, 'tests', 'fixtures', 'project-3-rect-16x9.wodblok');

// A project whose first layer (an arrangement) and a second, free layer both hold a stamp, a picture and a text box.
function mixed(outDir) {
  const p = JSON.parse(fs.readFileSync(FIX, 'utf8'));
  const tid = p.layers[0].st[0];
  const items = k => [
    { u: k + 'a', t: tid, x: 200, y: 200, s: 160, r: 0, f: 1 },
    { u: k + 'b', a: 'zart', x: 500, y: 300, s: 200, r: 10, f: 1 },
    { u: k + 'c', tx: { text: 'A', f: 'x', sz: 40 }, G: { k1: 'M0 0L10 0L10 10Z' }, Lt: [['k1', 0, 0, 0, 1]], bw: 10, bh: 10, n: 10, x: 800, y: 400, s: 120, r: 0, f: 1 },
  ];
  p.arts = { zart: { n: 'Dot', k: 'img', src: PNG, w: 1, h: 1 } };
  p.layers[0].pl = items('p');
  const free = JSON.parse(JSON.stringify(p.layers[0]));
  free.u = 'freeMixed'; free.name = 'Mixed free'; free.free = true; free.st = []; free.pl = items('f');
  p.layers.push(free);
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, 'mixed.wodblok');
  fs.writeFileSync(file, JSON.stringify(p));
  return { file, tid };
}

const drawn = (page, li) => page.evaluate(li => ({
  art: !!document.querySelector(`#art image[id^="ar${li}_"]`),
  text: !!document.querySelector(`#art [id^="tg${li}_"]`),
}), li);

test('a layer with an arrangement draws its stamps, picture and text on top of the arrangement', async ({ page }, testInfo) => {
  const { errors } = await openApp(page);
  const { file } = mixed(testInfo.outputDir);
  await openProjectFile(page, file);
  const s = JSON.parse(await getState(page));
  expect(s.layers[0].free).toBeFalsy();
  expect(s.layers[0].pl.map(q => Object.keys(q).find(k => ['t', 'a', 'tx'].includes(k)))).toEqual(['t', 'a', 'tx']);
  await expect.poll(async () => (await drawn(page, 0)).art, { message: 'picture on the arrangement layer' }).toBe(true);
  await expect.poll(async () => (await drawn(page, 0)).text, { message: 'text on the arrangement layer' }).toBe(true);
  expect(await page.locator('#art image[id^="ar0_"]').count()).toBe(1);
  // the arrangement itself is still drawn: many more stamps than the one placed
  expect(await page.locator('#art use[href^="#bk"]').count()).toBeGreaterThan(3);
  expect(errors).toEqual([]);
});

test('a free layer draws all three kinds at once', async ({ page }, testInfo) => {
  const { errors } = await openApp(page);
  await openProjectFile(page, mixed(testInfo.outputDir).file);
  const li = JSON.parse(await getState(page)).layers.length - 1;
  await expect.poll(async () => (await drawn(page, li)).art, { message: 'picture on the free layer' }).toBe(true);
  await expect.poll(async () => (await drawn(page, li)).text, { message: 'text on the free layer' }).toBe(true);
  expect(errors).toEqual([]);
});

test('the pictures used by items on any layer are saved with the project, and a saved mixed project opens the same', async ({ page }, testInfo) => {
  const { errors } = await openApp(page);
  await openProjectFile(page, mixed(testInfo.outputDir).file);
  const before = await getState(page);
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#psv');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  await page.keyboard.press('Escape');
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  const saved = JSON.parse(Buffer.from(require('fflate').unzipSync(new Uint8Array(Buffer.from(dl.base64, 'base64')))['project.json']).toString('utf8'));
  expect(saved.v).toBe(21);
  expect(Object.keys(saved.arts)).toEqual(['zart']);
  expect(saved.layers[0].pl.length).toBe(3);
  const out = path.join(testInfo.outputDir, 'again.wodblok');
  fs.writeFileSync(out, Buffer.from(dl.base64, 'base64'));
  await page.reload();
  await openProjectFile(page, out);
  expect(await getState(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('a layer whose pieces are damaged is refused with a friendly message', async () => {
  const { fmtOpen } = await nativeImport(pathToFileURL(path.join(ROOT, 'src', 'format', 'container.js')).href);
  const p = JSON.parse(fs.readFileSync(FIX, 'utf8'));
  p.layers[0].pl = [{ t: 1, x: 'nope', y: 3 }];
  await expect(fmtOpen(new TextEncoder().encode(JSON.stringify(p)))).rejects.toThrow(/damaged pieces/);
  p.layers[0].pl = 'x';
  await expect(fmtOpen(new TextEncoder().encode(JSON.stringify(p)))).rejects.toThrow(/damaged pieces/);
});
