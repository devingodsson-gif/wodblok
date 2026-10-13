// The first minute (UX review B4): Randomize is in the top bar, an empty project offers "Add a motif" on the canvas, and an empty stamp in the tray shows a plus.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

test('launch is still fully cleared: Pattern view, no panel open, no stamps printed', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('.seg2 [data-v="pattern"]')).toHaveClass(/on/);
  expect(await page.evaluate(() => [...document.querySelectorAll('.dock.dk')].filter(d => d.offsetWidth * d.offsetHeight > 0).length), 'no tool windows open at launch').toBe(0);
  expect(JSON.parse(await getState(page)).tiles.every(t => !t.items.length)).toBe(true);
  expect(errors).toEqual([]);
});

test('Randomize is a labelled button in the top bar and rolls a piece', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  const btn = page.locator('#rzbar');
  await expect(btn).toBeVisible();
  await expect(btn).toContainText('Randomize');
  const before = await getState(page);
  await btn.click();
  await settle(page, { max: 60000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
  expect(await getState(page)).not.toBe(before);
  await expect(page.locator('#pmsg')).toContainText('Randomized');
  expect(errors).toEqual([]);
});

test('an empty project shows "Add a shape" centred on the canvas; it opens the Stamp editor and Shapes; it goes away once there is a shape', async ({ page }) => {
  const { errors } = await openApp(page);
  await expect(page.locator('#empc')).toBeVisible();
  await expect(page.locator('#empc')).toHaveText('');                // a round "+" icon, no label text
  await expect(page.locator('#empc')).toHaveAttribute('aria-label', 'Add a shape');
  const pb = await page.locator('#empc').boundingBox(), cb = await page.locator('#art').boundingBox();
  expect(Math.abs(pb.x + pb.width / 2 - (cb.x + cb.width / 2))).toBeLessThan(2);   // centred on the canvas, both ways
  expect(Math.abs(pb.y + pb.height / 2 - (cb.y + cb.height / 2))).toBeLessThan(2);
  await expect(page.locator('#tabs button.empty')).toHaveCount(1);
  await page.click('#empc');
  await settle(page);
  await expect(page.locator('.seg2 [data-v="stamp"]')).toHaveClass(/on/);
  await expect(page.locator('section.pn[data-p="motifs"]')).toBeVisible();
  await expect(page.locator('#empc')).toBeHidden();                 // not shown in the Stamp editor
  await page.locator('#lfold .lfr[data-f^="b:"]').first().click();
  await page.locator('#lib > *').first().click();
  await page.mouse.click(590, 390);
  await page.keyboard.press('Escape');
  await settle(page);
  await page.click('.seg2 [data-v="pattern"]');
  await settle(page);
  await expect(page.locator('#empc')).toBeHidden();
  await expect(page.locator('#tabs button.empty')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Randomize hides the cue too', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await page.click('#rzbar');
  await settle(page, { max: 60000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
  await expect(page.locator('#empc')).toBeHidden();
  expect(errors).toEqual([]);
});
