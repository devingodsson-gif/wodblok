// 2.114.0 (owner Nov 6 2026): a Pattern's Texture, Colour grade and filter effects are drawn once over the whole pattern, unless the effect's Whole pattern box is
// unticked; then each stamp gets its own, as before. Jitter and Pressure offset are always each stamp's, and have no box; other elements' effects have no box.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));
const addEffect = async (page, kind, label) => {
  await page.locator(`.fxg[data-fxk="${kind}"] .fxadd`).scrollIntoViewIfNeeded(); await page.click(`.fxg[data-fxk="${kind}"] .fxadd`);
  await page.locator('.rowm .ddi', { hasText: label }).first().click(); await H.settle(page); };
// the pattern's grade filters on the canvas: one over the whole pattern (pfx...), or one for each stamp
const grades = page => page.evaluate(() => { const a = [...document.querySelectorAll('#art filter')].map(f => f.id);
  return { whole: a.filter(i => /^pfx/.test(i)).length, each: a.filter(i => /^f[gm]\d/.test(i) || /^mtx|^mtg/.test(i)).length, all: a.length }; });

test('a Pattern\'s Colour grade is one filter over the whole pattern; unticking Whole pattern gives each stamp its own', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.openPanel(page, 'layers');
  await page.click('#elb [data-k="pattern"]'); await H.addKind(page, 'pattern'); await H.settle(page);
  await addEffect(page, 'pattern', 'Colour grade');
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); s.els.filter(q => q.k === 'pattern').forEach(q => (q.fx || []).forEach(e => { if (e.k === 'grade') e.sat = -50; })); window.__wbTest.apply(JSON.stringify(s)); });
  await H.settle(page);
  const box = page.locator('.fxg[data-fxk="pattern"] .fxwp');
  await expect(box).toBeVisible();
  await expect(box.locator('input')).toBeChecked();
  let p = (await st(page)).els.find(q => q.k === 'pattern' && (q.fx || []).length);
  expect(p.fx[0].wp, 'whole is the default and saves nothing').toBeUndefined();
  let g = await grades(page);
  expect(g.whole, 'one filter over the whole pattern').toBeGreaterThan(0);
  const all1 = g.all;
  // untick: each stamp
  await box.locator('input').uncheck(); await H.settle(page);
  p = (await st(page)).els.find(q => q.k === 'pattern' && (q.fx || []).length);
  expect(p.fx[0].wp).toBe(false);
  g = await grades(page);
  expect(g.whole, 'no whole-pattern filter').toBe(0);
  expect(g.all, 'a filter for each stamp').toBeGreaterThan(all1 + 3);
  // and back
  await box.locator('input').check(); await H.settle(page);
  expect((await grades(page)).whole).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Jitter has no Whole pattern box, nor do a shape\'s effects', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.openPanel(page, 'layers');
  await page.click('#elb [data-k="pattern"]'); await H.addKind(page, 'pattern'); await H.settle(page);
  await addEffect(page, 'pattern', 'Jitter');
  await expect(page.locator('.fxg[data-fxk="pattern"] .fxwp')).toBeHidden();
  await H.addShape(page); await H.settle(page);
  await addEffect(page, 'motif', 'Colour grade');
  await expect(page.locator('.fxg[data-fxk="motif"] .fxwp')).toBeHidden();
  expect(errors).toEqual([]);
});
