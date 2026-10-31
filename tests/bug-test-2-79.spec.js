// The whole-application bug test of Oct 30 2026 (docs/bug-test-2.78.md) and its fix plan (2.78.2 to 2.79.0).
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const look = (page, k) => page.evaluate(k => window.__wbTest.kv.set('wb167_rzlook', k), k);
const roll = async page => { if (!(await page.locator('section.pn[data-p="rand"]:not([hidden])').count())) await H.openPanel(page, 'rand'); await page.click('#rzdo'); await page.waitForTimeout(250); await H.settle(page, { max: 60000 }); };

// B1: selecting a pattern rounded its Size and Spacing to the sliders' steps and wrote them back, two History steps for a click
test('selecting any element changes neither the document nor History', async ({ page }) => {
  test.setTimeout(400000);
  const { errors } = await H.openApp(page, { seed: 9, background: true });
  for (const k of ['modern', 'repeat', 'textile', 'tilework', 'letters', 'poster', 'badge', 'halftone']) {
    await look(page, k); await roll(page);
    const a = await H.getState(page), h = await page.evaluate(() => window.__wbTest.histLabels().join('|'));
    await H.openPanel(page, 'lyrs');
    for (const q of JSON.parse(a).els) {
      const r = page.locator(`#lybody .lyr[data-u="${q.u}"]`).first(); if (!(await r.count())) continue;
      await r.click({ position: { x: 60, y: 10 } }); await H.settle(page); await page.waitForTimeout(300);
      expect(diff(JSON.parse(a), JSON.parse(await H.getState(page))), `${k}: selecting ${q.k} ${q.n || q.nm || ''} changed the document`).toEqual([]);
      expect(await page.evaluate(() => window.__wbTest.histLabels().join('|')), `${k}: selecting ${q.k} ${q.n || q.nm || ''} added a History step`).toBe(h);
    }
  }
  expect(errors).toEqual([]);
});

function diff(x, y, p = '', out = []) {
  if (out.length > 10) return out;
  if (typeof x !== typeof y) { out.push(p); return out; }
  if (x && typeof x === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y || {})])) diff(x[k], (y || {})[k], p + '.' + k, out); return out; }
  if (x !== y) out.push(p + ': ' + JSON.stringify(x) + ' → ' + JSON.stringify(y));
  return out;
}

// B6 (2.78.3): Group asked its button, which catches up only on the next redraw
test('right after Select all, Group is there and groups', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 8, background: true });
  await roll(page);
  const r = await page.evaluate(() => { const c = window.__wbTest.commands; c.run('edit.selectAll'); return [c.isEnabled('element.group'), c.run('element.group')]; });
  expect(r[0], 'Group available at once').toBe(true);
  await H.settle(page);
  expect(JSON.parse(await H.getState(page)).els.filter(q => q.k === 'group').length).toBe(1);
  expect(await page.evaluate(() => window.__wbTest.commands.isEnabled('element.ungroup'))).toBe(true);
  expect(errors).toEqual([]);
});

// B4 (2.78.3): an emptied Text field left the old words on the canvas
test('a text whose field is left empty goes; Undo brings it back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await page.click('#elb [data-k="text"]'); await H.settle(page); await H.placeArmed(page, 'text'); await H.showPanel(page, 'text');
  await page.fill('#tx_t', 'Hello'); await page.waitForTimeout(500); await H.settle(page);
  const texts = async () => JSON.parse(await H.getState(page)).els.filter(e => e.tx).map(e => e.tx.text);
  expect(await texts()).toEqual(['Hello']);
  await page.fill('#tx_t', ''); await page.waitForTimeout(500); await H.settle(page);
  expect(await texts(), 'while the field is empty the words stay (typing goes on)').toEqual(['Hello']);
  await page.locator('#tx_t').blur(); await H.settle(page);
  expect(await texts(), 'leaving the field empty removes the text').toEqual([]);
  await page.evaluate(() => window.__wbTest.commands.run('edit.undo')); await H.settle(page);
  expect(await texts()).toEqual(['Hello']);
  expect(errors).toEqual([]);
});

