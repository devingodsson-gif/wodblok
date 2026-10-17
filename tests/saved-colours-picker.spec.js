// 1.18: the picker that opens from a tray colour has a "Saved colours" dropdown with a search field. It lists the colours in your saved
// trays, then Wada's colours; choosing one sets the colour and its name in one history step.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const proj = async page => JSON.parse(await getState(page)).proj;
const slot0 = async page => { const p = await proj(page); const w = p.cw[p.cwa]; return { hex: w.c.k1, name: (w.m || {}).k1 || '' }; };
async function openList(page) {
  await page.click('#tyc .tys >> nth=0');
  await expect(page.locator('.cpk')).toBeVisible();
  await expect(page.locator('.cpks')).toBeVisible();
  await page.click('.cpks .ddb');
  await expect(page.locator('.cpkl')).toBeVisible();
}

test('the picker from a tray colour has a Saved colours dropdown with a search; choosing a colour sets its colour and name in one history step', async ({ page }) => {
  const { errors } = await openApp(page);
  const before = await slot0(page);
  await openList(page);
  await expect(page.locator('.cpkl input')).toBeFocused();
  expect(await page.locator('.cpkl .ddi').count()).toBeGreaterThan(100);       // Wada's colours
  await page.fill('.cpkl input', 'hermosa');
  await expect(page.locator('.cpkl .ddi')).toHaveCount(1);
  await expect(page.locator('.cpkl .ddi')).toContainText('Hermosa Pink');
  await page.click('.cpkl .ddi');
  await expect(page.locator('.cpkl')).toBeHidden();
  await expect(page.locator('.cpk')).toBeVisible();                           // the picker stays open
  await expect(page.locator('.cpk [data-f="hex"]')).toHaveValue(/f9c1ce/i);
  await expect(page.locator('.cpkn')).toHaveValue('Hermosa Pink');
  await page.press('.cpk [data-f="hex"]', 'Escape'); await expect(page.locator('.cpk')).toBeHidden(); await settle(page);
  expect(await slot0(page)).toEqual({ hex: '#f9c1ce', name: 'Hermosa Pink' });
  await page.click('#undo'); await settle(page);
  expect(await slot0(page)).toEqual(before);                                  // one undo undoes the colour and the name together
  expect(errors).toEqual([]);
});

test('the search finds a colour by its hex, says when nothing matches, and lists colours from your saved trays first', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.evaluate(() => localStorage.setItem('wb200_trays', JSON.stringify({ f: [], t: [{ id: 'tt1', n: 'Harbour set', f: '', c: [['#123456', 'Deep harbour'], ['#abcdef', '']] }] })));
  await openList(page);
  await expect(page.locator('.cpkl .ddg').first()).toHaveText('Your trays');
  await expect(page.locator('.cpkl .ddi').first()).toContainText('Deep harbour');
  await expect(page.locator('.cpkl .ddi').nth(1)).toContainText('#ABCDEF'.slice(0, 7));   // an unnamed colour shows its hex as its name
  await page.fill('.cpkl input', 'harbour');                                           // the tray's own name finds its colours
  await expect(page.locator('.cpkl .ddi')).toHaveCount(2);
  await page.fill('.cpkl input', '#f9c1ce');
  await expect(page.locator('.cpkl .ddi')).toContainText('Hermosa Pink');
  await page.fill('.cpkl input', 'zzzzqq');
  await expect(page.locator('.cpkl .ddi')).toHaveText('No matching colour');
  await page.press('.cpkl input', 'Enter');
  await expect(page.locator('.cpkl')).toBeVisible();                                   // nothing to pick, so it stays open
  expect(errors).toEqual([]);
});

test('arrow keys and Enter pick a saved colour; Esc closes the list but leaves the picker open', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.evaluate(() => localStorage.setItem('wb200_trays', JSON.stringify({ f: [], t: [{ id: 'tt1', n: 'Harbour set', f: '', c: [['#123456', 'Deep harbour'], ['#654321', 'Dark roast']] }] })));
  await openList(page);
  await page.press('.cpkl input', 'ArrowDown');
  await page.press('.cpkl input', 'Enter');
  await expect(page.locator('.cpkl')).toBeHidden();
  await expect(page.locator('.cpkn')).toHaveValue('Dark roast');
  await page.click('.cpks .ddb');
  await expect(page.locator('.cpkl')).toBeVisible();
  await page.press('.cpkl input', 'Escape');
  await expect(page.locator('.cpkl')).toBeHidden();
  await expect(page.locator('.cpk')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the row is only in pickers that are given saved colours', async ({ page }) => {
  const { errors } = await openApp(page);
  await page.click('#fileb'); await page.click('#stgo');                                  // Settings > a custom accent opens a picker without the row
  await page.waitForSelector('[data-custom]');
  await page.click('[data-custom]');
  await expect(page.locator('.cpk')).toBeVisible();
  await expect(page.locator('.cpks')).toBeHidden();
  expect(errors).toEqual([]);
});
