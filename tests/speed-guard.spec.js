// Speed guard (1.7). Counts the work a redraw does instead of timing it, so it gives the same answer on a slow CI machine and on a fast Mac.
//  - The on-screen pattern does not carry the full outline of every stamp: every copy is a ready-made print, so those outlines are not drawn.
//    They live once in a hidden block that is rewritten only when a stamp changes. (Before 1.7 the busy project held 2.7 MB of them on screen.)
//  - Nothing the page draws points at an id that does not exist, in the Pattern view, zoomed in (every copy drawn live),
//    after a slider move, and after Randomize. The stamp buttons in the Layers panel borrow the stamp outlines, so
//    they are checked by name.
// Numbers are written to test-results/speed-guard-<target>.json.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, TARGET, openApp, openProjectFile, openPanel, settle } = require('./helpers/harness');
const { FIXTURES, danglingRefs, patternCounters } = require('./helpers/speed');

const BUDGET = { diamond: 120000, wide: 120000, busy: 150000 };     // characters of markup in #dyn at fit; 1.6.0 held 0.4 to 2.7 million
const report = {};
test.afterAll(() => {
  fs.mkdirSync(path.join(ROOT, 'test-results'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'test-results', `speed-guard-${TARGET}.json`), JSON.stringify(report, null, 1));
  console.log('speed-guard', JSON.stringify(report));
});

for (const name of Object.keys(FIXTURES)) {
  test(`${name}: the pattern on screen stays light and every reference resolves`, async ({ page }) => {
    const { errors } = await openApp(page, { seed: 21 });
    await openProjectFile(page, FIXTURES[name]);
    await settle(page);                                   // while the stamps are still being printed after opening, a few of them point at outlines that are not on the page yet (see known-issues)
    let d = await danglingRefs(page);
    for (let i = 0; i < 20 && Object.keys(d).length; i++) { await page.waitForTimeout(400); d = await danglingRefs(page); }   // the wide sample finishes printing about a second after settle returns (known-issues); a reference that is still missing after 8 s is a real one
    const c = await patternCounters(page);
    report[name] = { dynChars: c.dynChars, dynNodes: c.dynNodes, artChars: c.artChars, dangling: d };
    expect(c.dynChars, `${name}: characters of pattern markup on screen`).toBeLessThan(BUDGET[name]);
    expect(d, 'references to ids that do not exist').toEqual({});
    expect(errors).toEqual([]);
  });
}

test('busy: after a slider move, zoomed in and after Randomize, nothing points at a missing id', async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);
  const { errors } = await openApp(page, { seed: 21 });
  await openProjectFile(page, FIXTURES.busy);
  await openPanel(page, 'lyrs');
  await page.locator('#lybody .lyr').last().click({ position: { x: 60, y: 10 } });          // a repeating-pattern layer
  await openPanel(page, 'layers');
  await settle(page);
  const steps = {};
  const check = async (label, quiet = 6) => {
    await settle(page, { quiet });
    const c = await patternCounters(page);
    const d = await danglingRefs(page);
    steps[label] = { dynChars: c.dynChars, dangling: d };
    expect(d, `${label}: references to ids that do not exist`).toEqual({});
    for (const t of c.layerButtons) expect(t.found, `${label}: thumbnail ${t.href} resolves`).toBe(true);
    return c;
  };
  // the pattern size slider, a handful of real input events (the pattern redraws each time)
  for (const v of [120, 200, 90, 156]) {
    await page.evaluate(v => { const e = document.getElementById('pesz'); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, v);
    await settle(page);
  }
  const moved = await check('after the pattern size slider');
  expect(moved.dynChars, 'a redraw after a slider move stays light').toBeLessThan(BUDGET.busy);
  await page.mouse.move(700, 450);
  await page.keyboard.press('1');                                                            // 100%: every copy is drawn live, so the outlines are needed
  await check('zoomed in (live)');
  await page.locator('#zl').dispatchEvent('click');                                                                   // back to Fit
  await check('back at Fit');
  await openPanel(page, 'rand');
  await page.click('#rzdo');
  await check('after Randomize', 30);                                                        // Randomize finishes in stages; wait for the last one (3 s without change)
  report.busySteps = steps;
  expect(errors).toEqual([]);
});
