// Layer update, step 2 (1.46.2), rewritten for element layers in 2.1.12: any layer takes stamps, pictures and text placed by hand, next to its Pattern.
// A new layer starts with a Pattern; the old Arrangement control (None, Repeat, Frame) is retired, and so are its tests.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, noPattern } = require('./helpers/harness');

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const layers = async page => JSON.parse(await getState(page)).layers;
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};

test('"+" adds an element layer that starts with a Pattern; there is no layer type', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await expect(page.locator('#lmsel')).toHaveCount(0);
  await expect(page.locator('#ly_menu')).toHaveCount(0);
  await page.click('#ly_add');
  await settle(page);
  const ls = await layers(page);
  expect(ls.length).toBe(2);
  expect(ls[1].free).toBe(true);
  expect(ls[1].pl.map(q => q.k)).toEqual(['pattern']);
  expect(errors).toEqual([]);
});

test('a stamp is placed on a layer that has a Pattern, and the Pattern stays', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.5, 0.5);
  const l = (await layers(page))[0];
  expect(l.pl.map(q => q.k)).toEqual(['pattern', 'stamp']);
  expect(l.pl[1].t).toBeTruthy();
  expect(await page.locator('#art use[href^="#bk"]').count()).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

test('a picture and then a stamp go onto the same layer; each is its own placed item', async ({ page }, testInfo) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'elimg');
  const f = path.join(testInfo.outputDir, 'dot.png');
  fs.mkdirSync(testInfo.outputDir, { recursive: true });
  fs.writeFileSync(f, Buffer.from(PNG, 'base64'));
  await page.setInputFiles('#lfafile', f);
  await settle(page);
  await expect(page.locator('#lfars [data-a]')).toHaveCount(1);
  await expect(page.locator('#lfars [data-a].on')).toHaveCount(1);          // importing a picture arms it
  await canvasClick(page, 0.3, 0.3);
  await page.click('#lfars [data-a]');            // stop placing the picture
  await showPanel(page, 'stmp');
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.7, 0.7);
  const l = (await layers(page))[0];
  expect(l.pl.map(q => (q.a ? 'a' : q.t ? 't' : '?'))).toEqual(['a', 't']);
  await showPanel(page, 'mlist');
  await expect(page.locator('#lfpl .mr')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('typing in the Text tool places text on the selected layer, next to its Pattern', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'Hi');
  await settle(page);
  await canvasClick(page, 0.5, 0.5);
  const ls = await layers(page);
  expect(ls.length).toBe(1);
  expect(ls[0].pl.some(q => q.tx)).toBe(true);
  expect(ls[0].pl.some(q => q.k === 'pattern')).toBe(true);
  expect(errors).toEqual([]);
});

test('the Layers list says how many items a layer holds', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'stmp');
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.5, 0.5);
  await expect(page.locator('#lyl2 .lyr .lym')).toContainText('1 placed');
  expect(errors).toEqual([]);
});

test('the old Arrangement, Stamps in the pattern, Manual arrangement, Variation and Impression groups are retired; placed items live in the element panels', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  const shown = await page.locator('section.pn[data-p="layers"] > details.g').evaluateAll(els => els.filter(e => !e.hidden && e.offsetParent !== null).map(e => e.querySelector('summary').firstChild.textContent.trim()));
  for (const old of ['Arrangement', 'Stamps in the pattern', 'Manual arrangement', 'Variation', 'Impression']) expect(shown, old).not.toContain(old);
  for (const [sel, pn] of [['#lfpst', 'stmp'], ['#lfars', 'elimg'], ['#lfpl', 'mlist'], ['#lalg', 'mlist']]) {
    expect(await page.locator(sel).evaluate(e => e.closest('section.pn').dataset.p), sel).toBe(pn);
  }
  expect(errors).toEqual([]);
});
