// 2.91.3 (owner Nov 4 2026, docs/repeats-plan.md step 3): View > Real size zooms the canvas to the size it prints at: its real width times the screen's pixels per
// inch (Settings > General > Screen resolution, 96 by default). A canvas with no real size says so.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const artW = page => page.evaluate(() => document.getElementById('art').getBoundingClientRect().width);

test('Real size: 100 mm at 96 ppi is 378 screen pixels across; Screen resolution changes it; no real size, no zoom', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  const w0 = await artW(page);
  await page.evaluate(() => window.__wbTest.commands.run('view.realSize')); await H.settle(page);
  await expect(page.locator('#pmsg')).toHaveText(/real size first/);
  expect(Math.abs(await artW(page) - w0)).toBeLessThan(1);
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); s.dim = { ...(s.dim || {}), u: 'mm', pw: 100, ph: 150, dpi: 300 }; window.__wbTest.apply(JSON.stringify(s)); }); await H.settle(page);
  await page.click('#mnb-view'); await page.locator('.pop.mnbm:visible [data-cmd="view.realSize"]').click(); await H.settle(page);
  expect(Math.abs(await artW(page) - 100 / 25.4 * 96)).toBeLessThan(2);
  // Settings > General > Screen resolution 120
  await page.evaluate(() => window.__wbTest.commands.run('settings.open')); await page.waitForSelector('#stgppi');
  await expect(page.locator('#stgppio')).toHaveText('96 ppi');
  await page.locator('#stgppi').evaluate(r => { r.value = 120; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#stgppio')).toHaveText('120 ppi');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__wbTest.commands.run('view.realSize')); await H.settle(page);
  expect(Math.abs(await artW(page) - 100 / 25.4 * 120)).toBeLessThan(2);
  expect(errors).toEqual([]);
});
