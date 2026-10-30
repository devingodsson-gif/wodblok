// 2.35.0: Noise › (Add Noise, Film Grain, Dust & Scratches), Blur › (Gaussian Blur, Motion Blur) and Halftone in the Add effect menu.
// Noise and Blur are flyouts: hover, click, Enter or Right Arrow opens one. Each effect is one SVG filter on the element, chained with the others in list order.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, addShape, addKind, addPattern } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const shapeOf = d => (d.els || []).find(q => q.k === 'motif' && !q.bgd);
const openAdd = async (page, kind) => {
  await page.locator(`.fxg[data-fxk="${kind}"] .fxadd`).scrollIntoViewIfNeeded();
  await page.click(`.fxg[data-fxk="${kind}"] .fxadd`);
  await expect(page.locator('.rowm').first()).toBeVisible();
};
const addFx = async (page, kind, grp, label) => {
  await openAdd(page, kind);
  if (grp) { await page.locator('.rowm .ddi', { hasText: grp }).first().hover(); await page.locator('.rowsub .ddi', { hasText: label }).click(); }
  else await page.locator('.rowm:not(.rowsub) .ddi', { hasText: label }).first().click();
  await settle(page);
};
const ALL = [['Noise', 'Add Noise', 'noise'], ['Noise', 'Film Grain', 'grain'], ['Noise', 'Dust & Scratches', 'dust'], ['Blur', 'Gaussian Blur', 'blur'], ['Blur', 'Motion Blur', 'motion'], ['Print', 'Halftone', 'halftone'], ['Print', 'Line Screen', 'lines'], ['Print', 'Stipple', 'stipple'], ['Print', 'Ink Bleed', 'bleed'], ['Print', 'Misregistration', 'misreg'], ['Print', 'Threshold', 'thresh'], ['Distort', 'Roughen', 'rough'], ['Distort', 'Ripple', 'ripple'], ['Distort', 'Wobble', 'wobble'], ['Distort', 'Warp', 'warp'], ['Distort', 'Slip', 'slip']];

test('the Add effect menu groups Noise and Blur in flyouts; Print and Distort too', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  await openAdd(page, 'motif');
  const top = await page.locator('.rowm:not(.rowsub) .ddi').allInnerTexts();
  expect(top.map(t => t.replace(/\s*›\s*$/, '').trim())).toEqual(['Texture', 'Jitter', 'Colour grade', 'Noise', 'Blur', 'Print', 'Distort']);
  await expect(page.locator('.rowsub')).toHaveCount(0);
  await page.locator('.rowm .ddi', { hasText: 'Noise' }).first().hover();
  await expect(page.locator('.rowsub .ddi')).toHaveText(['Add Noise', 'Film Grain', 'Dust & Scratches']);
  // moving to a plain item closes the flyout; Blur opens its own
  await page.locator('.rowm .ddi', { hasText: 'Jitter' }).first().hover();
  await expect(page.locator('.rowsub')).toHaveCount(0);
  await page.locator('.rowm .ddi', { hasText: 'Print' }).first().hover();
  await expect(page.locator('.rowsub .ddi')).toHaveText(['Halftone', 'Line Screen', 'Stipple', 'Ink Bleed', 'Misregistration', 'Threshold']);
  await page.locator('.rowm .ddi', { hasText: 'Distort' }).first().hover();
  await expect(page.locator('.rowsub .ddi')).toHaveText(['Roughen', 'Ripple', 'Wobble', 'Warp', 'Slip']);
  await page.locator('.rowm .ddi', { hasText: 'Blur' }).first().click();
  await expect(page.locator('.rowsub .ddi')).toHaveText(['Gaussian Blur', 'Motion Blur']);
  await page.locator('.rowsub .ddi', { hasText: 'Motion Blur' }).click(); await settle(page);
  await expect(page.locator('.rowm')).toHaveCount(0);
  expect(shapeOf(await st(page)).fx.map(e => e.k)).toEqual(['motion']);
  expect(errors).toEqual([]);
});

test('the flyout works from the keyboard: Right Arrow opens, Left Arrow goes back, Enter adds', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  await openAdd(page, 'motif');
  await page.locator('.rowm .ddi', { hasText: 'Noise' }).first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.rowsub .ddi').first()).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.rowsub')).toHaveCount(0);
  await expect(page.locator('.rowm .ddi', { hasText: 'Noise' }).first()).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.rowsub .ddi', { hasText: 'Film Grain' })).toBeFocused();
  await page.keyboard.press('Enter'); await settle(page);
  expect(shapeOf(await st(page)).fx.map(e => e.k)).toEqual(['grain']);
  expect(errors).toEqual([]);
});

