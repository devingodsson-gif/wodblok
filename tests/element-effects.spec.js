// Element update, step 7 (2.1.7): the effect stack. An ordered list `fx` on an element, shown at the bottom of its panel: add, switch off, move, delete.
// Texture (stamp, text, pattern, Shape) and Pressure offset (stamp, pattern).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, noPattern, addShape, addKind } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const sheetOf = d => (d.els || []).find(q => q.k === 'motif' && !q.bgd);   // the effects tests use a Motif element (the Sheet is gone)
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};
const addEffect = async (page, kind, label) => {
  await page.locator(`.fxg[data-fxk="${kind}"] .fxadd`).scrollIntoViewIfNeeded();   // a scroll closes a menu, so scroll first
  await page.click(`.fxg[data-fxk="${kind}"] .fxadd`);
  await page.locator(".rowm .ddi", { hasText: label }).first().click();
  await settle(page);
};

// 2.3.0: an effect is a row (.fxr, data-fu) with an eye (data-fon) and a ⋯ menu (data-fmore: Duplicate, Move up, Move down, Delete); no up/down/delete buttons
const fxRows = (page, kind) => page.locator(`.fxg[data-fxk="${kind}"] [data-fu]`);
const fxMenu = async (page, kind, n, label) => { const more = fxRows(page, kind).nth(n).locator('[data-fmore]'); await more.scrollIntoViewIfNeeded(); await page.waitForTimeout(100); await more.click(); await page.locator('.rowm .ddi', { hasText: label }).first().click(); await settle(page); };

test('a Motif has an Effects group; Texture is added, switched off, moved and deleted', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addShape(page);
  await settle(page);
  await expect(page.locator('.fxg[data-fxk="motif"]')).toBeVisible();
  await addEffect(page, 'motif', 'Texture');
  await addEffect(page, 'motif', 'Texture');
  let fx = sheetOf(await st(page)).fx;
  expect(fx.map(e => e.k)).toEqual(['texture', 'texture']);
  expect(fx[0].on).toBe(true);
  expect(fx[0].x).toBeTruthy();
  const second = fx[1].u;
  // switch the first off
  await fxRows(page, 'motif').nth(0).locator('[data-fon]').click(); await settle(page);
  expect(sheetOf(await st(page)).fx[0].on).toBe(false);
  // move the second one up
  await fxMenu(page, 'motif', 1, 'Move up');
  expect(sheetOf(await st(page)).fx[0].u).toBe(second);
  // delete both
  await fxMenu(page, 'motif', 0, 'Delete');
  await fxMenu(page, 'motif', 0, 'Delete');
  expect(sheetOf(await st(page)).fx).toBeUndefined();
  expect(errors).toEqual([]);
});

test('a placed stamp gets Pressure offset from its own Effects group; the layer\'s own pressure is not needed', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'stmp');
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  await canvasClick(page, 0.5, 0.5);
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');          // stop placing
  await expect(page.locator('.fxg[data-fxk="stamp"]')).toBeHidden();
  await openPanel(page, 'lyrs');
  await page.click('#lyl2 .lyr');
  await settle(page);
  await openPanel(page, 'stmp');
  await expect(page.locator('.fxg[data-fxk="stamp"]')).toBeVisible();
  await addEffect(page, 'stamp', 'Pressure offset');
  const q = (await st(page)).els[0];
  expect(q.fx).toHaveLength(1);
  expect(q.fx[0]).toMatchObject({ k: 'pressure', on: true, pst: 4, pfl: 0 });
  await expect(page.locator('.fxg[data-fxk="stamp"] .fxpp')).toBeVisible();
  await page.locator('.fxg[data-fxk="stamp"] .fxpf').fill('6');
  await settle(page);
  expect((await st(page)).els[0].fx[0].pfl).toBe(6);
  expect(errors).toEqual([]);
});

test('a pattern\'s effects apply to every placement', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await page.click('#elb [data-k="pattern"]'); await addKind(page, 'pattern');
  await settle(page);
  await expect(page.locator('.fxg[data-fxk="pattern"]')).toBeVisible();
  await addEffect(page, 'pattern', 'Pressure offset');
  const p = (await st(page)).els.filter(q => q.k === 'pattern').pop();
  expect(p.fx).toHaveLength(1);
  // the add menu offers only what works on a pattern
  await page.locator('.fxg[data-fxk="pattern"] .fxadd').scrollIntoViewIfNeeded();
  await page.click('.fxg[data-fxk="pattern"] .fxadd');
  const items = await page.locator(".rowm .ddi").allTextContents();
  expect(items.map(s => s.trim())).toEqual(['Texture', 'Pressure offset', 'Jitter', 'Colour grade']);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('Pressure offset on a stamp makes its own pressure variants; without it the layer\'s zero pressure draws the plain stamp', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'stmp');
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  await canvasClick(page, 0.5, 0.5);
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  await openPanel(page, 'lyrs');
  await page.click('#lyl2 .lyr');
  await settle(page);
  await openPanel(page, 'stmp');
  // the bitmap cache prints every variant into a bk picture, so the placed stamp's picture changes when its own pressure variant replaces the plain stamp
  const pic = () => page.evaluate(() => { const u = document.querySelector('#art [data-fp] use'); return u ? u.getAttribute('href') : ''; });
  await expect.poll(pic, { timeout: 15000 }).toMatch(/^#/);
  await settle(page);
  const plain = await pic();
  await addEffect(page, 'stamp', 'Pressure offset');
  await expect.poll(pic, { timeout: 15000 }).not.toBe(plain);
  expect(errors).toEqual([]);
});
