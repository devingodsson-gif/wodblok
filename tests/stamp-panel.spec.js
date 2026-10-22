// 2.13.0: the Stamp panel. New stamp is at the very top and makes a stamp (a template), Add stamp sits under the stamp list and
// prints a copy of the selected stamp on the canvas. Contents, Place and Outlines are gone; Block, Block edge and Symmetry show only in a stamp tab.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, unlockStamp, addKind } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));

test('New stamp is first, the stamp list has Edit, Add stamp is under the list, and Contents, Place and Outlines are gone', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  await showPanel(page, 'stmp');
  const top = await page.evaluate(() => document.querySelector('section.pn[data-p="stmp"] .smkp').firstElementChild.querySelector('button').textContent);
  expect(top).toBe('New stamp');
  const order = await page.evaluate(() => { const s = document.querySelector('section.pn[data-p="stmp"]'), q = x => { const e = s.querySelector(x); return e ? [...s.querySelectorAll('*')].indexOf(e) : -1; }; return [q('#smknew'), q('#stmpl'), q('.elk[data-k="stamp"] [data-add]')]; });
  expect(order[0]).toBeGreaterThan(-1); expect(order[1]).toBeGreaterThan(order[0]); expect(order[2]).toBeGreaterThan(order[1]);
  const n0 = (await st(page)).tiles.length;
  await page.click('#smknew'); await settle(page);       // at once, like Add stamp
  expect((await st(page)).tiles.length).toBe(n0 + 1);
  await expect(page.locator('#stmpl .smkr [data-lk]').last()).toBeVisible();
  await expect(page.locator('#smkedit')).toBeVisible();
  for (const t of ['Contents', 'Place', 'Outlines']) await expect(page.locator('section.pn[data-p="stmp"] summary', { hasText: t })).toHaveCount(0);
  await expect(page.locator('#stmksel, #stmpop')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Add stamp prints a copy of the selected stamp on the canvas', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, pattern: false });
  await showPanel(page, 'stmp');
  await expect(page.locator('.elk[data-k="stamp"] [data-add]')).toBeDisabled();      // nothing to add before a stamp exists
  await page.click('#smknew'); await settle(page);
  await page.click('#stetabs .wtg.on [data-sx]'); await settle(page);   // 2.25.0: the new stamp opened in its tab; back to the canvas
  await addKind(page, 'stamp'); await settle(page);
  const els = (await st(page)).els || [];
  expect(els.filter(e => e.k === 'stamp')).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('Block, Block edge and Symmetry are only in a stamp tab', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await showPanel(page, 'stmp');
  for (const t of ['Stamp shape', 'Block edge', 'Symmetry']) await expect(page.locator('section.pn[data-p="stmp"] summary', { hasText: new RegExp('^' + t + '$') })).toBeHidden();
  await unlockStamp(page);
  for (const t of ['Stamp shape', 'Block edge', 'Symmetry']) await expect(page.locator('section.pn[data-p="stmp"] summary', { hasText: new RegExp('^' + t + '$') })).toBeVisible();
  await page.keyboard.press('Escape'); await settle(page);
  expect(errors).toEqual([]);
});

test('no stamp outlines are drawn', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  expect(await page.locator('#stol path').count()).toBe(0);
  expect(errors).toEqual([]);
});
