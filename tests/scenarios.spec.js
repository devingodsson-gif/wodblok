// Scripted scenarios. Each one drives the real UI, then records the document state, a summary of the drawn
// SVG, and a picture. Randomness is seeded and time is fixed (see helpers/harness.js), so results repeat exactly.
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, openProjectFile, openPanel, settle, getState, stateText, checkpoint, unlockStamp, stampInstance, clickStamp } = require('./helpers/harness');

const FIX = n => path.join(ROOT, 'tests', 'fixtures', n);
const PANEL_FIXTURE = 'project-4-rect-4x3.wodblok';   // frames, free place, textures, grade, blends, elements

async function randomize(page) {
  await openPanel(page, 'rand');
  await page.click('#rzdo');
  await settle(page, { max: 30000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));   // the old picture is held until the new one is made; compare buttons ignore clicks until then
}

for (const seed of [1, 2, 3]) {
  test(`randomize with seed ${seed}`, async ({ page }, testInfo) => {
    const { errors } = await openApp(page, { seed });
    await randomize(page);
    expect(JSON.parse(await getState(page)).els.length).toBeGreaterThan(0);
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
  await page.keyboard.press('Backslash'); await settle(page);
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
  await page.keyboard.press('Shift+Backslash'); await settle(page);
  await expect(page.locator('#bas')).toHaveAttribute('aria-pressed', 'true');
  await checkpoint(page, testInfo, errors, 'split-view');
});

for (const shape of ['rect', 'rrect', 'circle', 'oval', 'arch', 'hex', 'tri', 'diamond', 'ngon']) {
  test(`canvas shape: ${shape}`, async ({ page }, testInfo) => {
    const { errors } = await openApp(page);
    await openProjectFile(page, FIX('project-1-diamond.wodblok'));
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
  const { errors } = await openApp(page, { seed: 4 });
  await unlockStamp(page);                                 // the text goes into the unlocked stamp, from the canvas
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'Wod');
  await settle(page);
  const before = JSON.parse(await getState(page)).tiles.reduce((n, t) => n + t.items.length, 0);
  await clickStamp(page, await stampInstance(page));
  await expect.poll(async () => JSON.parse(await getState(page)).tiles.reduce((n, t) => n + t.items.length, 0), { timeout: 15000 }).toBeGreaterThan(before);
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
  // The whole document comes back, colour grade included (fixed in v107; before, the grade stayed blank).
  expect(undone).toEqual(loaded);
  expect(JSON.stringify({ grade_after_undo: undone.grade }, null, 1) + '\n').toMatchSnapshot('clear-undo-grade.json');
  expect(errors).toEqual([]);
});
