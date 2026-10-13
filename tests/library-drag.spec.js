// A motif can be dragged from the library onto the stamp; clicking one still arms it for stamping (UX review C7).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

test('drag a library motif onto the stamp adds one motif there; a click arms the stamp tool and adds none', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await openPanel(page, 'motifs');
  await page.click('#lfold [data-f="b:Flowers"]');                    // the library opens on the list of folders (1.2.14)
  const count = () => page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles[0].items.length);
  expect(await count()).toBe(0);
  const tile = page.locator('#lib button[data-m]').first();
  const tb = await tile.boundingBox(), ed = await page.locator('#ed').boundingBox();
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
  await page.mouse.down();
  await page.mouse.move(ed.x + ed.width / 2, ed.y + ed.height / 2, { steps: 8 });
  await page.mouse.up();
  await settle(page);
  expect(await count()).toBe(1);
  await expect(page.locator('#mdg')).toHaveCount(0);
  await tile.click();
  await settle(page);
  expect(await count()).toBe(1);
  await expect(tile).toHaveClass(/on/);
  expect(errors).toEqual([]);
});
