// 2.118.0 (docs/full-check-2.117.md, owner Nov 6 2026: yes to the plan): B2 a wheel change is one History step even with slow notches; B3 a two-letter unit
// does not sit over the number; S1 the stamp library says nothing about where it is stored. (B1, the mockup card names, is style-slips-2-107's B2 test.)
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const hist = page => page.evaluate(() => window.__wbTest.histLabels());
const scr = (page, x, y) => page.evaluate(([x, y]) => { const a = document.getElementById('art'), p = a.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(a.getScreenCTM()); return [q.x, q.y]; }, [x, y]);

test('Alt + wheel on the selected shape, notches far apart, is one History step', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page);
  const q = JSON.parse(await H.getState(page)).els.find(e => e.k === 'motif');
  const [px, py] = await scr(page, q.x, q.y);
  await page.mouse.move(px, py); await page.mouse.click(px, py); await H.settle(page);
  const h0 = (await hist(page)).length;
  // notches 450 ms apart: more than the idle moment History saves at, less than the 700 ms that ends the change
  await page.keyboard.down('Alt');
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(450); }
  await page.keyboard.up('Alt'); await H.settle(page); await page.waitForTimeout(900);
  const q2 = JSON.parse(await H.getState(page)).els.find(e => e.k === 'motif');
  expect(q2.s, 'smaller').toBeLessThan(q.s);
  expect((await hist(page)).length, 'one History step').toBe(h0 + 1);
  expect(errors).toEqual([]);
});

test('a number field with a two-letter unit keeps the unit clear of the number; the stamp library has no storage line', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await H.openPanel(page, 'xrec');
  const r = await page.locator('#xrpx').evaluate(i => { const u = i.parentElement.querySelector('i'), ib = i.getBoundingClientRect(), ub = u.getBoundingClientRect();
    return { pad: parseFloat(getComputedStyle(i).paddingRight), room: ib.right - ub.left }; });
  expect(r.pad, 'the padding reaches past the unit').toBeGreaterThanOrEqual(r.room);
  await H.openPanel(page, 'stmp');
  await expect(page.locator('#slwhere')).toHaveCount(0);
  await expect(page.locator('section.pn[data-p="stmp"]')).not.toContainText('Claude');
  expect(errors).toEqual([]);
});
