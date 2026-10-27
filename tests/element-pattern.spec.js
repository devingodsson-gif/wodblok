// Element update, step 5 (2.1.5): the Pattern element. A list of points plus sources (stamps, images, text) placed at them by cycle, random or weighted random.
// It is stored on the layer's element list as {k:'pattern'} and draws as ordinary elements; sources are references.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, addStamp, noPattern, patSource, addKind } = require('./helpers/harness');

const pats = async page => JSON.parse(await getState(page)).els.filter(q => q.k === 'pattern');
const drawn = async (page, u) => page.$$eval(`#art [data-fp^="${u}."]`, es => es.length);

test('New pattern is empty: each point of its grid shows as an arrow until a source is added from the Add element list', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'layers');
  await expect(page.locator('#peed')).toBeHidden();
  await page.click('#elb [data-k="pattern"]'); await addKind(page, 'pattern');
  await settle(page);
  const p = (await pats(page))[0];
  expect(p).toMatchObject({ k: 'pattern', lay: 'tile', ts: 'auto', ds: 'cycle', cn: 5, rn: 7 });   // 2.57.0: a new pattern tiles (cn, rn stay for Radial and the others)
  expect(p.src).toHaveLength(0);
  await expect(page.locator('#peed')).toBeVisible();
  await expect(page.locator('#pelist .mr')).toHaveCount(1);
  expect(await drawn(page, p.u)).toBe(0);
  const arrows = await page.locator('#fpov [data-pa]').count();
  expect(arrows).toBeGreaterThan(20);
  // 2.28.0: Add source is a menu of the project's stamps (and texts) that ends with the library
  await page.click('#peadd');
  const items = await page.$$eval('.rowm .ddi', g => g.map(x => x.textContent));
  expect(items[0]).toMatch(/^Stamp /);
  expect(items[items.length - 1]).toBe('Shape from the library…');
  await page.keyboard.press('Escape');
  await patSource(page);
  expect((await pats(page))[0].src).toHaveLength(1);
  expect((await pats(page))[0].src[0].k).toBe('stamp');
  expect(await drawn(page, p.u)).toBe(arrows);                                // a piece at every place
  await expect(page.locator('#fpov [data-pa]')).toHaveCount(0);   // placed pieces replace the arrows
  await patSource(page, 'motif', 3);
  expect((await pats(page))[0].src.map(s => s.k)).toEqual(['stamp', 'motif']);
  const st2 = await drawn(page, p.u), mo = await page.$$eval('#dyn g[data-mv]', e => e.length);
  expect(st2 + mo).toBe(arrows); expect(Math.abs(st2 - mo)).toBeLessThanOrEqual(arrows * 0.25);   // cycle: every other column is the motif (2.57.0)
  expect(errors).toEqual([]);
});

test('arrows turn with Rotate and lie along the edges of a Frame', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="pattern"]'); await addKind(page, 'pattern'); await settle(page);
  const rots = () => page.$$eval('#fpov [data-pa]', a => a.map(x => Math.round(+/rotate\((-?[\d.]+)\)/.exec(x.getAttribute('transform'))[1])));
  expect(new Set(await rots())).toEqual(new Set([0]));
  await page.locator('#pert').fill('30'); await settle(page);
  expect(new Set(await rots())).toEqual(new Set([30]));
  await page.locator('#pert').fill('0');
  await page.click('#pelay [data-l="frame"]'); await settle(page);
  expect(new Set(await rots())).toEqual(new Set([0, 90]));
  expect(errors).toEqual([]);
});

test('Radial takes columns and rows; a pattern with no source draws nothing', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'layers');
  await page.click('#elb [data-k="pattern"]'); await addKind(page, 'pattern');
  await patSource(page);
  const u = (await pats(page))[0].u;
  expect(await drawn(page, u)).toBeGreaterThan(0);
  await page.click('#pelay [data-l="radial"]');   // 2.57.0: columns and rows belong to the free layouts
  await page.locator('#pecn').fill('6'); await page.locator('#pern').fill('3');
  await settle(page);
  expect((await pats(page))[0].lay).toBe('radial');
  expect(await drawn(page, u)).toBe(1 + 6 + 12 + 18);
  await page.click('#pesrc [data-sx="0"]');
  await settle(page);
  expect(await drawn(page, u)).toBe(0);
  await expect(page.locator('#fpov [data-pa]')).not.toHaveCount(0);   // with no source the points show as arrows again
  expect(errors).toEqual([]);
});

test('two sources alternate by cycle; Reroll changes the seed; delete takes the pattern away and undo brings it back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await addStamp(page);
  await openPanel(page, 'layers');
  await page.click('#elb [data-k="pattern"]'); await addKind(page, 'pattern');
  await patSource(page); await patSource(page);                  // the stamp twice: two sources
  await settle(page);
  expect((await pats(page))[0].src).toHaveLength(2);
  const s0 = (await pats(page))[0].sd;
  await page.click('#pesd');
  expect((await pats(page))[0].sd).not.toBe(s0);
  await page.click('#peds [data-d="random"]');
  expect((await pats(page))[0].ds).toBe('random');
  await page.evaluate(() => document.querySelector('#pelist [data-pd]').click());
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
  await page.click('#elb [data-k="pattern"]'); await addKind(page, 'pattern');
  await patSource(page);
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

test('Shift across and Shift down move a tiling by a share of a piece (2.57.0)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'layers');
  await page.click('#elb [data-k="pattern"]'); await addKind(page, 'pattern');
  await patSource(page);
  const p = (await pats(page))[0], u = p.u, view = await page.locator('#art').evaluate(a => ({ w: a.viewBox.baseVal.width, h: a.viewBox.baseVal.height })), step = Math.min(view.w, view.h) * p.ps / 100;
  // where the pieces sit across, as a share of a step (0..1)
  const frac = async () => { const xs = await page.$$eval(`#art [data-fp^="${u}."]`, es => es.map(e => +/translate\(([-\d.]+)/.exec(e.getAttribute('transform'))[1])); const f = xs.map(x => ((x / step) % 1 + 1) % 1); return f[0]; };
  const f0 = await frac();
  await page.locator('#peox').fill('50'); await settle(page);
  expect((await pats(page))[0].ox).toBe(50);
  const d = (((await frac()) - f0) % 1 + 1) % 1;
  expect(Math.abs(d - 0.5)).toBeLessThan(0.02);   // moved half a piece across
  expect(errors).toEqual([]);
});
