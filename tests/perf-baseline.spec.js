// Phase 6 baseline: how long the main thread is busy per input for each kind of work, on the five-layer fixture. Only runs with WB_PERF=1
// (npm run perf-baseline). Times are written to test-results/perf-baseline-<target>.json and never compared to a stored number.
const fs = require('fs');
const path = require('path');
const { test } = require('@playwright/test');
const { ROOT, TARGET, openApp, openProjectFile, openPanel, settle } = require('./helpers/harness');

test.skip(!process.env.WB_PERF, 'WB_PERF=1 only');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok');
const SLIDERS = [['layers', 'pesz', 'pattern size'], ['layers', 'peox', 'pattern shift'], ['grade', 'gd_ex', 'grade exposure'], ['grade', 'gm_amt', 'grade mask amount'], ['tex', 'tx_a', 'texture amount'], ['canvas', 'ccr', 'canvas corner']];
const STEPS = 20;

test('baseline per-input busy time', async ({ page }) => {
  test.setTimeout(10 * 60 * 1000);
  await openApp(page, { seed: 21 });
  await openProjectFile(page, FIXTURE);
  await openPanel(page, 'lyrs'); await page.locator('#lybody .lyr').first().click({ position: { x: 60, y: 10 } });
  const out = {};
  for (const [pn, id, label] of SLIDERS) {
    if (!(await page.locator(`section.pn[data-p="${pn}"]:not([hidden])`).count())) await openPanel(page, pn);
    await settle(page);
    const el = page.locator('#' + id);
    if (!(await el.isVisible())) { out[label] = 'not visible'; continue; }
    out[label] = await page.evaluate(async ([id, STEPS]) => {
      const e = document.getElementById(id), lo = +e.min || 0, hi = +e.max || 100, times = [], total0 = performance.now();
      const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      for (let i = 1; i <= STEPS; i++) {
        e.value = lo + (hi - lo) * (0.2 + 0.6 * (i % 2 ? i / STEPS : 1 - i / STEPS));
        const t = performance.now(); e.dispatchEvent(new Event('input', { bubbles: true })); await raf(); times.push(performance.now() - t);
      }
      e.dispatchEvent(new Event('change', { bubbles: true }));
      times.sort((a, b) => a - b);
      return { medianMs: +times[Math.floor(STEPS / 2)].toFixed(1), p95Ms: +times[Math.floor(STEPS * .95)].toFixed(1), maxMs: +times[STEPS - 1].toFixed(1) };
    }, [id, STEPS]);
    await settle(page);
  }
  // Randomize roll, and PNG export of the current piece
  await openPanel(page, 'rand'); let t0 = Date.now(); await page.click('#rzdo'); await settle(page, { max: 60000 }); out['randomize roll + settle'] = Date.now() - t0;
  t0 = Date.now(); await page.evaluate(() => document.getElementById('png').click()); await page.waitForFunction(() => (window.__wbDownloads || []).length > 0, null, { timeout: 60000 }); out['png export'] = Date.now() - t0;
  fs.mkdirSync(path.join(ROOT, 'test-results'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'test-results', `perf-baseline-${TARGET}.json`), JSON.stringify(out, null, 1));
  console.log('BASELINE', JSON.stringify(out, null, 1));
});
