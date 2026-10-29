// Project colours (1.10: the tray): a Wada combination fills the first places of the tray, Randomize stays inside the tray,
// and Randomize > Colours > New palette (on by default) loads a whole new combination into the tray.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, openPanel, settle, getState, rzSet } = require('./helpers/harness');

// the first 4-colour combination in the data file
const src = fs.readFileSync(path.join(ROOT, 'src', 'data', 'wada.js'), 'utf8');
const combos = new Function(src.slice(src.indexOf('const WADA_COLORS')).replace(/export \{[^}]*\};/, '') + ';return WADA_COMBOS;')();
const four = combos.findIndex(c => c.length === 4);

const comboNames = (() => {
  const s2 = src.slice(src.indexOf('const WADA_COLORS')).replace(/export \{[^}]*\};/, '') + ';return [WADA_COLORS, WADA_COMBOS];';
  const [cols, cbs] = new Function(s2)();
  return cbs.map(cb => cb.map(j => cols[j][0]).sort().join('|'));
})();
// the names of the tray's first n colours (n = how many a combination fills)
const trayNames = (st, n) => { const p = st.proj, w = p.cw[p.cwa]; return p.ts.slice(0, n).map(id => w.m[id]).filter(Boolean); };
const links = st => [...st.tiles.map(t => t.ink), ...st.els.map(q => q.ink), st.proj.bg, st.proj.ink].filter(Boolean);
async function loadCombo(page, i) {
  await openPanel(page, 'colors');
  await page.fill('#stq', 'No. ' + (i + 1));
  await page.locator('#stl button[data-st]', { has: page.locator('small', { hasText: new RegExp('^No\\. ' + (i + 1) + '$') }) }).click();
  await settle(page);
  await page.fill('#stq', '');
}

test('a four-colour combination fills the first four places of the tray, paper first; moving one reorders the tray', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  expect(four).toBeGreaterThan(-1);
  await loadCombo(page, four);
  const a = JSON.parse(await getState(page)).proj;
  expect(a.ts).toHaveLength(4);
  expect(new Set(a.ts.map(id => a.cw[0].c[id])).size).toBe(4);
  expect(a.bg).toBe('@' + a.ts[0]); expect(a.ink).toBe('@' + a.ts[1]);
  await page.locator('#tyl .tyr').first().locator('[data-more]').click();
  await page.click('.rowm .ddi:has-text("Move down")'); await settle(page);
  const b = JSON.parse(await getState(page)).proj;
  expect(b.ts).toEqual([a.ts[1], a.ts[0], a.ts[2], a.ts[3]]);
  expect(b.bg).toBe(a.bg);                                     // the paper still links to the same colour, wherever it sits
  expect(errors).toEqual([]);
});

test('randomize only uses colours from the tray', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await loadCombo(page, four);
  const before = JSON.parse(await getState(page)).proj;
  await openPanel(page, 'rand');
  await rzSet(page, { col: false });   // 2.76.3: with Colours off a roll keeps the palette and uses the tray as it is
  for (let i = 0; i < 4; i++) {
    await page.click('#rzdo');
    await settle(page, { max: 60000 });
    const st = JSON.parse(await getState(page));
    expect(st.proj.cw[st.proj.cwa].c).toEqual(before.cw[0].c);   // the tray's colours are untouched
    // 2.76.3: a Look also makes tones of the paper and ink (fixed colours); every colour it takes from the palette is a link to a tray place
    for (const r of links(st).filter(r => r[0] === '@')) expect(st.proj.ts.map(id => '@' + id), `roll ${i + 1} used ${r}`).toContain(r);
  }
  expect(errors).toEqual([]);
});

test('New palette is on by default and each roll loads a whole Wada combination into the tray; undo brings the old one back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 7 });
  await openPanel(page, 'rand');
  expect(await page.locator('[data-rz="col"]').isChecked()).toBe(true);
  const before = JSON.parse(await getState(page)).proj;
  const seen = new Set();
  for (let i = 0; i < 4; i++) {
    await page.click('#rzdo');
    await settle(page, { max: 60000 });
    await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
    const st = JSON.parse(await getState(page)), p = st.proj, w = p.cw[p.cwa];
    // the combination fills places 1 to n; everything the piece uses links to one of them
    const used = new Set(links(st).filter(r => r[0] === '@').map(r => r.slice(1))), n = Math.max(...[...used].map(id => p.ts.indexOf(id) + 1));
    let hit = false;
    for (let k = Math.max(2, n); k <= 4 && !hit; k++) hit = comboNames.includes([...trayNames(st, k)].sort().join('|'));
    expect(hit, `roll ${i + 1} tray ${p.ts.map(id => w.m[id]).join(', ')}`).toBe(true);
    for (const r of links(st).filter(r => r[0] === '@')) expect(p.ts.map(id => '@' + id), `roll ${i + 1} used ${r}`).toContain(r);   // 2.76.3: a Look's tones of the paper and ink are fixed colours
    seen.add(trayNames(st, 4).join('|'));
  }
  expect(seen.size).toBeGreaterThan(1);
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Control+z'); await settle(page); }
  expect(JSON.parse(await getState(page)).proj).toEqual(before);
  expect(errors).toEqual([]);
});
