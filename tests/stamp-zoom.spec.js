// The Stamp editor can be zoomed (1x to 8x), with the same controls and shortcuts as the Pattern view; at Fit nothing changes (UX review C15).
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, TARGET, openApp, openProjectFile, openPanel, setMode, settle, motifPoint } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const size = page => page.evaluate(() => { const r = document.getElementById('ed').getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });

test('zoom (no bar buttons now; keys and commands) works in the Stamp editor; in grows the editor, Fit and Ctrl+0 bring it back; Ctrl + = and Ctrl + - work', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await expect(page.locator('#zoomc')).toBeHidden();
  await expect(page.locator('#zl')).toHaveText('Fit');
  const fit = await size(page);
  await page.locator('#zi').dispatchEvent('click'); await page.locator('#zi').dispatchEvent('click');
  await expect(page.locator('#zl')).toHaveText('156%');
  const big = await size(page);
  expect(big.w / fit.w).toBeGreaterThan(1.5);
  await page.locator('#zl').dispatchEvent('click');
  await expect(page.locator('#zl')).toHaveText('Fit');
  expect(await size(page)).toEqual(fit);
  await page.keyboard.press('Control+=');
  await expect(page.locator('#zl')).toHaveText('125%');
  await page.keyboard.press('Control+-');
  await expect(page.locator('#zl')).toHaveText('Fit');
  await page.keyboard.press('Control+=');
  await page.keyboard.press('Control+0');
  await expect(page.locator('#zl')).toHaveText('Fit');
  expect(errors).toEqual([]);
});

test('a motif can still be picked and Ctrl + wheel zooms under the pointer while zoomed in the Stamp editor', async ({ page }) => {
  const { errors } = await openApp(page);
  await openProjectFile(page, path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok.json'));
  await setMode(page, 'stamp');
  await openPanel(page, 'mlist');
  for (let i = 0; i < 3; i++) await page.locator('#zi').dispatchEvent('click');
  const pt = await motifPoint(page, { bottom: 20 });      // a point on a motif that is inside the visible part of the editor
  expect(pt, 'a motif is visible at this zoom').not.toBeNull();
  await page.mouse.click(pt.x, pt.y);
  await expect(page.locator('#mlist .mr.on').first()).toBeVisible();
  const ed = await page.locator('#ed').boundingBox(), host = await page.locator('#boardS').boundingBox();
  await page.mouse.move(host.x + host.width / 2, host.y + host.height / 2);
  const before = (await size(page)).w;
  await page.keyboard.down('Control'); await page.mouse.wheel(0, -300); await page.keyboard.up('Control');
  await expect.poll(async () => (await size(page)).w).toBeGreaterThan(before);
  expect(ed.width).toBeGreaterThan(host.width);
  expect(errors).toEqual([]);
});
