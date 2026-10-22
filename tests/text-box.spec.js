// In a Text element, typing edits the selected text and "Add text" makes a new one (UX review D5; 2.12.0: Add text is the only way, no clicking the canvas).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

test('typing changes the selected text; Add text makes a second one', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'text');
  await settle(page);
  await expect(page.locator('#tx_go')).toBeHidden();                     // the old arm-and-click button is gone
  const texts = async () => JSON.parse(await getState(page)).els.filter(p => p.tx).map(p => p.tx.text);
  await page.fill('#tx_t', 'ONE');
  await page.waitForTimeout(500); await settle(page);
  expect(await texts()).toEqual([]);                                       // typing alone makes nothing and arms nothing
  await page.click('.elk[data-k="text"] [data-add]'); await settle(page);
  await expect.poll(texts).toEqual(['ONE']);
  await page.fill('#tx_t', 'TWO');                                         // edits the selected text
  await expect.poll(texts, { timeout: 5000 }).toEqual(['TWO']);
  await page.click('.elk[data-k="text"] [data-add]'); await settle(page);
  await page.fill('#tx_t', 'THREE');
  await expect.poll(texts, { timeout: 5000 }).toEqual(['TWO', 'THREE']);
  expect(errors).toEqual([]);
});
