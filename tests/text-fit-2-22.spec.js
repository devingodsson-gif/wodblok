const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, noPattern } = require('./helpers/harness');
// 2.22.2: a long word typed on the canvas comes down in size until it fits inside the canvas (review bug 9).
test('typing a long word in place shrinks the text to fit the canvas', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="text"]'); await settle(page);
  await page.click('.elk[data-k="text"] [data-add]'); await settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.5); await settle(page);
  await page.keyboard.type('Extraordinarily', { delay: 20 });
  await page.waitForTimeout(1200); await settle(page);
  const r = await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), t = s.els.find(e => e.k === 'text'); return { bw: t && t.bw, sz: t && t.tx && t.tx.sz, cw: document.getElementById('art').viewBox.baseVal.width }; });
  expect(r.bw, JSON.stringify(r)).toBeLessThanOrEqual(r.cw * 0.95);
  expect(errors).toEqual([]);
});
