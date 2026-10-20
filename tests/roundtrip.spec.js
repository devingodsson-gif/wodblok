// Project files: open each sample project (tests/fixtures, made by make-fixtures.js), snapshot what the app understood, save it again with
// Save project, reopen that, and check nothing was lost or changed. Files made by an older WODBLOK, or by a newer one, are handled as the
// owner decided (Oct 19 2026): older ones are refused with a message, never converted; newer ones open read-only.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { zipSync, unzipSync, strToU8, strFromU8 } = require('fflate');
const { ROOT, openApp, openProjectFile, getState, stateText, checkpoint, settle } = require('./helpers/harness');

const DIR = path.join(ROOT, 'tests', 'fixtures');
const FIXTURES = fs.readdirSync(DIR).filter(f => f.endsWith('.wodblok')).sort();
const TMP = path.join(ROOT, 'test-results', 'tmp');

async function download(page) {
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#psv');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  await page.keyboard.press('Escape');
  return page.evaluate(() => window.__wbDownloads[0]);
}
const unpack = f => unzipSync(new Uint8Array(fs.readFileSync(path.join(DIR, f))));
const projectOf = f => JSON.parse(strFromU8(unpack(f)['project.json']));
// a copy of a fixture with its project.json changed by fn
function variant(f, name, fn) {
  const files = unpack(f), p = projectOf(f); fn(p);
  const out = { ...files, 'project.json': strToU8(JSON.stringify(p)) };
  fs.mkdirSync(TMP, { recursive: true });
  const file = path.join(TMP, name);
  const entries = {};
  for (const [k, v] of Object.entries(out)) entries[k] = [v, { level: k === 'mimetype' || k.startsWith('assets/') ? 0 : 6 }];
  fs.writeFileSync(file, Buffer.from(zipSync(entries)));
  return file;
}

for (const f of FIXTURES) {
  const slug = f.replace('.wodblok', '');

  test(`open ${f}`, async ({ page }, testInfo) => {
    const { errors } = await openApp(page);
    await openProjectFile(page, path.join(DIR, f));
    await checkpoint(page, testInfo, errors, `open-${slug}`);
  });

  test(`round trip ${f}`, async ({ page }, testInfo) => {
    const { errors } = await openApp(page);
    await openProjectFile(page, path.join(DIR, f));
    const before = await stateText(page);

    const dl = await download(page);
    expect(dl.filename).toMatch(/\.wodblok$/);
    const bytes = Buffer.from(dl.base64, 'base64');
    const files = unzipSync(new Uint8Array(bytes));
    const saved = JSON.parse(strFromU8(files['project.json']));
    expect(saved.app).toBe('WODBLOK');
    expect(Object.keys(files)).toContain('thumbnail.png');
    expect(saved.v).toBe(22);
    // What was saved is exactly what the app held after opening (no loss on save).
    const held = JSON.parse(before);
    for (const k of ['tiles', 'layers', 'proj', 'dim', 'pr', 'tex', 'texLib', 'pg', 'grade'])
      expect(saved[k], `field ${k} is saved as held`).toEqual(held[k]);

    // Reopen the saved file in a fresh page: the document must come back identical.
    fs.mkdirSync(TMP, { recursive: true });
    const tmp = path.join(TMP, 'resaved-' + f);
    fs.writeFileSync(tmp, bytes);
    const page2 = await page.context().newPage();
    const r2 = await openApp(page2);
    await openProjectFile(page2, tmp);
    expect(await stateText(page2)).toBe(before);
    expect(errors.concat(r2.errors)).toEqual([]);
  });
}

test('a file that is not a WODBLOK project is refused without damage', async ({ page }) => {
  const { errors } = await openApp(page);
  const before = await stateText(page);
  const bad = path.join(TMP, 'not-a-project.json');
  fs.mkdirSync(path.dirname(bad), { recursive: true });
  fs.writeFileSync(bad, JSON.stringify({ hello: 'world' }));
  await page.setInputFiles('#pfile', bad);
  await page.waitForFunction(() => /not a WODBLOK project/.test(document.getElementById('pmsg').textContent));
  await settle(page);
  expect(await stateText(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('a project made by an older WODBLOK is refused with a message and nothing is changed', async ({ page }) => {
  const { errors } = await openApp(page);
  const before = await stateText(page);
  for (const v of [20, 18, undefined]) {
    const file = variant(FIXTURES[0], `older-${v}.wodblok`, p => { if (v === undefined) delete p.v; else p.v = v; });
    await page.setInputFiles('#pfile', file);
    await page.waitForFunction(() => /older WODBLOK and cannot be opened/.test(document.getElementById('pmsg').textContent));
    await settle(page);
    expect(await stateText(page), `format ${v}`).toBe(before);
    await page.evaluate(() => { document.getElementById('pmsg').textContent = ''; });
  }
  expect(errors).toEqual([]);
});

test('a project made by a newer WODBLOK opens as a copy that is not saved', async ({ page }) => {
  const { errors } = await openApp(page);
  const file = variant(FIXTURES[0], 'newer.wodblok', p => { p.v = 99; });
  await page.setInputFiles('#pfile', file);
  await page.waitForFunction(() => /made by a newer WODBLOK/.test(document.getElementById('pmsg').textContent));
  await settle(page);
  expect(JSON.parse(await getState(page)).tiles.length).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});
