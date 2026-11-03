// 2.87.1 (docs/pro-basics-plan.md step 1): real units. Settings > General > Units (mm by default); the Element group shows X, Y (the box's top-left corner) and W, H in them,
// and takes typed values with units and arithmetic. A canvas with only a ratio is 300 mm on its long side (owner, Nov 3 2026).
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));
const shape = async page => (await st(page)).els.find(q => q.k === 'motif');
const type = async (page, id, v) => { const e = page.locator('#' + id); await e.click(); await e.fill(v); await e.press('Enter'); await H.settle(page); };
const vb = page => page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
const box = q => { const w = q.s * (q.wx || 1), h = q.s * (q.wy || 1); return { x: q.x - w / 2, y: q.y - h / 2, w, h }; };

test('the Element group shows X, Y, W and H in mm; typed values, units and sums set them; Esc and bad input change nothing', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page);
  const [W, Hh] = await vb(page), k = 300 / Math.max(W, Hh);   // mm per canvas unit on a 2:3 canvas with no size set
  await expect(page.locator('#lfux')).toBeVisible();
  await expect(page.locator('#lfpxy .unu').first()).toHaveText('mm');
  let b = box(await shape(page));
  expect(+(await page.inputValue('#lfux'))).toBeCloseTo(b.x * k, 0);
  expect(+(await page.inputValue('#lfuw'))).toBeCloseTo(b.w * k, 0);
  await type(page, 'lfux', '20'); b = box(await shape(page)); expect(b.x * k).toBeCloseTo(20, 1);
  await type(page, 'lfuy', '1in'); b = box(await shape(page)); expect(b.y * k).toBeCloseTo(25.4, 1);
  await type(page, 'lfux', '+10'); b = box(await shape(page)); expect(b.x * k).toBeCloseTo(30, 1);
  await type(page, 'lfuw', '50*2'); b = box(await shape(page)); expect(b.w * k).toBeCloseTo(100, 0); expect(b.x * k, 'the left edge stays').toBeCloseTo(30, 1);
  const before = JSON.stringify(await shape(page));
  const e = page.locator('#lfuh'); await e.click(); await e.fill('abc'); await e.press('Enter'); await H.settle(page);
  await expect(e).toHaveClass(/bad/);
  expect(JSON.stringify(await shape(page))).toBe(before);
  await e.fill('5'); await e.press('Escape'); await H.settle(page);
  expect(JSON.stringify(await shape(page))).toBe(before);
  expect(+(await page.inputValue('#lfuh'))).toBeCloseTo(box(await shape(page)).h * k, 0);
  // one History step for a typed change
  const h0 = (await page.evaluate(() => window.__wbTest.histLabels())).length;
  await type(page, 'lfuy', '40');
  expect((await page.evaluate(() => window.__wbTest.histLabels())).length).toBe(h0 + 1);
  expect(errors).toEqual([]);
});

test('Units in Settings changes what is shown, not the element; a canvas with a size uses it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page);
  const before = JSON.stringify(await shape(page)), mm = +(await page.inputValue('#lfuw'));
  await page.evaluate(() => window.__wbTest.kv.set('wb2871_units', 'in')); await page.evaluate(() => window.__wbTest.apply(window.__wbTest.state())); await H.settle(page);
  await expect(page.locator('#lfpxy .unu').first()).toHaveText('in');
  expect(+(await page.inputValue('#lfuw'))).toBeCloseTo(mm / 25.4, 2);
  expect(JSON.stringify(await shape(page))).toBe(before);
  // a canvas 200 x 300 mm at 300 DPI: a box as wide as the canvas reads 200 mm, 2362 px
  await page.evaluate(() => { window.__wbTest.kv.set('wb2871_units', 'mm'); const s = JSON.parse(window.__wbTest.state()); s.dim = { ...(s.dim || {}), u: 'mm', pw: 200, ph: 300, dpi: 300 }; window.__wbTest.apply(JSON.stringify(s)); }); await H.settle(page);
  await type(page, 'lfuw', '200');
  const [W] = await vb(page);
  expect(box(await shape(page)).w).toBeCloseTo(W, 0);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.evaluate(() => window.__wbTest.kv.set('wb2871_units', 'px')); await page.evaluate(() => window.__wbTest.apply(window.__wbTest.state())); await H.settle(page);
  expect(+(await page.inputValue('#lfuw'))).toBeCloseTo(2362, -1);
  expect(errors).toEqual([]);
});

test('Settings > General has Units: px, in, mm, cm, mm to start', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await page.evaluate(() => window.__wbTest.commands.run('settings.open')); await H.settle(page);
  const g = page.locator('#stgun');
  await expect(g).toBeVisible();
  expect(await g.locator('[data-v]').allTextContents()).toEqual(['px', 'in', 'mm', 'cm']);
  await expect(g.locator('[data-v="mm"]')).toHaveClass(/on/);
  await g.locator('[data-v="cm"]').click();
  expect(await page.evaluate(() => window.__wbTest.kv.get('wb2871_units'))).toBe('cm');
  expect(errors).toEqual([]);
});
