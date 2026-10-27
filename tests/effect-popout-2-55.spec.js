// 2.55.0 (owner Oct 26 2026, docs/panel-modes-plan.md): an Effects menu item opens the effect pop-out: the panel's own settings pane in a floating window,
// on every selected element, Apply one history step, Cancel (or Esc, Undo, a new selection) leaves nothing.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));
const openFx = async (page, label, sub) => {
  await page.click('#mnb-effects'); await expect(page.locator('#mnbm-effects')).toBeVisible();
  if (sub) { await page.locator('#mnbm-effects .mnbs', { hasText: sub }).hover(); await page.locator('.mnbsub [data-cmd]', { hasText: label }).first().click(); }
  else await page.locator('#mnbm-effects [data-cmd]', { hasText: label }).first().click();
  await H.settle(page);
};
const shapes = async page => (await st(page)).els.filter(q => q.k === 'motif');
// the labels of the visible controls in a settings pane
const labels = (page, sel) => page.locator(sel).evaluate(p => [...p.querySelectorAll('.fxs:not([hidden]) label, .fxs:not([hidden]) .rzl')].filter(x => x.offsetParent).map(x => x.textContent.trim()));

test('the Effects items are greyed with nothing selected; with a shape selected one opens the pop-out with the panel\'s own controls; Apply is one step', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await page.click('#mnb-effects');
  await expect(page.locator('#mnbm-effects [data-cmd="effect.grade"]')).toBeDisabled();
  await page.keyboard.press('Escape');
  await H.addShape(page, 'rect');
  await openFx(page, 'Colour grade');
  const win = page.locator('.fxwin');
  await expect(win).toBeVisible();
  await expect(win.locator('.fxwt')).toHaveText('Colour grade');
  await expect(win.locator('.fxs[data-e="grade"]')).toBeVisible();
  // the window holds the Effects group's own pane: it is not in the panel while the window is open
  await expect(page.locator('.fxg[data-fxk="motif"] .fxpane')).toHaveCount(0);
  const inWin = await labels(page, '.fxwin .fxpane');
  expect(inWin.length).toBeGreaterThan(2);
  expect((await shapes(page))[0].fx.map(e => e.k)).toEqual(['grade']);   // live while open
  await win.locator('.fxs[data-e="grade"] input[type=range]').first().evaluate(r => { r.value = 30; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.click('.fxwin .fxwa'); await H.settle(page);
  await expect(win).toHaveCount(0);
  await expect(page.locator('.fxg[data-fxk="motif"] .fxpane')).toHaveCount(1);   // the pane is back in the panel
  // the same effect opened in the panel shows the same controls
  await H.showPanel(page, 'motifs');
  await page.locator('.fxg[data-fxk="motif"] .fxr .fxc').first().click(); await H.settle(page);
  expect(await labels(page, '.fxg[data-fxk="motif"] .fxpane')).toEqual(inWin);
  // one step: Undo takes the effect away
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await shapes(page))[0].fx).toBeUndefined();
  expect(errors).toEqual([]);
});

test('Cancel, Esc and Undo leave nothing; several selected shapes all get the effect', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addShape(page, 'rect');
  await openFx(page, 'Jitter');
  await page.click('.fxwin .fxwc'); await H.settle(page);
  await expect(page.locator('.fxwin')).toHaveCount(0);
  expect((await shapes(page))[0].fx).toBeUndefined();
  await openFx(page, 'Jitter');
  await page.keyboard.press('Escape'); await H.settle(page);
  expect((await shapes(page))[0].fx).toBeUndefined();
  await openFx(page, 'Jitter');
  await page.keyboard.press('Control+z'); await H.settle(page);
  await expect(page.locator('.fxwin')).toHaveCount(0);
  expect((await shapes(page)).length).toBe(1);   // Undo cancelled the pop-out, it did not undo the shape
  expect((await shapes(page))[0].fx).toBeUndefined();
  // two shapes selected (Ctrl+A selects all but the Background): both get it
  await H.addShape(page, 'ellipse');
  await page.keyboard.press('Control+a'); await H.settle(page);
  const sel = (await shapes(page)).length;
  expect(sel).toBe(2);
  await openFx(page, 'Jitter');
  await expect(page.locator('.fxwin')).toBeVisible();
  await page.click('.fxwin .fxwa'); await H.settle(page);
  expect((await shapes(page)).map(q => (q.fx || []).map(e => e.k))).toEqual([['jitter'], ['jitter']]);
  expect(errors).toEqual([]);
});
