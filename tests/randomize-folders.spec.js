// Randomize: shape folders (1.6.0). A roll takes its shapes only from the ticked library folders; all ticked works as before.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in 1.6.0'); });

const roll = async page => { await page.click('#rzdo'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };
const usedKeys = async page => new Set([...(await getState(page)).matchAll(/"m":"(b\d+|i\|[^"]*)"/g)].map(m => m[1]));
const birdKeys = async page => {
  await openPanel(page, 'motifs');
  await page.locator('#lib .lfr[data-f="b:Birds"]').click();
  const ks = await page.locator('#lib button[data-m]').evaluateAll(b => b.map(x => x.dataset.m));
  return new Set(ks);
};

test('the row starts on All, lists the library folders, and keeps one folder ticked', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 5 });
  await openPanel(page, 'rand');
  await expect(page.locator('[data-rzfx] .rzn')).toHaveText('All');
  await page.click('[data-rzfx]');
  const boxes = page.locator('[data-rzflist] input[data-fv]');
  expect(await boxes.count()).toBeGreaterThan(5);
  await expect(page.locator('[data-rzflist] input[data-fv="b:Birds"]')).toBeChecked();
  await page.click('[data-rzfno]');                                    // None leaves one folder ticked, never zero
  const left = await page.locator('[data-rzflist] input[data-fv]:checked').count();
  expect(left).toBe(1);
  await page.locator('[data-rzflist] input[data-fv]:checked').click({ force: true });   // the last one cannot be unticked
  expect(await page.locator('[data-rzflist] input[data-fv]:checked').count()).toBe(1);
  await page.click('[data-rzfall]');
  await expect(page.locator('[data-rzfx] .rzn')).toHaveText('All');
  expect(errors).toEqual([]);
});

test('with only Birds ticked, every library shape a roll uses is a bird; the choice survives a reload', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 11 });
  const birds = await birdKeys(page);
  expect(birds.size).toBe(37);
  await openPanel(page, 'rand');
  await page.click('[data-rzfx]');
  await page.click('[data-rzfno]');
  await page.locator('[data-rzflist] input[data-fv="b:Birds"]').check();
  await page.locator('[data-rzflist] input[data-fv]:checked:not([data-fv="b:Birds"])').evaluateAll(b => b.forEach(x => x.click()));
  expect(await page.locator('[data-rzflist] input[data-fv]:checked').count()).toBe(1);
  await expect(page.locator('[data-rzfx] .rzn')).toHaveText(/^1\/\d+$/);
  for (let i = 0; i < 4; i++) {
    await roll(page);
    const used = await usedKeys(page);
    expect(used.size).toBeGreaterThan(0);
    for (const k of used) expect(birds.has(k), 'shape ' + k + ' is not a bird').toBe(true);
  }
  await page.reload(); await page.waitForFunction(() => document.fonts.status === 'loaded'); await settle(page);
  await openPanel(page, 'rand');
  await expect(page.locator('[data-rzfx] .rzn')).toHaveText(/^1\/\d+$/);
  expect(errors).toEqual([]);
});
