// Stamps, pictures and text placed by hand join the element list next to the Pattern (2.2.2: one list, no layers).
// A new project starts with a Pattern; the old Arrangement control (None, Repeat, Frame) is retired, and so are its tests.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, noPattern } = require('./helpers/harness');

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const els = async page => JSON.parse(await getState(page)).els;
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};

test('a stamp is placed next to the Pattern, and the Pattern stays', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'stmp');
  await page.click('#lfpst [data-t]');
  await canvasClick(page, 0.5, 0.5);
  const l = await els(page);
  expect(l.map(q => q.k)).toEqual(['pattern', 'stamp']);
  expect(l[1].t).toBeTruthy();
  expect(await page.locator('#art use[href^="#bk"]').count()).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

test('a picture and then a stamp go into the same list; each is its own placed item', async ({ page }, testInfo) => {
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
  const l = await els(page);
  expect(l.map(q => (q.a ? 'a' : q.t ? 't' : '?'))).toEqual(['a', 't']);
  await showPanel(page, 'mlist');
  await expect(page.locator('#lfpl .mr')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('typing in the Text tool places text next to the Pattern', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'Hi');
  await settle(page);
  await canvasClick(page, 0.5, 0.5);
  const ls = await els(page);
  expect(ls.some(q => q.tx)).toBe(true);
  expect(ls.some(q => q.k === 'pattern')).toBe(true);
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
