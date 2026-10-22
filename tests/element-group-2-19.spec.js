const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, noPattern, addKind } = require('./helpers/harness');
// 2.19.0: one Element group (Size, Rotate, Position, Flip, Duplicate, Order, Delete) in the panel of whatever kind is selected.
const inPanel = (page, pn) => page.evaluate(p => { const g = document.querySelector('details.g:has(>.gb>#lfree)'); return !!g && !!g.closest(`section.pn[data-p="${p}"]`); }, pn);
const el = async (page, k) => JSON.parse(await getState(page)).els.find(q => q.k === k);

test('the Element group is in the selected element\'s panel: Shape, Text, Stamp; Rotate works on each', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  for (const [k, pn] of [['shape', 'mlist'], ['text', 'text'], ['stamp', 'stmp']]) {
    await page.click(`#elb [data-k="${k}"]`); await settle(page);
    await addKind(page, k); await settle(page);
    expect(await inPanel(page, pn), k).toBe(true);
    const sec = page.locator(`section.pn[data-p="${pn}"]`);
    await expect(sec.locator('#lfpr')).toBeVisible();
    await sec.locator('#lfpr').fill('30'); await sec.locator('#lfpr').dispatchEvent('change'); await settle(page);
    expect((await el(page, k)).r, `${k} rotate`).toBe(30);
  }
  expect(errors).toEqual([]);
});

test('Duplicate, Order and Delete from the group work on a text element', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="text"]'); await addKind(page, 'text'); await settle(page);
  const n = async () => JSON.parse(await getState(page)).els.filter(q => q.k === 'text').length;
  expect(await n()).toBe(1);
  await page.click('#lfpdu'); await settle(page);
  expect(await n()).toBe(2);
  await page.click('#lfpdl'); await settle(page);
  expect(await n()).toBe(1);
  expect(errors).toEqual([]);
});
