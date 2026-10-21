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