test('each effect draws its filter on a Shape, and they chain in list order', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  for (const [g, l] of ALL) await addFx(page, 'motif', g, l);
  const fx = shapeOf(await st(page)).fx;
  expect(fx.map(e => e.k)).toEqual(ALL.map(a => a[2]));
  expect(fx[0]).toMatchObject({ amt: 25, sz: 20, dist: 'gauss', mono: true });
  expect(typeof fx[0].sd).toBe('number');
  expect(fx[5]).toMatchObject({ sz: 30, tone: 55, ang: 45, spr: 40 });
  expect(fx[6]).toMatchObject({ k: 'lines', ang: 45 });
  expect(fx[8]).toMatchObject({ k: 'bleed', amt: 20, rag: 30, soft: 30 });
  expect(fx[9]).toMatchObject({ k: 'misreg', col: '#00aeef', amt: 25 });
  const art = await page.evaluate(() => { const a = document.getElementById('art'), fs = [...a.querySelectorAll('filter')].map(f => f.innerHTML); return { turb: fs.filter(h => h.includes('feTurbulence')).length, blur: fs.filter(h => /feGaussianBlur in="SourceGraphic" stdDeviation="[\d.]+"\/?>/.test(h)).length, motion: fs.filter(h => /stdDeviation="[\d.]+ 0"/.test(h)).length, tile: fs.filter(h => h.includes('feTile')).length, turned: a.querySelectorAll('g[transform^="rotate"] > g[filter] > g[transform^="rotate"]').length }; });
  expect(art.turb).toBeGreaterThanOrEqual(3);
  expect(art.blur).toBeGreaterThanOrEqual(1);
  expect(art.motion).toBeGreaterThanOrEqual(1);
  expect(art.tile).toBeGreaterThanOrEqual(3);   // Halftone, Line Screen and Ripple tile a cell
  expect(await page.evaluate(() => { const f = [...document.querySelectorAll('#art filter')].map(x => x.innerHTML); return [f.some(h => h.includes('feMorphology')), f.some(h => h.includes('feOffset')), f.filter(h => h.includes('feDisplacementMap')).length]; })).toEqual([true, true, 6]);   // Ink Bleed, Misregistration, and Ink Bleed + Roughen + Ripple + Wobble + Warp + Slip displace
  expect(art.turned).toBeGreaterThanOrEqual(4);   // Motion Blur, Halftone, Line Screen and Ripple work in a turned frame
  // switched off, an effect draws nothing
  const before = await page.evaluate(() => document.querySelectorAll('#art filter feTile').length);
  await page.locator('.fxg[data-fxk="motif"] [data-fu]').nth(5).locator('[data-fon]').click(); await settle(page);
  expect(await page.evaluate(() => document.querySelectorAll('#art filter feTile').length)).toBe(before - 1);   // Halftone is off
  expect(errors).toEqual([]);
});

test('settings: sliders, menus, checkboxes and Reroll change the effect; Undo brings it back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  await addFx(page, 'motif', 'Noise', 'Add Noise');
  const pane = page.locator('.fxg[data-fxk="motif"] .fxs[data-e="noise"]');
  await expect(pane).toBeVisible();
  await pane.locator('[data-q="amt"]').fill('70'); await settle(page);
  await pane.locator('[data-q="dist"]').evaluate(el => { el.value = 'unif'; el.dispatchEvent(new Event('change', { bubbles: true })); }); await settle(page);
  await pane.locator('[data-q="mono"]').uncheck(); await settle(page);
  let e = shapeOf(await st(page)).fx[0];
  expect(e).toMatchObject({ amt: 70, dist: 'unif', mono: false });
  const sd = e.sd;
  await pane.locator('[data-qrr]').click(); await settle(page);
  expect(shapeOf(await st(page)).fx[0].sd).not.toBe(sd);
  await page.keyboard.press('Control+z'); await settle(page);
  expect(shapeOf(await st(page)).fx[0].sd).toBe(sd);
  // another effect's pane shows its own values
  await addFx(page, 'motif', 'Blur', 'Motion Blur');
  const mp = page.locator('.fxg[data-fxk="motif"] .fxs[data-e="motion"]');
  await expect(mp).toBeVisible(); await expect(pane).toBeHidden();
  await mp.locator('[data-q="ang"]').fill('90'); await settle(page);
  expect(shapeOf(await st(page)).fx[1]).toMatchObject({ k: 'motion', ang: 90, amt: 20 });
  expect(errors).toEqual([]);
});

test('text and a pattern take the new effects too', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'text');
  await addKind(page, 'text');
  await addFx(page, 'text', 'Print', 'Halftone');
  await addFx(page, 'text', 'Noise', 'Film Grain');
  let d = await st(page);
  expect((d.els.find(q => q.k === 'text').fx || []).map(e => e.k)).toEqual(['halftone', 'grain']);
  await addPattern(page);   // a pattern that prints a stamp
  if (!(await page.locator('.fxg[data-fxk="pattern"]').isVisible())) await openPanel(page, 'layers');
  await expect(page.locator('.fxg[data-fxk="pattern"]')).toBeVisible();
  const n0 = await page.evaluate(() => document.querySelectorAll('#art filter feGaussianBlur').length);
  await addFx(page, 'pattern', 'Blur', 'Gaussian Blur');
  d = await st(page);
  expect((d.els.find(q => q.k === 'pattern').fx || []).map(e => e.k)).toEqual(['blur']);   // 2.76.8: the newest Pattern is the first, just above the Background
  expect(await page.evaluate(() => document.querySelectorAll('#art filter feGaussianBlur').length)).toBeGreaterThan(n0);
  expect(errors).toEqual([]);
});

