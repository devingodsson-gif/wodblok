const { test, expect } = require('@playwright/test');
const { openApp, settle, showPanel, getState, noPattern } = require('./helpers/harness');
// 2.6.0: every element panel starts with the list of its elements and (Text, Shape, Pattern) an Add button; picking a row selects it; the Elements list opens the kind's panel.
const tabs = page => page.$$eval('.wg .wtab', b => b.map(x => x.textContent));
const rows = (page, k) => page.$$eval(`.elk[data-k="${k}"] .lyr`, r => r.map(x => x.textContent + (x.classList.contains('on') ? '*' : '')));
const shown = page => page.$$eval('section.pn:not([hidden])', s => s.filter(x => x.offsetParent).map(x => x.dataset.p));

test('Add makes an element of the panel\'s kind, selects it and lists it; rows pick between elements', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await page.click('#elb [data-k="shape"]'); await settle(page);
  expect(await shown(page)).toContain('mlist');
  expect(await rows(page, 'shape')).toEqual([]);
  await page.click('.elk[data-k="shape"] [data-add]'); await settle(page);
  await page.click('.elk[data-k="shape"] [data-add]'); await settle(page);
  expect((await rows(page, 'shape')).length).toBe(2);
  expect((await rows(page, 'shape'))[0]).toMatch(/\*$/);                 // the newest is on top and selected
  await page.locator('.elk[data-k="shape"] .lyr').nth(1).click(); await settle(page);
  expect((await rows(page, 'shape'))[1]).toMatch(/\*$/);
  await page.click('#elb [data-k="pattern"]'); await settle(page);
  expect(await shown(page)).toContain('layers');
  await page.click('.elk[data-k="pattern"] [data-add]'); await settle(page);
  expect((await rows(page, 'pattern')).length).toBeGreaterThan(0);
  await page.click('#elb [data-k="text"]'); await settle(page);
  await page.click('.elk[data-k="text"] [data-add]'); await settle(page);
  expect((await rows(page, 'text')).length).toBe(1);
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
  const shapeRow = page.locator(`#lyl2 .lyr[data-u="${u}"]`);
  await shapeRow.click(); await settle(page);
  expect(await shown(page)).toContain('mlist');
  expect((await rows(page, 'shape'))[0]).toMatch(/\*$/);
  expect(errors).toEqual([]);
});

test('every element panel has an Add button and it makes one element of that kind, selected (2.7.0: Motif and Stamp too)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  const kinds = async () => JSON.parse(await getState(page)).els.map(q => q.k);
  for (const k of ['text', 'shape', 'pattern', 'motif', 'stamp']) {
    await page.click(`#elb [data-k="${k}"]`); await settle(page);
    expect(await kinds()).not.toContain(k);                              // the bar button makes nothing
    await expect(page.locator(`.elk[data-k="${k}"] [data-add]`)).toBeVisible();
    const n0 = (await kinds()).filter(x => x === k).length;
    await page.click(`.elk[data-k="${k}"] [data-add]`); await settle(page);
    expect((await kinds()).filter(x => x === k).length, `Add ${k}`).toBe(n0 + 1);
    expect((await rows(page, k))[0], `${k} is selected`).toMatch(/\*$/);
  }
  expect(errors).toEqual([]);
});
