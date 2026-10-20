// Element update, step 7 (2.1.7): the effect stack. An ordered list `fx` on an element, shown at the bottom of its panel: add, switch off, move, delete.
// Texture (stamp, picture, text, pattern, Sheet) and Pressure offset (stamp, pattern).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, noPattern } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
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

test('the Sheet panel has an Effects group once there is a Sheet; Texture is added, switched off, moved and deleted', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await page.click('#elb [data-k="sheet"]');
  await expect(page.locator('.fxg[data-fxk="sheet"]')).toBeHidden();
  await page.check('#sh_on');
  await settle(page);
  await expect(page.locator('.fxg[data-fxk="sheet"]')).toBeVisible();
  await addEffect(page, 'sheet', 'Texture');
  await addEffect(page, 'sheet', 'Texture');
  let fx = (await st(page)).proj.sh.fx;
  expect(fx.map(e => e.k)).toEqual(['texture', 'texture']);
  expect(fx[0].on).toBe(true);
  expect(fx[0].x).toBeTruthy();
  const second = fx[1].u;
  // switch the first off
  await page.locator('.fxg[data-fxk="sheet"] .fxl [data-fon]').first().click();
  expect((await st(page)).proj.sh.fx[0].on).toBe(false);
  // move the second one up
  await page.locator('.fxg[data-fxk="sheet"] .fxl [data-fu]').nth(1).locator('[data-fup]').click();
  expect((await st(page)).proj.sh.fx[0].u).toBe(second);
  // delete both
  await page.locator('.fxg[data-fxk="sheet"] .fxl [data-fx]').first().click();
  await page.locator('.fxg[data-fxk="sheet"] .fxl [data-fx]').first().click();
  expect((await st(page)).proj.sh.fx).toBeUndefined();
  expect(errors).toEqual([]);
});

test('a placed stamp gets Pressure offset from its own Effects group; the layer\'s own pressure is not needed', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="stamp"]');
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.5, 0.5);
  await page.click('#lfpst [data-t]');          // stop placing
  await expect(page.locator('.fxg[data-fxk="stamp"]')).toBeHidden();
  await openPanel(page, 'mlist');
  await page.click('#lfpl .mr');
  await settle(page);
  await page.click('#elb [data-k="stamp"]');
  await expect(page.locator('.fxg[data-fxk="stamp"]')).toBeVisible();
  await addEffect(page, 'stamp', 'Pressure offset');
  const q = (await st(page)).layers[0].pl[0];
  expect(q.fx).toHaveLength(1);
  expect(q.fx[0]).toMatchObject({ k: 'pressure', on: true, pst: 4, pfl: 0 });
  await expect(page.locator('.fxg[data-fxk="stamp"] .fxpp')).toBeVisible();
  await page.locator('.fxg[data-fxk="stamp"] .fxpf').fill('6');
  await settle(page);
  expect((await st(page)).layers[0].pl[0].fx[0].pfl).toBe(6);
  expect(errors).toEqual([]);
});

test('a pattern\'s effects apply to every placement', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await page.click('#penew');
  await settle(page);
  await expect(page.locator('.fxg[data-fxk="pattern"]')).toBeVisible();
  await addEffect(page, 'pattern', 'Pressure offset');
  const p = (await st(page)).layers[0].pl.filter(q => q.k === 'pattern').pop();
  expect(p.fx).toHaveLength(1);
  // the add menu offers only what works on a pattern
  await page.locator('.fxg[data-fxk="pattern"] .fxadd').scrollIntoViewIfNeeded();
  await page.click('.fxg[data-fxk="pattern"] .fxadd');
  const items = await page.locator(".rowm .ddi").allTextContents();
  expect(items.map(s => s.trim())).toEqual(['Texture', 'Pressure offset', 'Jitter', 'Colour grade']);
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('a Texture effect on the Sheet masks the paper while it is on, and not when it is off', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await page.click('#elb [data-k="sheet"]');
  await page.check('#sh_on');
  await settle(page);
  expect(await page.$$eval('#dyn mask#fmsheet', e => e.length)).toBe(0);
  await addEffect(page, 'sheet', 'Texture');
  await expect.poll(() => page.$$eval('#dyn mask#fmsheet', e => e.length), { timeout: 15000 }).toBe(1);
  await page.locator('.fxg[data-fxk="sheet"] .fxl [data-fon]').first().click();
  await expect.poll(() => page.$$eval('#dyn mask#fmsheet', e => e.length), { timeout: 15000 }).toBe(0);
  expect(errors).toEqual([]);
});

test('Pressure offset on a stamp makes its own pressure variants; without it the layer\'s zero pressure draws the plain stamp', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="stamp"]');
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.5, 0.5);
  await page.click('#lfpst [data-t]');
  await openPanel(page, 'mlist');
  await page.click('#lfpl .mr');
  await settle(page);
  await page.click('#elb [data-k="stamp"]');
  // the bitmap cache prints every variant into a bk picture, so the placed stamp's picture changes when its own pressure variant replaces the plain stamp
  const pic = () => page.evaluate(() => { const u = document.querySelector('#art [data-fp] use'); return u ? u.getAttribute('href') : ''; });
  await expect.poll(pic, { timeout: 15000 }).toMatch(/^#/);
  await settle(page);
  const plain = await pic();
  await addEffect(page, 'stamp', 'Pressure offset');
  await expect.poll(pic, { timeout: 15000 }).not.toBe(plain);
  expect(errors).toEqual([]);
});
