// Element update, step 8 (2.1.8): the Jitter effect. A repeatable random nudge (position, rotation, size, flips) for one element; a pattern's placements each get their own.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, noPattern, patSource } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};
const addEffect = async (page, kind, label) => {
  await page.locator(`.fxg[data-fxk="${kind}"] .fxadd`).scrollIntoViewIfNeeded();
  await page.click(`.fxg[data-fxk="${kind}"] .fxadd`);
  await page.locator('.rowm .ddi', { hasText: label }).first().click();
  await settle(page);
};
const placed = async page => {
  await openPanel(page, 'stmp');
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  await canvasClick(page, 0.5, 0.5);
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  await openPanel(page, 'lyrs');
  await page.click('#lyl2 .lyr');
  await settle(page);
  await openPanel(page, 'stmp');
};
const useTransform = page => page.evaluate(() => { const u = document.querySelector('#art [data-fp] use'); return u ? u.getAttribute('transform') : ''; });

test('Jitter on a placed stamp moves it, Reroll gives another nudge, and off puts it back; the stored place does not change', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await placed(page);
  await expect.poll(() => useTransform(page)).toMatch(/rotate/);
  const plain = await useTransform(page), x0 = (await st(page)).els[0].x;
  await addEffect(page, 'stamp', 'Jitter');
  const fx = (await st(page)).els[0].fx;
  expect(fx).toHaveLength(1);
  expect(fx[0]).toMatchObject({ k: 'jitter', on: true, pos: 20, rot: 15, sz: 0 });
  await expect.poll(() => useTransform(page)).not.toBe(plain);
  const j1 = await useTransform(page);
  await page.locator('.fxg[data-fxk="stamp"] .fxjrr').click();
  await settle(page);
  await expect.poll(() => useTransform(page)).not.toBe(j1);
  expect((await st(page)).els[0].x).toBe(x0);
  await page.locator('.fxg[data-fxk="stamp"] .fxl [data-fon]').first().click();
  await settle(page);
  await expect.poll(() => useTransform(page)).toBe(plain);
  expect(errors).toEqual([]);
});

test('a pattern\'s Jitter nudges each placement differently, and the same seed gives the same picture', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'layers');
  await page.click('#elb [data-k="pattern"]'); await page.click('.elk[data-k="pattern"] [data-add]');
  await patSource(page);
  await addEffect(page, 'pattern', 'Jitter');
  const fx = (await st(page)).els.find(p => p.k == 'pattern').fx;
  expect(fx[0].k).toBe('jitter');
  const ts = () => page.evaluate(() => [...document.querySelectorAll('#art use[transform*="rotate"]')].slice(0, 6).map(u => u.getAttribute('transform')));
  await expect.poll(async () => new Set(await ts()).size).toBeGreaterThan(2);
  const a = await ts();
  await page.locator('.fxg[data-fxk="pattern"] .fxl [data-fon]').first().click();
  await page.locator('.fxg[data-fxk="pattern"] .fxl [data-fon]').first().click();
  await settle(page);
  expect(await ts()).toEqual(a);
  expect(errors).toEqual([]);
});
