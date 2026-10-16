// Presets (Phase 5): saved looks; the palette list moved to Colours > Saved trays in 1.10. Applying never touches stamps or layout, and is one undo step.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const state = async page => JSON.parse(await getState(page));
const roll = async page => { if (!(await page.locator('section.pn[data-p="rand"]:not([hidden])').count())) await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };
const look = (page, name) => page.locator('#psl .psr', { hasText: name });
const pal = (page, name) => page.locator('#stl .str', { hasText: name });
const findTray = async (page, q) => { await openPanel(page, 'colors'); await page.fill('#stq', q); };
const undo = async page => { await page.keyboard.press('Control+z'); await settle(page); };
const inks = st => [...new Set([...st.tiles.map(t => t.ink), ...st.layers.map(l => l.ink)].filter(Boolean))];

test('the saved trays hold all 348 combinations; typing finds them by name or colour', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  const total = await page.$$eval('.stf[data-f^="wada"] small', s => s.reduce((a, x) => a + +x.textContent, 0));
  expect(total).toBe(348);
  await page.fill('#stq', 'kinari');
  const some = await page.locator('#stl .str b').allTextContents();
  expect(some.length).toBeGreaterThan(0); expect(some.length).toBeLessThan(40);
  expect(some.every(n => /kinari/i.test(n))).toBe(true);
  await page.fill('#stq', 'Dark Tyrian Blue');                                  // a colour of the combination
  expect(await page.locator('#stl .str').count()).toBeGreaterThan(3);
  await page.fill('#stq', 'zzzz');
  await expect(page.locator('#stl .stno')).toHaveText('No matching tray');
  expect(errors).toEqual([]);
});

test('a saved tray sets the tray colours; what links to them follows; stamps and layout stay; one undo step', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  const before = await state(page);
  await findTray(page, 'Kinari Kon');
  await pal(page, 'Kinari Kon').first().click(); await settle(page);
  const after = await state(page), p = after.proj, w = p.cw[p.cwa];
  expect([w.m[p.ts[0]], w.m[p.ts[1]]]).toEqual(['Pale Lemon Yellow', 'Dark Tyrian Blue']);
  expect([p.bg, p.ink]).toEqual([before.proj.bg, before.proj.ink]);              // the links stay; their colours changed
  for (const r of inks(after)) expect(p.ts.map(id => '@' + id), `ink ${r}`).toContain(r);
  expect(after.tiles.map(t => t.items)).toEqual(before.tiles.map(t => t.items));        // the stamps' shapes
  expect(after.layers.map(l => [l.st, l.size, l.ak])).toEqual(before.layers.map(l => [l.st, l.size, l.ak]));
  await undo(page);
  expect((await state(page)).proj).toEqual(before.proj);
  expect(errors).toEqual([]);
});

test('a starting look changes the finish only: grade, print effects and canvas texture; Undo brings the old finish back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  await roll(page);
  const before = await state(page);
  await openPanel(page, 'pres');
  await look(page, 'Strong ink').click(); await settle(page);
  const a = await state(page);
  expect(a.grade.ct).toBe(18); expect(a.grade.sh).toBe(-6); expect(a.pr.e).toBe(0); expect(a.pr.q).toBe(0); expect(a.tex.u).toEqual([]);
  expect(a.proj).toEqual(before.proj);
  expect(a.tiles.map(t => t.items)).toEqual(before.tiles.map(t => t.items));
  await look(page, 'Faded linen').click(); await settle(page);
  const b = await state(page);
  expect(b.grade.fd).toBe(24); expect(b.tex.u.length).toBe(1);
  expect(b.texLib.some(x => x.id === b.tex.u[0].x && x.t === 'linen')).toBe(true);
  await undo(page); await undo(page);
  const c = await state(page);
  expect(c.grade).toEqual(before.grade); expect(c.pr).toEqual(before.pr);
  expect(errors).toEqual([]);
});

test('save a look, change everything, apply it: the palette, grade, texture and print effects come back; rename, reload, delete', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 7 });
  await roll(page);
  const saved = await state(page);
  await openPanel(page, 'pres');
  await page.fill('#psn', 'Mine'); await page.click('#pssave');
  await expect(look(page, 'Mine')).toBeVisible();
  await expect(look(page, 'Mine').locator('img')).toHaveAttribute('src', /^data:image/);
  await look(page, 'Clean').click(); await settle(page);
  await findTray(page, 'Kinari Kon'); await pal(page, 'Kinari Kon').first().click(); await settle(page);
  expect((await state(page)).proj).not.toEqual(saved.proj);
  await openPanel(page, 'pres');
  await look(page, 'Mine').click(); await settle(page);
  const back = await state(page);
  expect(back.proj).toEqual(saved.proj);
  expect(back.pr).toEqual(saved.pr);
  expect(back.grade.masks.filter(m => !m.lay && !m.sc)).toEqual(saved.grade.masks.filter(m => !m.lay && !m.sc));
  expect(back.tex.u.map(u => u.x)).toEqual(saved.tex.u.map(u => u.x));
  expect(back.tiles.map(t => t.items)).toEqual(saved.tiles.map(t => t.items));
  await look(page, 'Mine').locator('[data-act="ren"]').click();
  await page.locator('#psl .psr input').fill('Mine two'); await page.keyboard.press('Enter');
  await expect(look(page, 'Mine two')).toBeVisible();
  await page.reload(); await page.waitForFunction(() => window.__wbTest);
  await openPanel(page, 'pres');
  await expect(look(page, 'Mine two')).toBeVisible();
  await look(page, 'Mine two').locator('[data-act="del"]').click();
  await expect(look(page, 'Mine two')).toHaveCount(0);
  expect(errors).toEqual([]);
});