// B2 (2.78.4): Size at 1% with no spacing placed about 15,000 pieces (6 MB of drawing, seconds a change); a pattern holds at most 3,000 and its slider stops there
test('a pattern stops at its piece limit; the slider shows the real value; it stays quick', async ({ page }) => {
  test.setTimeout(240000);
  const { errors } = await H.openApp(page, { seed: 4, background: true });
  await H.openPanel(page, 'layers');
  const set = (id, v) => page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);
  const pat = async () => JSON.parse(await H.getState(page)).els.find(q => q.k === 'pattern');
  await set('pesp', 0); await H.settle(page);
  const t0 = Date.now(); await set('peps', 1); await H.settle(page, { max: 30000 }); const ms = Date.now() - t0;
  const p = await pat(), shown = await page.inputValue('#peps');
  expect(p.ps, 'held above 1%').toBeGreaterThan(1);
  expect(+shown, 'the slider shows what the pattern has').toBe(p.ps);
  const n = await page.evaluate(() => document.querySelectorAll('#dyn use, #dyn g[data-pc], #dyn [transform]').length);
  expect(await page.evaluate(() => document.getElementById('dyn').innerHTML.length), 'drawing markup').toBeLessThan(2500000);
  expect(ms, 'a change at the limit').toBeLessThan(6000);
  // Radial at its largest counts is held too
  await page.locator('section.pn[data-p="layers"] button', { hasText: /^Radial$/ }).first().click(); await H.settle(page);
  await set('pecn', 24); await set('pern', 24); await H.settle(page, { max: 30000 });
  const r = await pat();
  expect(r.cn * r.rn * (r.rn + 1) / 2, 'radial pieces').toBeLessThanOrEqual(3000);
  expect(errors).toEqual([]);
});

// B3 (2.78.5): below about 1,000 px the right end of the top bar was cut off (Randomize, then Undo and Redo); the menus fold into "…" instead
test('a narrow window folds the menus into "…" and keeps every top-bar button in reach', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true });
  await expect(page.locator('#mnbmore')).toBeHidden();
  for (const w of [1024, 900, 800]) {
    await page.setViewportSize({ width: w, height: 700 }); await page.waitForTimeout(300);
    const out = await page.evaluate(() => [...document.querySelectorAll('header button')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1; }).map(b => b.id || b.textContent.trim()));
    expect(out, `${w} px: buttons past the edge`).toEqual([]);
    await expect(page.locator('#rzdo')).toBeVisible();
  }
  await expect(page.locator('#mnbmore')).toBeVisible();
  await page.click('#mnb-more');
  const subs = await page.locator('#mnbm-more button').allTextContents();
  expect(subs.join('|')).toMatch(/Help/);
  await page.locator('#mnbm-more button', { hasText: 'Help' }).hover();
  await expect(page.locator('.pop button', { hasText: 'Keyboard shortcuts' }).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(300);
  await expect(page.locator('#mnbmore')).toBeHidden();
  await expect(page.locator('#mnb-help')).toBeVisible();
  expect(errors).toEqual([]);
});

// B5 (2.78.5, owner: "hidden"): the Element panel was a blank tab with a stamp selected but not open; its tab goes while no stamp is open
test('the Element tab is there only while a stamp is open', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
  await H.addStamp(page); await H.unlockStamp(page, 0); await H.settle(page);
  await page.evaluate(() => document.querySelector('.rail [data-pn="mlist"]').click()); await H.settle(page);   // 2.79.1: with nothing selected the panel is empty (Align hides), so only its tab is checked
  await expect(page.locator('.wtab[data-t="mlist"]')).toHaveCount(1);
  await H.showPanel(page, 'stmp'); await page.locator('#stmpl .smklk').first().click(); await H.settle(page);   // its edit button again closes the stamp
  expect(await page.evaluate(() => window.__wbTest.unlockedStamp())).toBe(null);
  await expect(page.locator('.wtab[data-t="mlist"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
