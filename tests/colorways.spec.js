const { test, expect } = require('@playwright/test');
const { TARGET, openApp } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'Colorways core is new in the modular build'); });

test('colorway core normalizes saved palettes and detects palette edits', async ({ page }) => {
  const { errors } = await openApp(page);
  const result = await page.evaluate(() => {
    const api = window.__wbTest.colorways;
    const core = { proj: { bg: '#FFFFFF', ink: '#111111', c3: '#CC0000' } };
    const saved = api.capture('Warm print', 'cw-warm');
    const clean = api.normalize([saved, null, { id: 'bad', name: 'Bad', colors: { bg: 'red', ink: '#000000' } }]);
    return {
      saved, clean,
      unchanged: api.isModified(core, saved),
      changed: api.isModified({ proj: { ...core.proj, bg: '#EEEEDD' } }, saved),
      max: api.max
    };
  });
  expect(result.saved).toEqual({ id: 'cw-warm', name: 'Warm print', colors: { bg: '#FFFFFF', ink: '#111111', c3: '#CC0000' } });
  expect(result.clean).toEqual([result.saved]);
  expect(result.unchanged).toBe(false);
  expect(result.changed).toBe(true);
  expect(result.max).toBe(60);
  expect(errors).toEqual([]);
});

test('applying a colorway remaps palette inks without changing the composition', async ({ page }) => {
  const { errors } = await openApp(page);
  const result = await page.evaluate(() => {
    const api = window.__wbTest.colorways;
    const core = {
      tiles: [{ id: 1, ink: '#111111', items: [{ m: 'shape-a', x: 10, y: 20 }] }],
      layers: [{ id: 'layer-a', ink: '#CC0000', opacity: 80 }],
      proj: { bg: '#FFFFFF', ink: '#111111', c3: '#CC0000' },
      dim: { s: [1, 1], c: [2, 3] }, pr: { e: 0 }, tex: { u: [] },
      colorways: [], activeColorway: null
    };
    const next = { id: 'cw-night', name: 'Night', colors: { bg: '#101010', ink: '#F5F0E6', c3: '#2A7F75' } };
    const applied = api.apply(core, next);
    return { applied, original: core };
  });
  expect(result.applied.proj).toEqual({ bg: '#101010', ink: '#F5F0E6', c3: '#2A7F75' });
  expect(result.applied.tiles[0].ink).toBe('#F5F0E6');
  expect(result.applied.layers[0].ink).toBe('#2A7F75');
  expect(result.applied.tiles[0].items).toEqual([{ m: 'shape-a', x: 10, y: 20 }]);
  expect(result.applied.layers[0].opacity).toBe(80);
  expect(result.applied.dim).toEqual(result.original.dim);
  expect(result.applied.activeColorway).toBe('cw-night');
  expect(result.original.proj.bg).toBe('#FFFFFF');
  expect(errors).toEqual([]);
});

test('saved colorways are part of the project state and the active id is undoable state', async ({ page }) => {
  const { errors } = await openApp(page);
  const state = await page.evaluate(() => {
    const api = window.__wbTest.colorways;
    api.setList([{ id: 'cw-paper', name: 'Paper', colors: { bg: '#FFFFFF', ink: '#202020' } }]);
    api.setActive('cw-paper');
    return JSON.parse(window.__wbTest.state());
  });
  expect(state.colorways).toEqual([{ id: 'cw-paper', name: 'Paper', colors: { bg: '#FFFFFF', ink: '#202020' } }]);
  expect(state.activeColorway).toBe('cw-paper');
  expect(errors).toEqual([]);
});
