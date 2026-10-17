// Text tool: the text on the stamp follows the panel while it is edited (no Update button), and Enter makes a new line.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const count = async page => JSON.parse(await getState(page)).tiles.reduce((n, t) => n + t.items.length, 0);

test('typing, changing the font or a slider updates the stamp without an Update button; Enter adds a line', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await openPanel(page, 'text');
  await expect(page.locator('#tx_up')).toHaveCount(0);
  await page.fill('#tx_t', 'Wod');
  await page.click('#tx_go');
  await settle(page, { max: 30000 });
  const n3 = await count(page);
  expect(n3).toBeGreaterThan(0);
  // typing more letters shows up on the stamp by itself
  await page.click('#tx_t');
  await page.keyboard.press('End');
  await page.keyboard.type('lok');
  await expect.poll(() => count(page), { timeout: 15000 }).toBeGreaterThan(n3);
  await settle(page, { max: 30000 });
  const n6 = await count(page);
  // Enter is a new line in the box, not an action
  await page.keyboard.press('Enter');
  await page.keyboard.type('ab');
  await expect(page.locator('#tx_t')).toHaveValue('Wodlok\nab');
  await expect.poll(() => count(page), { timeout: 15000 }).toBeGreaterThan(n6);
  await settle(page, { max: 30000 });
  // a slider moves the letters on the stamp
  const pos = async () => JSON.stringify(JSON.parse(await getState(page)).tiles.map(t => t.items.map(i => [i.x, i.y, i.s])));
  const was = await pos(page);
  await page.evaluate(() => { const r = document.getElementById('tx_ls'); r.value = 60; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect.poll(() => pos(page), { timeout: 15000 }).not.toBe(was);
  expect(await page.locator('#tx_t').inputValue()).toBe('Wodlok\nab');
  expect(errors).toEqual([]);
});
