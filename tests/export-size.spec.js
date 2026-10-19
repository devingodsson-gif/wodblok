// Phase 6: the saved, copied and exported picture keeps one copy of each identical knockout mask (the busy fixture went from 13 MB to under 3 MB).
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, openProjectFile, settle } = require('./helpers/harness');

test('exported SVG shares identical knockout masks, every reference still resolves, and the stage is untouched', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 21 });
  await openProjectFile(page, path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok'));
  await settle(page);
  const stage = await page.evaluate(() => document.querySelectorAll('#art mask[id^="ks"]').length);
  await page.evaluate(() => document.getElementById('sv').click());
  await page.waitForFunction(() => (window.__wbDownloads || []).length > 0);
  const svg = await page.evaluate(() => window.__wbDownloads[0].data);
  const ids = new Set([...svg.matchAll(/<mask id="(ks\d+)"/g)].map(m => m[1]));
  const refs = [...svg.matchAll(/url\(#(ks\d+)\)/g)].map(m => m[1]);
  expect(stage).toBeGreaterThan(200);                    // the stage keeps one mask per placement
  expect(ids.size).toBeLessThan(stage / 10);
  expect(refs.length).toBeGreaterThanOrEqual(stage);     // every placement still has its knockout
  expect(refs.filter(r => !ids.has(r))).toEqual([]);
  expect(svg.length).toBeLessThan(5 * 1024 * 1024);
  expect(errors).toEqual([]);
});
