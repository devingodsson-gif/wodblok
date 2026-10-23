const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, noPattern, addShape } = require('./helpers/harness');
// 2.21.0: one Randomize button (the top bar). A roll replaces the previous roll and leaves your own elements alone; the switch in the Randomize panel starts from an empty canvas instead.
const st = async page => JSON.parse(await getState(page));
const roll = async page => { await page.click('#rzdo'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('#fzst.on')); };

test('there is one Randomize button, in the top bar', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  expect(await page.locator('#rzdo').count()).toBe(1);
  await expect(page.locator('#rzdo')).toBeVisible();
  expect(await page.locator('header.top #rzdo').count()).toBe(1);
  expect(errors).toEqual([]);
});

test('a roll replaces the previous roll: the count does not grow roll after roll, and your own shape stays', async ({ page }) => {
  test.setTimeout(240000);
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await addShape(page);
  const own = (await st(page)).els.find(q => q.k === 'motif' && !q.bgd).u;
  const counts = [];
  for (let i = 0; i < 4; i++) { await roll(page); const s = await st(page); counts.push(s.els.length); expect(s.els.some(q => q.u === own), 'roll ' + (i + 1)).toBe(true); }
  expect(Math.max(...counts)).toBeLessThan(counts[0] * 3);   // before 2.21.0 each roll kept every earlier one on top
  expect(errors).toEqual([]);
});

test('the switch "Start from an empty canvas" removes your own elements before a roll, and is remembered', async ({ page }) => {
  test.setTimeout(240000);
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await addShape(page);
  const own = (await st(page)).els.find(q => q.k === 'motif' && !q.bgd).u;
  await page.evaluate(() => window.__wbTest.commands.run('panel.rand'));
  await settle(page);
  await page.locator('#rzfresh').check(); await settle(page);
  await roll(page);
  expect((await st(page)).els.some(q => q.u === own)).toBe(false);
  await page.reload(); await page.waitForFunction(() => window.__wbTest); await settle(page);
  expect(await page.evaluate(() => document.getElementById('rzfresh').checked)).toBe(true);
  expect(errors).toEqual([]);
});

test('your own placed stamp survives rolls and still points at a stamp that exists', async ({ page }) => {
  test.setTimeout(240000);
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  const { addKind } = require('./helpers/harness');
  await page.click('#elb [data-k="stamp"]'); await addKind(page, 'stamp'); await settle(page);
  const own = (await st(page)).els.find(q => q.k === 'stamp').u;
  for (let i = 0; i < 3; i++) {
    await roll(page);
    const s = await st(page), q = s.els.find(e => e.u === own);
    expect(q, 'roll ' + (i + 1)).toBeTruthy();
    expect(s.tiles.some(t => t.id === q.t), 'its stamp exists').toBe(true);
  }
  expect(errors).toEqual([]);
});
