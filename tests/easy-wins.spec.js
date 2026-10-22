// 1.0.16: colour slots named Paper / Ink / Accent / Accent 2 (as the print proof says), the add-colour tile first in the library, previews for the
// starting Looks, check marks and a heading in the Display menu, and the stamp library's own default name (UX review C9, C16, C20, D15).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

test('the Colours tool holds the tray, paper and ink, and the saved trays (1.10)', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  const heads = await page.evaluate(() => [...document.querySelectorAll('section[data-p="colors"] details.g > summary')].map(s => s.firstChild.textContent.trim()));
  expect(heads).toEqual(['Tray', 'Ink', 'Saved colours', 'Saved trays', 'Colourways']);   // Saved colours came with 1.19
  expect(await page.evaluate(() => [...document.querySelectorAll('section[data-p="colors"] .cwk')].map(l => l.textContent))).toEqual(['Ink']);   // Paper is the Background, in the Canvas panel (2.3.1)
  await expect(page.locator('#tyl .tyr')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test.skip('every starting Look has a picture, made from its own settings', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'pres');
  const n = await page.locator('#psl .psr').count();
  expect(n).toBeGreaterThanOrEqual(6);
  expect(await page.locator('#psl .psr .th svg').count()).toBe(n);
  const sigs = await page.evaluate(() => [...document.querySelectorAll('#psl .psr .th svg')].map(s => s.innerHTML.replace(/lkf\d+/g, 'x')));
  expect(new Set(sigs).size, 'the looks do not all look the same').toBeGreaterThan(3);
  expect(errors).toEqual([]);
});

test('the four view toggles live in Settings (General) and the Display tab is gone', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('#itbb')).toHaveCount(0);
  await page.evaluate(() => document.getElementById('stgo').click());
  await expect(page.locator('#stgdlg')).toBeVisible();
  await page.click('#stgnav [data-p="general"]');
  for (const [sid, bid] of [['stgti', 'gti'], ['stgtx', 'gtx'], ['stgtm', 'gtm'], ['stgdt', 'gdt']]) {
    const want = await page.evaluate(b => document.getElementById(b).getAttribute('aria-pressed'), bid);
    await expect(page.locator('#' + sid), sid).toHaveAttribute('aria-pressed', want);
    await page.click('#' + sid);
    const now = await page.evaluate(b => document.getElementById(b).getAttribute('aria-pressed'), bid);
    expect(now, bid + ' follows').not.toBe(want);
    await expect(page.locator('#' + sid)).toHaveAttribute('aria-pressed', now);
  }
  expect(errors).toEqual([]);
});

// 2.23.0: the stamp library is a group in the Stamp panel again
test('the stamp library says what an empty name will become, and confirms in the status line', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'stmp');
  await expect(page.locator('#slname')).toHaveAttribute('placeholder', 'Stamp 1');
  await page.click('#slsave');
  await expect(page.locator('#pmsg')).toContainText('Saved “Stamp 1”');
  await expect(page.locator('#slmsg')).toHaveText('');
  expect(errors).toEqual([]);
});
