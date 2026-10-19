// Project files: open each real fixture, snapshot what the app understood, save it again with
// "Download project file", reopen that, and check nothing was lost or changed.
// Fixtures are format v:18 files from the v100 app. They must open in every future build.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, TARGET, openApp, openProjectFile, getState, stateText, checkpoint, settle } = require('./helpers/harness');

const DIR = path.join(ROOT, 'tests', 'fixtures');
const FIXTURES = fs.readdirSync(DIR).filter(f => f.endsWith('.wodblok.json')).sort();

async function download(page) {
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  if (TARGET === 'legacy') { await page.click('#fileb'); await page.click('#pdl'); } else await page.click('#psv');   // 1.0.4: the top-bar Save project writes the file
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  await page.keyboard.press('Escape');
  return page.evaluate(() => window.__wbDownloads[0]);
}

for (const f of FIXTURES) {
  const slug = f.replace('.wodblok.json', '');

  test(`open ${f}`, async ({ page }, testInfo) => {
    const { errors } = await openApp(page);
    await openProjectFile(page, path.join(DIR, f));
    await checkpoint(page, testInfo, errors, `open-${slug}`);
  });

  test(`round trip ${f}`, async ({ page }) => {
    const { errors } = await openApp(page);
    await openProjectFile(page, path.join(DIR, f));
    const before = await stateText(page);

    const dl = await download(page);
    // the repo build saves the zip container (format 21 since the layer update); the untouched v100 baseline still saves v18 JSON.
    const zip = TARGET !== 'legacy';
    expect(dl.filename).toMatch(zip ? /\.wodblok$/ : /\.wodblok\.json$/);
    const bytes = zip ? Buffer.from(dl.base64, 'base64') : null;
    const saved = zip ? JSON.parse(Buffer.from(require('fflate').unzipSync(new Uint8Array(bytes))['project.json']).toString('utf8')) : JSON.parse(dl.data);
    expect(saved.app).toBe('WODBLOK');
    if (zip) expect(Object.keys(require('fflate').unzipSync(new Uint8Array(bytes)))).toContain('thumbnail.png');
    expect(saved.v).toBe(zip ? 21 : 18);                   // the format number continues from v:18
    // What was saved is exactly what the app held after opening (no loss on save)...
    const held = JSON.parse(before);
    for (const k of ['tiles', 'layers', 'proj', 'dim', 'pr', 'tex', 'texLib', 'pg', 'grade'])
      expect(saved[k], `field ${k} is saved as held`).toEqual(held[k]);
    // ...and the way opening changes the original file is recorded, not hidden. Today v100 nudges a few
    // values on open (for example a frame inset 9.6 -> 9.5). Phases 1-3 must keep this identical.
    const orig = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    const changes = {};
    for (const k of ['tiles', 'layers', 'proj', 'dim', 'pr', 'tex', 'texLib', 'pg', 'grade']) diff(orig[k], held[k], k, changes);
    expect(JSON.stringify(changes, null, 1) + '\n').toMatchSnapshot(`open-normalisation-${slug}.json`);

    // Reopen the saved file in a fresh page: the document must come back identical.
    const tmp = testInfo_tmp(f);
    fs.writeFileSync(tmp, zip ? bytes : dl.data);
    const page2 = await page.context().newPage();
    const r2 = await openApp(page2);
    await openProjectFile(page2, tmp);
    expect(await stateText(page2)).toBe(before);
    expect(errors.concat(r2.errors)).toEqual([]);
  });
}

// Paths whose values differ between a and b: { path: [a, b] }.
function diff(a, b, p, out) {
  if (a === b) return;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], p + '.' + k, out);
  } else if (!(Number.isNaN(a) && Number.isNaN(b))) out[p] = [a === undefined ? '(absent)' : a, b === undefined ? '(absent)' : b];
}

function testInfo_tmp(f) {
  const d = path.join(ROOT, 'test-results', 'tmp');
  fs.mkdirSync(d, { recursive: true });
  return path.join(d, 'resaved-' + f);
}

test('a file that is not a WODBLOK project is refused without damage', async ({ page }) => {
  const { errors } = await openApp(page);
  const before = await stateText(page);
  const bad = path.join(ROOT, 'test-results', 'tmp', 'not-a-project.json');
  fs.mkdirSync(path.dirname(bad), { recursive: true });
  fs.writeFileSync(bad, JSON.stringify({ hello: 'world' }));
  await page.setInputFiles('#pfile', bad);
  await page.waitForFunction(() => /not a WODBLOK project/.test(document.getElementById('pmsg').textContent));
  await settle(page);
  expect(await stateText(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('projects saved in the account database list and reopen', async ({ page }) => {
  test.skip(TARGET !== 'legacy', 'the browser/account project list was removed in 1.0.4: projects are .wodblok files');
  const { errors } = await openApp(page, { runtime: 'artifact' });
  await openProjectFile(page, path.join(DIR, FIXTURES[0]));
  const before = await stateText(page);
  const stored = await page.evaluate(() => JSON.stringify(Object.keys(window.__wbDb)));
  expect(stored).toContain('data/users/test-user/projects');
  // The Projects list reads from the account database: the project we opened is there, and its Open button
  // brings back the same document.
  await page.click('#pls');
  await page.waitForSelector('#pgrid .pc');
  expect(await page.locator('#pgrid .pc').count()).toBe(1);
  await page.click('#plist', { position: { x: 4, y: 4 } });          // click the backdrop to close the list
  await page.click('#fileb');
  await page.click('#clr');                                          // File > Clear: a blank document
  await settle(page);
  expect(await stateText(page)).not.toBe(before);
  await page.click('#pls');
  const openBtn = page.locator('#pgrid .pc [data-a="open"]');
  await openBtn.click();                                             // the first click asks "Discard changes?"
  await expect(openBtn).toHaveText(/Discard/);
  await openBtn.click();                                             // the second confirms
  await page.waitForFunction(() => /Opened/.test(document.getElementById('pmsg').textContent));
  await settle(page);
  expect(await stateText(page)).toBe(before);
  expect(errors).toEqual([]);
});
