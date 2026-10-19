// Speed is a feature. This measures a real drag (the layer "lrp" slider in the Arrangement panel on the 4:3 fixture, which has five
// layers, textures, blends and grading) and a Randomize roll.
//
// Two kinds of numbers:
//  - work counters (DOM nodes added per move, redraws per move). They vary a little from run to run because
//    the app drafts while dragging and the number of redraws depends on timing, so they are NOT snapshotted
//    exactly. They are written down, and a build is compared against legacy (nodes per move may not grow by
//    more than 25%).
//  - times (total drag time, slowest frame, p95 frame). Machines are noisy, so times are never compared to a
//    stored number. They are written to test-results/perf-<target>.json, and when a built version exists
//    (WB_TARGET=build) it is measured side by side with the legacy file in the same run: it fails if its median
//    drag time is more than 10% slower. Run `npm run perf` on the Mac before each release for felt speed.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, TARGET, APP_URL, openApp, openProjectFile, openPanel, settle } = require('./helpers/harness');

const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok.json');
const STEPS = 40, RUNS = 5;

async function measureDrag(page) {
  await openPanel(page, 'lyrs');
  await page.locator('#lybody .lyr').first().click({ position: { x: 60, y: 10 } });   // layer 1 (a repeating pattern layer)
  await openPanel(page, 'layers');
  await settle(page);
  await page.waitForSelector('#lrp', { state: 'visible' });
  await page.locator('#lrp').scrollIntoViewIfNeeded();                       // the slider must be on screen, or the drag misses it and nothing is measured
  const box = await page.locator('#lrp').boundingBox();
  expect(box.y + box.height, 'the slider is inside the window').toBeLessThan(900);
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 4, y);
  await page.mouse.down();
  await page.evaluate(() => {
    const art = document.getElementById('art');
    window.__perf = { frames: [], added: 0, removed: 0, mutations: 0, long: 0, last: performance.now(), on: true };
    const loop = t => { const p = window.__perf; if (!p.on) return; p.frames.push(t - p.last); p.last = t; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    window.__perfMO = new MutationObserver(list => { for (const m of list) { window.__perf.mutations++; window.__perf.added += m.addedNodes.length; window.__perf.removed += m.removedNodes.length; } });
    window.__perfMO.observe(art, { childList: true, subtree: true });
    try { new PerformanceObserver(l => { window.__perf.long += l.getEntries().length; }).observe({ type: 'longtask', buffered: false }); } catch (e) { /* not supported */ }
  });
  const t0 = Date.now();
  for (let i = 1; i <= STEPS; i++) await page.mouse.move(box.x + 4 + (box.width - 8) * i / STEPS, y);
  await page.mouse.up();
  const wall = Date.now() - t0;
  await settle(page);
  return page.evaluate(wall => {
    const p = window.__perf; p.on = false; window.__perfMO.disconnect();
    const f = p.frames.slice().sort((a, b) => a - b);
    const pick = q => f.length ? f[Math.min(f.length - 1, Math.floor(q * f.length))] : 0;
    return { wallMs: wall, frames: f.length, p50Ms: pick(0.5), p95Ms: pick(0.95), maxMs: f.length ? f[f.length - 1] : 0, longTasks: p.long,
             nodesAdded: p.added, nodesRemoved: p.removed, mutations: p.mutations };
  }, wall);
}

async function measureOnce(browser, url, label) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const { errors } = await openApp(page, { url });
  await openProjectFile(page, FIXTURE);
  const r = await measureDrag(page);
  expect(errors, `${label} page errors`).toEqual([]);
  await ctx.close();
  return r;
}

const median = (runs, k) => runs.map(r => r[k]).sort((a, b) => a - b)[Math.floor(runs.length / 2)];
const summary = (label, runs) => ({ label, runs, median: { wallMs: median(runs, 'wallMs'), p95Ms: median(runs, 'p95Ms'), maxMs: median(runs, 'maxMs'), frames: median(runs, 'frames') } });
const per = (t, k) => +(median(t.runs, k) / STEPS).toFixed(2);

test('slider drag: work done and speed', async ({ browser }, testInfo) => {
  test.setTimeout(15 * 60 * 1000);
  const legacyUrl = 'file://' + path.join(ROOT, 'legacy', 'wodblok-v100.html');
  const compare = TARGET === 'build';
  // Runs alternate (legacy, build, legacy, build, ...) so slow drift on the machine hits both the same way.
  const L = [], B = [];
  for (let i = 0; i < RUNS; i++) {
    L.push(await measureOnce(browser, legacyUrl, 'legacy'));
    if (compare) B.push(await measureOnce(browser, APP_URL, 'build'));
  }
  const legacy = summary('legacy', L);
  const results = { steps: STEPS, runs: RUNS, legacy };
  fs.mkdirSync(path.join(ROOT, 'test-results'), { recursive: true });
  results.legacyPerMove = { nodesAdded: per(legacy, 'nodesAdded'), mutations: per(legacy, 'mutations') };
  expect(results.legacyPerMove.mutations, 'the drag redraws the pattern').toBeGreaterThan(0);

  if (compare) {
    results.build = summary('build', B);
    const ratio = results.build.median.wallMs / legacy.median.wallMs;
    results.ratio = +ratio.toFixed(3);
    results.buildPerMove = { nodesAdded: per(results.build, 'nodesAdded'), mutations: per(results.build, 'mutations') };
    expect(results.buildPerMove.nodesAdded, 'DOM nodes added per move').toBeLessThanOrEqual(results.legacyPerMove.nodesAdded * 1.25 + 0.5);
    expect(ratio, `build drag time / legacy drag time (median of ${RUNS} alternating runs)`).toBeLessThanOrEqual(1.10);
  }
  fs.writeFileSync(path.join(ROOT, 'test-results', `perf-${TARGET}.json`), JSON.stringify(results, null, 1));
  await testInfo.attach('perf', { body: JSON.stringify(results, null, 1), contentType: 'application/json' });
  console.log('perf', JSON.stringify({ legacy: legacy.median, build: results.build && results.build.median, ratio: results.ratio }));
});

test('randomize roll time', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 21 });
  await openPanel(page, 'rand');
  const t0 = Date.now();
  await page.click('#rzdo');
  await settle(page, { max: 30000 });
  const ms = Date.now() - t0;
  fs.mkdirSync(path.join(ROOT, 'test-results'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'test-results', `perf-randomize-${TARGET}.json`), JSON.stringify({ ms }));
  console.log('randomize roll + settle ms', ms);
  expect(errors).toEqual([]);
});
