// Phase 3b: crash recovery. Unsaved work is copied to a recovery slot; after a crash or a closed tab it can be restored.
const path = require('path');
const { test, expect } = require('@playwright/test');
const { TARGET, ROOT, openApp, openProjectFile, openPanel, settle, getState } = require('./helpers/harness');
const FIX = path.join(ROOT, 'tests', 'fixtures', 'project-3-rect-16x9.wodblok.json');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

async function workAndTick(page) {
  await openProjectFile(page, FIX);
  await openPanel(page, 'rand'); await page.click('#rzdo'); await settle(page);
  const changed = await getState(page);
  await page.evaluate(() => window.__wbTest.recoveryTick());
  return changed;
}

test('unsaved work is offered back after the page is closed, and restoring brings it back unsaved', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }), page = await ctx.newPage();
  const a = await openApp(page);
  await expect(page.locator('#rcv')).toBeHidden();
  const changed = await workAndTick(page);
  await page.close();
  const p2 = await ctx.newPage(), b = await openApp(p2);
  await expect(p2.locator('#rcv')).toBeVisible();
  await p2.click('#rcv'); await settle(p2);
  expect(await getState(p2)).toBe(changed);
  await expect(p2.locator('#rcv')).toBeHidden();
  await expect(p2.locator('#pst')).toHaveClass(/dirty/);
  // once restored, it does not come back on the next launch
  await p2.reload(); await p2.waitForFunction(() => document.fonts.status === 'loaded'); await settle(p2);
  await expect(p2.locator('#rcv')).toBeHidden();
  expect(a.errors.concat(b.errors)).toEqual([]);
  await ctx.close();
});

test('saved work leaves nothing to restore, and Dismiss removes the offer for good', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }), page = await ctx.newPage();
  await openApp(page);
  await workAndTick(page);
  await page.click('#psv'); await settle(page);
  await page.evaluate(() => window.__wbTest.recoveryTick());               // clean now: the recovery copy is dropped
  await page.close();
  const p2 = await ctx.newPage(); await openApp(p2);
  await expect(p2.locator('#rcv')).toBeHidden();
  await workAndTick(p2); await p2.close();
  const p3 = await ctx.newPage(); await openApp(p3);
  await expect(p3.locator('#rcv')).toBeVisible();
  await p3.click('#rcx');
  await expect(p3.locator('#rcv')).toBeHidden();
  await p3.reload(); await p3.waitForFunction(() => document.fonts.status === 'loaded'); await settle(p3);
  await expect(p3.locator('#rcv')).toBeHidden();
  await ctx.close();
});

// 1.0.12: the offer also shows on the empty canvas (the Pattern view), where people look; the status-bar buttons stay.
test('the recovery offer also shows on the canvas, and its buttons do the same as the ones in the status bar', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }), page = await ctx.newPage();
  await openApp(page);
  const changed = await workAndTick(page);
  await page.close();
  const p2 = await ctx.newPage(), b = await openApp(p2);
  await expect(p2.locator('#rcc')).toBeVisible();
  await expect(p2.locator('#empc')).toBeHidden();                                  // the "Add a motif" pill gives way
  await p2.click('#rcc-go'); await settle(p2);
  expect(await getState(p2)).toBe(changed);
  await expect(p2.locator('#rcc')).toBeHidden();
  await expect(p2.locator('#rcv')).toBeHidden();
  expect(b.errors).toEqual([]);
  await ctx.close();
});
