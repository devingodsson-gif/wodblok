// 2.15.0: the element selection box. A one-pixel line in the accent, square handles and a round rotate handle in the panel colours (style tokens only);
// a corner stretches one side (sideways: width, up or down: height), Ctrl or Cmd scales both, Shift works from the middle.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, addShape } = require('./helpers/harness');

const el = async page => (JSON.parse(await getState(page)).els || []).filter(q => q.k === 'motif' && !q.bgd)[0];
const box = async (page, h) => { const r = await page.locator(`#fpov [data-fh="${h}"]`).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
const pull = async (page, h, dx, dy, key) => { const c = await box(page, h); if (key) await page.keyboard.down(key); await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + dx, c.y + dy, { steps: 6 }); await page.mouse.up(); if (key) await page.keyboard.up(key); await settle(page); };

test('the box and its handles use only style colours and the same pixel size at any zoom', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  await addShape(page);
  const css = await page.evaluate(() => { const g = s => { const e = document.querySelector(s), c = getComputedStyle(e); return { fill: c.fill, stroke: c.stroke, w: c.strokeWidth }; }, root = getComputedStyle(document.documentElement); return { sel: g('#fpov rect.sel'), hd: g('#fpov .fhd'), acc: root.getPropertyValue('--acc').trim(), fg: root.getPropertyValue('--fg').trim(), panel: root.getPropertyValue('--panel').trim() }; });
  expect(css.sel.fill).toBe('none'); expect(css.sel.w).toBe('1px');
  expect(css.hd.w).toBe('1px');
  const rgb = h => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(h); return m ? `rgb(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)})` : h; };
  expect(css.sel.stroke).toBe(rgb(css.acc)); expect(css.hd.stroke).toBe(rgb(css.panel)); expect(css.hd.fill).toBe(rgb(css.fg));
  const size = async () => (await page.locator('#fpov [data-fh="se"]').boundingBox()).width;
  const s0 = await size();
  expect(s0).toBeGreaterThan(7); expect(s0).toBeLessThan(11);
  await page.evaluate(() => { document.getElementById('zi').click(); document.getElementById('zi').click(); }); await settle(page); await page.waitForTimeout(300);
  expect(Math.abs((await size()) - s0)).toBeLessThan(1.5);
  expect(errors).toEqual([]);
});

test('a corner pulls both ways at once; Shift keeps the proportions (2.56.0)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  await addShape(page);
  const a = await el(page);
  await pull(page, 'se', 60, 30);
  const b = await el(page);
  expect(b.wx || 1).toBeGreaterThan((a.wx || 1) * 1.05); expect(b.wy || 1).toBeGreaterThan((a.wy || 1) * 1.02); expect(b.s).toBe(a.s);
  expect(b.wx).not.toBeCloseTo(b.wy, 2);   // width and height followed the pointer separately
  await pull(page, 'se', 40, 40, 'Shift');
  const d = await el(page);
  expect(d.s).toBeGreaterThan(b.s * 1.05); expect(d.wx || 1).toBe(b.wx || 1); expect(d.wy || 1).toBe(b.wy || 1);
  expect(errors).toEqual([]);
});
