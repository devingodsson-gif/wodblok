// Project colours: four palette slots (1st = paper, 2nd = ink, 3rd and 4th optional), Randomize staying inside them,
// and Randomize > Colours > New palette (on by default) picking a whole new combination.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, openPanel, settle, getState } = require('./helpers/harness');

// the first 4-colour combination in the data file
const src = fs.readFileSync(path.join(ROOT, 'src', 'data', 'wada.js'), 'utf8');
const combos = new Function(src.slice(src.indexOf('const WADA_COLORS')).replace(/export \{[^}]*\};/, '') + ';return WADA_COMBOS;')();
const four = combos.findIndex(c => c.length === 4);

async function pick(page, id, value) {
  await page.evaluate(([i, v]) => { const s = document.getElementById(i); s.value = v; s.dispatchEvent(new Event('input')); }, [id, value]);
}
const palette = st => [st.proj.bg, st.proj.ink, st.proj.c3, st.proj.c4].filter(Boolean);
const comboNames = (() => {
  const s2 = src.slice(src.indexOf('const WADA_COLORS')).replace(/export \{[^}]*\};/, '') + ';return [WADA_COLORS, WADA_COMBOS];';
  const [cols, cbs] = new Function(s2)();
  return cbs.map(cb => cb.map(j => cols[j][0]).sort().join('|'));
})();
async function setSub(page, key, on) {
  await page.evaluate(([k, v]) => { const c = document.querySelector(`[data-sub="${k}"]`); c.checked = v; c.dispatchEvent(new Event('change', { bubbles: true })); }, [key, on]);
}

test('a four-colour combination fills the four slots and rotating moves them along', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  await openPanel(page, 'colors');
  expect(four).toBeGreaterThan(-1);
  await pick(page, 'pal', String(four));
  await settle(page);
  const a = JSON.parse(await getState(page)).proj;
  expect(Object.keys(a).sort()).toEqual(['bg', 'c3', 'c4', 'ink']);
  expect(new Set([a.bg, a.ink, a.c3, a.c4]).size).toBe(4);
  expect(await page.locator('label', { hasText: '1st colour' }).count()).toBe(1);
  expect(await page.locator('label', { hasText: '4th colour' }).count()).toBe(1);
  expect(await page.locator('label', { hasText: /^Background$/ }).count()).toBe(0);
  await page.click('#pswp');
  await settle(page);
  const b = JSON.parse(await getState(page)).proj;
  expect([b.bg, b.ink, b.c3, b.c4]).toEqual([a.ink, a.c3, a.c4, a.bg]);
  await pick(page, 'p4', '');
  await settle(page);
  expect(Object.keys(JSON.parse(await getState(page)).proj).sort()).toEqual(['bg', 'c3', 'ink']);
  expect(errors).toEqual([]);
});

test('randomize only uses colours from the current palette', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await openPanel(page, 'colors');
  await pick(page, 'pal', String(four));
  await settle(page);
  const pal = palette(JSON.parse(await getState(page)).proj ? JSON.parse(await getState(page)) : {});
  expect(pal.length).toBe(4);
  await openPanel(page, 'rand');
  await setSub(page, 'col.new', false);
  for (let i = 0; i < 4; i++) {
    await page.click('#rzdo');
    await settle(page, { max: 60000 });
    const st = JSON.parse(await getState(page));
    expect([...palette(st)].sort()).toEqual([...pal].sort());
    const used = [...st.tiles.map(t => t.ink), ...st.layers.map(l => l.ink)].filter(Boolean);
    for (const n of used) expect(pal, `roll ${i + 1} used ${n}`).toContain(n);
  }
  expect(errors).toEqual([]);
});

test('New palette is on by default and each roll uses a whole Wada combination; undo brings the old one back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 7 });
  await openPanel(page, 'rand');
  expect(await page.locator('[data-sub="col.new"]').isChecked()).toBe(true);
  const before = JSON.parse(await getState(page)).proj;
  const seen = new Set();
  for (let i = 0; i < 4; i++) {
    await page.click('#rzdo');
    await settle(page, { max: 60000 });
    const st = JSON.parse(await getState(page));
    const pal = palette(st);
    expect(comboNames, `roll ${i + 1} palette ${pal.join(', ')}`).toContain([...pal].sort().join('|'));
    const used = [...st.tiles.map(t => t.ink), ...st.layers.map(l => l.ink)].filter(Boolean);
    for (const n of used) expect(pal, `roll ${i + 1} used ${n}`).toContain(n);
    seen.add(pal.join('|'));
  }
  expect(seen.size).toBeGreaterThan(1);
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Control+z'); await settle(page); }
  expect(JSON.parse(await getState(page)).proj).toEqual(before);
  expect(errors).toEqual([]);
});
