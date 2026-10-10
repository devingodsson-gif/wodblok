// Before (\) compares with Start. The Exit compare pill must stay fully inside the stage, and Before must show as pressed (UX review C3, part).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle } = require('./helpers/harness');

async function roll(page) {
  await openPanel(page, 'rand');
  await page.click('#rzdo');
  await settle(page, { max: 60000 });
  await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
}

for (const [name, btn, mode] of [['Before', '#bab', 1], ['Split', '#bas', 2]]) {
  test(`${name}: the Exit compare pill is inside the stage and the button shows as pressed`, async ({ page }) => {
    const { errors } = await openApp(page, { seed: 11 });
    await roll(page);
    await page.click(btn);
    await page.waitForSelector('.baX');
    await page.waitForTimeout(300);
    await expect(page.locator(btn)).toHaveAttribute('aria-pressed', 'true');
    const r = await page.evaluate(() => {
      const x = document.querySelector('.baX').getBoundingClientRect(), s = document.querySelector('.stage').getBoundingClientRect();
      return { l: x.left - s.left, r: s.right - x.right, t: x.top - s.top, b: s.bottom - x.bottom };
    });
    expect(r.l, 'pill left edge inside stage').toBeGreaterThanOrEqual(0);
    expect(r.r, 'pill right edge inside stage').toBeGreaterThanOrEqual(0);
    expect(r.t).toBeGreaterThanOrEqual(0);
    expect(r.b).toBeGreaterThanOrEqual(0);
    const pressed = await page.evaluate(b => { const e = document.querySelector(b), cs = getComputedStyle(e); return { bg: cs.backgroundColor, shadow: cs.boxShadow }; }, btn);
    const other = await page.evaluate(b => { const e = document.querySelector(b === '#bab' ? '#bas' : '#bab'), cs = getComputedStyle(e); return { bg: cs.backgroundColor, shadow: cs.boxShadow }; }, btn);
    expect(pressed, 'pressed button looks different from the other one').not.toEqual(other);
    await page.keyboard.press('Escape');
    expect(errors).toEqual([]);
  });
}

const rollTop = async page => { await page.click('#rzbar'); await settle(page, { max: 60000 }); await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)')); };
// 1.0.9: Before and Split compare with the step before the current one, not always with the Start.
test('Before compares with the step before this one, and follows the history as it grows', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 11 });
  await rollTop(page);
  await page.click('#bab'); await page.waitForSelector('.baX');
  await expect(page.locator('.baT.a span')).toHaveText('Start');           // after one roll the step before is the Start
  await page.keyboard.press('Escape');
  await rollTop(page);
  await page.click('#bab'); await page.waitForSelector('.baX');
  await expect(page.locator('.baT.a span')).toHaveText('Randomize 1');     // after two, it is the first roll
  await page.keyboard.press('Escape');
  await openPanel(page, 'hist');
  await expect(page.locator('#bal b').first()).toContainText('Randomize 1');       // History says the same
  await expect(page.locator('#hhl .hr.ra b')).toHaveText('Randomize 1');
  expect(errors).toEqual([]);
});
