// 2.79.2 (owner Oct 31 2026, docs/small-updates-plan.md step 2): the wheel and quick tooltips.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));
const val = (page, id) => page.evaluate(id => +document.getElementById(id).value, id);
const shape = async page => (await st(page)).els.find(e => e.k === 'motif' && !e.bgd);
const wheel = async (page, key, dy, n = 1) => { if (key) await page.keyboard.down(key); for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy); await page.waitForTimeout(30); } if (key) await page.keyboard.up(key); await page.waitForTimeout(500); await H.settle(page); };
// the screen point of a canvas point
const scr = (page, x, y) => page.evaluate(([x, y]) => { const a = document.getElementById('art'), p = a.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(a.getScreenCTM()); return [q.x, q.y]; }, [x, y]);

test('Alt + wheel sizes and Shift + wheel turns the shape on the cursor, then the selected one under the pointer, one History step each', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
  await page.click('#elb [data-k="motif"]'); await H.settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  const s0 = await val(page, 'lfps'), r0 = await val(page, 'lfpr');
  await wheel(page, 'Alt', -100, 3);
  expect(await val(page, 'lfps'), 'bigger').toBeGreaterThan(s0);
  await wheel(page, 'Shift', -100, 2);
  expect(await val(page, 'lfpr'), 'turned two notches').toBe(r0 + 10);
  const s1 = await val(page, 'lfps');
  await H.placeArmed(page, 'motif');
  let q = await shape(page);
  expect(q.r).toBe(r0 + 10);
  // the placed shape, selected, under the pointer
  await page.keyboard.press('Escape'); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('edit.selectAll')); await H.settle(page);
  q = await shape(page);
  const h0 = (await page.evaluate(() => window.__wbTest.histLabels())).length;
  const [px, py] = await scr(page, q.x, q.y);
  await page.mouse.move(px, py);
  await wheel(page, 'Alt', 100, 2);
  const q2 = await shape(page);
  expect(q2.s, 'smaller').toBeLessThan(q.s);
  expect((await page.evaluate(() => window.__wbTest.histLabels())).length, 'one History step').toBe(h0 + 1);
  // the pointer off it: the wheel leaves it alone
  await page.mouse.move(b.x + 4, b.y + 4);
  await wheel(page, 'Shift', 100, 2);
  expect((await shape(page)).r).toBe(q2.r);
  expect(s1).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('in a stamp\'s tab Alt + wheel sizes the library shape on the cursor', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
  await H.addStamp(page); await H.unlockStamp(page, 0); await H.settle(page);
  await H.pickShape(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * .4, b.y + b.height * .4);
  const s0 = await val(page, 'ssz'), r0 = await val(page, 'srt');
  await wheel(page, 'Alt', -100, 2);
  expect(await val(page, 'ssz')).toBeGreaterThan(s0);
  await wheel(page, 'Shift', 100, 1);
  expect(await val(page, 'srt')).toBe(r0 - 5);
  expect(errors).toEqual([]);
});

test('the wheel moves a zoomed canvas, Shift across, Ctrl zooms; with nothing on the cursor Alt and Shift change nothing', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
  await H.addShape(page); await page.keyboard.press('Escape'); await page.evaluate(() => window.__wbTest.commands.run('edit.deselect')); await H.settle(page);
  const a = await H.getState(page);
  await page.evaluate(() => { for (let i = 0; i < 6; i++) window.__wbTest.commands.run('view.zoomIn'); }); await H.settle(page);
  const b = await page.locator('#boardP').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  const pos = () => page.evaluate(() => { const e = document.getElementById('boardP'); return [e.scrollLeft, e.scrollTop]; });
  const p0 = await pos();
  await wheel(page, null, 120);
  const p1 = await pos();
  expect(p1[1], 'down').toBeGreaterThan(p0[1]);
  await wheel(page, 'Shift', 120);
  expect((await pos())[0], 'across').not.toBe(p1[0]);
  const z0 = await page.locator('#zl').textContent();
  await wheel(page, 'Control', -120);
  expect(await page.locator('#zl').textContent(), 'zoomed').not.toBe(z0);
  await wheel(page, 'Alt', -120, 2);
  expect(await H.getState(page), 'the document').toBe(a);
  expect(errors).toEqual([]);
});

test('an icon button\'s name shows in a quick tip; the native title is lifted while it shows and back after', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
  const zi = page.locator('#undo'), zo = page.locator('#hstb');
  await zi.hover();
  await expect(page.locator('.wbtip')).toBeVisible({ timeout: 1000 });
  await expect(page.locator('.wbtip')).toHaveText('Undo (Ctrl+Z)');
  expect(await zi.getAttribute('title'), 'no native tip on top').toBe(null);
  await zo.hover();
  await expect(page.locator('.wbtip')).toHaveText('History', { timeout: 200 });   // moving on: at once
  expect(await zi.getAttribute('title')).toBe('Undo (Ctrl+Z)');
  await page.mouse.move(2, 400); await page.waitForTimeout(100);
  await expect(page.locator('.wbtip')).toBeHidden();
  expect(await zo.getAttribute('title')).toBe('History');
  expect(errors).toEqual([]);
});
