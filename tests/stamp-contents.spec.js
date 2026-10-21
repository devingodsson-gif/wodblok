// Element update, step 6 (2.1.6): a stamp holds text as well as motifs (tile.el; pictures no longer, 2.3.3). "Make stamp from selection" turns the selected
// text into a new stamp and puts one copy of it where it was; the Contents group lists what a stamp holds.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};
const st = async page => JSON.parse(await getState(page));

test('Make stamp from selection is off with nothing selected; selected text becomes a stamp that holds it; taking it out empties Contents', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  await expect(page.locator('#stmksel')).toBeDisabled();
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'Hi');
  await settle(page);
  await canvasClick(page, 0.5, 0.5);
  await page.keyboard.press('Escape');         // put the text tool down
  await openPanel(page, 'lyrs');
  await page.click('#lyl2 .lyr');                // select the text from the Elements list
  await settle(page);
  await openPanel(page, 'stmp');
  await expect(page.locator('#stmksel')).toBeEnabled();
  await page.click('#stmksel');
  await settle(page);
  const s = await st(page);
  const t = s.tiles[s.tiles.length - 1];
  expect(t.el).toHaveLength(1);
  expect(t.el[0]).toMatchObject({ k: 'text' });
  expect(s.els.filter(q => q.k === 'text')).toHaveLength(0);
  await expect(page.locator('#stcl .mr')).toHaveCount(1);
  await page.click('#stcl [data-xi="0"]');
  await settle(page);
  expect((await st(page)).tiles[s.tiles.length - 1].el).toBeUndefined();
  await expect(page.locator('#stcl')).toBeHidden();
  expect(errors).toEqual([]);
});
