// Back up everything / Restore from backup (Phase 2; renamed in 1.0.4, and projects are no longer part of it). Exports from the claude.ai-style runtime (account database), then imports
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
  await p1.click('#fileb'); await p1.click('#xall'); await settle(p1);
  const dls = await p1.evaluate(() => window.__wbDownloads);
  const out = dls.filter(d => /\.wodblok-all\.json$/.test(d.filename));
  expect(out).toHaveLength(1);
  const x = JSON.parse(out[0].data);
  expect(x.app).toBe('WODBLOK-EXPORT');
  expect(x.v).toBe(1);
  expect(x).not.toHaveProperty('projects');                       // 1.0.4: projects are .wodblok files, not part of the backup
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
  // the settings and libraries came with it (the app always launches cleared, so the open document is not part of this)
  // (the cover and book keys are working-document state that the app clears at every launch, so they are not expected to remain)
  const CLEARED_AT_LAUNCH = ['wb31_cover', 'wb40_book', 'wb40_coverS', 'wb40_coverB'];
  const missing = await p2.evaluate(keys => keys.filter(k => window.__wbTest.kv.get(k) === null), Object.keys(x.kv).filter(k => !CLEARED_AT_LAUNCH.includes(k)));
  expect(missing).toEqual([]);
  expect(b.errors).toEqual([]);
  await ctx2.close();
});

test('import everything refuses files that are not an export, and newer exports', async ({ page }) => {
  const { errors } = await openApp(page, { runtime: 'none' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-export-'));
  const bad = path.join(dir, 'bad.json'); fs.writeFileSync(bad, JSON.stringify({ app: 'WODBLOK', v: 18 }));
  await page.setInputFiles('#xallf', bad); await settle(page);
  await expect(page.locator('#pmsg')).toContainText('not a WODBLOK backup');
  const newer = path.join(dir, 'newer.json'); fs.writeFileSync(newer, JSON.stringify({ app: 'WODBLOK-EXPORT', v: 99, kv: {}, projects: [], stamps: [] }));
  await page.setInputFiles('#xallf', newer); await settle(page);
  await expect(page.locator('#pmsg')).toContainText('newer WODBLOK');
  expect(errors).toEqual([]);
});
