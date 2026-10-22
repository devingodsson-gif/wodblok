const { test, expect } = require('@playwright/test');
const { openApp, settle, showPanel } = require('./helpers/harness');
// 2.19.0: a lock on a panel's top rail. A locked panel cannot be moved or closed; the Elements panel starts locked.
const grp = (page, p) => page.locator(`.wg:has(section.pn[data-p="${p}"])`);

test('the Elements panel starts locked: no close or pop-out buttons, the rail button does not close it', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
  await showPanel(page, 'lyrs'); await settle(page);
  const g = grp(page, 'lyrs');
  await expect(g.locator('[data-act="lock"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await g.locator('[data-act="close"]').count()).toBe(0);
  expect(await g.locator('[data-act="float"]').count()).toBe(0);
  await page.click('#rail-lyrs'); await settle(page);
  await expect(grp(page, 'lyrs')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('a locked panel cannot be dragged; unlocking brings back close and pop out; Close all keeps locked panels', async ({ page }) => {
  const { errors } = await openApp(page, { workspaces: true });
  await showPanel(page, 'lyrs'); await settle(page);
  const g = grp(page, 'lyrs'), wh = g.locator('.wh');
  const box = await wh.boundingBox();
  await page.mouse.move(box.x + 10, box.y + 8); await page.mouse.down(); await page.mouse.move(box.x - 300, box.y + 200, { steps: 6 }); await page.mouse.up(); await settle(page);
  expect(await g.evaluate(e => e.classList.contains('fl'))).toBe(false);   // still docked
  await page.click('#rcls'); await settle(page);
  await expect(grp(page, 'lyrs')).toHaveCount(1);
  await g.locator('[data-act="lock"]').click(); await settle(page);
  await expect(g.locator('[data-act="lock"]')).toHaveAttribute('aria-pressed', 'false');
  expect(await g.locator('[data-act="close"]').count()).toBe(1);
  await g.locator('[data-act="close"]').click(); await settle(page);
  await expect(grp(page, 'lyrs')).toHaveCount(0);
  expect(errors).toEqual([]);
});
