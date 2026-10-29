// 2.76.3 (docs/pattern-plan.md step 0, the rest of docs/randomize-plan.md): the Randomize panel is a Look choice and nine switches (Background, Pattern, Focal point, Text,
// Frame, Colours, Effects, Finish, Canvas size); every roll is a Look; with no part on, a roll reworks what is there; a Look follows the switches.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, rzSet } = require('./helpers/harness');
const st = async page => JSON.parse(await getState(page));
const roll = async page => { await page.click('#rzdo'); await page.waitForTimeout(300); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };
const ALL = ['bg', 'pat', 'focal', 'text', 'frame', 'col', 'efx', 'fin', 'size'];

test('the panel is the Look choice and nine switches; Canvas size starts off; All off disables Randomize; a choice survives a reload', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'rand');
  expect(await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-rz]')].map(c => [c.dataset.rz, c.checked])))).toEqual({ bg: true, pat: true, focal: true, text: true, frame: true, col: true, efx: true, fin: true, size: false });
  await expect(page.locator('section.pn[data-p="rand"] .dd2').first()).toBeVisible();
  expect(await page.locator('section.pn[data-p="rand"] input[type="range"]').count()).toBe(0);   // no sliders, no sub-lists
  await page.click('#rznone'); await expect(page.locator('#rzdo')).toBeDisabled();
  await page.click('#rzall'); await expect(page.locator('#rzdo')).toBeEnabled();
  await rzSet(page, { frame: false });
  await page.reload(); await page.waitForFunction(() => document.fonts.status === 'loaded'); await settle(page);
  await openPanel(page, 'rand');
  expect(await page.evaluate(() => document.querySelector('[data-rz="frame"]').checked)).toBe(false);
  expect(errors).toEqual([]);
});

test('with every part off, a roll reworks what is there: the elements stay, the colours and the canvas ratio change', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 9, background: true });
  await openPanel(page, 'rand');
  await roll(page);                                         // something to rework
  await rzSet(page, { col: true, size: true }, true);
  const a = await st(page); await roll(page); const b = await st(page);
  expect(b.els.map(q => q.u)).toEqual(a.els.map(q => q.u));
  expect(JSON.stringify(b.proj)).not.toBe(JSON.stringify(a.proj));
  expect(JSON.stringify(b.dim.c)).not.toBe(JSON.stringify(a.dim.c));
  expect(errors).toEqual([]);
});

test('Pattern off: no Pattern in a roll that is not a frame or on a path; Text off: no words; Focal point off: fewer elements', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5, pattern: false });
  await openPanel(page, 'rand');
  await page.evaluate(() => window.__wbTest.kv.set('wb167_rzlook', 'poster'));
  await rzSet(page, { pat: false, text: false });
  for (let i = 0; i < 3; i++) { await roll(page); const s = await st(page);
    expect(s.els.filter(q => q.k === 'text').length, 'text off, roll ' + i).toBe(0);
    expect(s.els.filter(q => q.k === 'pattern' && !q.mp && !(q.lay === 'frame')).length, 'pattern off, roll ' + i).toBe(0); }
  expect(errors).toEqual([]);
});

test('Background off: a roll is on the flat paper; the Background is still one solid Sheet', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 6, pattern: false, background: true });
  await openPanel(page, 'rand');
  await rzSet(page, { bg: false });
  for (let i = 0; i < 4; i++) { await roll(page); const s = await st(page);
    expect(s.els.filter(q => q.k === 'sheet' && q.fl !== 'none' && q.fl !== undefined && !q.bgd).length, 'no ground sheet, roll ' + i).toBe(0);
    expect(s.els.filter(q => q.bgd).length).toBe(1); }
  expect(errors).toEqual([]);
});

test('on a repeat tile only a Look that tiles is made, with no filter effect; a Look needing a Pattern is not made with Pattern off', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 8, pattern: false });
  await openPanel(page, 'canvas'); await page.click('#cfmt [data-f="tile"]'); await settle(page);
  await page.evaluate(() => window.__wbTest.kv.set('wb167_rzlook', 'poster'));   // a Look that does not tile: a roll makes Repeat instead
  await openPanel(page, 'rand');
  for (let i = 0; i < 2; i++) { await roll(page); const s = await st(page);
    expect(s.els.some(q => q.k === 'pattern'), 'roll ' + i).toBe(true);
    expect(s.els.flatMap(q => (q.fx || []).map(e => e.k)).filter(k => !['pressure', 'jitter', 'texture', 'grade'].includes(k)), 'no filter effect on a tile').toEqual([]); }
  expect(errors).toEqual([]);
});

test('on a book cover the Look is on the front cover', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 7, pattern: false });
  await openPanel(page, 'canvas'); await page.click('#cfmt [data-f="book"]'); await settle(page, { max: 30000 });
  await openPanel(page, 'rand');
  const W = await page.evaluate(() => document.getElementById('art').viewBox.baseVal.width);
  for (let i = 0; i < 3; i++) { await roll(page); const s = await st(page);
    const xs = s.els.filter(q => q.x != null && q.k !== 'sheet' && !(q.k === 'pattern' && q.af)).map(q => +q.x);
    expect(Math.min(...xs) / W, 'roll ' + i).toBeGreaterThan(.5); }
  expect(errors).toEqual([]);
});
