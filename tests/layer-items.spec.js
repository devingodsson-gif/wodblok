// The element list (format 23) holds stamps, pictures and text boxes in any mix, and the file keeps them; this checks the data and the drawing.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('url');
const { ROOT, openApp, openProjectFile, getState, settle } = require('./helpers/harness');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const nativeImport = new Function('u', 'return import(u)');
const FIX = path.join(ROOT, 'tests', 'fixtures', 'project-3-rect-16x9.wodblok');
const { zipSync, unzipSync, strToU8, strFromU8 } = require('fflate');
// the sample projects are .wodblok zips: read the project object out of one, and write a copy of a sample with another project object in it
const readProject = f => JSON.parse(strFromU8(unzipSync(new Uint8Array(fs.readFileSync(f)))['project.json']));
function writeProject(file, p, base) {
  const out = {}; for (const [k, v] of Object.entries({ ...unzipSync(new Uint8Array(fs.readFileSync(base))), 'project.json': strToU8(JSON.stringify(p)) })) out[k] = [v, { level: k === 'mimetype' || k.startsWith('assets/') ? 0 : 6 }];
  fs.writeFileSync(file, Buffer.from(zipSync(out)));
}
const projectZip = p => zipSync({ mimetype: [strToU8('application/vnd.wodblok+zip'), { level: 0 }], 'project.json': strToU8(JSON.stringify(p)) });

// A project whose element list holds a stamp, a picture and a text box.
function mixed(outDir) {
  const p = readProject(FIX);
  const tid = p.tiles[0].id;
  const items = k => [
    { u: k + 'a', k: 'stamp', t: tid, x: 200, y: 200, s: 160, r: 0, f: 1 },
    { u: k + 'b', k: 'image', a: 'zart', x: 500, y: 300, s: 200, r: 10, f: 1 },
    { u: k + 'c', k: 'text', tx: { text: 'A', f: 'x', sz: 40 }, G: { k1: 'M0 0L10 0L10 10Z' }, Lt: [['k1', 0, 0, 0, 1]], bw: 10, bh: 10, n: 10, x: 800, y: 400, s: 120, r: 0, f: 1 },
  ];
  p.arts = { zart: { n: 'Dot', k: 'img', src: PNG, w: 1, h: 1 } };
  p.els = items('p');
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, 'mixed.wodblok');
  writeProject(file, p, FIX);
  return { file, tid };
}

const drawn = (page, li) => page.evaluate(li => ({
  art: !!document.querySelector(`#art image[id^="ar${li}_"]`),
  text: !!document.querySelector(`#art [id^="tg${li}_"]`),
}), li);

test('a list with a stamp, a picture and a text draws all three', async ({ page }, testInfo) => {
  const { errors } = await openApp(page);
  const { file } = mixed(testInfo.outputDir);
  await openProjectFile(page, file);
  const s = JSON.parse(await getState(page));
  expect(s.els.map(q => Object.keys(q).find(k => ['t', 'a', 'tx'].includes(k)))).toEqual(['t', 'a', 'tx']);
  await expect.poll(async () => (await drawn(page, 0)).art, { message: 'picture' }).toBe(true);
  await expect.poll(async () => (await drawn(page, 0)).text, { message: 'text' }).toBe(true);
  expect(await page.locator('#art image[id^="ar0_"]').count()).toBe(1);
  expect(errors).toEqual([]);
});

test('the pictures used by elements are saved with the project, and a saved mixed project opens the same', async ({ page }, testInfo) => {
  const { errors } = await openApp(page);
  await openProjectFile(page, mixed(testInfo.outputDir).file);
  const before = await getState(page);
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#psv');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  await page.keyboard.press('Escape');
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  const saved = JSON.parse(Buffer.from(require('fflate').unzipSync(new Uint8Array(Buffer.from(dl.base64, 'base64')))['project.json']).toString('utf8'));
  expect(saved.v).toBe(25);
  expect(Object.keys(saved.arts)).toEqual(['zart']);
  expect(saved.els.length).toBe(3);
  const out = path.join(testInfo.outputDir, 'again.wodblok');
  fs.writeFileSync(out, Buffer.from(dl.base64, 'base64'));
  await page.reload();
  await openProjectFile(page, out);
  expect(await getState(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('an element list whose pieces are damaged is refused with a friendly message', async () => {
  const { fmtOpen } = await nativeImport(pathToFileURL(path.join(ROOT, 'src', 'format', 'container.js')).href);
  const p = readProject(FIX);
  p.els = [{ t: 1, x: 'nope', y: 3 }];
  await expect(fmtOpen(projectZip(p))).rejects.toThrow(/damaged pieces/);
  p.els = 'x';
  await expect(fmtOpen(projectZip(p))).rejects.toThrow(/no elements/);
});
