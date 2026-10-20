const { test, expect } = require('@playwright/test');
const { openApp, settle, getState } = require('./helpers/harness');
// 2.2.1: a shape picked from the Shapes panel lands on the first click, with no stamp unlocked beforehand
test('shape: Shape button, pick, click the canvas places one', async ({ page }) => {
  await openApp(page, { seed: 4 });
  await page.click('#elb [data-k="shape"]'); await settle(page);
  if (!(await page.locator('#lib button[data-m]').count())) await page.locator('#lib .lfr[data-f^="b:"]').first().click();
  await page.locator('#lib button[data-m]').first().click(); await settle(page);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3); await settle(page);
  const s = JSON.parse(await getState(page));
  expect(s.tiles[0].items.length).toBe(1);
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.6); await settle(page);
  expect(JSON.parse(await getState(page)).tiles[0].items.length).toBe(2);
});
