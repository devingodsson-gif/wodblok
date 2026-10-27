// 2.65.0 (owner Oct 27 2026, docs/text-plan.md release 3): Bold, Italic, Underline, Strikethrough and Highlight on the selected letters of a text (all of them when none
// are selected); a button shows on when every selected letter has the style, and pressing it then takes it off.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const txt = async page => JSON.parse(await H.getState(page)).els.find(x => x.tx);
const sel = (page, a, b) => page.evaluate(([a, b]) => { const t = document.getElementById('tx_t'); t.focus(); t.setSelectionRange(a, b); t.dispatchEvent(new Event('select')); }, [a, b]);
const runs = async page => JSON.stringify(((await txt(page)).tx.sty || []).map(r => [r[0], r[1], r[6] || '', r[7] ? 'h' : '']));

test('Bold, Italic, Underline, Strikethrough and Highlight: on the selected letters, drawn, and taken off again', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  await H.placeArmed(page, 'text'); await H.showPanel(page, 'text');
  await page.fill('#tx_t', 'AB CD'); await H.settle(page);
  await sel(page, 0, 2);
  await page.click('#tx_fx [data-fl="b"]'); await page.click('#tx_fx [data-fl="u"]');
  await expect.poll(() => runs(page), { timeout: 12000 }).toBe('[[0,2,"bu",""]]');
  await expect(page.locator('#tx_fx [data-fl="b"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#art use[stroke]')).toHaveCount(2);                // bold: an outline of the letter's own colour
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('#art g[transform] > use + rect')].length), { timeout: 12000 }).toBe(2);   // underline bars
  // nothing selected: Italic on every letter
  await sel(page, 1, 1);
  await page.click('#tx_fx [data-fl="i"]');
  await expect.poll(() => runs(page), { timeout: 12000 }).toBe('[[0,2,"biu",""],[2,5,"i",""]]');
  await expect(page.locator('#art use[transform="skewX(-12)"]')).toHaveCount(4);
  // Highlight on C and D
  await sel(page, 3, 5);
  await page.locator('#wl_txh .cwsb').scrollIntoViewIfNeeded(); await page.click('#wl_txh .cwsb'); await page.locator('.cwp .cwpc[data-s]').nth(0).click(); await H.settle(page);
  await expect.poll(() => runs(page), { timeout: 12000 }).toBe('[[0,2,"biu",""],[2,3,"i",""],[3,5,"i","h"]]');
  // Bold again on A and B takes it off
  await sel(page, 0, 2);
  await page.click('#tx_fx [data-fl="b"]');
  await expect.poll(() => runs(page), { timeout: 12000 }).toBe('[[0,2,"iu",""],[2,3,"i",""],[3,5,"i","h"]]');
  await expect(page.locator('#art use[stroke]')).toHaveCount(0);
  if (process.env.WB_SHOT) await page.screenshot({ path: process.env.WB_SHOT });
  expect(errors).toEqual([]);
});
