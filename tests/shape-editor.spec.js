// The shape controls are their own tool: the Shape editor panel. It is docked along the bottom of the Stamp editor (1.35.0; it used to float), opens by itself when a shape is placed
// (unless Auto-open at the top is switched off), dims when nothing is selected, and moves like any floating panel.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const place = async (page, x, y) => { await page.locator('#lib button[data-m]').first().click(); await page.mouse.click(x, y); await settle(page); };

test('placing a shape opens the Shape editor docked at the bottom; Auto-open off keeps it closed; the rail button opens it; it dims with nothing selected', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await expect(page.locator('.wtab', { hasText: 'Shape editor' })).toHaveCount(0);   // nothing open at launch
  await openPanel(page, 'motifs');
  await page.click('#lib .lfr[data-f="b:Flowers"]');                // folders open in place (1.5.0)
  await place(page, 590, 330);
  await expect(page.locator('.wtab.on', { hasText: 'Shape editor' })).toHaveCount(1);
  expect(await page.evaluate(() => !!document.getElementById('sel').closest('.dk-b')), 'docked at the bottom by default').toBe(true);
  expect(await page.evaluate(() => !!document.getElementById('sel').closest('.wg.fl')), 'not floating').toBe(false);
  await expect(page.locator('#seauto')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#sel')).not.toHaveClass(/none/);
  // a second shape does not open a second panel
  await place(page, 590, 440);
  await expect(page.locator('.wtab', { hasText: 'Shape editor' })).toHaveCount(1);
  // switch Auto-open off, close the panel, place again: it stays closed
  await page.click('#seauto');
  await expect(page.locator('#seauto')).toHaveAttribute('aria-pressed', 'false');
  await page.click('.wg:has(#sel) [data-act="close"]');
  await expect(page.locator('.wtab', { hasText: 'Shape editor' })).toHaveCount(0);
  await place(page, 500, 250);
  await expect(page.locator('.wtab', { hasText: 'Shape editor' })).toHaveCount(0);
  // the rail button still opens it, and with nothing selected its controls dim
  await page.click('#rail-sedit');
  await expect(page.locator('.wtab.on', { hasText: 'Shape editor' })).toHaveCount(1);
  await page.keyboard.press('Escape');   // the library click armed the stamp tool: put it down first
  await page.mouse.click(820, 200);   // an empty spot on the stamp: nothing is selected
  await settle(page);
  await expect(page.locator('#sel')).toHaveClass(/none/);
  expect(errors).toEqual([]);
});

test('the Shape editor pops out and then drags to a new place', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await page.click('#rail-sedit');
  await page.click('.wg:has(#sel) [data-act="float"]');
  const box = async () => page.locator('.wg.fl:has(#sel)').boundingBox();
  const b0 = await box();
  await page.mouse.move(b0.x + 40, b0.y + 14);
  await page.mouse.down(); await page.mouse.move(b0.x + 300, b0.y + 120, { steps: 8 }); await page.mouse.up();
  const b1 = await box();
  expect(Math.round(b1.y - b0.y), 'moved down').toBeGreaterThan(80);
  expect(Math.round(b1.x - b0.x), 'moved across').toBeGreaterThan(200);
  expect(errors).toEqual([]);
});
