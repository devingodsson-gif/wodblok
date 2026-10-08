// Scripted scenarios. Each one drives the real UI, then records the document state, a summary of the drawn
// SVG, and a picture. Randomness is seeded and time is fixed (see helpers/harness.js), so results repeat exactly.
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, openProjectFile, openPanel, setMode, settle, getState, stateText, checkpoint } = require('./helpers/harness');

const FIX = n => path.join(ROOT, 'tests', 'fixtures', n);
const PANEL_FIXTURE = 'project-4-rect-4x3.wodblok.json';   // frames, free place, textures, grade, blends, five layers

async function randomize(page) {
  await openPanel(page, 'rand');
  await page.click('#rzdo');
  await settle(page, { max: 30000 });
}

for (const seed of [1, 2, 3]) {
  test(`randomize with seed ${seed}`, async ({ page }, testInfo) => {
    const { errors } = await openApp(page, { seed });
    await randomize(page);
    expect(JSON.parse(await getState(page)).layers.length).toBeGreaterThan(0);
    await checkpoint(page, testInfo, errors, `randomize-seed-${seed}`);
  });
}

test('randomize is undoable and redoable', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 7 });
  const blank = await stateText(page);
  await randomize(page);
  const rolled = await stateText(page);
  expect(rolled).not.toBe(blank);
  await page.keyboard.press('Control+z'); await settle(page);
  expect(await stateText(page)).toBe(blank);
  await page.keyboard.press('Control+Shift+z'); await settle(page);
  expect(await stateText(page)).toBe(rolled);
  expect(errors).toEqual([]);
});

test('before / after compare does not change the document', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 5 });
  await randomize(page);
  const rolled = await stateText(page);
  await page.click('#bab'); await settle(page);
  await expect(page.locator('#bab')).toHaveAttribute('aria-pressed', 'true');
  expect(await stateText(page)).toBe(rolled);
  await checkpoint(page, testInfo, errors, 'before-view');
  await page.click('#bab'); await settle(page);
  await expect(page.locator('#bab')).toHaveAttribute('aria-pressed', 'false');
  expect(await stateText(page)).toBe(rolled);
});

test('split compare view', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 5 });
  await randomize(page);
  await page.click('#bas'); await settle(page);
  await expect(page.locator('#bas')).toHaveAttribute('aria-pressed', 'true');
  await checkpoint(page, testInfo, errors, 'split-view');
});

for (const shape of ['rect', 'rrect', 'circle', 'oval', 'arch', 'hex', 'tri', 'diamond', 'ngon']) {
  test(`canvas shape: ${shape}`, async ({ page }, testInfo) => {
    const { errors } = await openApp(page);
    await openProjectFile(page, FIX('project-3-rect-16x9.wodblok.json'));
    await openPanel(page, 'canvas');
    await page.click(`#cshp [data-s="${shape}"]`);
    await settle(page);
    expect(JSON.parse(await getState(page)).dim.cs || 'rect').toBe(shape);
    await checkpoint(page, testInfo, errors, `canvas-shape-${shape}`);
  });
}

test('light theme', async ({ page }, testInfo) => {
  const { errors } = await openApp(page);
  await openProjectFile(page, FIX(PANEL_FIXTURE));
  await page.click('#thm'); await settle(page);
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
  await checkpoint(page, testInfo, errors, 'theme-light');
});

test('stamp editor view', async ({ page }, testInfo) => {
  const { errors } = await openApp(page);
  await openProjectFile(page, FIX(PANEL_FIXTURE));
  await setMode(page, 'stamp');
  await checkpoint(page, testInfo, errors, 'stamp-editor', { selector: '#ed' });
});

// The tool windows with a real project open: the whole window is compared, so chrome changes show up too.
for (const [panel, label] of [['canvas', 'canvas'], ['colors', 'colors'], ['lyrs', 'layers'], ['layers', 'arrangement'], ['grade', 'grade'], ['tex', 'textures'], ['hist', 'history'], ['rand', 'randomize'], ['pgrid', 'pattern-grid']]) {
  test(`panel: ${label}`, async ({ page }, testInfo) => {
    const { errors } = await openApp(page);
    await openProjectFile(page, FIX(PANEL_FIXTURE));
    await openPanel(page, panel);
    await settle(page);
    if (process.env.WB_PIXELS !== '0') await expect(page).toHaveScreenshot(`panel-${label}.png`);
    expect(await stateText(page)).toMatchSnapshot(`panel-${label}.state.json`);
    expect(errors).toEqual([]);
  });
}

test('history records a randomize and goes back to Start', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 11 });
  await randomize(page);
  await openPanel(page, 'hist');
  const rows = page.locator('#hhl .hr');
  await expect(rows.nth(1)).toBeVisible();                 // "Start" and the randomize step
  await rows.filter({ hasText: 'Start' }).first().dispatchEvent('click'); await settle(page);   // the list repaints often, so no pointer retries
  expect(JSON.parse(await getState(page)).tiles).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('text tool turns typed text into a motif (smoke; glyph shapes depend on installed fonts)', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');                            // the Text tool only exists in the Stamp editor
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'Wod');
  const before = JSON.parse(await getState(page)).tiles.reduce((n, t) => n + t.items.length, 0);
  await page.click('#tx_go');
  await settle(page, { max: 30000 });
  const after = JSON.parse(await getState(page)).tiles.reduce((n, t) => n + t.items.length, 0);
  expect(after).toBeGreaterThan(before);
  expect(errors).toEqual([]);
});

test('clear resets to a blank document; undo brings the document back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  await openProjectFile(page, FIX(PANEL_FIXTURE));
  const loaded = JSON.parse(await getState(page));
  await page.click('#fileb'); await page.click('#clr'); await settle(page);
  expect(JSON.parse(await getState(page)).dim.cs || 'rect').toBe('rect');
  await page.keyboard.press('Control+z'); await settle(page);
  const undone = JSON.parse(await getState(page));
  // Everything except colour grading comes back. KNOWN ISSUE (v100, docs/known-issues.md #1): undo after Clear
  // leaves the grade blank, because the history's first entry is taken before the opened project's grade is
  // applied. The grade is recorded below so Phases 1-3 keep this exactly as it is.
  const { grade: g0, ...rest0 } = loaded, { grade: g1, ...rest1 } = undone;
  expect(rest1).toEqual(rest0);
  expect(JSON.stringify({ grade_after_undo: g1 }, null, 1) + '\n').toMatchSnapshot('clear-undo-grade.json');
  expect(errors).toEqual([]);
});
