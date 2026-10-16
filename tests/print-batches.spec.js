// 1.9: stamp prints are made in small sheets, so no single print holds the app up for long. Counted by size, which does not depend on how fast the machine is:
// every printed sheet on the busy project (after opening it, and after a stamp size change) is at most about 1.3 megapixels, or is a single stamp print
// (one impression can be larger than that by itself). 1.8.0 made sheets of up to 4096 x 4096 (16.7 megapixels). The picture stays the same (see picture-compare).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openProjectFile, openPanel, settle } = require('./helpers/harness');
const { FIXTURES } = require('./helpers/speed');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const sheets = page => page.evaluate(() => Array.from(document.querySelectorAll('#dyn symbol image')).map(i => [+i.getAttribute('width'), +i.getAttribute('height')]).filter(s => s[0] > 0));

test('busy project: printed sheets are small, after opening and after a stamp size change', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 21 });
  await openProjectFile(page, FIXTURES.busy);
  await settle(page, { quiet: 25 });
  const check = async label => {
    const s = await sheets(page);
    expect(s.length, label + ': the pattern is drawn from printed sheets').toBeGreaterThan(0);
    for (const [w, h] of s) expect(w * h, `${label}: sheet ${w} x ${h} is no bigger than 1.3 megapixels`).toBeLessThanOrEqual(1.3e6);
  };
  await check('after opening');
  await openPanel(page, 'lyrs');
  await page.locator('#lybody .lyr').last().click({ position: { x: 60, y: 10 } });
  await openPanel(page, 'layers');
  await settle(page);
  await page.evaluate(() => { const e = document.getElementById('ts'); e.value = 200; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
  await settle(page, { quiet: 25 });
  await check('after stamp size 200');
  expect(errors).toEqual([]);
});
