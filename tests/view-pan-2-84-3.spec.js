// 2.84.3 (T6, T7): the middle mouse button drags the view and the wheel moves it, also while the canvas is fitted (not zoomed in); Fit puts it back.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, noPattern, armRect } = require('./helpers/harness');
const art = page => page.locator('#art').boundingBox();

test('fitted to the screen, a middle-button drag moves the canvas with the pointer; Fit puts it back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  const n0 = JSON.parse(await getState(page)).els.length;
  const a = await art(page), cx = a.x + a.width / 2, cy = a.y + a.height / 2;
  await page.mouse.move(cx, cy); await page.mouse.down({ button: 'middle' });
  await page.mouse.move(cx + 120, cy + 60, { steps: 6 }); await page.mouse.up({ button: 'middle' }); await settle(page);
  const b = await art(page);
  expect(b.x - a.x).toBeCloseTo(120, -1); expect(b.y - a.y).toBeCloseTo(60, -1);
  expect(JSON.parse(await getState(page)).els.length, 'the drag made nothing').toBe(n0);
  await page.evaluate(() => document.getElementById('zl').click()); await settle(page);   // Fit (the zoom label; folded away at this window width)
  const c = await art(page);
  expect(Math.abs(c.x - a.x)).toBeLessThan(2); expect(Math.abs(c.y - a.y)).toBeLessThan(2);
  expect(errors).toEqual([]);
});

test('fitted to the screen, the wheel moves the canvas up and down, Shift+wheel across; it never leaves the screen', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  const a = await art(page);
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.wheel(0, 100); await settle(page);
  const b = await art(page);
  expect(b.y).toBeLessThan(a.y - 50);
  await page.keyboard.down('Shift'); await page.mouse.wheel(0, 100); await page.keyboard.up('Shift'); await settle(page);
  const c = await art(page);
  expect(c.x).toBeLessThan(b.x - 50);
  for (let i = 0; i < 40; i++) await page.mouse.wheel(0, 400);
  await settle(page);
  const d = await art(page), vh = page.viewportSize().height;
  expect(d.y + d.height, 'a part of the canvas is still on screen').toBeGreaterThan(0);
  expect(d.y).toBeLessThan(vh);
  expect(errors).toEqual([]);
});

test('after the view is moved, a shape is still placed under the pointer', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  const a = await art(page), cx = a.x + a.width / 2, cy = a.y + a.height / 2;
  await page.mouse.move(cx, cy); await page.mouse.down({ button: 'middle' }); await page.mouse.move(cx + 80, cy, { steps: 5 }); await page.mouse.up({ button: 'middle' }); await settle(page);
  await armRect(page);
  const b = await art(page), px = b.x + b.width * 0.5, py = b.y + b.height * 0.5;
  await page.mouse.move(px, py, { steps: 3 }); await page.mouse.click(px, py); await settle(page);
  const q = JSON.parse(await getState(page)).els.find(e => e.k === 'motif'), vb = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
  expect(Math.abs(q.x - vb[0] / 2)).toBeLessThan(vb[0] * 0.03);
  expect(Math.abs(q.y - vb[1] / 2)).toBeLessThan(vb[1] * 0.03);
  expect(errors).toEqual([]);
});
