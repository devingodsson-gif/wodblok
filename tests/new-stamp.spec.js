// New stamp (+) used to throw "isDef is not defined" and add nothing (UX review B1; the bug is also in v100).
const { test, expect } = require('@playwright/test');
const { openApp, addStamp, settle, getState, unlockStamp, stampInstance, clickStamp, openPanel } = require('./helpers/harness');

test('New stamp adds a blank stamp, selects it, and raises no page error', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  const before = JSON.parse(await getState(page)).tiles.length;
  await addStamp(page);
  const s = JSON.parse(await getState(page));
  expect(s.tiles.length).toBe(before + 1);
  expect(s.tiles[s.tiles.length - 1].items.length).toBe(0);
  expect(errors).toEqual([]);
  await page.keyboard.press('Control+z');
  await settle(page);
  expect(JSON.parse(await getState(page)).tiles.length).toBe(before);
});

test('Send to back puts the selected motif behind the others (UX review D8)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  await unlockStamp(page);
  await openPanel(page, 'motifs');
  await page.click('#lib .lfr[data-f="b:Flowers"]');                // folders open in place (1.5.0)
  const lib = page.locator('#lib button[data-m]');
  const p = await stampInstance(page);
  const n0 = JSON.parse(await getState(page)).tiles[0].items.length;
  for (const n of [0, 1]) {
    await lib.nth(n).click();
    await clickStamp(page, p, n ? 55 : -55, 0);
    await page.keyboard.press('Escape');
    await settle(page);
  }
  const before = JSON.parse(await getState(page)).tiles[0].items.map(i => i.m).slice(n0);
  expect(before.length).toBe(2);
  await clickStamp(page, p, 55, 0);   // select the second, front-most motif
  await expect(page.locator('#ssb')).toBeVisible();
  await page.click('#ssb');
  await settle(page);
  const after = JSON.parse(await getState(page)).tiles[0].items.map(i => i.m);
  expect(before[1]).not.toBe(before[0]);
  expect(after.length).toBe(n0 + 2);
  expect(after[0]).toBe(before[1]);                               // to the back of the stamp: first in the list
  expect(errors).toEqual([]);
});

test('a new or duplicated stamp is added to the current layer, and Undo takes it out again (UX review B2)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 3 });
  const st = async () => { const s = JSON.parse(await getState(page)); return { tiles: s.tiles.map(t => t.id), layer: s.layers[0].st }; };
  const before = await st();
  await addStamp(page);
  const afterNew = await st();
  expect(afterNew.tiles.length).toBe(before.tiles.length + 1);
  expect(afterNew.layer).toContain(afterNew.tiles[afterNew.tiles.length - 1]);
  await page.click('#smkdup');
  await settle(page);
  const afterDup = await st();
  expect(afterDup.tiles.length).toBe(afterNew.tiles.length + 1);
  const added = afterDup.tiles.filter(id => !afterNew.tiles.includes(id));
  expect(added.length).toBe(1);
  expect(afterDup.layer).toContain(added[0]);
  await page.keyboard.press('Control+z');
  await settle(page);
  const undone = await st();
  expect(undone.tiles).toEqual(afterNew.tiles);
  expect(undone.layer).toEqual(afterNew.layer);
  expect(errors).toEqual([]);
});

test('A new stamp starts with no block edge (thickness and roughness 0)', async ({ page }) => {
  await openApp(page, { seed: 3 });
  await addStamp(page);
  const s = JSON.parse(await getState(page));
  const t = s.tiles[s.tiles.length - 1];
  expect(t.et).toBe(0);
  expect(t.er).toBe(0);
});
