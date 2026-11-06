// 2.112.0 (owner Nov 5 2026: "When i click a group i want the selection rectangle over the group and the ability to click and drag to move it"; a canvas click still
// picks one element, his choice): a group picked in the Elements list shows the selection rectangle with four corner handles and the rotate handle. A drag inside the
// box moves the whole group, a corner scales it evenly, the rotate handle turns it; each is one History step. A press that does not move picks the element under it.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const els = async page => JSON.parse(await H.getState(page)).els;
const mem = async page => Object.fromEntries((await els(page)).filter(q => q.n && q.n.startsWith('m:')).map(q => [q.n, q]));
const near = (a, b, t = .6) => expect(Math.abs(a - b)).toBeLessThan(t);
const hist = page => page.evaluate(() => window.__wbTest.histLabels());
// canvas units to screen
const toScreen = async (page, x, y) => page.evaluate(([x, y]) => { const a = document.getElementById('art'), m = a.getScreenCTM(), p = a.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(m); return { x: q.x, y: q.y }; }, [x, y]);
const drag = async (page, from, dx, dy) => { await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(from.x + dx, from.y + dy, { steps: 8 }); await page.mouse.up(); await H.settle(page); };
const centre = async (page, sel) => { const r = await page.locator(sel).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };

async function grouped(page) {
  const r = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), m = s.els.find(q => q.k === 'motif');
    s.els = [{ ...m, u: 'ma', n: 'm:a', x: 300, y: 300, s: 60, r: 0 }, { ...m, u: 'mb', n: 'm:b', x: 500, y: 400, s: 60, r: 0 }];
    window.__wbTest.apply(JSON.stringify(s)); window.__wbTest.resetHistory(); });
  await H.settle(page);
  await page.evaluate(() => { const c = window.__wbTest.commands; c.run('edit.selectAll'); c.run('element.group'); }); await H.settle(page);
  const G = (await els(page)).find(q => q.k === 'group');
  await H.openPanel(page, 'lyrs');
  await page.locator(`#lybody .lyr[data-u="${G.u}"]`).first().click({ position: { x: 60, y: 10 } }); await H.settle(page);
  return { ...r, G };
}

test('a picked group shows the selection rectangle with corner and rotate handles; dragging inside it moves the whole group, one History step', async ({ page }) => {
  const { errors } = await grouped(page);
  await expect(page.locator('#fpov rect.sel')).toHaveCount(1);
  await expect(page.locator('#fpov [data-gh]')).toHaveCount(5);
  const a = await mem(page), h0 = (await hist(page)).length;
  // press in the empty middle of the box (no member there) and drag
  await drag(page, await toScreen(page, 400, 350), 40, 25);
  const b = await mem(page), dx = b['m:a'].x - a['m:a'].x, dy = b['m:a'].y - a['m:a'].y;
  expect(dx).toBeGreaterThan(5); expect(dy).toBeGreaterThan(3);
  near(b['m:b'].x - a['m:b'].x, dx, .05); near(b['m:b'].y - a['m:b'].y, dy, .05);
  const h1 = await hist(page);
  expect(h1.length).toBe(h0 + 1); expect(h1[h1.length - 1]).toContain('Moved group');
  await expect(page.locator('#fpov [data-gh]'), 'the group is still picked').toHaveCount(5);
  expect(errors).toEqual([]);
});

test('a corner scales the group evenly, the rotate handle turns it; a press that does not move picks the element under it', async ({ page }) => {
  const { errors } = await grouped(page);
  // 2.114.1: on a slow machine (CI, Nov 6 2026) a History step was saved in the middle of a drag; the CPU is slowed here so that would show
  { const c = await page.context().newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', { rate: 6 }); }
  const a = await mem(page), h0 = (await hist(page)).length;
  // the south-east corner, pulled out: sizes and the gap between the members grow by the same factor, the north-west corner stays
  await drag(page, await centre(page, '#fpov [data-gh="se"]'), 60, 60);
  const b = await mem(page), k = b['m:a'].s / a['m:a'].s;
  expect(k).toBeGreaterThan(1.1);
  near(b['m:b'].s / a['m:b'].s, k, .01);
  near((b['m:b'].x - b['m:a'].x) / (a['m:b'].x - a['m:a'].x), k, .01);
  near(b['m:a'].x - b['m:a'].s / 2, a['m:a'].x - a['m:a'].s / 2, .6);   // the top-left stays
  expect((await hist(page)).length).toBe(h0 + 1);
  // the rotate handle: the members turn and the group keeps the angle (the panel's Rotate)
  const c0 = await centre(page, '#fpov [data-gh="rot"]');
  await drag(page, c0, 120, 60);
  const c = await mem(page), G = (await els(page)).find(q => q.k === 'group');
  expect(Math.abs(c['m:a'].r)).toBeGreaterThan(5); near(c['m:a'].r, c['m:b'].r, .2); near(+G.gr, c['m:a'].r, .2);
  expect((await hist(page)).length).toBe(h0 + 2);
  // a click (no move) on a member inside the box picks that member
  const m = await mem(page);
  const p = await toScreen(page, m['m:b'].x, m['m:b'].y);
  await page.mouse.click(p.x, p.y); await H.settle(page);
  await expect(page.locator('#fpov [data-gh]')).toHaveCount(0);
  await expect(page.locator('#fpov [data-fh]').first()).toBeVisible();
  expect((await hist(page)).length, 'a click is no History step').toBe(h0 + 2);
  expect(errors).toEqual([]);
});
