// 2.104.1 (owner Nov 5 2026, docs/group-panel-plan.md step 1): a group picked in the Elements list opens the Group panel (the canvas still picks single elements).
// X, Y, W and H are the group's box (W or H scales it evenly from the top-left); Rotate turns the members about their middle; Shift across and down move them in
// hundredths of the canvas. Every change is one History step and changes the members themselves, so Ungroup leaves them where they are.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const els = async page => JSON.parse(await H.getState(page)).els;
const mem = async page => Object.fromEntries((await els(page)).filter(q => q.n && q.n.startsWith('m:')).map(q => [q.n, q]));
const val = async (page, id, v) => { const n = page.locator('#' + id).locator('xpath=..').locator('.num input'); await n.fill(String(v)); await n.press('Enter'); await H.settle(page); };
const field = async (page, id, v) => { await page.fill('#' + id, String(v)); await page.press('#' + id, 'Enter'); await H.settle(page); };
const near = (a, b, t = .6) => expect(Math.abs(a - b)).toBeLessThan(t);

async function grouped(page) {
  const r = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
  // two shapes and a paint stroke (100 across, from its own place)
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), m = s.els.find(q => q.k === 'motif');
    s.els = [{ ...m, u: 'ma', n: 'm:a', x: 300, y: 300, s: 60, r: 0 }, { ...m, u: 'mb', n: 'm:b', x: 500, y: 400, s: 60, r: 0 }, { u: 'mp', k: 'paint', n: 'm:p', x: 400, y: 200, st: [{ u: 's1', w: 10, pts: [[0, 0], [100, 0]] }] }];
    window.__wbTest.apply(JSON.stringify(s)); window.__wbTest.resetHistory(); });
  await H.settle(page);
  await page.evaluate(() => { const c = window.__wbTest.commands; c.run('edit.selectAll'); c.run('element.group'); }); await H.settle(page);
  const G = (await els(page)).find(q => q.k === 'group');
  await H.openPanel(page, 'lyrs');
  await page.locator(`#lybody .lyr[data-u="${G.u}"]`).first().click({ position: { x: 60, y: 10 } }); await H.settle(page);
  return { ...r, G };
}

test('picking a group in the Elements list opens the Group panel and shows its box; X and W move and size the whole group, one History step each', async ({ page }) => {
  const { errors } = await grouped(page);
  await expect(page.locator('section.pn[data-p="group"]')).toBeVisible();
  await expect(page.locator('#fpov rect.sel')).toHaveCount(1);
  const a = await mem(page), h0 = (await page.evaluate(() => window.__wbTest.histLabels())).length;
  // X, one more unit: every member moves across by the same amount, none down
  const x0 = parseFloat(await page.inputValue('#gpx'));
  await field(page, 'gpx', x0 + 1);
  const b = await mem(page), dx = b['m:a'].x - a['m:a'].x;
  expect(dx).toBeGreaterThan(0);
  for (const k of Object.keys(a)) { near(b[k].x - a[k].x, dx, .05); near(b[k].y, a[k].y, .05); }
  expect((await page.evaluate(() => window.__wbTest.histLabels())).length).toBe(h0 + 1);
  // W twice as wide: sizes and the distances between the members double (the box's top-left stays)
  const w0 = parseFloat(await page.inputValue('#gpw'));
  await field(page, 'gpw', w0 * 2);
  const c = await mem(page);
  near(c['m:a'].s, 120, .1); near(c['m:b'].s, 120, .1); near(c['m:p'].st[0].w, 20, .1); near(c['m:p'].st[0].pts[1][0], 200, .2);
  near(c['m:b'].x - c['m:a'].x, 2 * (b['m:b'].x - b['m:a'].x), .1); near(c['m:b'].y - c['m:a'].y, 2 * (b['m:b'].y - b['m:a'].y), .1);
  near(parseFloat(await page.inputValue('#gpx')), x0 + 1, .02);
  expect((await page.evaluate(() => window.__wbTest.histLabels())).length).toBe(h0 + 2);
  expect(errors).toEqual([]);
});

test('Rotate turns the members about their middle; Shift moves them; Ungroup leaves them where they are; a canvas click still picks one element', async ({ page }) => {
  const { errors } = await grouped(page);
  const a = await mem(page), h0 = (await page.evaluate(() => window.__wbTest.histLabels())).length;
  await val(page, 'gprt', 90);
  const b = await mem(page), cx = (a['m:a'].x + a['m:b'].x + a['m:p'].x) / 3, cy = (a['m:a'].y + a['m:b'].y + a['m:p'].y) / 3;
  for (const k of Object.keys(a)) { near(b[k].x - cx, -(a[k].y - cy)); near(b[k].y - cy, a[k].x - cx); }   // a quarter turn about the middle
  expect(b['m:a'].r).toBe(90); expect(b['m:b'].r).toBe(90);
  near(b['m:p'].st[0].pts[1][0], 0); near(b['m:p'].st[0].pts[1][1], 100);   // the stroke turned with it
  expect((await page.evaluate(() => window.__wbTest.histLabels())).length).toBe(h0 + 1);
  // Shift across 10%: a tenth of the canvas
  const CW = await page.locator('#art').evaluate(e => e.viewBox.baseVal.width);
  await val(page, 'gpox', 10);
  const c = await mem(page);
  for (const k of Object.keys(a)) { near(c[k].x - b[k].x, CW / 10); near(c[k].y, b[k].y); }
  // the group keeps what its sliders show
  const G = (await els(page)).find(q => q.k === 'group'); expect(G.gr).toBe(90); expect(G.gox).toBe(10);
  // Ungroup: every member stays where it is
  await page.evaluate(() => window.__wbTest.commands.run('element.ungroup')); await H.settle(page);
  const d = await mem(page);
  expect((await els(page)).some(q => q.k === 'group')).toBe(false);
  for (const k of Object.keys(a)) { near(d[k].x, c[k].x, .01); near(d[k].y, c[k].y, .01); }
  // with a group again, a click on the canvas picks the shape under it, not the group
  await page.evaluate(() => { const c = window.__wbTest.commands; c.run('edit.selectAll'); c.run('element.group'); }); await H.settle(page);
  await page.keyboard.press('Escape'); await H.settle(page);
  const p = await H.canvasToClient(page, d['m:a'].x, d['m:a'].y); await page.mouse.click(p.x, p.y); await H.settle(page);
  await expect(page.locator('section.pn[data-p="motifs"]')).toBeVisible();   // the shape's own panel
  await expect(page.locator('section.pn[data-p="group"]')).toBeHidden();
  expect(errors).toEqual([]);
});
