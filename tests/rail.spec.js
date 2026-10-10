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
  expect(pattern.slice(9, -1)).toEqual(['Canvas', 'Layers', 'Arrangement', 'Pattern grid', 'Navigator', 'Variations', 'Export recipes']);
  expect(stamp.slice(9, -1)).toEqual(['Stamp', 'Motifs', 'Text', 'Stamp grid', 'Motif list', 'Pattern preview']);
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

test('names show beside the icons in a wide window, hide in a narrow one, and the button remembers a choice', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const { errors } = await openApp(page);
  await expect(page.locator('body')).toHaveClass(/rwide/);
  await expect(page.locator('#rail-rand .tip')).toBeVisible();
  const wide = await page.locator('.rail').evaluate(e => e.offsetWidth);
  await page.click('#rnames');
  await expect(page.locator('body')).not.toHaveClass(/rwide/);
  expect(await page.locator('.rail').evaluate(e => e.offsetWidth)).toBeLessThan(wide - 80);
  await page.reload();
  await page.waitForFunction(() => window.__wbTest);
  await expect(page.locator('body')).not.toHaveClass(/rwide/);      // the choice stays across a reload
  expect(errors).toEqual([]);
});

test('below 1180 px the names are off unless chosen', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 800 });
  const { errors } = await openApp(page);
  await expect(page.locator('body')).not.toHaveClass(/rwide/);
  await expect(page.locator('#rnames')).toHaveAttribute('aria-label', 'Show tool names');
  expect(errors).toEqual([]);
});
