// 1.0.20 (UX review 2: N1, N6): a panel group with more tabs than fit scrolls the chosen tab into view and fades the hidden edge; the top-bar text buttons have an outline.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

test('with many tabs open the newest tab is fully visible and the strip shows it can scroll back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  for (const p of ['lyrs', 'rand', 'hist', 'colors', 'cways', 'canvas']) await openPanel(page, p);
  await settle(page);
  const r = await page.evaluate(() => {
    const t = document.querySelector('.wh .wt'), a = t.querySelector('.wtab.on'), tr = t.getBoundingClientRect(), ar = a.getBoundingClientRect();
    return { over: t.scrollWidth > t.clientWidth, inView: ar.left >= tr.left - 1 && ar.right <= tr.right + 1, left: t.parentElement.classList.contains('ovl') };
  });
  expect(r.over).toBe(true);
  expect(r.inView).toBe(true);
  expect(r.left).toBe(true);
  expect(errors).toEqual([]);
});

test('Open projects folder and File look like buttons', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  for (const id of ['pls', 'fileb']) {
    const w = await page.evaluate(id => parseFloat(getComputedStyle(document.getElementById(id)).borderTopWidth) > 0 && getComputedStyle(document.getElementById(id)).borderTopColor !== 'rgba(0, 0, 0, 0)', id);
    expect(w, id).toBe(true);
  }
  expect(errors).toEqual([]);
});
