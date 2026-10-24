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
const ALL = [['Noise', 'Add Noise', 'noise'], ['Noise', 'Film Grain', 'grain'], ['Noise', 'Dust & Scratches', 'dust'], ['Blur', 'Gaussian Blur', 'blur'], ['Blur', 'Motion Blur', 'motion'], [null, 'Halftone', 'halftone']];

test('the Add effect menu groups Noise and Blur in flyouts; Halftone sits on its own', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  await openAdd(page, 'motif');
  const top = await page.locator('.rowm:not(.rowsub) .ddi').allInnerTexts();
  expect(top.map(t => t.replace(/\s*›\s*$/, '').trim())).toEqual(['Texture', 'Jitter', 'Colour grade', 'Noise', 'Blur', 'Halftone']);
  await expect(page.locator('.rowsub')).toHaveCount(0);
  await page.locator('.rowm .ddi', { hasText: 'Noise' }).first().hover();
  await expect(page.locator('.rowsub .ddi')).toHaveText(['Add Noise', 'Film Grain', 'Dust & Scratches']);
  // moving to a plain item closes the flyout; Blur opens its own
  await page.locator('.rowm .ddi', { hasText: 'Jitter' }).first().hover();
  await expect(page.locator('.rowsub')).toHaveCount(0);
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
  const art = await page.evaluate(() => { const a = document.getElementById('art'), fs = [...a.querySelectorAll('filter')].map(f => f.innerHTML); return { turb: fs.filter(h => h.includes('feTurbulence')).length, blur: fs.filter(h => /feGaussianBlur in="SourceGraphic" stdDeviation="[\d.]+"\/?>/.test(h)).length, motion: fs.filter(h => /stdDeviation="[\d.]+ 0"/.test(h)).length, tile: fs.filter(h => h.includes('feTile')).length, turned: a.querySelectorAll('g[transform^="rotate"] > g[filter] > g[transform^="rotate"]').length }; });
  expect(art.turb).toBeGreaterThanOrEqual(3);
  expect(art.blur).toBeGreaterThanOrEqual(1);
  expect(art.motion).toBeGreaterThanOrEqual(1);
  expect(art.tile).toBeGreaterThanOrEqual(1);
  expect(art.turned).toBeGreaterThanOrEqual(2);   // Motion Blur and Halftone work in a turned frame
  // switched off, an effect draws nothing
  const before = await page.evaluate(() => document.querySelectorAll('#art filter feTile').length);
  await page.locator('.fxg[data-fxk="motif"] [data-fu]').nth(5).locator('[data-fon]').click(); await settle(page);
  expect(await page.evaluate(() => document.querySelectorAll('#art filter feTile').length)).toBe(before - 1);
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
  await addFx(page, 'text', null, 'Halftone');
  await addFx(page, 'text', 'Noise', 'Film Grain');
  let d = await st(page);
  expect((d.els.find(q => q.k === 'text').fx || []).map(e => e.k)).toEqual(['halftone', 'grain']);
  await addPattern(page);   // a pattern that prints a stamp
  if (!(await page.locator('.fxg[data-fxk="pattern"]').isVisible())) await openPanel(page, 'layers');
  await expect(page.locator('.fxg[data-fxk="pattern"]')).toBeVisible();
  const n0 = await page.evaluate(() => document.querySelectorAll('#art filter feGaussianBlur').length);
  await addFx(page, 'pattern', 'Blur', 'Gaussian Blur');
  d = await st(page);
  expect((d.els.filter(q => q.k === 'pattern').pop().fx || []).map(e => e.k)).toEqual(['blur']);
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
    await page.locator('#xrl .xrr', { hasText: 'Preview' }).locator('[data-act="exp"]').click();
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
