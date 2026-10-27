// 2.55.0 (owner Oct 26 2026, docs/polish-plan.md): the app starts with the Elements list on the right, locked; every other panel opens on the left by default
// (Settings > General > Open panels on), and a panel comes back where it was last.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const dockOf = (page, p) => page.locator(`section.pn[data-p="${p}"]`).evaluate(s => { const a = s.closest('aside.dk'); return a ? a.dataset.e : (s.closest('.wg.fl') ? 'float' : ''); });
const groupOf = (page, p) => page.locator('.wg').filter({ has: page.locator(`section.pn[data-p="${p}"]`) });

test('the app starts with the Elements list on the right, locked, and nothing else open', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, workspaces: 'launch' });
  await expect(page.locator('section.pn[data-p="lyrs"]')).toBeVisible();
  expect(await dockOf(page, 'lyrs')).toBe('r');
  await expect(groupOf(page, 'lyrs').locator('[data-act="lock"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('.wg section.pn:not([hidden])').count()).toBe(1);
  await expect(page.locator('aside.dk-l')).toBeHidden();
  expect(errors).toEqual([]);
});

test('panels open on the left; an element panel too; Settings can make it the right', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, workspaces: 'launch', pattern: false, background: true });
  await H.openPanel(page, 'canvas');
  expect(await dockOf(page, 'canvas')).toBe('l');
  await H.addShape(page, 'rect');
  expect(await dockOf(page, 'motifs')).toBe('l');
  expect(await dockOf(page, 'lyrs')).toBe('r');
  // Settings > General > Open panels on: Right, for a panel that has never been open
  await page.click('#fileb'); await page.click('#stgo'); await expect(page.locator('#stgdlg')).toBeVisible();
  await page.click('#stgnav [data-p="general"]');
  await page.click('#stgps [data-v="r"]');
  await expect(page.locator('#stgps [data-v="r"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape'); await H.settle(page);
  await H.openPanel(page, 'colors');
  expect(await dockOf(page, 'colors')).toBe('r');
  expect(errors).toEqual([]);
});

test('a panel comes back where it was: closed on the left, it opens on the left again even after the setting says right', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, workspaces: 'launch' });
  await H.openPanel(page, 'canvas');
  expect(await dockOf(page, 'canvas')).toBe('l');
  await groupOf(page, 'canvas').locator('[data-act="close"]').click(); await H.settle(page);
  await expect(page.locator('section.pn[data-p="canvas"]')).toBeHidden();
  await page.evaluate(() => localStorage.setItem('wb255_pside', 'r'));
  await H.openPanel(page, 'canvas');
  expect(await dockOf(page, 'canvas')).toBe('l');
  expect(errors).toEqual([]);
});
