// The tool rail (UX review C4): shared tools sit in the same slots in both views, every tool has one name (rail, tab and command search),
// and the names show beside the icons in wide windows.
const { test, expect } = require('@playwright/test');
const { openApp } = require('./helpers/harness');

const labels = page => page.locator('.rail button:visible').evaluateAll(b => b.map(x => x.getAttribute('aria-label')));
const SHARED = ['Default panels', 'Randomize', 'Colours', 'History'];   // with no panel open the first button opens the default layout (2.9.0)
const closeAll = async page => { if ((await page.getAttribute('#rcls', 'aria-label')) == 'Close all panels') await page.click('#rcls'); };

test('the shared tools are the first four rail buttons, in the same order', async ({ page }) => {
  const { errors } = await openApp(page);
  const pattern = await labels(page);
  expect(pattern.slice(0, 4)).toEqual(SHARED);
  expect(pattern.slice(4)).toEqual(['Canvas', 'Elements', 'Grid', 'Export recipes', 'More tools']);   // the element panels open from the element bar only
  expect(errors).toEqual([]);
});

test('each tool has one name: the rail, the tab it opens, and "Open …" in command search agree', async ({ page }) => {
  const { errors } = await openApp(page);
  const cmds = await page.evaluate(() => window.__wbTest.commands.list().map(c => c.label));
  for (const mode of ['pattern']) {
    for (const b of await page.locator('.rail [data-pn]:visible').all()) {
      const name = await b.getAttribute('aria-label');
      await closeAll(page);
      await b.click();
      await expect(page.locator('.wtab.on').first(), `the tab for ${name}`).toHaveText(name === 'Element' ? 'Shape' : name);   // 2.6.0: each element panel has its own tab name
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

test('the tool bar is one list; the three-line button opens a tool repository: tools drag between it and the bar, and a tool in it opens like on the bar', async ({ page }) => {
  const { errors } = await openApp(page);
  const ids = () => page.locator('.rail > [data-pn]:visible').evaluateAll(b => b.map(x => x.dataset.pn));
  expect(await page.locator('.rail .rsep').count()).toBe(0);
  expect(await page.locator('#rmenu:visible').count()).toBe(0);
  const n = (await ids()).length;
  await page.click('#rmore');
  expect(await page.locator('#rmenu:visible').count()).toBe(1);
  const drag = async (from, to) => {
    const a = await from.boundingBox(), b = await to.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2 + 10, { steps: 3 });
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 }); await page.mouse.up();
  };
  await drag(page.locator('.rail [data-pn="hist"]'), page.locator('#rmenu'));
  expect(await ids()).not.toContain('hist');
  await page.reload(); await page.waitForTimeout(500);
  expect(await ids()).not.toContain('hist');
  await page.click('#rmore');
  await page.click('#rmenu [data-add="hist"]');
  expect(await page.locator('.dock [data-tab="hist"], .wtab:has-text("History")').count()).toBeGreaterThan(0);
  await drag(page.locator('#rmenu [data-add="hist"]'), page.locator('.rail [data-pn="colors"]'));
  expect((await ids()).length).toBe(n);
  await page.keyboard.press('Escape');
  expect(await page.locator('#rmenu:visible').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('a tool drags to a new place on the bar, and the order is remembered', async ({ page }) => {
  const { errors } = await openApp(page);
  const ids = () => page.locator('.rail > [data-pn]:visible').evaluateAll(b => b.map(x => x.dataset.pn));
  const before = await ids();
  const a = await page.locator(`.rail [data-pn="${before[0]}"]`).boundingBox(), c = await page.locator(`.rail [data-pn="${before[3]}"]`).boundingBox();
  await page.mouse.move(a.x + 20, a.y + 20); await page.mouse.down();
  await page.mouse.move(a.x + 20, a.y + 32, { steps: 3 }); await page.mouse.move(c.x + 20, c.y + 30, { steps: 12 });
  await page.mouse.up();
  const after = await ids();
  expect(after).not.toEqual(before);
  expect(after.indexOf(before[0])).toBeGreaterThan(2);
  await page.reload(); await page.waitForTimeout(500);
  expect(await ids()).toEqual(after);
  expect(errors).toEqual([]);
});
