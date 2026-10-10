// Dragging a box on empty block space selects the motifs it touches; Shift keeps the earlier selection (UX review D7).
const { test, expect } = require('@playwright/test');
const path = require('path');
const { ROOT, TARGET, openApp, openProjectFile, openPanel, setMode, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

test('drag a box over empty space to select several motifs', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openProjectFile(page, path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok.json'));
  await setMode(page, 'stamp');
  const ed = await page.locator('#ed').boundingBox();
  const count = () => page.evaluate(() => window.__wbTest && JSON.parse(window.__wbTest.state()).tiles[0].items.length);
  expect(await count()).toBeGreaterThan(1);
  await openPanel(page, 'mlist');
  await page.mouse.move(ed.x + 2, ed.y + 2);
  await page.mouse.down();
  await page.mouse.move(ed.x + ed.width - 2, ed.y + ed.height - 2, { steps: 6 });
  await expect(page.locator('#mqb')).toBeVisible();
  await page.mouse.up();
  await settle(page);
  await expect(page.locator('#mqb')).toBeHidden();
  const selected = await page.evaluate(() => document.querySelectorAll('#mlist .mr.on').length);
  expect(selected).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
