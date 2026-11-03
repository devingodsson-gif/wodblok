// 2.90.0 (owner Nov 3 2026): every tiling arrangement has settings of its own under its preview (Half drop a Drop, Brick an Offset...). Each one changes the
// pattern; values are kept per arrangement in p.ao only when off their default; one History step a change; the defaults lay the pattern exactly as before.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const pat = async page => JSON.parse(await H.getState(page)).els.find(q => q.k === 'pattern');
const art = page => page.evaluate(() => document.getElementById('art').innerHTML.length + ':' + document.getElementById('art').innerHTML.replace(/\s+/g, '').slice(0, 400000).split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0));
const pick = (page, id, v) => page.evaluate(([id, v]) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);

test('every arrangement shows its own settings, and each first setting changes the pattern', async ({ page }) => {
  test.setTimeout(240000);
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addPattern(page); await H.showPanel(page, 'layers'); await H.settle(page);
  // two sources, so the arrangements about classes (Checkerboard, Stripes...) show their settings too
  await H.patSource(page, 'motif', 0); await H.settle(page);
  const shapes = await page.evaluate(() => [...document.getElementById('pets').options].map(o => o.value).filter(v => v !== 'auto'));
  let n = 0;
  for (const ts of shapes) {
    await pick(page, 'pets', ts); await H.settle(page);
    const ars = await page.evaluate(() => [...document.getElementById('pear').options].map(o => o.value));
    for (const ar of (ts === 'wall' ? ars.slice(0, 3) : ars)) {
      await pick(page, 'pear', ar); await H.settle(page);
      const rows = page.locator('#peao [data-ao], #peao [data-aos]');
      expect(await rows.count(), ts + ' ' + ar).toBeGreaterThan(0);
      // every slider has its value box
      expect(await page.locator('#peao .ctl').count()).toBe(await page.locator('#peao .ctl .num').count());
      const before = await art(page), first = rows.first();
      if (await first.getAttribute('data-ao')) {
        await first.evaluate(r => { const v = +r.value, mid = (+r.min + +r.max) / 2; r.value = Math.abs(v - +r.min) > Math.abs(v - +r.max) ? +r.min + Math.round((mid - +r.min) / 2) : +r.max; r.dispatchEvent(new Event('input', { bubbles: true })); });
      } else await first.locator('[data-v]:not(.on)').first().click();
      await H.settle(page);
      expect(await art(page), ts + ' ' + ar + ' changes the pattern').not.toBe(before);
      const p = await pat(page); expect(p.ao && p.ao[ar], ts + ' ' + ar).toBeTruthy();
      n++;
    }
  }
  expect(n).toBeGreaterThan(25);
  expect(errors).toEqual([]);
});

test('Half drop: Drop is kept per arrangement, one History step, Undo removes it; the default leaves no field', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addPattern(page); await H.showPanel(page, 'layers'); await H.settle(page);
  await pick(page, 'pets', 'square'); await pick(page, 'pear', 'half'); await H.settle(page);
  expect((await pat(page)).ao).toBeUndefined();
  await expect(page.locator('#peao .ctl label')).toHaveText(['Drop']);
  const h0 = (await page.evaluate(() => window.__wbTest.histLabels())).length;
  const nb = page.locator('#peao .ctl .num input'); await nb.fill('30'); await nb.press('Enter'); await H.settle(page);
  expect((await pat(page)).ao).toEqual({ half: { dr: 30 } });
  expect((await page.evaluate(() => window.__wbTest.histLabels())).length).toBe(h0 + 1);
  // another arrangement keeps its own; back to Half drop shows 30 again
  await pick(page, 'pear', 'brick'); await H.settle(page);
  await expect(page.locator('#peao .ctl label')).toHaveText(['Offset']);
  await expect(page.locator('#peao [data-ao="of"]')).toHaveValue('50');
  await pick(page, 'pear', 'half'); await H.settle(page);
  await expect(page.locator('#peao [data-ao="dr"]')).toHaveValue('30');
  // Undo twice (the arrangement, then the Drop): the field is gone and the slider shows 50
  await page.mouse.click(5, 300); await page.keyboard.press('Control+z'); await H.settle(page); await page.keyboard.press('Control+z'); await H.settle(page);
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await pat(page)).ao).toBeUndefined();
  expect(errors).toEqual([]);
});
