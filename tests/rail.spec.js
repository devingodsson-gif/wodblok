// The tool rail (UX review C4): shared tools sit in the same slots in both views, every tool has one name (rail, tab and command search),
// and the names show beside the icons in wide windows.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, setMode } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const labels = page => page.locator('.rail button:visible').evaluateAll(b => b.map(x => x.getAttribute('aria-label')));
const SHARED = ['Close all panels', 'Randomize', 'Colours', 'Presets', 'Stamp library', 'Colour grading', 'Textures', 'History', 'Workspaces'];

test('the shared tools are the first nine rail buttons, in the same order, in Pattern and in the Stamp editor', async ({ page }) => {
  const { errors } = await openApp(page);
  const pattern = await labels(page);
  await setMode(page, 'stamp');
  const stamp = await labels(page);
  expect(pattern.slice(0, 9)).toEqual(SHARED);
  expect(stamp.slice(0, 9)).toEqual(SHARED);
  expect(pattern.slice(9)).toEqual(['Canvas', 'Layers', 'Layout', 'Guides', 'Navigator', 'Variations', 'Export recipes']);
  expect(stamp.slice(9)).toEqual(['Stamp', 'Motifs', 'Text', 'Stamp grid', 'Motif list', 'Pattern preview']);
  expect(errors).toEqual([]);
});

test('each tool has one name: the rail, the tab it opens, and "Open …" in command search agree', async ({ page }) => {
  const { errors } = await openApp(page);
  const cmds = await page.evaluate(() => window.__wbTest.commands.list().map(c => c.label));
  for (const mode of ['pattern', 'stamp']) {
    await setMode(page, mode);
    for (const b of await page.locator('.rail [data-pn]:visible').all()) {
      const name = await b.getAttribute('aria-label');
      await page.click('#rcls');
      await b.click();
      await expect(page.locator('.wtab.on').first(), `the tab for ${name}`).toHaveText(name);
      expect(cmds, `command "Open ${name}"`).toContain('Open ' + name);
    }
  }
  expect(errors).toEqual([]);
});

test('a tool name shows when the pointer rests on an icon or when it has keyboard focus, and nothing sits beside the icons', async ({ page }) => {
  const { errors } = await openApp(page);
  expect(await page.locator('.rail').evaluate(e => e.offsetWidth)).toBeLessThan(60);
  await expect(page.locator('#rnames')).toHaveCount(0);
  await expect(page.locator('#rail-rand .tip')).toHaveCSS('opacity', '0');
  await page.hover('#rail-rand');
  await expect(page.locator('#rail-rand .tip')).toHaveCSS('opacity', '1');
  await expect(page.locator('#rail-rand .tip')).toHaveText('Randomize');
  await page.mouse.move(700, 400);
  await page.focus('#rail-colors');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#rail-colors .tip')).toHaveCSS('opacity', '1');
  expect(errors).toEqual([]);
});
