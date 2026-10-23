const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, noPattern, addShape } = require('./helpers/harness');
// 2.22.0: Ctrl+C / X / V on selected elements, and the right-click menu.
const shapes = async page => JSON.parse(await getState(page)).els.filter(q => q.k === 'motif' && !q.bgd);

test('copy then paste adds an offset copy and selects it; cut removes; paste after cut brings it back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page); await addShape(page); await settle(page);
  const s0 = (await shapes(page))[0];
  expect((await shapes(page)).length).toBe(1);
  const at = await page.evaluate(([x, y]) => { const a = document.getElementById('art'), p = a.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(a.getScreenCTM()); return [q.x, q.y]; }, [s0.x, s0.y]);
  await page.mouse.click(at[0], at[1]); await settle(page);
  await page.keyboard.press('Control+c'); await page.keyboard.press('Control+v'); await settle(page);
  const a = await shapes(page);
  expect(a.length, 'after paste').toBe(2);
  expect(a[1].x).toBeGreaterThan(a[0].x);
  await page.keyboard.press('Control+x'); await settle(page);
  expect((await shapes(page)).length, 'after cut').toBe(1);
  await page.keyboard.press('Control+v'); await settle(page);
  expect((await shapes(page)).length, 'after paste').toBe(2);
  expect(errors).toEqual([]);
});

test('right click on an element opens the menu; Duplicate and Delete work; Esc closes', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page); await addShape(page); await settle(page);
  const s = (await shapes(page))[0];
  const pt = await page.evaluate(([x, y]) => { const a = document.getElementById('art'), p = a.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(a.getScreenCTM()); return [q.x, q.y]; }, [s.x, s.y]);
  await page.mouse.click(pt[0], pt[1], { button: 'right' }); await settle(page);
  await expect(page.locator('#ctxm')).toBeVisible();
  await page.click('#ctxm [data-a="dup"]'); await settle(page);
  expect((await shapes(page)).length, 'duplicate').toBe(2);
  await page.mouse.click(pt[0], pt[1], { button: 'right' });
  await expect(page.locator('#ctxm')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#ctxm')).toBeHidden();
  await page.mouse.click(pt[0], pt[1], { button: 'right' });
  await page.click('#ctxm [data-a="del"]'); await settle(page);
  expect((await shapes(page)).length, 'delete').toBeLessThan(2);
  expect(errors).toEqual([]);
});
