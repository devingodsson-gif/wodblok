// 2.67.3: a Randomize roll leaves the Background solid: 100% opacity, no blend, and no Wear texture over the canvas (Wear knocks ink out of every layer, the Background too, so it showed through).
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState } = require('./helpers/harness');

test('rolls never give the canvas a Wear texture or the Background an opacity, blend or Wear', async ({ page }) => {
  test.setTimeout(240000);
  const { errors } = await openApp(page, { seed: 7, background: true });
  for (let i = 0; i < 5; i++) {
    await page.click('#rzdo'); await settle(page, { max: 90000 });
    const s = JSON.parse(await getState(page));
    expect(((s.tex || {}).u || []).map(u => u.md), `roll ${i}: canvas texture modes`).not.toContain('wear');
    const bg = (s.els || []).filter(q => q.bgd);
    expect(bg.length, `roll ${i}: the Background is still there`).toBe(1);
    expect(bg[0].op == null || bg[0].op === 100, `roll ${i}: Background opacity`).toBe(true);
    expect(bg[0].bl, `roll ${i}: Background blend`).toBeUndefined();
    expect((bg[0].fx || []).filter(e => e.md === 'wear'), `roll ${i}: Background Wear`).toEqual([]);
  }
  expect(errors).toEqual([]);
});
