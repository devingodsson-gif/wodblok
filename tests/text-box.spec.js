// In a Text layer, typing edits the selected text box and "Add text" starts a new one (UX review D5).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

test('typing changes the selected text box; Add text then arms a second one', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await page.click('#ly_add');
  await openPanel(page, 'text');
  await settle(page);
  await expect(page.locator('#tx_go')).toHaveText('Add text');
  await page.fill('#tx_t', 'ONE');
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(500);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page);
  const texts = async () => JSON.parse(await getState(page)).layers.flatMap(l => (l.pl || []).filter(p => p.tx).map(p => p.tx.text));
  await expect.poll(texts).toEqual(['ONE']);
  await page.click('#tx_go');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page);
  await expect(page.locator('#tx_ed')).toBeVisible();
  await page.fill('#tx_t', 'TWO');
  await expect.poll(texts, { timeout: 5000 }).toEqual(['TWO']);
  await page.click('#tx_go');
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'true');
  await page.fill('#tx_t', 'THREE');
  await page.waitForTimeout(500);
  await page.mouse.click(box.x + box.width / 4, box.y + box.height / 4);
  await settle(page);
  await expect.poll(texts).toEqual(['TWO', 'THREE']);
  expect(errors).toEqual([]);
});
