// 2.104.2 (owner Nov 5 2026, docs/group-panel-plan.md step 2: "Yes one combined effect"): the Group panel has Effects. They are drawn over the group's members drawn
// together (one filter round the group, not one per member), are kept on the group, show in exports, and go with Ungroup; the members keep their own.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const els = async page => JSON.parse(await H.getState(page)).els;
const openAdd = async page => { await page.locator('.fxg[data-fxk="group"] .fxadd').scrollIntoViewIfNeeded(); await page.click('.fxg[data-fxk="group"] .fxadd'); await expect(page.locator('.rowm').first()).toBeVisible(); };
const png = async page => { await page.evaluate(() => { window.__wbDownloads.length = 0; }); await page.click('#xrnow'); await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 60000 });
  return page.evaluate(async () => { const b = atob(window.__wbDownloads[0].base64), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0); const d = g.getImageData(0, 0, bm.width, bm.height).data;
    let soft = 0; for (let i = 3; i < d.length; i += 4 * 7) { const v = d[i - 3]; if (v > 30 && v < 225) soft++; } return soft; }); };   // pixels part way between ink and paper: edges, more of them when blurred

async function grouped(page) {
  const r = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), m = s.els.find(q => q.k === 'motif' && !q.bgd);
    s.els = [...s.els.filter(q => q.k !== 'motif' || q.bgd), { ...m, u: 'ma', n: 'm:a', x: 300, y: 300, s: 120, r: 0, ink: 'c0' }, { ...m, u: 'mb', n: 'm:b', x: 600, y: 450, s: 120, r: 0, ink: 'c0', fx: [{ u: 'own', k: 'grade', on: true, ex: 20 }] }];
    window.__wbTest.apply(JSON.stringify(s)); window.__wbTest.resetHistory(); });
  await H.settle(page);
  await H.openPanel(page, 'lyrs');
  await page.locator('#lybody .lyr[data-u="ma"]').first().click({ position: { x: 60, y: 10 } });
  await page.locator('#lybody .lyr[data-u="mb"]').first().click({ position: { x: 60, y: 10 }, modifiers: ['Shift'] }); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('element.group')); await H.settle(page);
  const G = (await els(page)).find(q => q.k === 'group');
  await page.locator(`#lybody .lyr[data-u="${G.u}"]`).first().click({ position: { x: 60, y: 10 } }); await H.settle(page);
  return { ...r, G };
}

test('the Group panel has Effects: the same list as an element’s, without Pressure offset and Jitter; a blur is one filter round the whole group', async ({ page }) => {
  const { errors, G } = await grouped(page);
  await expect(page.locator('section.pn[data-p="group"] .fxg[data-fxk="group"]')).toBeVisible();
  await openAdd(page);
  const top = (await page.locator('.rowm:not(.rowsub) .ddi').allInnerTexts()).map(t => t.replace(/\s*›\s*$/, '').trim());
  expect(top).toEqual(['Texture', 'Colour grade', 'Noise', 'Blur', 'Print', 'Distort']);
  await page.locator('.rowm .ddi', { hasText: 'Blur' }).first().hover(); await page.locator('.rowsub .ddi', { hasText: 'Gaussian Blur' }).click(); await H.settle(page);
  const g = (await els(page)).find(q => q.k === 'group');
  expect(g.fx.map(e => e.k)).toEqual(['blur']);
  // one filter for the group, wrapping both members
  const f = await page.evaluate(() => { const fs = [...document.querySelectorAll('#art filter[id^="gfx"]')]; const w = fs.length ? document.querySelector(`#art [filter="url(#${fs[0].id})"]`) : null;
    return { n: fs.length, wraps: w ? w.querySelectorAll('[data-mv]').length : 0 }; });
  expect(f.n).toBe(1); expect(f.wraps).toBe(2);   // both members inside the one filter
  // its eye turns it off: no filter
  await page.locator('.fxg[data-fxk="group"] .fxl [data-fon]').first().click(); await H.settle(page);
  expect(await page.locator('#art filter[id^="gfx"]').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('a group’s blur shows in the exported PNG; Ungroup drops the group’s effect and the members keep their own', async ({ page }) => {
  const { errors } = await grouped(page);
  await H.openPanel(page, 'xrec'); await page.click('#xrf [data-f="png"]');
  const sharp = await png(page);
  await H.openPanel(page, 'lyrs'); const G = (await els(page)).find(q => q.k === 'group');
  await page.locator(`#lybody .lyr[data-u="${G.u}"]`).first().click({ position: { x: 60, y: 10 } }); await H.settle(page);
  await openAdd(page); await page.locator('.rowm .ddi', { hasText: 'Blur' }).first().hover(); await page.locator('.rowsub .ddi', { hasText: 'Gaussian Blur' }).click(); await H.settle(page);
  await H.openPanel(page, 'xrec');
  const soft = await png(page);
  expect(soft).toBeGreaterThan(sharp * 1.5);   // the edges are soft
  await page.evaluate(() => window.__wbTest.commands.run('element.ungroup')); await H.settle(page);
  const e = await els(page);
  expect(e.some(q => q.k === 'group')).toBe(false);
  expect(e.find(q => q.u === 'mb').fx.map(x => x.k)).toEqual(['grade']);   // the member's own effect stays
  expect(await page.locator('#art filter[id^="gfx"]').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('every effect a group offers draws on the group: Texture, Colour grade and each filter effect', async ({ page }) => {
  test.setTimeout(240000);
  const { errors, G } = await grouped(page);
  const items = [['', 'Texture'], ['', 'Colour grade']];
  await openAdd(page);
  for (const grp of ['Noise', 'Blur', 'Print', 'Distort']) { await page.locator('.rowm .ddi', { hasText: grp }).first().hover(); for (const t of await page.locator('.rowsub .ddi').allInnerTexts()) items.push([grp, t.trim()]); }
  await page.keyboard.press('Escape');
  expect(items.length).toBe(18);   // Texture, Colour grade and the 16 filter effects
  const bad = [];
  for (const [grp, label] of items) {
    await page.evaluate(u => { const s = JSON.parse(window.__wbTest.state()); s.els.find(q => q.u === u).fx = []; window.__wbTest.apply(JSON.stringify(s)); }, G.u); await H.settle(page);
    await page.locator(`#lybody .lyr[data-u="${G.u}"]`).first().click({ position: { x: 60, y: 10 } }); await H.settle(page);
    await openAdd(page);
    if (grp) { await page.locator('.rowm .ddi', { hasText: grp }).first().hover(); await page.locator('.rowsub .ddi', { hasText: label }).first().click(); }
    else await page.locator('.rowm:not(.rowsub) .ddi', { hasText: label }).first().click();
    await H.settle(page, { max: 30000 });
    if (label === 'Colour grade') { await page.evaluate(u => { const s = JSON.parse(window.__wbTest.state()); s.els.find(q => q.u === u).fx[0].ex = 30; window.__wbTest.apply(JSON.stringify(s)); }, G.u); await H.settle(page); }   // a new grade changes nothing (and so draws nothing) until a slider moves
    const on = await page.evaluate(() => [...document.querySelectorAll('#art [filter^="url(#gfx"], #art [mask^="url(#gfx"]')].some(w => w.querySelectorAll('[data-mv]').length === 2));
    if (!on) bad.push(label);
  }
  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
});
