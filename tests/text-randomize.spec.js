// 1.46.0: Randomize uses the newer text options (wave path, bulge, random placement, bounce) on some lettering. The options come from the words, so rolls stay repeatable.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

async function roll(page) {
  await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 30000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
  await settle(page, { max: 30000 });
}
const texts = st => { const s = JSON.parse(st), out = []; s.tiles.forEach(t => Object.values(t.tgm || {}).forEach(m => out.push(m))); (s.layers || []).forEach(l => (l.pl || []).forEach(p => { if (p.tx) out.push(p.tx); })); return out; };
const NEW = m => !!(m.pt || m.wp || m.rp || m.bb);

test('Randomize gives some lettering a path, warp, scatter or bounce, and the same seed gives the same result', async ({ page }) => {
  let withNew = 0, total = 0, first = null;
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const { errors } = await openApp(page, { seed });
    await roll(page);
    const ts = texts(await getState(page));
    total += ts.length; withNew += ts.filter(NEW).length;
    if (seed === 3) first = JSON.stringify(ts.map(m => [m.text, m.pt, m.wp, m.rp, m.bb]));
    expect(errors).toEqual([]);
  }
  expect(total).toBeGreaterThan(0);
  expect(withNew).toBeGreaterThan(0);
  await openApp(page, { seed: 3 }); await roll(page);
  expect(JSON.stringify(texts(await getState(page)).map(m => [m.text, m.pt, m.wp, m.rp, m.bb]))).toBe(first);
});
