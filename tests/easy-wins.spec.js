// 1.0.16: colour slots named Paper / Ink / Accent / Accent 2 (as the print proof says), the add-colour tile first in the library, previews for the
// starting Looks, check marks and a heading in the Display menu, and the stamp library's own default name (UX review C9, C16, C20, D15).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

test('the Colours tool holds the tray, paper and ink, and the saved trays (1.10)', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'colors');
  const heads = await page.evaluate(() => [...document.querySelectorAll('section[data-p="colors"] details.g > summary')].map(s => s.firstChild.textContent.trim()));
  expect(heads).toEqual(['Tray', 'Paper and ink', 'Saved trays']);
  expect(await page.evaluate(() => [...document.querySelectorAll('section[data-p="colors"] .cwk')].map(l => l.textContent))).toEqual(['Paper', 'Ink']);
  await expect(page.locator('#tyl .tyr')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('every starting Look has a picture, made from its own settings', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'pres');
  const n = await page.locator('#psl .psr').count();
  expect(n).toBeGreaterThanOrEqual(6);
  expect(await page.locator('#psl .psr .th svg').count()).toBe(n);
  const sigs = await page.evaluate(() => [...document.querySelectorAll('#psl .psr .th svg')].map(s => s.innerHTML.replace(/lkf\d+/g, 'x')));
  expect(new Set(sigs).size, 'the looks do not all look the same').toBeGreaterThan(3);
  expect(errors).toEqual([]);
});

test('the Display menu has a heading and a check mark on what is switched on', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.click('#itbb');
  await expect(page.locator('#itb .itbh')).toHaveText('Show while editing');
  const on = await page.evaluate(() => [...document.querySelectorAll('#itb button')].map(b => [b.id, b.getAttribute('aria-pressed'), getComputedStyle(b, '::before').content]));
  for (const [id, pressed, content] of on) expect(content, id).toBe(pressed === 'true' ? '"✓"' : '""');
  expect(errors).toEqual([]);
});

test('the stamp library says what an empty name will become, and confirms in the status line', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await openPanel(page, 'slib');
  await expect(page.locator('#slname')).toHaveAttribute('placeholder', 'Stamp 1');
  await page.click('#slsave');
  await expect(page.locator('#pmsg')).toContainText('Saved “Stamp 1”');
  await expect(page.locator('#slmsg')).toHaveText('');
  expect(errors).toEqual([]);
});
