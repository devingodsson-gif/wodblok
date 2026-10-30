// 2.76.3 (docs/randomize-plan.md step 3): a coverage test for the roller: many rolls give a wide variety of Looks, no roll is empty, and nothing a roll places lies off the canvas.
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState } = require('./helpers/harness');

test('thirty rolls: at least six different Looks, none empty, nothing off the canvas, no page error', async ({ page }) => {
  test.setTimeout(420000);
  const { errors } = await openApp(page, { seed: 11, pattern: false, background: true });
  const looks = new Set(), kinds = new Set();
  for (let i = 0; i < 30; i++) {
    await page.click('#rzdo'); await page.waitForTimeout(250); await settle(page, { max: 60000 });
    await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
    const m = /Randomized: ([^.]+)\./.exec(await page.locator('#pmsg').textContent()); if (m) looks.add(m[1]);
    const s = JSON.parse(await getState(page)), v = await page.evaluate(() => { const b = document.getElementById('art').viewBox.baseVal; return [b.width, b.height]; });
    const real = s.els.filter(q => !q.bgd);
    // a Repeat is one or two Patterns (each holds many pieces), so it has few elements, as have Quilt and the pattern Looks of 2.78.0; every other Look has at least three
    expect(real.length, 'roll ' + i + ' (' + (m && m[1]) + ': ' + real.map(q => q.k + (q.nm ? ':' + q.nm : '')).join(',') + ') is not empty').toBeGreaterThanOrEqual(m && ['Repeat', 'Quilt', 'Textile', 'Tilework', 'Halftone', 'Confetti', 'Pattern type', 'Mandala'].includes(m[1]) ? 1 : 3);
    real.forEach(q => kinds.add(q.k));
    // a placed element's middle lies on the canvas (a Sheet, and a Pattern that fills it, have no place of their own)
    // (a corner ornament or a half sun may sit on the edge, so the middle may lie up to 5% of the short side outside)
    const tol = Math.min(v[0], v[1]) * .05;
    real.filter(q => q.x != null && q.k !== 'sheet' && !(q.k === 'pattern' && q.af)).forEach(q => {
      expect(+q.x, 'roll ' + i + ' ' + q.k + ' x').toBeGreaterThan(-tol); expect(+q.x, 'roll ' + i + ' ' + q.k + ' x').toBeLessThan(v[0] + tol);
      expect(+q.y, 'roll ' + i + ' ' + q.k + ' y').toBeGreaterThan(-tol); expect(+q.y, 'roll ' + i + ' ' + q.k + ' y').toBeLessThan(v[1] + tol);
    });
  }
  expect(looks.size, [...looks].join(', ')).toBeGreaterThanOrEqual(6);
  expect([...kinds]).toEqual(expect.arrayContaining(['motif', 'text', 'pattern', 'sheet']));
  expect(errors).toEqual([]);
});
