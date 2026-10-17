// Layers "+" asks what kind of layer to add, and the existing layer is left alone (UX review D1). The "Layer type" buttons in the Layout tool
// only change the selected layer, and say so.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const layers = async page => JSON.parse(await getState(page)).layers;

for (const [t, name, check] of [
  ['p', 'Repeat pattern', l => !l.free && !(l.fr && l.fr.on)],
  ['f', 'Frame', l => l.fr && l.fr.on],
  ['x', 'Free place', l => l.free && !l.art && !l.txt],
  ['a', 'Pictures', l => l.free && l.art],
  ['t', 'Text', l => l.free && l.txt],
]) {
  test(`adding a ${name} layer puts a new layer of that type above the selected one and leaves the first layer as it was`, async ({ page }) => {
    const { errors } = await openApp(page, { seed: 4 });
    await openPanel(page, 'lyrs');
    const before = (await layers(page))[0];
    await page.click('#ly_add');
    await expect(page.locator('#ly_menu')).toBeVisible();
    await expect(page.locator('#ly_menu .ddi')).toHaveText(['Repeat pattern', 'Frame', 'Free place', 'Pictures', 'Text']);
    await page.click(`#ly_menu [data-lt="${t}"]`);
    await settle(page);
    const after = await layers(page);
    expect(after.length).toBe(2);
    expect(after[0]).toEqual(before);                       // the original layer is untouched
    expect(check(after[1]), `${name}: ${JSON.stringify(after[1]).slice(0, 160)}`).toBeTruthy();
    expect(after[1].st).toEqual([JSON.parse(await getState(page)).tiles[0].id]);   // it holds the current stamp
    await expect(page.locator('#lyl2 .lyr.on')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test('the Layers list shows each layer\'s type, and the Layout tool\'s "Layer type" heading shows the selected layer\'s name', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await page.click('#ly_add');
  await page.click('#ly_menu [data-lt="f"]');
  await settle(page);
  await expect(page.locator('#lyl2 .lyr .lym').first()).toHaveText('Frame');
  await expect(page.locator('section.pn[data-p="layers"]')).toBeVisible();      // a non-repeat layer opens its Layout tool
  await expect(page.locator('#lytn')).toHaveText('Frame');
  await page.locator('#lmsel').evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))},'x');
  await settle(page);
  await expect(page.locator('#lyl2 .lyr.on .lym')).toHaveText('Free place');
  expect(errors).toEqual([]);
});
