// 2.76.4 (owner Oct 29 2026, from the 2.76 review, B5 to B12): the menu bar leaves the project title room at 1024 px, Radial and Scatter name their controls,
// the Image panel's picture row keeps the panel's padding, Export now is first, Point crop says how to start, Ctrl+D offsets the copy, Randomize names stamps by a
// running count, and the Pattern button is greyed in a stamp tab.
const { test, expect } = require('@playwright/test');
const path = require('path');
const H = require('./helpers/harness');
const IMG = path.join(__dirname, 'fixtures', 'picture.png');

test('Radial and Scatter name their controls', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await page.click('#elb [data-k="pattern"]'); await H.addKind(page, 'pattern'); await H.settle(page);
  const lab = id => page.evaluate(id => document.getElementById(id).closest('.ctl').firstElementChild.textContent, id);
  await page.click('#pelay [data-l="radial"]'); await H.settle(page);
  expect([await lab('pecn'), await lab('pern')]).toEqual(['Spokes', 'Rings']);
  await page.click('#pelay [data-l="scatter"]'); await H.settle(page);
  expect([await lab('pecn'), await lab('pern')]).toEqual(['Across', 'Down']);
  await page.click('#pelay [data-l="frame"]'); await H.settle(page);
  expect([await lab('pecn'), await lab('pern')]).toEqual(['Columns', 'Rows']);
  expect(errors).toEqual([]);
});

test('Ctrl+D puts the copy a step away from the original', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, background: true });
  const u = await H.addShape(page, 'rect'); await H.settle(page);
  const els = async () => JSON.parse(await H.getState(page)).els.filter(q => q.k === 'motif');
  const before = await els();
  await page.keyboard.press('Control+d'); await H.settle(page);
  const after = await els();
  expect(after.length).toBe(before.length + 1);
  const a = after.find(q => q.u === u), b = after.find(q => q.u !== u);
  expect(b.x).not.toBe(a.x); expect(b.y).not.toBe(a.y);   // before 2.76.4 the copy sat exactly on the original
  expect(errors).toEqual([]);
});

test('Export now is the first thing in Custom export', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await H.showPanel(page, 'xrec'); await H.settle(page);
  const first = await page.evaluate(() => { const b = document.getElementById('xrnow'); return b.closest('.gb').firstElementChild.contains(b) });
  expect(first).toBe(true);
  expect(errors).toEqual([]);
});

test('Point crop says how to start, and fewer than 3 points do not apply on Enter', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await page.click('#elb [data-k="image"]'); await H.settle(page);
  await page.setInputFiles('section.pn[data-p="image"] .pcfile', IMG); await H.settle(page, { max: 30000 });
  await page.click('#im_pcrop');
  await expect(page.locator('#pmsg')).toContainText('click the picture to add points');
  await page.keyboard.press('Enter');
  await expect(page.locator('#pmsg')).toContainText('at least 3 points');
  expect(errors).toEqual([]);
});

test('Randomize names stamps by a running count', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 5, pattern: false });
  await page.click('#rzdo'); await page.waitForTimeout(300); await H.settle(page, { max: 60000 });
  const names = (await page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles || [])).map(t => t.nm).filter(Boolean);
  const nums = names.map(n => /^Stamp (\d+)$/.exec(n)).filter(Boolean).map(m => +m[1]).sort((a, b) => a - b);
  if (nums.length) expect(nums[0]).toBe(1);
  nums.forEach((n, i) => expect(n).toBe(i + 1));
  expect(errors).toEqual([]);
});

test('the Pattern button is greyed in a stamp tab', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await H.addStamp(page);
  await H.unlockStamp(page); await H.settle(page);
  await expect(page.locator('#elb [data-k="pattern"]')).toBeDisabled();
  expect(errors).toEqual([]);
});
