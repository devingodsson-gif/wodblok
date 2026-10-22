const { test, expect } = require('@playwright/test');
const { openApp, settle, showPanel, getState, noPattern } = require('./helpers/harness');
// 2.6.0: every element panel starts with an Add button; the Elements list opens the kind's panel.
// 2.19.0: the per-kind lists are gone; the Elements panel is the only list.
const tabs = page => page.$$eval('.wg .wtab', b => b.map(x => x.textContent));
const count = async (page, k) => JSON.parse(await getState(page)).els.filter(q => q.k === k).length;
const shown = page => page.$$eval('section.pn:not([hidden])', s => s.filter(x => x.offsetParent).map(x => x.dataset.p));

test('no element panel has its own list; Add makes an element of the kind and the Elements panel lists it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  for (const k of ['text', 'shape', 'pattern', 'motif', 'stamp']) {
    await page.click(`#elb [data-k="${k}"]`); await settle(page);
    expect(await page.locator(`.elk[data-k="${k}"] .lyr`).count(), `${k} list`).toBe(0);
  }
  await page.click('#elb [data-k="shape"]'); await settle(page);
  await page.click('.elk[data-k="shape"] [data-add]'); await settle(page);
  await page.click('.elk[data-k="shape"] [data-add]'); await settle(page);
  expect(await count(page, 'shape')).toBe(2);
  await showPanel(page, 'lyrs');
  expect(await page.locator('#lyl2 .lyr').count()).toBe(2);
  expect(errors).toEqual([]);
});

test('picking an element in the Elements list opens its kind\'s panel; the tabs carry the panels\' own names', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4, workspaces: true });
  await page.click('#elb [data-k="shape"]'); await page.click('.elk[data-k="shape"] [data-add]'); await settle(page);
  await page.click('#elb [data-k="pattern"]'); await page.click('.elk[data-k="pattern"] [data-add]'); await settle(page);
  expect(await shown(page)).toContain('layers');
  expect(await tabs(page)).toEqual(expect.arrayContaining(['Shape', 'Pattern']));
  expect(await tabs(page)).not.toContain('Properties');
  await showPanel(page, 'lyrs');
  const u = JSON.parse(await getState(page)).els.find(q => q.k === 'shape').u;
  await page.locator(`#lyl2 .lyr[data-u="${u}"]`).click(); await settle(page);
  expect(await shown(page)).toContain('mlist');
  expect(errors).toEqual([]);
});

test('every element panel has an Add button and it makes one element of that kind (Motif and Stamp too)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  for (const k of ['text', 'shape', 'pattern', 'motif', 'stamp']) {
    await page.click(`#elb [data-k="${k}"]`); await settle(page);
    expect(await count(page, k)).toBe(0);                                // the bar button makes nothing
    await expect(page.locator(`.elk[data-k="${k}"] [data-add]`)).toBeVisible();
    await page.click(`.elk[data-k="${k}"] [data-add]`); await settle(page);
    expect(await count(page, k), `Add ${k}`).toBe(1);
  }
  expect(errors).toEqual([]);
});
