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
    await page.keyboard.press(mode === 1 ? 'Backslash' : 'Shift+Backslash');   // the Before / Split buttons only show while comparing, so the keys start it
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
  await page.keyboard.press('Backslash'); await page.waitForSelector('.baX');
  await expect(page.locator('.baT.a span')).toHaveText('Start');           // after one roll the step before is the Start
  await page.keyboard.press('Escape');
  await rollTop(page);
  await page.keyboard.press('Backslash'); await page.waitForSelector('.baX');
  await expect(page.locator('.baT.a span')).toHaveText('Randomize 1');     // after two, it is the first roll
  await page.keyboard.press('Escape');
  await openPanel(page, 'hist');
  await expect(page.locator('#bal b').first()).toContainText('Randomize 1');       // History says the same
  await expect(page.locator('#hhl .hr.ra b')).toHaveText('Randomize 1');
  expect(errors).toEqual([]);
});

// 1.17: the Before / Split control is only on screen while a compare is on; the tray sits at the far right of the bar with the zoom just left of it.
test('the Before / Split control shows only while comparing', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 11 });
  await roll(page);
  await expect(page.locator('#bacmp')).toBeHidden();
  await page.keyboard.press('Backslash');
  await page.waitForSelector('.baX');
  await expect(page.locator('#bacmp')).toBeVisible();
  await page.click('.baX');
  await expect(page.locator('#bacmp')).toBeHidden();
  await page.keyboard.press('Shift+Backslash');
  await page.waitForSelector('.baX');
  await expect(page.locator('#bacmp')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#bacmp')).toBeHidden();
  expect(errors).toEqual([]);
});

test('the colour tray fills the right half of the bar (the element bar has the left half); the Display tab and the zoom buttons are gone', async ({ page }) => {
  const { errors } = await openApp(page);
  const r = await page.evaluate(() => { const g = id => document.getElementById(id).getBoundingClientRect(), bar = document.querySelector('.viewbar').getBoundingClientRect(), t = g('tyd'); return { barMid: (bar.left + bar.right) / 2, tLeft: t.left, tShown: t.width > 0, ctl: document.getElementById('viewctl').getBoundingClientRect().width }; });
  expect(r.tShown, 'the tray is on screen').toBe(true);
  expect(r.tLeft, 'the tray starts at the centre line or to its right').toBeGreaterThanOrEqual(r.barMid - 2);
  expect(r.ctl, 'no Display tab or zoom buttons in the bar').toBe(0);
  expect(errors).toEqual([]);
});
