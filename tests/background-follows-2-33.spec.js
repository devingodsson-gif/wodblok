// 2.33.0: a Background that covers the canvas keeps covering it when the canvas changes size; one the person resized on purpose is left alone.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const bgOf = async page => JSON.parse(await H.getState(page)).els.find(q => q.bgd);
const view = page => page.locator('#art').evaluate(a => { const v = a.viewBox.baseVal; return { w: v.width, h: v.height }; });
const setRatio = (page, i) => page.evaluate(i => { const e = document.getElementById('casp'); e.selectedIndex = i; e.dispatchEvent(new Event('input', { bubbles: true })); }, i);

test('the Background follows a new canvas ratio', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, background: true });
  await H.openPanel(page, 'canvas');
  const n = await page.locator('#casp option').count();
  const before = await view(page);
  await setRatio(page, (await page.evaluate(() => document.getElementById('casp').selectedIndex)) === 0 ? 3 : 0); await H.settle(page);
  const after = await view(page);
  expect(after.w / after.h).not.toBeCloseTo(before.w / before.h, 2);
  const b = await bgOf(page);
  expect(b.s).toBeCloseTo(after.w, 0); expect(b.s * (b.wy || 1)).toBeCloseTo(after.h, 0);
  expect([b.x, b.y]).toEqual([+(after.w / 2).toFixed(1), +(after.h / 2).toFixed(1)]);
  expect(n).toBeGreaterThan(3);
  expect(errors).toEqual([]);
});

test('a Background the person made smaller stays as it is when the canvas changes', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, background: true });
  await H.openPanel(page, 'canvas');
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); s.els.forEach(q => { if (q.bgd) q.s = q.s / 2; }); window.__wbTest.apply(JSON.stringify(s)); });
  await H.settle(page);
  const b0 = await bgOf(page);
  await setRatio(page, (await page.evaluate(() => document.getElementById('casp').selectedIndex)) === 0 ? 3 : 0); await H.settle(page);
  const b1 = await bgOf(page);
  expect(b1.s).toBe(b0.s);
  expect(errors).toEqual([]);
});
