// "No Claude-generated motifs" (CLAUDE.md; UX review C11): no "Draw with Claude" section and no empty "Drawn by Claude" folder in the library.
// The built-in sets stay (a decision for the owner, Q3): an old project that uses them must still print, and a new one needs something to start with.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, setMode } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'the v100 file has these by design'); });

test('the Shapes panel has no Draw with Claude section and the folder list has no empty "Drawn by Claude"', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await page.click('.rail [data-pn="motifs"]');
  await expect(page.locator('summary', { hasText: 'Draw with Claude' })).toBeHidden();
  const folders = await page.locator('#lfold .lfr .lfn').allTextContents();      // the library opens on the list of folders (1.2.14)
  expect(folders.some(f => /Drawn by Claude/.test(f))).toBe(false);
  expect(folders.some(f => /My imports/.test(f))).toBe(true);
  await page.click('#lfold [data-f="g:Old shapes"]'); await page.click('#lfold [data-f="b:Plants"]');
  expect(await page.locator('#lib > *').count()).toBeGreaterThan(0);      // there is still something to place
  expect(errors).toEqual([]);
});
