// 2.87.10 (docs/pro-basics-plan.md step 10): the Blend list has the Photoshop modes the browser draws, grouped with thin lines, Replace at the end; pointing at a
// mode or arrowing to it previews it on the selected elements with no History step; leaving or Esc puts the old one back; a click or Enter keeps it, one step.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const shape = async page => JSON.parse(await H.getState(page)).els.find(q => q.k === 'motif');
const labels = async page => (await page.evaluate(() => window.__wbTest.histLabels())).length;
const dd = page => page.locator('#ly_bl + .dd2');
const list = page => page.locator('body > .ddl:not([hidden])');   // the open list floats on the page
const drawn = (page, v) => page.evaluate(v => document.getElementById('art').innerHTML.includes('mix-blend-mode:' + v), v);
async function setup(page) {
  const r = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page);
  await H.openPanel(page, 'lyrs'); await H.settle(page);
  await page.locator('#lyl2 .lyr').first().click(); await H.settle(page);
  await expect(dd(page)).toBeVisible();
  return r;
}

test('the list is grouped, every mode is drawn, and Replace is last', async ({ page }) => {
  const { errors } = await setup(page);
  await dd(page).locator('.ddb').click();
  await expect(list(page).locator('.ddsep')).toHaveCount(6);
  const items = (await list(page).locator('.ddi').allTextContents()).map(t => t.trim());
  expect(items.slice(0, 4)).toEqual(['Normal', 'Darken', 'Multiply', 'Colour burn']);
  expect(items).toEqual(expect.arrayContaining(['Linear dodge (Add)', 'Hard light', 'Difference', 'Exclusion', 'Hue', 'Saturation', 'Colour', 'Luminosity']));
  expect(items[items.length - 1]).toMatch(/^Replace/);
  await page.keyboard.press('Escape');
  for (const v of ['darken', 'multiply', 'color-burn', 'lighten', 'screen', 'color-dodge', 'plus-lighter', 'overlay', 'soft-light', 'hard-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity']) {
    await page.evaluate(v => { const e = document.getElementById('ly_bl'); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, v); await H.settle(page);
    expect((await shape(page)).bl, v).toBe(v); expect(await drawn(page, v), v + ' drawn').toBe(true);
  }
  expect(errors).toEqual([]);
});

test('pointing at a mode previews it with no History step; leaving puts the old one back; a click keeps it as one step', async ({ page }) => {
  const { errors } = await setup(page);
  const h0 = await labels(page);
  await dd(page).locator('.ddb').click();
  await list(page).locator('.ddi', { hasText: 'Screen' }).hover(); await H.settle(page);
  expect((await shape(page)).bl).toBe('screen'); expect(await drawn(page, 'screen')).toBe(true);
  await list(page).locator('.ddi', { hasText: 'Difference' }).hover(); await H.settle(page);
  expect((await shape(page)).bl).toBe('difference');
  await page.mouse.move(5, 300); await H.settle(page);
  expect((await shape(page)).bl).toBeUndefined();
  await page.waitForTimeout(600); expect(await labels(page)).toBe(h0);
  await list(page).locator('.ddi', { hasText: 'Multiply' }).click(); await H.settle(page);
  expect((await shape(page)).bl).toBe('multiply');
  await page.waitForTimeout(600); expect(await labels(page)).toBe(h0 + 1);
  expect(errors).toEqual([]);
});

test('the arrow keys preview too; Esc puts the old mode back and Enter keeps the new one', async ({ page }) => {
  const { errors } = await setup(page);
  const h0 = await labels(page);
  await page.mouse.move(5, 300);   // the pointer away from where the list opens: only the keys move the preview
  await dd(page).locator('.ddb').focus();
  await page.keyboard.press('ArrowDown'); await expect(list(page)).toBeVisible();
  await page.keyboard.press('ArrowDown'); await H.settle(page);
  expect((await shape(page)).bl).toBe('darken');
  await page.keyboard.press('ArrowDown'); await H.settle(page);
  expect((await shape(page)).bl).toBe('multiply');
  await page.keyboard.press('Escape'); await H.settle(page);
  expect((await shape(page)).bl).toBeUndefined();
  await page.waitForTimeout(600); expect(await labels(page)).toBe(h0);
  await dd(page).locator('.ddb').focus();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await H.settle(page);
  expect((await shape(page)).bl).toBe('multiply');
  await page.waitForTimeout(600); expect(await labels(page)).toBe(h0 + 1);
  expect(errors).toEqual([]);
});