test('a Halftone shape exports as dots: less ink than the plain shape, but not none', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  const d = await st(page); const q = shapeOf(d); q.s = (+q.s || 100) * 5;
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await settle(page);
  const ink = async () => {
    await page.evaluate(() => { window.__wbDownloads.length = 0; });
    await openPanel(page, 'xrec');
    await page.locator('#xrl .lib > div', { hasText: 'Preview' }).locator('.rcact').click();
    await page.waitForFunction(() => window.__wbDownloads.length > 0);
    return page.evaluate(async () => {
      const x = window.__wbDownloads[0], bin = atob(x.base64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
      const bm = await createImageBitmap(new Blob([u], { type: x.type })), c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
      const p = g.getImageData(0, 0, bm.width, bm.height).data; let n = 0; for (let i = 0; i < p.length; i += 4) if (p[i] + p[i + 1] + p[i + 2] < 300) n++; return n;
    });
  };
  const plain = await ink();
  expect(plain).toBeGreaterThan(1000);
  await openPanel(page, 'motifs');
  const d2 = await st(page); shapeOf(d2).fx = [{ u: 'ht1', k: 'halftone', on: true, sz: 30, tone: 55, ang: 45, spr: 40 }];
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d2)); await settle(page);
  const dots = await ink();
  expect(dots).toBeGreaterThan(plain * 0.1);
  expect(dots).toBeLessThan(plain * 0.85);
  expect(errors).toEqual([]);
});

test('Print and Distort effects change what is drawn, and Misregistration offsets a second copy', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  const d = await st(page); const q = shapeOf(d); q.s = (+q.s || 100) * 5;
  await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await settle(page);
  const ink = async () => {
    await page.evaluate(() => { window.__wbDownloads.length = 0; });
    if (await page.locator('section.pn[data-p="xrec"]:not([hidden])').count() === 0) await openPanel(page, 'xrec');
    await page.locator('#xrl .lib > div', { hasText: 'Preview' }).locator('.rcact').click();
    await page.waitForFunction(() => window.__wbDownloads.length > 0);
    return page.evaluate(async () => {
      const x = window.__wbDownloads[0], bin = atob(x.base64), u = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) u[k] = bin.charCodeAt(k);
      const bm = await createImageBitmap(new Blob([u], { type: x.type })), c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d'); g.drawImage(bm, 0, 0);
      const p = g.getImageData(0, 0, bm.width, bm.height).data; let dark = 0, cyan = 0, where = 0; for (let i = 0; i < p.length; i += 4) { if (p[i] + p[i + 1] + p[i + 2] < 300) { dark++; where = (where + i * 31) % 1000003; } if (p[i] < 60 && p[i + 1] > 140 && p[i + 2] > 200) cyan++; } return { dark, cyan, where };
    });
  };
  const plain = await ink();
  const fxs = { lines: { k: 'lines', sz: 25, tone: 55, ang: 45, spr: 40 }, stipple: { k: 'stipple', sz: 20, den: 55, spr: 80, sd: 5 }, bleed: { k: 'bleed', amt: 40, rag: 0, soft: 30, sd: 5 }, misreg: { k: 'misreg', amt: 40, ang: 0, col: '#00aeef' }, rough: { k: 'rough', amt: 40, sz: 30, sd: 5 }, ripple: { k: 'ripple', amt: 40, wl: 30, ang: 0 }, wobble: { k: 'wobble', amt: 40, sz: 40, sd: 5 }, warp: { k: 'warp', amt: 40, sz: 50, sd: 5 }, slip: { k: 'slip', amt: 40, bh: 30, ang: 0, sd: 5 } };
  const got = {};
  for (const [name, f] of Object.entries(fxs)) {
    const d2 = await st(page); shapeOf(d2).fx = [{ u: 'e1', on: true, ...f }];
    await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d2)); await settle(page);
    got[name] = await ink();
  }
  expect(got.lines.dark).toBeLessThan(plain.dark * 0.9);       // lines leave gaps
  expect(got.lines.dark).toBeGreaterThan(plain.dark * 0.1);
  expect(got.stipple.dark).toBeLessThan(plain.dark);           // the edge dissolves
  expect(got.stipple.dark).toBeGreaterThan(plain.dark * 0.7);
  expect(got.bleed.dark).toBeGreaterThan(plain.dark * 1.02);   // the ink swells
  expect(plain.cyan).toBe(0);
  expect(got.misreg.cyan).toBeGreaterThan(50);                 // a cyan second copy shows beside the ink
  expect(got.rough.dark).not.toBe(plain.dark);
  expect(got.ripple.where).not.toBe(plain.where);   // a ripple moves ink sideways to the wave, so the amount stays and the places change
  for (const k of ['wobble', 'warp', 'slip']) expect(got[k].where, k + ' moves the ink').not.toBe(plain.where);   // 2.68.0
  expect(errors).toEqual([]);
});
