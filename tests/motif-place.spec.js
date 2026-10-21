const { test, expect } = require('@playwright/test');
const { openApp, settle, getState } = require('./helpers/harness');
// 2.3.0: the Motif button makes a free Motif element at once (not inside a stamp); picking another library shape changes it; a click on the canvas makes another
const shapes = async page => JSON.parse(await getState(page)).els.filter(q => q.k === 'motif');
test('shape: the Motif button makes one at once, a library pick changes it, a click on the canvas adds another', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await page.click('#elb [data-k="motif"]'); await settle(page);
  expect(await shapes(page)).toHaveLength(1);
  const m0 = (await shapes(page))[0].m;
  if (!(await page.locator('#lib button[data-m]').count())) await page.locator('#lib .lfr[data-f^="b:"]').first().click();
  const btns = page.locator('#lib button[data-m]');
  const n = await btns.count();
  let other = 0;
  for (let i = 0; i < n; i++) if ((await btns.nth(i).getAttribute('data-m')) !== m0) { other = i; break; }
  await btns.nth(other).click(); await settle(page);
  const s1 = await shapes(page);
  expect(s1).toHaveLength(1);
  expect(s1[0].m).not.toBe(m0);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3); await settle(page);
  expect(await shapes(page)).toHaveLength(2);
  expect(JSON.parse(await getState(page)).tiles[0].items.length).toBe(0);   // nothing went into the stamp
  expect(errors).toEqual([]);
});
