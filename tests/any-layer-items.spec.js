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

test('the old Arrangement, Stamps in the pattern, Manual arrangement, Variation and Impression groups are retired; placed items live in the element panels', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  const shown = await page.locator('section.pn[data-p="layers"] > details.g').evaluateAll(els => els.filter(e => !e.hidden && e.offsetParent !== null).map(e => e.querySelector('summary').firstChild.textContent.trim()));
  for (const old of ['Arrangement', 'Stamps in the pattern', 'Manual arrangement', 'Variation', 'Impression']) expect(shown, old).not.toContain(old);
  for (const [sel, pn] of [['#lfpst', 'stmp'], ['#lfars', 'mlist'], ['#lalg', 'mlist']]) {
    expect(await page.locator(sel).evaluate(e => e.closest('section.pn').dataset.p), sel).toBe(pn);
  }
  expect(errors).toEqual([]);
});
