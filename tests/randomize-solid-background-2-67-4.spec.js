// 2.67.4: a canvas texture with Wear that an older roll (or you) saved stayed on the canvas when a roll kept the canvas texture (its switch at 0), so the Background still showed through.
// A roll now drops the Wear use from a kept canvas texture; its other uses stay.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, rzSet } = require('./helpers/harness');

test('a roll that keeps the canvas texture drops its Wear and keeps the rest', async ({ page }) => {
  test.setTimeout(240000);
  const { errors } = await openApp(page, { seed: 5, background: true });
  let s;
  for (let i = 0; i < 8; i++) {                                                          // a roll leaves a canvas texture and its library entry (some Looks have none: roll again)
    await page.click('#rzdo'); await settle(page, { max: 90000 }); s = JSON.parse(await getState(page));
    if (((s.tex || {}).u || []).length) break;
  }
  expect(((s.tex || {}).u || []).length).toBeGreaterThan(0);
  const keep = JSON.parse(JSON.stringify(s.tex.u[0]));
  s.tex.u = [{ ...keep, md: 'relief' }, { ...keep, sd: 4242, md: 'wear' }];             // one Relief use and one Wear use, as an older roll could leave
  await page.evaluate(x => window.__wbTest.apply(x), JSON.stringify(s));
  await settle(page, { max: 30000 });
  expect(JSON.parse(await getState(page)).tex.u.map(u => u.md)).toEqual(['relief', 'wear']);
  await openPanel(page, 'rand');
  await rzSet(page, { fin: false });   // 2.76.3: Finish off keeps the canvas texture
  await page.click('#rzdo'); await settle(page, { max: 90000 });
  expect(JSON.parse(await getState(page)).tex.u.map(u => u.md)).toEqual(['relief']);
  expect(errors).toEqual([]);
});
