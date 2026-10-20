// 2.2.1: Jitter on a text nudges each letter on its own (seeded per letter); the text as a whole stays where it is.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const uses = page => page.evaluate(() => [...document.querySelectorAll('#art use[href^="#tg"]')].map(u => u.getAttribute('transform')).slice(0, 4));
const num = t => (t.match(/-?\d+\.?\d*/g) || []).map(Number);

test('text Jitter moves every letter differently, not the text as one object', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await page.click('#ly_add');
  await openPanel(page, 'text');
  await settle(page);
  await page.fill('#tx_t', 'ABCD');
  await page.waitForTimeout(500);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page);
  await expect.poll(async () => (await uses(page)).length).toBe(4);
  const plain = await uses(page);
  const grp = () => page.evaluate(() => document.querySelector('#art [data-fp]').getAttribute('transform'));
  const g0 = await grp();
  await page.click('#tx_go');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page);
  await openPanel(page, 'text');
  await page.locator('.fxg[data-fxk="text"] .fxadd').scrollIntoViewIfNeeded();
  await page.click('.fxg[data-fxk="text"] .fxadd');
  await page.locator('.rowm .ddi', { hasText: 'Jitter' }).first().click();
  await settle(page);
  await expect.poll(async () => (await uses(page))[0]).not.toBe(plain[0]);
  const j = await uses(page);
  expect(await grp()).toBe(g0);
  const d = j.map((t, i) => { const a = num(t), b = num(plain[i]); return [a[0] - b[0], a[1] - b[1]].map(v => +v.toFixed(3)).join(); });
  expect(new Set(d).size).toBeGreaterThan(1);
  const again = await uses(page);
  expect(again).toEqual(j);
  expect(errors).toEqual([]);
});
