// 2.80.1 and on (owner Oct 31 2026, docs/mobile-touch-plan.md): a phone's touch controls. Touch is sent as real touch events (CDP), which the page sees
// as touch pointers, on a phone-sized screen; the desktop checks run at the normal size with a mouse.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

// one finger along a path: [[x, y], ...]
async function swipe(page, pts, steps = 6) {
  const c = await page.context().newCDPSession(page);
  const tp = (x, y) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(...pts[0]) });
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    for (let k = 1; k <= steps; k++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(x0 + (x1 - x0) * k / steps, y0 + (y1 - y0) * k / steps) }); await page.waitForTimeout(16); }
  }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(100);
}
// a slider in an open panel, scrolled into the middle of the screen
async function slider(page, id) {
  await page.evaluate(id => document.getElementById(id).scrollIntoView({ block: 'center' }), id);
  await page.waitForTimeout(150);
  return page.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width }; }, id);
}
const val = (page, id) => page.evaluate(id => +document.getElementById(id).value, id);
const scrollY = page => page.evaluate(() => scrollY);

test.describe('on a phone', () => {
  test.use(PHONE);
  test('a slider moves only by a sideways drag, from where it was; a swipe up or down scrolls and a tap changes nothing', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true });
    expect(await page.evaluate(() => document.documentElement.classList.contains('wbtouch'))).toBe(true);
    const pu = JSON.parse(await H.getState(page)).els.find(q => q.k === 'pattern').u;
    await page.evaluate(u => document.querySelector(`#lybody .lyr[data-u="${u}"]`).click(), pu); await H.settle(page);   // the pattern selected: its panel edits it
    await H.showPanel(page, 'layers'); await H.settle(page);
    const id = 'peps', s = await slider(page, id), v0 = await val(page, id), y0 = await scrollY(page);
    // up the page across the slider: it scrolls, the value stays
    await swipe(page, [[s.x + s.w * .5, s.y + 10], [s.x + s.w * .52, s.y - 200]]);
    expect(await val(page, id), 'a vertical swipe').toBe(v0);
    expect(await scrollY(page), 'the page scrolled').not.toBe(y0);
    // a tap on the far end of its track
    const s2 = await slider(page, id);
    await swipe(page, [[s2.x + s2.w * .95, s2.y], [s2.x + s2.w * .95 + 1, s2.y]], 1);
    expect(await val(page, id), 'a tap').toBe(v0);
    await page.waitForTimeout(400);   // a second tap at once would be a double tap, which sets the slider back to its default (as a double click does)
    // sideways: it moves, from where it was
    const h0 = (await page.evaluate(() => window.__wbTest.histLabels())).length;
    await swipe(page, [[s2.x + s2.w * .2, s2.y], [s2.x + s2.w * .5, s2.y + 4]]);
    expect(await val(page, id), 'a sideways drag').toBeGreaterThan(v0);
    expect(JSON.parse(await H.getState(page)).els.find(q => q.k === 'pattern').ps, 'the pattern took it').toBe(await val(page, id));
    expect((await page.evaluate(() => window.__wbTest.histLabels())).length, 'one History step').toBe(h0 + 1);
    expect(errors).toEqual([]);
  });

  test('the colour tray shows under the element bar', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true });
    await expect(page.locator('#tyd')).toBeVisible();
    const tray = await page.locator('#tyd').boundingBox(), bar = await page.locator('#elb').boundingBox();
    expect(tray.y, 'under the element bar').toBeGreaterThanOrEqual(bar.y + bar.height - 1);
    expect(tray.x + tray.width).toBeLessThanOrEqual(391);
    expect(errors).toEqual([]);
  });
});

test('desktop: no touch class, sliders take a click as before, the tray sits beside the element bar', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true });
  expect(await page.evaluate(() => document.documentElement.classList.contains('wbtouch'))).toBe(false);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('input[type=range]')).pointerEvents)).not.toBe('none');
  const tray = await page.locator('#tyd').boundingBox(), bar = await page.locator('#elb').boundingBox();
  expect(Math.abs(tray.y - bar.y), 'one row').toBeLessThan(20);
  expect(errors).toEqual([]);
});
