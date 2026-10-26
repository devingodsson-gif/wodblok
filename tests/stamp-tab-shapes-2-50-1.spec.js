// 2.50.1 (owner Oct 26 2026: "the lines are misaligned on hex and triangle"): in a stamp's tab the stage takes the stamp's own size when its shape changes,
// the stamp fills its outline, and the symmetry lines are centred on the stamp (a triangle on its own centre, a third of the way up from its base).
const { test, expect } = require('@playwright/test');
const { openApp, settle, showPanel, openPanel } = require('./helpers/harness');

// where things are, in the stage's own units: the viewBox, the printed stamp's box (without the print's 2px margin) and the centre dot of the symmetry lines
const measure = page => page.evaluate(() => {
  const a = document.getElementById('art'), r = a.getBoundingClientRect(), vb = a.viewBox.baseVal, k = vb.width / r.width, box = e => { const b = e.getBoundingClientRect(); return { x: (b.x - r.x) * k, y: (b.y - r.y) * k, w: b.width * k, h: b.height * k }; };
  const prints = [...a.querySelectorAll('use')].filter(u => /^#bk/.test(u.getAttribute('href'))).map(box).filter(b => b.w > vb.width * .5);
  const dot = [...document.querySelectorAll('g[pointer-events="none"] > circle[fill="#c8694a"]')].map(box)[0];
  return { W: vb.width, H: vb.height, print: prints[0] || null, dot: dot ? { x: dot.x + dot.w / 2, y: dot.y + dot.h / 2 } : null };
});

test('a hexagon or triangle stamp fills its own stage in its tab, and the symmetry lines are centred on it', async ({ page }) => {
  test.setTimeout(240000);
  const { errors } = await openApp(page, { seed: 3 });
  await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 60000 });
  await showPanel(page, 'stmp'); await page.click('#smkedit'); await settle(page);
  const want = { hex: { W: 207.85, H: 240, cy: 120 }, tri: { W: 240, H: 207.85, cy: 138.56 }, rect: { W: 240, H: 240, cy: 120 } };
  for (const k of ['hex', 'tri', 'rect']) {
    await showPanel(page, 'stmp');
    await page.click(`#skind [data-k="${k}"]`); await settle(page);
    await page.locator('#sym [data-y="star"]').click(); await settle(page);
    const m = await measure(page), w = want[k];
    expect(m.W, k + ' stage width').toBeCloseTo(w.W, 1);
    expect(m.H, k + ' stage height').toBeCloseTo(w.H, 1);
    // the print reaches the stage's edges (its bitmap has a margin of a few units)
    expect(m.print, k + ' print').toBeTruthy();
    expect(Math.abs(m.print.x + m.print.w / 2 - w.W / 2), k + ' print centred across').toBeLessThan(1.5);
    expect(Math.abs(m.print.y + m.print.h / 2 - w.H / 2), k + ' print centred down').toBeLessThan(1.5);
    expect(m.print.w, k + ' print fills the stage').toBeGreaterThan(w.W - 1);
    // the symmetry centre
    expect(m.dot, k + ' guide centre').toBeTruthy();
    expect(Math.abs(m.dot.x - w.W / 2), k + ' guide centre across').toBeLessThan(1.5);
    expect(Math.abs(m.dot.y - w.cy), k + ' guide centre down').toBeLessThan(1.5);
  }
  expect(errors).toEqual([]);
});
