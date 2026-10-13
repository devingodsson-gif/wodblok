// Shape library browsing (1.5.0): "expand all" shows every folder's shapes in one scrolling view, each folder can be collapsed,
// and a slider sets how big the shapes are.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in 1.5.0'); });
async function open(page) { const r = await openApp(page); await setMode(page, 'stamp'); await openPanel(page, 'motifs'); return r; }
const cols = page => page.evaluate(() => getComputedStyle(document.getElementById('lib')).gridTemplateColumns.split(' ').length);

test('expand all shows every folder and its shapes at once; each folder collapses; opening one leaves the view', async ({ page }) => {
  const { errors } = await open(page);
  await expect(page.locator('#lib')).toBeHidden();
  await page.click('#fbrw');
  await expect(page.locator('#fbrw')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#lfold')).toBeHidden();
  await expect(page.locator('#lib .lsh')).toHaveCount(20);                      // the 20 built-in sets (My imports is empty, so it has no heading)
  await expect(page.locator('#lib button[data-m]')).toHaveCount(463);
  await page.locator('#lib .lsh[data-s="b:Flowers"]').click();                  // collapse one
  await expect(page.locator('#lib .lsh[data-s="b:Flowers"]')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#lib button[data-m]')).toHaveCount(463 - 55);
  await page.locator('#lib .lsh[data-s="b:Flowers"]').click();
  await expect(page.locator('#lib button[data-m]')).toHaveCount(463);
  await page.locator('#lib .lsh[data-s="b:Birds"] [data-o]').click();           // the open button goes into that folder
  await expect(page.locator('#lcr')).toHaveText('Birds');
  await expect(page.locator('#lfold')).toBeHidden();
  await expect(page.locator('#fbrw')).toBeHidden();                              // a folder with no folders inside has nothing to expand
  await page.click('#lback');
  await expect(page.locator('#fbrw')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#lfold .lfr').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('a shape in the expanded view picks as the brush like any other shape; the button toggles back to the list', async ({ page }) => {
  const { errors } = await open(page);
  await page.click('#fbrw');
  await page.locator('#lib button[data-m]').nth(3).click();
  await settle(page);
  await expect(page.locator('#lib button[data-m].on')).toHaveCount(1);          // the brush is set
  await page.click('#fbrw');
  await expect(page.locator('#lib')).toBeHidden();
  await expect(page.locator('#lfold .lfr').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('the size slider changes how many shapes fit in a row and is remembered', async ({ page }) => {
  const { errors } = await open(page);
  await page.click('#fbrw');
  expect(await cols(page)).toBe(4);
  await page.locator('#lsz').fill('8');
  expect(await cols(page)).toBe(2);
  await page.locator('#lsz').fill('0');
  expect(await cols(page)).toBe(10);
  const w = await page.locator('#lib button[data-m]').first().evaluate(b => b.getBoundingClientRect().width);
  expect(w).toBeGreaterThan(10);
  await page.locator('#lsz').fill('8');
  await page.reload(); await setMode(page, 'stamp'); await openPanel(page, 'motifs');
  await expect(page.locator('#lsz')).toHaveValue('8');
  expect(errors).toEqual([]);
});
