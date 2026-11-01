// 2.84.2 (T4): Add pattern just adds the pattern; nothing is armed and no click on the canvas is needed.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, noPattern, showPanel } = require('./helpers/harness');
const pats = async page => JSON.parse(await getState(page)).els.filter(q => q.k === 'pattern');

test('the Add button in the Pattern panel adds a pattern at once, selected, with nothing armed', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="pattern"]'); await settle(page);
  expect((await pats(page)).length, 'the bar button adds it').toBe(1);
  await page.click('.elk[data-k="pattern"] [data-add]'); await settle(page);
  expect((await pats(page)).length, 'Add adds another').toBe(2);
  expect(await page.evaluate(() => window.__wbTest.state && !!document.querySelector('#fpov .gh')), 'no ghost on the pointer').toBe(false);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width * 0.3, b.y + b.height * 0.3); await settle(page);
  expect((await pats(page)).length, 'a click on the canvas adds nothing').toBe(2);
  expect(errors).toEqual([]);
});
