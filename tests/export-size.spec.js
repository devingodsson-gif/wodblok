// Phase 6: the saved, copied and exported picture keeps one copy of each identical knockout mask (the busy sample project exports under 5 MB: its many placements share a few masks).
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
  expect(refs.length).toBeGreaterThan(200);              // many placements carry a knockout...
  expect(ids.size).toBeLessThan(refs.length / 10);       // ...and identical ones share one mask in the file
  expect(ids.size).toBeLessThanOrEqual(stage);
  expect(refs.filter(r => !ids.has(r))).toEqual([]);
  expect(svg.length).toBeLessThan(5 * 1024 * 1024);
  expect(await page.evaluate(() => document.querySelectorAll('#art mask[id^="ks"]').length), 'the stage is untouched by the export').toBe(stage);
  expect(errors).toEqual([]);
});
