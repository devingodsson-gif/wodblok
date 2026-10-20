// @smoke: the minimum that must hold in every browser engine. Run on WebKit (Safari's engine) in CI:
//   npm run test:webkit
// It loads the app, opens a real project, rolls Randomize, and checks nothing throws. No pixel or state
// comparison: WebKit draws SVG filters differently, and the point here is "does it run, and how fast".
// Timings are written to test-results/webkit-timings.json so slowness shows up as a number.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, openProjectFile, openPanel, settle, getState } = require('./helpers/harness');

test('loads, opens a project, randomizes, no errors @smoke', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit' && !process.env.WB_SMOKE_ALL, 'engine smoke test (runs on WebKit; set WB_SMOKE_ALL=1 to run on Chromium too)');
  const timings = {};
  let t = Date.now();
  const { errors } = await openApp(page, { seed: 4 });
  timings.loadMs = Date.now() - t;

  t = Date.now();
  await openProjectFile(page, path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok'));
  timings.openProjectMs = Date.now() - t;

  await openPanel(page, 'rand');
  t = Date.now();
  await page.click('#rzdo');
  await settle(page, { max: 60000 });
  timings.randomizeMs = Date.now() - t;

  expect(JSON.parse(await getState(page)).els.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  fs.mkdirSync(path.join(ROOT, 'test-results'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'test-results', 'webkit-timings.json'), JSON.stringify({ browser: browserName, ...timings }, null, 1));
  console.log(browserName, JSON.stringify(timings));
});
