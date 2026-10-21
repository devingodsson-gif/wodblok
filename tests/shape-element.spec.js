// 2.3.2: the Shape element: geometric presets, a Pen with curves, fill (none, colour, image) and an outline with a thickness.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, noPattern } = require('./helpers/harness');

const els = async page => JSON.parse(await getState(page)).els;
const shapes = async page => (await els(page)).filter(q => q.k === 'shape');
const setRange = (page, id, v) => page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);
const canvasAt = async (page, fx, fy) => { const b = await page.locator('#art').boundingBox(); return { x: b.x + b.width * fx, y: b.y + b.height * fy }; };

test('the Shape button makes a Rectangle at once; the presets change it; Fill and Outline work', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="shape"]'); await settle(page);
  let s = await shapes(page);
  expect(s).toHaveLength(1);
  expect(s[0].sh).toBe('rect');
  await expect(page.locator('#shp_pre [data-g]')).toHaveCount(11);
  expect(await page.$$eval('#dyn path', p => p.length)).toBeGreaterThan(0);
  await page.click('#shp_pre [data-g="ellipse"]'); await settle(page);
  expect((await shapes(page))[0].sh).toBe('ellipse');
  await page.click('#shp_pre [data-g="rrect"]'); await settle(page);
  await expect(page.locator('#shp_crw')).toBeVisible();
  await page.click('#shp_fk [data-f="none"]'); await settle(page);
  expect((await shapes(page))[0].fl).toBe('none');
  await page.check('#shp_oon'); await settle(page);
  expect((await shapes(page))[0].sw).toBeGreaterThan(0);
  await setRange(page, 'shp_ow', 30); await settle(page);
  expect((await shapes(page))[0].sw).toBe(30);
  await page.click('#shp_fk [data-f="solid"]'); await settle(page);
  expect((await shapes(page))[0].fl).toBeUndefined();
  expect(errors).toEqual([]);
});

test('a Shape has the transform controls: size, turn, flip', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="shape"]'); await settle(page);
  const s0 = (await shapes(page))[0];
  await setRange(page, 'lfpr', 30); await settle(page);
  expect((await shapes(page))[0].r).toBe(30);
  await setRange(page, 'lfps', 20); await settle(page);
  expect((await shapes(page))[0].s).not.toBe(s0.s);
  await page.click('#lfpfl'); await settle(page);
  expect((await shapes(page))[0].f).toBe(-1);
  expect(errors).toEqual([]);
});

test('the Pen: click corner points, drag for a curve, Enter finishes an open path; clicking the first point closes one', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="pen"]'); await settle(page);
  await expect(page.locator('#elb [data-k="pen"]')).toHaveAttribute('aria-pressed', 'true');
  const a = await canvasAt(page, 0.3, 0.6), b = await canvasAt(page, 0.5, 0.3), c = await canvasAt(page, 0.7, 0.6);
  await page.mouse.click(a.x, a.y);
  await page.mouse.move(b.x, b.y); await page.mouse.down(); await page.mouse.move(b.x + 40, b.y, { steps: 4 }); await page.mouse.up();
  await page.mouse.click(c.x, c.y);
  await page.keyboard.press('Enter'); await settle(page);
  let s = await shapes(page);
  expect(s).toHaveLength(1);
  expect(s[0].sh).toBe('path');
  expect(s[0].pts).toHaveLength(3);
  expect(s[0].cl).toBe(0);
  expect(s[0].fl).toBe('none');
  expect(s[0].sw).toBeGreaterThan(0);
  expect(s[0].pts.some(q => q[4] || q[5])).toBe(true);   // the dragged point has curve handles
  // a closed one
  await page.click('#elb [data-k="pen"]'); await settle(page);
  const p = [await canvasAt(page, 0.2, 0.2), await canvasAt(page, 0.4, 0.2), await canvasAt(page, 0.3, 0.4)];
  for (const q of p) await page.mouse.click(q.x, q.y);
  await page.mouse.click(p[0].x, p[0].y); await settle(page);
  s = await shapes(page);
  expect(s).toHaveLength(2);
  expect(s[1]).toMatchObject({ sh: 'path', cl: 1 });
  await expect(page.locator('#elb [data-k="pen"]')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});
