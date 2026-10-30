// 2.78.0 (owner Oct 30 2026: "update and improve randomize, add more looks, add more variation in all the looks. And most of all utilize and leverage the new
// patterning capabilities ... utilize pattern elements in the vast majority of outputs and looks"): six new Looks made of patterns first (Textile, Tilework,
// Halftone, Mandala, Pattern type, Confetti), the pattern tools of the 2.76 plan in the rolls (wallpaper groups, colour per piece, density, Inside, accents,
// scatter without overlaps), and patterns in most of the older Looks' layouts.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, rzSet } = require('./helpers/harness');
const st = async page => JSON.parse(await getState(page));
const roll = async page => { await page.click('#rzdo'); await page.waitForTimeout(300); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };
const look = (page, k) => page.evaluate(k => window.__wbTest.kv.set('wb167_rzlook', k), k);
const dyn = page => page.evaluate(() => (document.getElementById('dyn') || { innerHTML: '' }).innerHTML.length);
const NEW = { textile: 'Textile', tilework: 'Tilework', halftone: 'Halftone', mandala: 'Mandala', letters: 'Pattern type', confetti: 'Confetti' };

test('each new Look is chosen in the panel, is made of patterns, says its name and stays light to draw', async ({ page }) => {
  test.setTimeout(240000);
  const { errors } = await openApp(page, { seed: 3, pattern: false });
  await openPanel(page, 'rand');
  const opts = await page.locator('#rzlook option').evaluateAll(o => o.map(x => x.value));
  for (const [k, name] of Object.entries(NEW)) {
    expect(opts, k).toContain(k);
    await look(page, k); await roll(page);
    await expect(page.locator('#pmsg')).toHaveText(`Randomized: ${name}.`);
    const s = await st(page);
    expect(s.els.filter(q => q.k === 'pattern').length, k).toBeGreaterThan(0);
    expect(await dyn(page), k + ': markup of the drawing').toBeLessThan(400000);
  }
  expect(errors).toEqual([]);
});

test('most rolls are made with patterns, and many Looks come up', async ({ page }) => {
  test.setTimeout(300000);
  const { errors } = await openApp(page, { seed: 21, pattern: false });
  await openPanel(page, 'rand');
  let withPat = 0; const seen = new Set();
  for (let i = 0; i < 24; i++) {
    await roll(page);
    const m = /Randomized: ([^.]+)\./.exec(await page.locator('#pmsg').textContent()); if (m) seen.add(m[1]);
    if ((await st(page)).els.some(q => q.k === 'pattern')) withPat++;
  }
  expect(withPat, 'rolls with a Pattern, of 24').toBeGreaterThanOrEqual(20);
  expect(seen.size, [...seen].join(', ')).toBeGreaterThanOrEqual(9);
  expect(errors).toEqual([]);
});

test('Pattern type: the pattern is inside its words and drawn over them; with Text off it is left out, so nothing points at missing words', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 6, pattern: false });
  await openPanel(page, 'rand');
  await look(page, 'letters'); await roll(page);
  let s = await st(page);
  const p = s.els.find(q => q.k === 'pattern' && q.pin), i = s.els.indexOf(p), w = s.els.findIndex(q => p && String(q.u) === String(p.pin));
  expect(p, 'a pattern inside an element').toBeTruthy();
  expect(s.els[w].k).toBe('text');
  expect(i, 'over its words').toBeGreaterThan(w);
  await rzSet(page, { text: false }); await roll(page);
  s = await st(page);
  const ids = new Set(s.els.map(q => String(q.u)));
  expect(s.els.filter(q => q.pin && !ids.has(String(q.pin)))).toEqual([]);
  expect(s.els.some(q => q.k === 'pattern'), 'the rest of the Look is still there').toBe(true);
  expect(errors).toEqual([]);
});

test('a stamp coloured piece by piece prints without a block edge (each colour would be drawn with its own edge, which took seconds)', async ({ page }) => {
  test.setTimeout(180000);
  const { errors } = await openApp(page, { seed: 1, pattern: false });
  await openPanel(page, 'rand');
  await look(page, 'tilework');
  let checked = 0;
  for (let i = 0; i < 4; i++) {
    await roll(page); const s = await st(page);
    for (const p of s.els.filter(q => q.k === 'pattern' && q.pcm)) for (const x of (p.src || []).filter(x => x.k === 'stamp')) {
      const t = s.tiles.find(t => t.id === x.t); expect(+(t && t.et) || 0, 'stamp ' + x.t).toBe(0); checked++;
    }
  }
  expect(checked, 'at least one stamp coloured piece by piece in four rolls').toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('on a repeat tile the pattern Looks only tile: no Inside, no density, no jitter, no colour per piece', async ({ page }) => {
  test.setTimeout(180000);
  const { errors } = await openApp(page, { seed: 12, pattern: false });
  await openPanel(page, 'canvas'); await page.click('#cfmt [data-f="tile"]'); await settle(page);
  await openPanel(page, 'rand');
  for (const k of ['textile', 'tilework', 'repeat']) {
    await look(page, k);
    for (let i = 0; i < 2; i++) {
      await roll(page); const s = await st(page), pats = s.els.filter(q => q.k === 'pattern');
      expect(pats.length, k).toBeGreaterThan(0);
      for (const p of pats) {
        expect(p.lay, k).toBe('tile');
        expect([p.pin, p.dm, p.pcm].filter(Boolean), k + ' ' + p.n).toEqual([]);   // no colour per piece either: by place it would not meet across the edges
        if (k !== 'repeat') expect((p.fx || []).filter(e => e.k === 'jitter'), k + ' ' + p.n).toEqual([]);   // Repeat's Damask sprig keeps its turn-only jitter (before 2.78)
      }
    }
  }
  expect(errors).toEqual([]);
});
