// Opening project files in the app: .wodblok zips (format 21), files from a newer app, damaged files, snapshots, stamp files and Art from a project file.
const fs = require('fs'), os = require('os'), path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, settle, getState } = require('./helpers/harness');
const FX = path.join(ROOT, 'tests', 'fixtures');
const { zipSync, unzipSync, strToU8, strFromU8 } = require('fflate');
// a copy of a sample file with its project.json changed by fn (mimetype first and stored, as the app writes it)
function variant(f, fn) {
  const files = unzipSync(new Uint8Array(fs.readFileSync(path.join(FX, f)))), p = JSON.parse(strFromU8(files['project.json'])); fn(p);
  const out = {}; for (const [k, v] of Object.entries({ ...files, 'project.json': strToU8(JSON.stringify(p)) })) out[k] = [v, { level: k === 'mimetype' || k.startsWith('assets/') ? 0 : 6 }];
  return Buffer.from(zipSync(out));
}

async function openFile(page, file) { await page.setInputFiles('#pfile', file); await settle(page); return page.locator('#pmsg').textContent(); }
const tmp = (name, data) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-pf-')), f = path.join(d, name); fs.writeFileSync(f, data); return f; };

test('a file from a newer app opens as an unsaved copy and nothing is written back', async ({ page }) => {
  const { errors } = await openApp(page);
  const msg = await openFile(page, tmp('future.wodblok', variant('project-1-diamond.wodblok', p => { p.v = 99; p.name = 'Future'; })));
  expect(msg).toContain('newer WODBLOK');
  await expect(page.locator('#pst')).toHaveClass(/dirty/);
  expect(errors).toEqual([]);
});

test('damaged files give a plain message and leave the document alone', async ({ page }) => {
  const { errors } = await openApp(page);
  const before = await getState(page);
  const good = fs.readFileSync(path.join(FX, 'project-1-diamond.wodblok'));
  for (const [name, data, text] of [['cut.wodblok', good.subarray(0, Math.floor(good.length / 2)), /damaged|not a WODBLOK/], ['junk.wodblok', Buffer.from('not a project'), /not a WODBLOK/], ['empty.wodblok', Buffer.alloc(0), /not a WODBLOK/]]) {
    expect(await openFile(page, tmp(name, data)), name).toMatch(text);
    expect(await getState(page)).toBe(before);
  }
  expect(errors).toEqual([]);
});

test('named snapshots are saved inside the file and come back when it is opened', async ({ browser }) => {
  const { openPanel } = require('./helpers/harness');
  const c1 = await browser.newContext({ viewport: { width: 1440, height: 900 } }), p1 = await c1.newPage(), a = await openApp(p1);
  await openFile(p1, path.join(FX, 'project-1-diamond.wodblok'));
  await openPanel(p1, 'hist');
  await p1.click('#hsadd'); await p1.locator('#hsl').first().locator('input').press('Enter'); await settle(p1);
  await expect(p1.locator('#hsl').first().locator('[data-sn]')).toHaveCount(1);
  await p1.evaluate(() => { window.__wbDownloads.length = 0; });
  await p1.click('#psv');
  await p1.waitForFunction(() => window.__wbDownloads.length > 0);
  const dl = await p1.evaluate(() => window.__wbDownloads[0]), bytes = Buffer.from(dl.base64, 'base64');
  expect(Object.keys(require('fflate').unzipSync(new Uint8Array(bytes)))).toContain('snapshots/00.json');
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 } }), p2 = await c2.newPage(), b = await openApp(p2);
  await openFile(p2, tmp('with-snaps.wodblok', bytes));
  await openPanel(p2, 'hist'); await settle(p2);
  await expect(p2.locator('#hsl').first().locator('[data-sn]')).toHaveCount(1);
  expect(a.errors.concat(b.errors)).toEqual([]);
  await c1.close(); await c2.close();
});

test('a library stamp can be saved as its own file and imported into another browser', async ({ browser }) => {
  const { openPanel } = require('./helpers/harness');
  const c1 = await browser.newContext({ viewport: { width: 1440, height: 900 } }), p1 = await c1.newPage(), a = await openApp(p1);
  await openFile(p1, path.join(FX, 'project-1-diamond.wodblok'));
  await openPanel(p1, 'stmp');
  await p1.fill('#slname', 'Test stamp'); await p1.click('#slsave');
  await expect(p1.locator('#slgrid .slc')).toHaveCount(1);
  await p1.evaluate(() => { window.__wbDownloads.length = 0; });
  await p1.click('#slgrid [data-sa="file"]');
  await p1.waitForFunction(() => window.__wbDownloads.length > 0);
  const dl = await p1.evaluate(() => window.__wbDownloads[0]);
  expect(dl.filename).toBe('test-stamp.wodblok-stamp');
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 } }), p2 = await c2.newPage(), b = await openApp(p2);
  await openPanel(p2, 'stmp');
  await p2.setInputFiles('#slimpf', tmp('s.wodblok-stamp', dl.data)); await settle(p2);
  await expect(p2.locator('#slgrid .slc')).toHaveCount(1);
  await expect(p2.locator('#slgrid .slc b')).toHaveText('Test stamp');
  await p2.setInputFiles('#slimpf', tmp('bad.wodblok-stamp', 'nope')); await settle(p2);
  await expect(p2.locator('#pmsg')).toContainText('not a WODBLOK stamp');       // stamp library messages show in the status line since 1.0.16
  expect(a.errors.concat(b.errors)).toEqual([]);
  await c1.close(); await c2.close();
});

test('a downloaded project file can be used as Art in another project', async ({ browser }) => {
  const c1 = await browser.newContext({ viewport: { width: 1440, height: 900 } }), p1 = await c1.newPage(), a = await openApp(p1);
  await p1.setInputFiles('#lfapfile', path.join(FX, 'project-1-diamond.wodblok')); await settle(p1);
  // a project file becomes a picture for Art; if it carries none the message says so plainly (not "could not read")
  await expect(p1.locator('#pmsg')).toContainText(/saved before Art existed|added/);
  expect(a.errors).toEqual([]);
  await c1.close();
});
