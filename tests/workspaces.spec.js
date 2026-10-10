// Workspaces (Phase 5): save the arrangement of the tools under a name, set it again with one click.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

// the tools that are open, group by group (each group is a set of tabs)
const groups = page => page.evaluate(() => [...document.querySelectorAll('.wg')].map(g => [...g.querySelectorAll('.wtab')].map(t => t.dataset.t)));
const row = (page, name) => page.locator('#wxl .wxr', { hasText: name });

test('the starting workspaces set exactly their own arrangement (at most two groups) and the Workspaces tool closes', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'wspc');
  await expect(page.locator('#wxl .wxh').first()).toHaveText('Starting points');
  await row(page, 'Colour work').click();
  await expect(page.locator('#pmsg')).toContainText('Colour work');
  const g = await groups(page);
  expect(g).toEqual([['colors', 'grade', 'tex'], ['rand']]);                  // the colour tools together, Randomize on its own, and the list has closed
  expect(g.length).toBeLessThanOrEqual(2);
  await openPanel(page, 'wspc');
  await row(page, 'Layout work').click();
  expect((await groups(page)).length).toBeLessThanOrEqual(2);
  await openPanel(page, 'wspc');
  await row(page, 'Everything closed').click();
  expect(await groups(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('save the current arrangement, set it again, rename it, keep it after a reload, delete it', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'canvas'); await openPanel(page, 'layers');
  await openPanel(page, 'wspc');
  const mine = (await groups(page)).flat().filter(t => t != 'wspc').sort();
  expect(mine).toEqual(['canvas', 'layers']);
  await page.fill('#wxn', 'Mine');
  await page.click('#wxsave');
  await expect(row(page, 'Mine')).toBeVisible();
  await expect(page.locator('#wxl .wxh').nth(1)).toHaveText('Yours');
  await row(page, 'Everything closed').click();
  expect((await groups(page)).flat()).toEqual([]);
  await openPanel(page, 'wspc');
  await row(page, 'Mine').click();
  expect((await groups(page)).flat().sort()).toEqual(mine);
  await openPanel(page, 'wspc');
  // rename
  await row(page, 'Mine').locator('[data-act="ren"]').click();
  await page.locator('#wxl .wxr input').fill('Mine two');
  await page.keyboard.press('Enter');
  await expect(row(page, 'Mine two')).toBeVisible();
  // it is kept with the settings: still there after a reload (the app starts with no tools open)
  await page.reload();
  await page.waitForFunction(() => window.__wbTest);
  expect(await groups(page)).toEqual([]);
  await openPanel(page, 'wspc');
  await expect(row(page, 'Mine two')).toBeVisible();
  await row(page, 'Mine two').locator('[data-act="del"]').click();
  await expect(row(page, 'Mine two')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the Stamp editor has its own arrangement in each workspace', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await openPanel(page, 'wspc');
  await row(page, 'Layout work').click();
  const g = await groups(page);
  expect(g.flat()).toEqual(expect.arrayContaining(['motifs', 'mlist', 'stamp', 'grid']));
  await setMode(page, 'pattern');
  // the Pattern view keeps what it had: Layout work sets it as well, in the same click
  expect((await groups(page)).flat()).toEqual(expect.arrayContaining(['lyrs', 'layers', 'canvas', 'pgrid']));
  expect(errors).toEqual([]);
});
