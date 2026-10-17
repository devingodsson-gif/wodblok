// Grading sliders follow Undo and Redo: the slider, its number and the picture go back and forward together (1.35.0).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const val = (page, id) => page.evaluate(id => { const r = document.getElementById(id); return { v: +r.value, n: r._n ? +r._n.value : null }; }, id);
const move = async (page, id, v) => { await page.evaluate(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]); await page.waitForTimeout(700); };

for (const view of ['pattern', 'stamp']) {
  test(`${view}: a grading slider goes back on Undo and forward on Redo, with its number`, async ({ page }) => {
    const { errors } = await openApp(page, { seed: 4 });
    await setMode(page, view);
    await openPanel(page, 'grade');
    await settle(page);
    await move(page, 'gd_ex', 40);
    await move(page, 'gd_sat', -30);
    expect((await val(page, 'gd_ex')).v).toBe(40);
    await page.click('#undo'); await settle(page);
    expect(await val(page, 'gd_sat')).toEqual({ v: 0, n: 0 });
    expect((await val(page, 'gd_ex')).v).toBe(40);
    await page.click('#undo'); await settle(page);
    expect(await val(page, 'gd_ex')).toEqual({ v: 0, n: 0 });
    await page.click('#redo'); await settle(page);
    expect(await val(page, 'gd_ex')).toEqual({ v: 40, n: 40 });
    await page.click('#redo'); await settle(page);
    expect(await val(page, 'gd_sat')).toEqual({ v: -30, n: -30 });
    expect(errors).toEqual([]);
  });
}
