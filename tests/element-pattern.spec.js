// Element update, step 5 (2.1.5): the Pattern element. A list of points plus sources (stamps, images, text) placed at them by cycle, random or weighted random.
// It is stored on the layer's element list as {k:'pattern'} and draws as ordinary elements; sources are references.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, addStamp, noPattern } = require('./helpers/harness');

const pats = async page => JSON.parse(await getState(page)).els.filter(q => q.k === 'pattern');
const drawn = async (page, u) => page.$$eval(`#art [data-fp^="${u}."]`, es => es.length);

test('New pattern puts a pattern on the layer with the current stamp as its source and draws a 4 x 4 grid of it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'layers');
  await expect(page.locator('#peed')).toBeHidden();
  await page.click('#penew');
  await settle(page);
  const p = (await pats(page))[0];
  expect(p).toMatchObject({ k: 'pattern', lay: 'grid', cn: 4, rn: 4, ds: 'cycle' });
  expect(p.src).toHaveLength(1);
  expect(p.src[0].k).toBe('stamp');
  await expect(page.locator('#peed')).toBeVisible();
  await expect(page.locator('#pelist .mr')).toHaveCount(1);
  expect(await drawn(page, p.u)).toBe(16);
  expect(errors).toEqual([]);
});

test('columns, rows and layout change the points; a pattern with no source draws nothing', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'layers');
  await page.click('#penew');
  await settle(page);
  const u = (await pats(page))[0].u;
  await page.locator('#pecn').fill('6'); await page.locator('#pern').fill('3');
  await settle(page);
  expect(await drawn(page, u)).toBe(18);
  await page.click('#pelay [data-l="radial"]');
  await settle(page);
  expect((await pats(page))[0].lay).toBe('radial');
  expect(await drawn(page, u)).toBeGreaterThan(18);          // 1 + 6 + 12 + 18
  await page.click('#pesrc [data-sx="0"]');
  await settle(page);
  expect(await drawn(page, u)).toBe(0);
  expect(errors).toEqual([]);
});

test('two sources alternate by cycle; Reroll changes the seed; delete takes the pattern away and undo brings it back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await addStamp(page);
  await openPanel(page, 'layers');
  await page.click('#penew');
  await page.click('#peadd');                                   // the current stamp again, as a second source
  await settle(page);
  expect((await pats(page))[0].src).toHaveLength(2);
  const s0 = (await pats(page))[0].sd;
  await page.click('#pesd');
  expect((await pats(page))[0].sd).not.toBe(s0);
  await page.click('#peds [data-d="random"]');
  expect((await pats(page))[0].ds).toBe('random');
  await page.click('#pelist [data-pd]');
  await settle(page);
  expect(await pats(page)).toHaveLength(0);
  await page.keyboard.press('Control+z');
  await settle(page);
  expect(await pats(page)).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('Frame lays points along the four edges, the sides turned to lie along them; Inset moves them in', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'layers');
  await page.click('#penew');
  await settle(page);
  const u = (await pats(page))[0].u;
  await expect(page.locator('#peinr')).toBeHidden();
  await page.click('#pelay [data-l="frame"]');
  await page.locator('#pecn').fill('5'); await page.locator('#pern').fill('3');
  await settle(page);
  await expect(page.locator('#peinr')).toBeVisible();
  expect(await drawn(page, u)).toBe(2 * 5 + 2 * 3);
  const before = (await pats(page))[0];
  expect(before.lay).toBe('frame');
  await page.locator('#pein').fill('20'); await settle(page);
  expect((await pats(page))[0].in).toBe(20);
  expect(await drawn(page, u)).toBe(16);
  expect(errors).toEqual([]);
});

test('Shift across and Shift down move a grid by a share of a cell without losing the cells that come in at the edge', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'layers');
  await page.click('#penew');
  await settle(page);
  const u = (await pats(page))[0].u;
  expect(await drawn(page, u)).toBe(16);
  await page.locator('#peox').fill('50'); await settle(page);
  expect((await pats(page))[0].ox).toBe(50);
  expect(await drawn(page, u)).toBe(20);         // shifted half a cell: the columns now sit on the cell edges, so a fifth one has its centre on the canvas edge
  await page.locator('#peoy').fill('50'); await settle(page);
  expect(await drawn(page, u)).toBe(25);
  expect(errors).toEqual([]);
});
