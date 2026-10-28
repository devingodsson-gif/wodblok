// 2.67.2: on a phone the top bar keeps every item at its own width and scrolls sideways (swipe left and right) instead of squeezing the buttons on top of each other.
const { test, expect } = require('@playwright/test');
const { openApp, settle } = require('./helpers/harness');

const items = page => page.evaluate(() => [...document.querySelectorAll('header.top button, header.top input:not(.vh)')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return { id: b.id || b.className, l: r.left, r: r.right, w: r.width }; }).sort((a, b) => a.l - b.l));

test('phone width: no top bar items overlap and the bar scrolls sideways to its last button', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  const { errors } = await openApp(page);
  await settle(page);
  const bar = await page.evaluate(() => { const t = document.querySelector('header.top'); return { sw: t.scrollWidth, cw: t.clientWidth, ox: getComputedStyle(t).overflowX }; });
  expect(bar.ox).toBe('auto');
  expect(bar.sw).toBeGreaterThan(bar.cw);                     // there is something to swipe to
  const a = await items(page);
  for (let i = 1; i < a.length; i++) expect(a[i].l, `${a[i - 1].id} then ${a[i].id}`).toBeGreaterThanOrEqual(a[i - 1].r - 1);
  for (const x of a) expect(x.w, x.id).toBeGreaterThanOrEqual(24);
  // swipe to the end: the last button (light/dark) comes fully into view
  await page.evaluate(() => { const t = document.querySelector('header.top'); t.scrollLeft = t.scrollWidth; });
  const last = await page.evaluate(() => { const r = document.getElementById('thm').getBoundingClientRect(), t = document.querySelector('header.top').getBoundingClientRect(); return r.right <= t.right + 1 && r.left >= t.left; });
  expect(last).toBe(true);
  expect(errors).toEqual([]);
});

test('desktop width: the top bar does not scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const { errors } = await openApp(page);
  expect(await page.evaluate(() => { const t = document.querySelector('header.top'); return t.scrollWidth <= t.clientWidth; })).toBe(true);
  expect(errors).toEqual([]);
});
