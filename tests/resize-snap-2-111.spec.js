// 2.111.0 (owner Nov 5 2026): with Snap to grid on (the Grid tool), the corner or side being pulled lands on the grid, as a moved piece does. Snap off: it follows
// the pointer as before.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const handle = async (page, h) => { const r = await page.locator(`#fpov [data-fh="${h}"]`).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
const pull = async (page, h, dx, dy) => { const c = await handle(page, h); await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + dx, c.y + dy, { steps: 6 }); await page.mouse.up(); await H.settle(page); };
// a handle's place in canvas units, and the grid's cell
const where = async (page, h) => { const c = await handle(page, h);
  return page.evaluate(([x, y]) => { const a = document.getElementById('art'), r = a.getBoundingClientRect(), v = a.viewBox.baseVal, s = JSON.parse(window.__wbTest.state());
    return { x: (x - r.left) / r.width * v.width + v.x, y: (y - r.top) / r.height * v.height + v.y, cell: v.width / Math.max(2, (s.pg && s.pg.n) || 8) }; }, [c.x, c.y]); };
const off = (v, c) => { const m = ((v % c) + c) % c; return Math.min(m, c - m); };

test('a corner and a side snap to the grid while being pulled when Snap to grid is on', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page);
  // Snap off: an odd pull leaves the corner off the grid
  await pull(page, 'se', 37, 23);
  let p = await where(page, 'se');
  expect(Math.max(off(p.x, p.cell), off(p.y, p.cell)), 'snap off: the corner follows the pointer').toBeGreaterThan(1);
  // Snap on
  await H.openPanel(page, 'pgrid'); await page.check('#pgn'); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('panels.closeAll')); await H.settle(page);
  await pull(page, 'se', 41, 29);
  p = await where(page, 'se');
  expect(off(p.x, p.cell), 'the corner is on a grid line across').toBeLessThan(1);
  expect(off(p.y, p.cell), 'and down').toBeLessThan(1);
  await pull(page, 'e', -33, 0);
  p = await where(page, 'e');
  expect(off(p.x, p.cell), 'a side lands on a grid line').toBeLessThan(1);
  expect(errors).toEqual([]);
});
