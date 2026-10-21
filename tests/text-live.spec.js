// Text tool: the text on the stamp follows the panel while it is edited (no Update button), and Enter makes a new line.
const { test, expect } = require('@playwright/test');
const { openApp, showPanel, settle, getState, unlockStamp, stampInstance, clickStamp, canvasToClient, addStampText } = require('./helpers/harness');

// text goes into the unlocked stamp: set it up in the Text panel, then click an instance of the stamp on the canvas (the placed text stays selected)
const putStampText = async page => {
  const p = await stampInstance(page); await addStampText(page);
  await expect.poll(async () => JSON.parse(await getState(page)).tiles[0].items.filter(q => q.tg).length, { timeout: 15000 }).toBeGreaterThan(0);
  await settle(page, { max: 30000 });
  // a plain click on a letter selects the whole text, so the Text panel edits it live
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  const q = JSON.parse(await getState(page)).tiles[0].items.find(x => x.tg);
  const c = await page.evaluate(([i, u, v]) => __wbTest.stampToCanvas(i, u, v), [p.i, q.x, q.y]), cl = await canvasToClient(page, c.x, c.y);
  await page.mouse.click(cl.x, cl.y); await settle(page);
  await expect(page.locator('#tx_ed')).toBeVisible();
  return p;
};

const count = async page => JSON.parse(await getState(page)).tiles.reduce((n, t) => n + t.items.length, 0);

test('typing, changing the font or a slider updates the stamp without an Update button; Enter adds a line', async ({ page }) => {
  const { errors } = await openApp(page);
  await unlockStamp(page);
  await showPanel(page, 'text');
  await expect(page.locator('#tx_up')).toHaveCount(0);
  await page.fill('#tx_t', 'Wod');
  await putStampText(page);
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
