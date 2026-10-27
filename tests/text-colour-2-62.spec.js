// 2.62.0 (owner Oct 27 2026, the text overhaul: style parts of a text): Letter colour colours the selected letters of a text (all of them when none are selected).
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const txt = async page => JSON.parse(await H.getState(page)).els.find(x => x.tx);
const pick = async (page, n) => { await page.locator('#wl_txl .cwsb').scrollIntoViewIfNeeded(); await page.click('#wl_txl .cwsb'); await page.locator('.cwp .cwpc[data-s]').nth(n).click(); await H.settle(page); };

test('Letter colour: the selected letters take a tray colour; with none selected every letter does; Undo goes back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  await H.placeArmed(page, 'text');
  await H.showPanel(page, 'text');
  await page.fill('#tx_t', 'ABCD'); await H.settle(page);
  await expect(page.locator('#wl_txl')).toBeVisible();
  await page.evaluate(() => { const t = document.getElementById('tx_t'); t.focus(); t.setSelectionRange(1, 3); });
  await pick(page, 1);
  const q = await txt(page);
  expect(q.tx.sty).toEqual([[1, 3, 100, 0, 0, expect.stringMatching(/^@/)]]);
  await expect(page.locator('#art use[fill]')).toHaveCount(2);
  if (process.env.WB_SHOT) await page.screenshot({ path: process.env.WB_SHOT });
  // the letters keep their colour when one is typed before them
  await page.evaluate(() => { const t = document.getElementById('tx_t'); t.focus(); t.setSelectionRange(0, 0); });
  await page.keyboard.type('Z'); await H.settle(page);
  await expect.poll(async () => ((await txt(page)).tx.sty || [[]])[0].slice(0, 2)).toEqual([2, 4]);
  // nothing selected: every letter
  await page.evaluate(() => { const t = document.getElementById('tx_t'); t.focus(); t.setSelectionRange(1, 1); });
  await pick(page, 0);
  await expect.poll(async () => JSON.stringify(((await txt(page)).tx.sty || []).map(r => r.slice(0, 2)))).toBe('[[0,5]]');
  await expect(page.locator('#art use[fill]')).toHaveCount(5);
  await page.keyboard.press('Control+z'); await H.settle(page);
  await expect.poll(async () => JSON.stringify(((await txt(page)).tx.sty || []).map(r => r.slice(0, 2)))).not.toBe('[[0,5]]');   // the colour on every letter is undone
  expect(errors).toEqual([]);
});
