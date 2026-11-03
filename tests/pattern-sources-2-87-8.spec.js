// 2.87.8 (docs/pro-basics-plan.md step 8): the Pattern panel's sources are a group of their own near the top, opened by the standard full-width Add button;
// its menu lists the project's stamps, then its texts and patterns, then Shape from the library…, and each entry adds that source.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));
const pat = async (page, n = 'Pattern 1') => (await st(page)).els.find(q => q.k === 'pattern' && q.n === n);
const pick = async (page, text) => { await page.locator('#peadd').click(); await page.locator('.rowm .ddi', { hasText: text }).first().click(); await H.settle(page); };

test('Sources is the first group under the panel\'s own controls, with a full-width Add source', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addPattern(page); await H.showPanel(page, 'layers'); await H.settle(page);
  const groups = await page.locator('section.pn[data-p="layers"] > details.g').evaluateAll(ds => ds.filter(d => getComputedStyle(d).display != 'none').map(d => d.querySelector(':scope>summary').textContent.trim()));
  expect(groups.indexOf('Sources')).toBeGreaterThanOrEqual(0);
  expect(groups.indexOf('Sources')).toBeLessThan(groups.indexOf('Pattern'));
  const b = await page.locator('#peadd').boundingBox(), g = await page.locator('#pesg .gb').boundingBox();
  expect(b.width).toBeGreaterThan(g.width * .85);                                     // full width, like Add effect
  await expect(page.locator('#pesg #pesrc .psr2')).toHaveCount(1);                       // the project's stamp
  expect(errors).toEqual([]);
});

test('each Add source entry adds its source: a stamp, a text, another pattern and a shape from the library', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addPattern(page); await H.showPanel(page, 'text'); await H.addStampText(page); await H.settle(page);
  const d = await st(page), p1 = d.els.find(q => q.k === 'pattern');
  d.els.push({ ...JSON.parse(JSON.stringify(p1)), u: 'p2test', n: 'Pattern 2', src: [] });   // a second pattern to offer
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await H.settle(page);
  await H.showPanel(page, 'layers'); await H.settle(page);
  await page.locator('#peadd').click();
  const items = (await page.locator('.rowm .ddi').allTextContents()).map(t => t.trim());
  await page.keyboard.press('Escape');
  expect(items[0]).toBe('Stamp 1'); expect(items).toContain('Pattern 2'); expect(items[items.length - 1]).toBe('Shape from the library…');
  const kinds = async () => ((await pat(page)).src || []).map(x => x.k);
  await pick(page, 'Stamp 1'); expect(await kinds()).toEqual(['stamp', 'stamp']);
  await pick(page, items[1]); expect((await kinds()).slice(-1)[0]).toBe('text');
  await pick(page, 'Pattern 2'); expect((await kinds()).slice(-1)[0]).toBe('pattern');
  await pick(page, 'Shape from the library');
  if (!(await page.locator('#lib button[data-m]:visible').count())) await page.locator('#lib .lfr[data-f^="b:"]:visible').first().click();
  await page.locator('#lib button[data-m]:visible').first().click(); await H.settle(page);
  expect((await kinds()).slice(-1)[0]).toBe('motif');
  await expect(page.locator('#pesrc .psr2')).toHaveCount(5);
  expect(errors).toEqual([]);
});
