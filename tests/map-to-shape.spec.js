// 2.3.3: Text and Pattern stay free until "Map to shape" picks a Basic shapes motif: Follow outline or Inside.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, noPattern, addShape, patSource, addKind } = require('./helpers/harness');

const els = async page => JSON.parse(await getState(page)).els;
const kind = async (page, k) => (await els(page)).filter(q => q.k === k && !q.bgd);
const setRange = (page, id, v) => page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);

// the select is shown as the app's styled list, so it is set through the page
const choose = (page, id, v) => page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);

async function shapeAndText(page) {
  await addShape(page, 'ellipse');
  await page.click('#elb [data-k="text"]'); await addKind(page, 'text'); await settle(page);
}

test('a Text is free until mapped: Follow outline moves the letters onto the Shape, Free puts it back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await shapeAndText(page);
  const t0 = (await kind(page, 'text'))[0];
  expect(t0.mp).toBeUndefined();
  await expect(page.locator('#mt_g')).toBeVisible();
  const free = await page.$$eval('#dyn use[transform*="translate"]', u => u.map(x => x.getAttribute('transform')).join('|'));
  const sh = (await kind(page, 'motif'))[0];
  await choose(page, 'mt_s', String(sh.u)); await settle(page);
  const t1 = (await kind(page, 'text'))[0];
  expect(t1).toMatchObject({ mp: sh.u, mm: 'on' });
  const mapped = await page.$$eval('#dyn use[transform*="translate"]', u => u.map(x => x.getAttribute('transform')).join('|'));
  expect(mapped).not.toBe(free);
  await setRange(page, 'mt_o', 20); await settle(page);
  expect((await kind(page, 'text'))[0].mo).toBe(20);
  await choose(page, 'mt_s', ''); await settle(page);
  expect((await kind(page, 'text'))[0].mp).toBeUndefined();
  expect(errors).toEqual([]);
});

test('a Text Inside a Shape is laid out again to fit it and follows the Shape', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await shapeAndText(page);
  const sh = (await kind(page, 'motif'))[0];
  await choose(page, 'mt_s', String(sh.u));
  await page.click('#mt_m [data-m="in"]'); await settle(page);
  await expect.poll(async () => (await kind(page, 'text'))[0].tx.wd).toBeGreaterThan(0);
  const t = (await kind(page, 'text'))[0];
  expect(t.mm).toBe('in');
  expect(t.x).toBeCloseTo(sh.x, 0);
  expect(t.y).toBeCloseTo(sh.y, 0);
  expect(errors).toEqual([]);
});

test('a Pattern can follow a Shape (Count placements) or fill it (the placements inside)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await addShape(page, 'ellipse');
  await page.click('#elb [data-k="pattern"]'); await addKind(page, 'pattern'); await patSource(page);
  const sh = (await kind(page, 'motif'))[0];
  const n0 = await page.$$eval('#dyn use', u => u.length);
  await expect(page.locator('#mp_g')).toBeVisible();
  await choose(page, 'mp_s', String(sh.u)); await settle(page);
  expect((await kind(page, 'pattern'))[0]).toMatchObject({ mp: sh.u, mm: 'on' });
  const nOn = await page.$$eval('#dyn use', u => u.length);
  await setRange(page, 'mp_c', 10); await settle(page);
  const n10 = await page.$$eval('#dyn use', u => u.length);
  expect(n10).toBeLessThan(nOn);
  await page.click('#mp_m [data-m="in"]'); await settle(page);
  const nIn = await page.$$eval('#dyn use', u => u.length);
  expect(nIn).toBeGreaterThan(0);
  expect(nIn).toBeLessThan(n0 + 1);
  expect(errors).toEqual([]);
});

test('deleting the Shape sets the mapping aside: the Text is drawn free again', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await shapeAndText(page);
  const sh = (await kind(page, 'motif'))[0];
  await choose(page, 'mt_s', String(sh.u)); await settle(page);
  await openPanel(page, 'lyrs');
  await page.click('#lyl2 .lyr:last-child'); await settle(page);
  await page.keyboard.press('Delete'); await settle(page);
  expect(await kind(page, 'motif')).toHaveLength(0);
  expect(await kind(page, 'text')).toHaveLength(1);
  expect(errors).toEqual([]);
});
