// 2.43.0: a clean top bar (owner, Oct 24 2026: "I want it to be really clean"). The WB mark and the menus on the left, the project's name in the
// middle, undo, redo, search, Randomize and light/dark on the right. No wordmark in the bar; the version is in the status line; Save project and the
// projects folder are File menu items.
const { test, expect } = require('@playwright/test');
const { openApp } = require('./helpers/harness');

test('three zones: mark and menus, the name in the middle, the few tools right', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('header.top .wordmark')).toHaveCount(0);
  await expect(page.locator('header.top #ver')).toHaveCount(0);
  await expect(page.locator('footer.status #ver')).toBeVisible();
  await expect(page.locator('#ver')).toHaveText(/^v\d+\.\d+/);
  // the name sits in the middle of the window
  const r = await page.evaluate(() => { const n = document.getElementById('pnm').getBoundingClientRect(), t = document.querySelector('header.top').getBoundingClientRect(); return { mid: n.left + n.width / 2, bar: t.left + t.width / 2 }; });
  expect(Math.abs(r.mid - r.bar)).toBeLessThan(12);
  // the right holds only the tools; Save project and the projects folder moved into File
  expect(await page.evaluate(() => [...document.querySelectorAll('header.top .tr button')].filter(b => b.offsetParent).map(b => b.id))).toEqual(['undo', 'redo', 'cmdkb', 'rzdo', 'thm']);
  await expect(page.locator('#filem #psv')).toHaveCount(1);
  await expect(page.locator('#filem #pls')).toHaveCount(1);
  await expect(page.locator('#psvm')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('File > Save project saves, and Ctrl+S still does', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.evaluate(() => { window.__saveClicks = 0; document.getElementById('psv').addEventListener('click', () => { window.__saveClicks++; }); });
  await page.click('#fileb');
  await expect(page.locator('#psv')).toContainText('Save project');
  await page.click('#psv');
  await expect(page.locator('#filem')).toBeHidden();
  await page.locator('body').click({ position: { x: 5, y: 300 } });
  await page.keyboard.press('Control+s');
  await expect.poll(() => page.evaluate(() => window.__saveClicks)).toBe(2);
  expect(errors).toEqual([]);
});
