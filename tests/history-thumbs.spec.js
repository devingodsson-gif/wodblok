// A Randomize roll and a snapshot get a small picture in History, taken once the piece is finished and the page is quiet; steps made by hand have none (UX review C2).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

const roll = async page => { await page.click('#rzdo'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };

test('rolls get a picture a moment after they finish; the Start and later hand edits do not; a snapshot gets one too', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  await openPanel(page, 'hist');
  const rows = page.locator('#hhl .hr');
  await expect(rows).toHaveCount(2);
  await expect(page.locator('#hhl .hr.th img.hth')).toHaveCount(1, { timeout: 20000 });
  expect(await page.locator('#hhl .hr.th img.hth').getAttribute('src')).toMatch(/^data:image\/jpeg;base64,/);
  await expect(rows.last().locator('img')).toHaveCount(0);                           // the Start row
  await page.click('#hsadd'); await page.keyboard.press('Enter');
  await expect(page.locator('#hsl .hr.th img.hth')).toHaveCount(1, { timeout: 20000 });
  expect(errors).toEqual([]);
});

test('no picture is made while the page is busy; it is made once the page is quiet', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await roll(page);
  await openPanel(page, 'hist');
  await page.evaluate(() => { window.__thumbCalls = 0; const o = HTMLCanvasElement.prototype.toDataURL; HTMLCanvasElement.prototype.toDataURL = function (...a) { window.__thumbCalls++; return o.apply(this, a); }; });
  await page.evaluate(() => { document.body.classList.add('babusy'); });                 // the page is busy: the picture waits
  await page.waitForTimeout(3500);
  expect(await page.evaluate(() => window.__thumbCalls)).toBe(0);
  await page.evaluate(() => { document.body.classList.remove('babusy'); });
  await expect(page.locator('#hhl .hr.th img.hth')).toHaveCount(1, { timeout: 20000 });
  expect(errors).toEqual([]);
});
