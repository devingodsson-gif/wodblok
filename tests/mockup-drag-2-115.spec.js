// 2.115.0 (owner Nov 6 2026): the Notebook on a table product (the owner's photo; a notebook at an angle), and the design on a mockup moved with the mouse:
// a drag on the print area moves it along the surface (Shift across and Shift down follow), Shift + drag turns it (Rotate), the wheel sizes it (Scale).
// Off the print area the pointer does nothing.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const ui = page => page.evaluate(() => JSON.parse(window.__wbTest.kv.get('wb2901_mockui') || '{}'));
const viewKey = page => page.evaluate(() => { const c = document.getElementById('mkc'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0; return h; });
// a point on the print area of the notebook on a table (its corners as fractions of the photo), in page pixels
const Q = [0.1699, 0.26, 0.5997, 0.1419, 0.8485, 0.7049, 0.3708, 0.862];
const onCover = async (page, u, v) => { const r = await page.locator('#mkc').boundingBox(), top = [Q[0] + (Q[2] - Q[0]) * u, Q[1] + (Q[3] - Q[1]) * u], bot = [Q[6] + (Q[4] - Q[6]) * u, Q[7] + (Q[5] - Q[7]) * u];
  return { x: r.x + r.width * (top[0] + (bot[0] - top[0]) * v), y: r.y + r.height * (top[1] + (bot[1] - top[1]) * v) }; };

test('the notebook on a table: a drag moves the design along the cover, Shift + drag turns it, the wheel sizes it', async ({ page }) => {
  test.setTimeout(120000);
  const { errors } = await H.openApp(page, { seed: 11 });
  await page.evaluate(() => window.__wbTest.commands.run('randomize.roll')); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock'));
  await page.locator('#mkfl [data-f="rep"]').click();
  await page.locator('#mkpane [data-mk="p-notebook-angle"]').click(); await page.waitForTimeout(1500);
  const u0 = await ui(page), k0 = await viewKey(page);
  // drag 17% of the cover's width across it, along its top edge (not 25%: the repeat's tiles are a quarter of the cover wide, so that would look the same)
  const a = await onCover(page, .4, .5), b = await onCover(page, .57, .5);
  await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(800);
  let u = await ui(page);
  expect((u.ox || 0) - (u0.ox || 0), 'Shift across follows the cover, 17% of it').toBeGreaterThan(14);
  expect((u.ox || 0) - (u0.ox || 0)).toBeLessThan(20);
  expect(Math.abs((u.oy || 0) - (u0.oy || 0)), 'and not down: the drag ran along the cover').toBeLessThan(2);
  expect(+(await page.locator('#mkox').inputValue())).toBeCloseTo(u.ox, 0);
  expect(await viewKey(page), 'the view shows it').not.toBe(k0);
  // Shift + drag: a turn
  const c = await onCover(page, .5, .3), d = await onCover(page, .8, .5);
  await page.keyboard.down('Shift'); await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(d.x, d.y, { steps: 8 }); await page.mouse.up(); await page.keyboard.up('Shift'); await page.waitForTimeout(600);
  u = await ui(page);
  expect(Math.abs(u.rt || 0), 'Shift + drag turns the design').toBeGreaterThan(10);
  // the wheel: smaller
  const s0 = u.sr || 25;
  const m = await onCover(page, .5, .5); await page.mouse.move(m.x, m.y); await page.mouse.wheel(0, 300); await page.waitForTimeout(600);
  u = await ui(page);
  expect(u.sr, 'the wheel sizes the design').toBeLessThan(s0);
  // off the print area (the table): nothing changes
  const r = await page.locator('#mkc').boundingBox(), before = JSON.stringify(await ui(page));
  await page.mouse.move(r.x + r.width * .9, r.y + r.height * .95); await page.mouse.down(); await page.mouse.move(r.x + r.width * .7, r.y + r.height * .95, { steps: 4 }); await page.mouse.up();
  await page.mouse.wheel(0, 300); await page.waitForTimeout(400);
  expect(JSON.stringify(await ui(page))).toBe(before);
  expect(errors).toEqual([]);
});
