// 2.60.4 (owner Oct 27 2026): a Sheet fills with a gradient, Linear or Radial, from its Start colour to its End colour; effects work on it as on any fill.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));
const sheet = async page => (await st(page)).els.find(x => x.k === 'sheet');
const range = (page, sel, v) => page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);
const SHOT = process.env.WB_SHOT;

test('the Background Sheet takes a Linear gradient, then a Radial one; the settings are kept; Undo goes back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  const u = (await sheet(page)).u;
  await H.showPanel(page, 'lyrs');
  await page.locator(`#lyl2 .lyr[data-u="${u}"] .lyn`).click(); await H.settle(page);
  await expect(page.locator('#mf_fk [data-f="grad"]')).toBeVisible();
  await page.click('#mf_fk [data-f="grad"]'); await H.settle(page);
  expect((await sheet(page)).fl).toBe('grad');
  await expect(page.locator('#mf_fck')).toHaveText('Start');
  await expect(page.locator('#mf_gr')).toBeVisible();
  await expect(page.locator('#art linearGradient:not([id^="shu"])')).toHaveCount(1);
  await range(page, '#mf_ga', 45); await H.settle(page);
  expect((await sheet(page)).ga).toBe(45);
  await page.click('#mf_gk [data-g="rad"]'); await H.settle(page);
  expect((await sheet(page)).gk).toBe('rad');
  await expect(page.locator('#mf_grr')).toBeVisible(); await expect(page.locator('#mf_gar')).toBeHidden();
  await expect(page.locator('#art radialGradient:not([id^="shu"])')).toHaveCount(1);
  await range(page, '#mf_gs', 40); await range(page, '#mf_gm', 30); await H.settle(page);
  expect(await sheet(page)).toMatchObject({ gs: 40, gm: 30 });
  expect(await page.locator('#art radialGradient:not([id^="shu"]) stop').count()).toBe(3);
  if (SHOT) await page.screenshot({ path: SHOT });
  // effects work on it: a Colour grade
  const g = page.locator('.fxg[data-fxk="sheet"]');
  await g.locator('.fxadd').scrollIntoViewIfNeeded(); await H.settle(page);   // 2.70.0: Add effect sits in the group's body, lower down; a scroll closes an open menu, so scroll first
  await g.locator('.fxadd').click();
  await page.locator('.rowm:not(.rowsub) .ddi', { hasText: 'Colour grade' }).first().click(); await H.settle(page);
  expect(((await sheet(page)).fx || []).length).toBe(1);
  // back to a plain colour
  await page.click('#mf_fk [data-f="solid"]'); await H.settle(page);
  expect((await sheet(page)).fl).toBeUndefined();
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await sheet(page)).fl).toBe('grad');
  expect(errors).toEqual([]);
});
