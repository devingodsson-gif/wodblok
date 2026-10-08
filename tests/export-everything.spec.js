// Export everything / Import everything (Phase 2). Exports from the claude.ai-style runtime (account database), then imports
// that file into a clean browser with no runtime (browser storage only), which is the real "move out of the artifact" path.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, TARGET, openApp, openProjectFile, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build; v100 does not have Export everything'); });

const FIX = path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok.json');

test('export everything from the artifact runtime, import into a clean browser', async ({ browser }) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-export-'));
  // --- export, with the artifact runtime (projects live in the account database)
  const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p1 = await ctx1.newPage();
  const a = await openApp(p1, { runtime: 'artifact' });
  await openProjectFile(p1, FIX);                                   // adds the project to the account database
  const stateBefore = await p1.evaluate(() => (window.__wbTest ? window.__wbTest.state() : coreStr()));
  await p1.click('#fileb'); await p1.click('#xall'); await settle(p1);
  const dls = await p1.evaluate(() => window.__wbDownloads);
  const out = dls.filter(d => /\.wodblok-all\.json$/.test(d.filename));
  expect(out).toHaveLength(1);
  const x = JSON.parse(out[0].data);
  expect(x.app).toBe('WODBLOK-EXPORT');
  expect(x.v).toBe(1);
  expect(x.source).toBe('account');
  expect(x.projects).toHaveLength(1);
  expect(x.projects[0].name).toBeTruthy();
  expect(Object.keys(x.kv).length).toBeGreaterThan(0);
  expect(Object.keys(x.kv).every(k => /^wb\d+_/.test(k))).toBe(true);
  expect(x.kv).not.toHaveProperty('wb18_projects');
  expect(a.errors).toEqual([]);
  const file = path.join(dir, out[0].filename);
  fs.writeFileSync(file, out[0].data);
  await ctx1.close();

  // --- import, into a browser with no runtime (projects go to browser storage)
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  const b = await openApp(p2, { runtime: 'none' });
  await p2.click('#fileb');
  const nav = p2.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
  await p2.setInputFiles('#xallf', file);
  await nav;
  await p2.waitForFunction(() => document.fonts.status === 'loaded');
  await settle(p2);
  await p2.click('#pls'); await settle(p2);
  await expect(p2.locator('#pgrid .pc')).toHaveCount(1);
  // the settings and libraries came with it (the app always launches cleared, so the open document is not part of this)
  // (the cover and book keys are working-document state that the app clears at every launch, so they are not expected to remain)
  const CLEARED_AT_LAUNCH = ['wb31_cover', 'wb40_book', 'wb40_coverS', 'wb40_coverB'];
  const missing = await p2.evaluate(keys => keys.filter(k => localStorage.getItem(k) === null), Object.keys(x.kv).filter(k => !CLEARED_AT_LAUNCH.includes(k)));
  expect(missing).toEqual([]);
  // and the imported project opens
  const openBtn = p2.locator('#pgrid .pc [data-a="open"]').first(); await openBtn.click(); if ((await p2.locator('#plist:visible').count()) && (await openBtn.textContent()).trim() !== 'Open') await openBtn.click(); await settle(p2);
  expect(JSON.parse(await p2.evaluate(() => (window.__wbTest ? window.__wbTest.state() : coreStr()))).layers.length).toBe(JSON.parse(stateBefore).layers.length);
  expect(b.errors).toEqual([]);
  await ctx2.close();
});

test('import everything refuses files that are not an export, and newer exports', async ({ page }) => {
  const { errors } = await openApp(page, { runtime: 'none' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-export-'));
  const bad = path.join(dir, 'bad.json'); fs.writeFileSync(bad, JSON.stringify({ app: 'WODBLOK', v: 18 }));
  await page.setInputFiles('#xallf', bad); await settle(page);
  await expect(page.locator('#pmsg')).toContainText('not a WODBLOK export');
  const newer = path.join(dir, 'newer.json'); fs.writeFileSync(newer, JSON.stringify({ app: 'WODBLOK-EXPORT', v: 99, kv: {}, projects: [], stamps: [] }));
  await page.setInputFiles('#xallf', newer); await settle(page);
  await expect(page.locator('#pmsg')).toContainText('newer WODBLOK');
  expect(errors).toEqual([]);
});
