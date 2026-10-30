// Element update, step 4 (2.1.4): the Element editor is the Edit group at the top of the Shape panel (it used to be its own panel docked at the bottom).
// It dims with nothing selected, and Auto-open brings the Shape panel forward when a shape is added while the panel is closed.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, unlockStamp, stampInstance, clickStamp } = require('./helpers/harness');

const place = async (page, dx, dy) => { await page.locator('#lib button[data-m]').first().click(); await clickStamp(page, await stampInstance(page), dx, dy); };

test('the Edit group sits in the Shape panel, is live when a shape is placed and dims with nothing selected; there is no separate Element editor', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('#rail-sedit')).toHaveCount(0);
  await unlockStamp(page);
  await openPanel(page, 'motifs');
  expect(await page.evaluate(() => !!document.getElementById('sel').closest('section.pn[data-p="motifs"]'))).toBe(true);
  await page.click('#lib .lfr[data-f="b:Flowers"]');
  await place(page, 0, 0);
  await expect(page.locator('#sel')).not.toHaveClass(/none/);
  await page.keyboard.press('Escape');
  await clickStamp(page, await stampInstance(page), 95, 95);   // an empty spot on the stamp: nothing is selected
  await settle(page);
  await expect(page.locator('#sel')).toHaveClass(/none/);
  expect(errors).toEqual([]);
});

test('Auto-open switches off and on', async ({ page }) => {
  const { errors } = await openApp(page);
  await unlockStamp(page);   // 2.76.8: with no stamp open the Shape panel shows the Library only; the Edit group belongs to the stamp tab
  await openPanel(page, 'motifs');
  await expect(page.locator('#seauto')).toHaveAttribute('aria-pressed', 'true');
  await page.click('#seauto');
  await expect(page.locator('#seauto')).toHaveAttribute('aria-pressed', 'false');
  await page.click('#seauto');
  await expect(page.locator('#seauto')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
