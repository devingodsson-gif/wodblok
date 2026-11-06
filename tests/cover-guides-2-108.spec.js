// 2.108.0 (owner Nov 5 2026): the book cover guides follow the styling rules. One colour, the highlight (--hl, Settings > General > Highlight); lines 1 screen
// pixel at any zoom; the bleed shaded with the scrim; Back, Spine and Front in the group-label style just above the cover, the same size at any zoom, each centred
// over its part (the turned SPINE pill used to stand to the right of the spine). Nothing of it is in an export.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

async function bookCover(page) {
  await H.openPanel(page, 'canvas'); await page.click('#cfmt [data-f="book"]'); await H.settle(page);
  if (!(await page.isChecked('#bkgd'))) { await page.check('#bkgd'); await H.settle(page); }
  await page.evaluate(() => window.__wbTest.commands.run('panels.closeAll')); await H.settle(page);
  await page.waitForFunction(() => document.querySelectorAll('#bkl .bkt').length > 0 && !document.getElementById('bkl').hidden);
}
// each label's screen box, the art's box and the spine's folds on screen
const measure = page => page.evaluate(() => {
  const r = e => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, cx: (b.left + b.right) / 2, cy: (b.top + b.bottom) / 2 }; };
  const lab = {}; document.querySelectorAll('#bkl .bkt').forEach(e => { lab[e.textContent] = { ...r(e), fs: getComputedStyle(e).fontSize, col: getComputedStyle(e).color }; });
  const lines = [...document.querySelectorAll('#guig line')].map(r);
  const any = document.querySelector('#guig .bgl'), cs = getComputedStyle(any);
  const probe = document.createElement('i'); probe.style.color = 'var(--hl)'; document.body.appendChild(probe); const hl = getComputedStyle(probe).color; probe.remove();
  return { lab, art: r(document.getElementById('art')), lines, stroke: cs.stroke, sw: cs.strokeWidth, ve: cs.vectorEffect, hl, text: document.querySelectorAll('#guig text').length };
});

test('the cover guides are in the highlight colour, 1px, with the labels above the cover and Spine centred on the spine', async ({ page }) => {
  const { errors } = await H.openApp(page);
  await bookCover(page);
  const m = await measure(page);
  expect(Object.keys(m.lab).sort()).toEqual(['Back', 'Barcode', 'Front', 'Spine']);
  expect(m.text, 'no label in the artwork').toBe(0);
  expect(m.stroke, 'the guides are the highlight colour').toBe(m.hl);
  expect(m.sw).toBe('1px'); expect(m.ve).toBe('non-scaling-stroke');
  for (const t of ['Back', 'Spine', 'Front']) expect(m.lab[t].b, `${t} sits above the cover`).toBeLessThanOrEqual(m.art.t);
  expect(m.lab.Back.cx).toBeLessThan(m.lab.Spine.cx); expect(m.lab.Spine.cx).toBeLessThan(m.lab.Front.cx);
  const folds = m.lines.map(l => l.cx).sort((a, b) => a - b);
  expect(folds.length).toBe(2);
  expect(Math.abs(m.lab.Spine.cx - (folds[0] + folds[1]) / 2), 'Spine is centred on the spine').toBeLessThan(1.5);
  expect(m.lab.Barcode.col, 'Barcode, inside its box on the artwork, is the highlight colour').toBe(m.hl);
  // zoomed in: the labels keep their size and Spine stays centred; the lines stay 1px
  const fs = m.lab.Spine.fs;
  await page.mouse.move(m.art.cx, m.art.cy);
  for (let i = 0; i < 3; i++) { await page.keyboard.down('Control'); await page.mouse.wheel(0, -200); await page.keyboard.up('Control'); }
  await page.waitForTimeout(400);
  const z = await measure(page);
  expect(z.art.r - z.art.l, 'zoomed in').toBeGreaterThan((m.art.r - m.art.l) * 1.3);
  expect(z.lab.Spine.fs).toBe(fs); expect(z.sw).toBe('1px');
  const f2 = z.lines.map(l => l.cx).sort((a, b) => a - b);
  expect(Math.abs(z.lab.Spine.cx - (f2[0] + f2[1]) / 2)).toBeLessThan(1.5);
  // the guides switch hides the lines and the labels
  await H.openPanel(page, 'canvas'); await page.uncheck('#bkgd'); await H.settle(page); await page.waitForTimeout(100);
  await expect(page.locator('#bkl')).toBeHidden();
  expect(await page.locator('#guig > *').count()).toBe(0);
  expect(errors).toEqual([]);
});
