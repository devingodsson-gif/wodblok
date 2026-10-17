// Stamp editor: the selection box picks only the shapes that lie wholly inside it (1.35.0; it used to pick every shape it touched).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const place = async (page, x, y) => { await page.locator('#lib button[data-m]').first().click(); await page.mouse.move(x - 5, y - 5); await page.mouse.move(x, y); await page.mouse.click(x, y); await settle(page); await page.keyboard.press('Escape');
  await page.evaluate(() => { const r = document.getElementById('ssz'); r.value = 20; r.dispatchEvent(new Event('input', { bubbles: true })); }); await settle(page); };
const rects = page => page.evaluate(() => { const o = {}; document.querySelectorAll('#boardS [data-i]').forEach(n => { const r = n.getBoundingClientRect(); const k = n.dataset.i; if (!o[k] || (r.width * r.height > o[k].w * o[k].h)) o[k] = { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; }); return Object.values(o); });
const marquee = async (page, x0, y0, x1, y1) => { await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 4 }); await page.mouse.move(x1, y1, { steps: 4 }); await page.mouse.up(); await settle(page); };
const picked = page => page.evaluate(() => { const m = document.getElementById('msc'); return m && !m.hidden ? parseInt(m.textContent) : document.querySelectorAll('#boardS [data-hd]').length ? 1 : 0; });

test('the selection box picks the shapes inside it, not the ones it only touches', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await openPanel(page, 'motifs');
  await page.click('#lib .lfr[data-f="b:Flowers"]');
  await place(page, 520, 250);
  await place(page, 560, 400);
  const R = (await rects(page)).sort((a, b) => a.t - b.t);
  expect(R.length).toBe(2);
  const [a, b] = R;
  // around both: both
    await marquee(page, Math.min(a.l, b.l) - 12, a.t - 12, Math.max(a.r, b.r) + 12, b.b + 12);
  expect(await picked(page)).toBe(2);
  await page.mouse.click(Math.max(a.r, b.r) + 150, a.t - 10); await settle(page);
  expect(await picked(page)).toBe(0);
  // around the first and half of the second: only the first
  await marquee(page, Math.min(a.l, b.l) - 12, a.t - 12, Math.max(a.r, b.r) + 12, (b.t + b.b) / 2);
  expect(await picked(page)).toBe(1);
  expect(errors).toEqual([]);
});
