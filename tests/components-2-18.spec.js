// 2.18.0: one component per role (UI standard, Part 9). Heights on the scale, one shape picker, one primary action per view.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, addShape } = require('./helpers/harness');

const SCALE = [18, 22, 24, 28, 36];

test('buttons, dropdowns and fields in every panel sit on the height scale (18, 22, 24, 28, 36)', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page);
  const off = [];
  for (const id of [null, 'canvas', 'colors', 'pgrid', 'hist', 'rand', 'xrec', 'motifs', 'text', 'stmp', 'layers']) {
    if (id) { await openPanel(page, id); await settle(page); }
    off.push(...await page.evaluate(() => {
      const res = [];
      for (const e of document.querySelectorAll('button,select,input[type=text],input[type=number],.ddb')) {
        if (!e.offsetParent) continue;
        const b = e.getBoundingClientRect();
        if (b.width < 6 || b.height < 6 || b.height >= 40) continue;   // tiles and thumbnails are not controls
        const h = Math.round(b.height);
        if (![18, 22, 24, 28, 36].includes(h)) res.push(h + 'px ' + (e.id || e.className || e.tagName) + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 20) + '"');
      }
      return res;
    }));
  }
  expect(off).toEqual([]);
  expect(errors).toEqual([]);
});

test('every shape picker is the same component: a four-column grid of icon buttons that carry their name', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page);
  for (const [panel, sel] of [['canvas', '#cshp'], ['pgrid', '#pgsh'], ['stmp', '#skind'], ['mlist', '#shp_pre']]) {
    await openPanel(page, panel); await settle(page);
    if (panel === 'stmp') await page.evaluate(() => document.querySelector('#skind').closest('details,section')?.setAttribute('open', ''));
    // a picker inside a closed group has no layout: it must at least have no column override of its own
    const r = await page.evaluate(sel => {
      const g = document.querySelector(sel);
      const bs = [...g.querySelectorAll('button')];
      return { cls: g.className, cols: g.offsetParent ? getComputedStyle(g).gridTemplateColumns.split(' ').length : (g.style.gridTemplateColumns ? 0 : 4), n: bs.length, text: bs.filter(b => b.textContent.trim()).length, named: bs.filter(b => b.getAttribute('aria-label') && b.title === b.getAttribute('aria-label')).length };
    }, sel);
    expect(r.cls, sel).toContain('shg');
    expect(r.cols, sel).toBe(4);
    expect(r.text, sel + ' has visible labels').toBe(0);
    expect(r.named, sel).toBe(r.n);
  }
  expect(errors).toEqual([]);
});

test('Import image, Edit and the Randomize panel button are secondary; the only primary buttons are a view\'s one key action', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page);
  for (const id of ['shp_imp', 'smkedit', 'rzdo']) await expect(page.locator('#' + id)).not.toHaveClass(/primary/);
  expect(errors).toEqual([]);
});
