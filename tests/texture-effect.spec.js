// 2.9.0: texture and colour grade are effects only. The Texture effect carries Type, Strength, Scale and Light from; the old tools are gone.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, addShape } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const sheetOf = d => (d.els || []).find(q => q.k === 'shape');
const addEffect = async (page, kind, label) => {
  await page.locator(`.fxg[data-fxk="${kind}"] .fxadd`).scrollIntoViewIfNeeded();
  await page.click(`.fxg[data-fxk="${kind}"] .fxadd`);
  await page.locator('.rowm .ddi', { hasText: label }).first().click();
  await settle(page);
};
const setRange = (page, sel, v) => page.evaluate(([s, v]) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);

test('the Texture effect has Type, Strength, Scale and Light from, and each effect keeps its own settings', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page); await settle(page);
  await addEffect(page, 'shape', 'Texture');
  await addEffect(page, 'shape', 'Texture');
  const g = '.fxg[data-fxk="shape"]';
  for (const c of ['.fxst', '.fxsa', '.fxsc', '.fxsz']) await expect(page.locator(`${g} ${c}`)).toHaveCount(1);
  for (const c of ['.fxsa', '.fxsc', '.fxsz']) await expect(page.locator(`${g} ${c}`)).toBeVisible();
  const opts = await page.locator(`${g} .fxst option`).evaluateAll(o => o.map(x => x.value));
  const pick = opts[opts.length - 1];
  await page.evaluate(([s, v]) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, [`${g} .fxst`, pick]);
  await setRange(page, `${g} .fxsa`, 77); await setRange(page, `${g} .fxsc`, 150); await setRange(page, `${g} .fxsz`, 90);
  await settle(page);
  const d = await st(page), fx = sheetOf(d).fx;
  expect(fx.length).toBe(2);
  expect(fx[0].x).not.toBe(fx[1].x);   // a private library entry each
  const L = id => d.texLib.find(x => x.id === id);
  expect(L(fx[1].x)).toMatchObject({ t: pick, a: 77, sc: 150, az: 90 });
  expect(L(fx[0].x).a).not.toBe(77);
  expect(errors).toEqual([]);
});

test('Variations, Presets, Workspaces, Navigator, Textures and Grade are no longer tools', async ({ page }) => {
  const { errors } = await openApp(page);
  for (const id of ['vars', 'pres', 'wspc', 'nav', 'tex', 'grade']) await expect(page.locator(`.rail [data-pn="${id}"]`)).toHaveCount(0);
  const cmds = await page.evaluate(() => window.__wbTest.commands.list().map(c => c.label));
  for (const n of ['Variations', 'Presets', 'Workspaces', 'Navigator', 'Textures', 'Colour grading']) expect(cmds).not.toContain('Open ' + n);
  expect(errors).toEqual([]);
});

// 2.27.0: a texture keeps its size in canvas units when the element is made bigger or smaller.
test('a Shape\'s texture does not scale with the Shape: the same feature size at half and at double the width', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  await addShape(page); await settle(page);
  await addEffect(page, 'shape', 'Texture');
  const s0 = await st(page), p0 = s0.els.find(q => q.k === 'shape' && q.nm !== 'Background');
  const feature = async w => {
    const s = JSON.parse(JSON.stringify(s0)); const p = s.els.find(q => q.u === p0.u); p.s = w; p.wy = 1; p.fx.forEach(e => { e.md = 'wear'; });
    await page.evaluate(j => window.__wbTest.apply(j), JSON.stringify(s)); await settle(page);
    return page.evaluate(async () => {
      const imgs = [...document.querySelectorAll('#txd image[href^="data:image/png"]')], im = imgs[imgs.length - 1];
      if (!im) return null;
      const img = new Image(); img.src = im.getAttribute('href'); await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data; let runs = 0, n = 0;
      for (let j = 0; j < c.height; j++) { let prev = false; for (let i = 0; i < c.width; i++) { const a = d[(j * c.width + i) * 4 + 3] > 100; if (a && !prev) runs++; if (a) n++; prev = a; } }
      const wUnits = +im.getAttribute('width');
      return { runsPerUnit: runs / c.height / wUnits, wUnits };
    });
  };
  const a = await feature(120), b = await feature(240);
  expect(a && b, 'the texture picture was found').toBeTruthy();
  const ratio = b.runsPerUnit / a.runsPerUnit;
  expect(ratio, 'features per canvas unit stay about the same (they would halve if the texture scaled): ' + JSON.stringify([a, b])).toBeGreaterThan(0.7);
  expect(ratio).toBeLessThan(1.4);
  expect(errors).toEqual([]);
});
