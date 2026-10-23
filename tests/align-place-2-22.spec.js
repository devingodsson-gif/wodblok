const { test, expect } = require('@playwright/test');
const { openApp, settle, noPattern, addKind } = require('./helpers/harness');
// 2.22.0: the Align buttons sit directly under the Element group, in whichever panel that group is in.
test('Align follows the Element group to the selected kind\'s panel', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  for (const k of ['text', 'motif']) {
    await page.click(`#elb [data-k="${k}"]`); await settle(page);
    await addKind(page, k); await settle(page);
    const r = await page.evaluate(() => { const g = document.querySelector('details.g:has(>.gb>#lfree)'), a = document.getElementById('lalsec'); return { same: g.parentElement === a.parentElement, next: g.nextElementSibling === a }; });
    expect(r, k).toEqual({ same: true, next: true });
  }
  expect(errors).toEqual([]);
});
