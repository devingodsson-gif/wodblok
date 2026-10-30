// 2.76.8 (owner Oct 29 2026, docs/pattern-plan.md step 5): the first minute. Starter stamps (drawn from the Basic shapes) and the template picker at launch;
// the Shape button arms a rectangle at once; a new Pattern takes the only (or the selected) stamp as its source and goes just above the Background; Make pattern;
// "Untitled project" and "No elements"; the canvas stays put when the left column opens; past four tabs a group folds the rest into a menu.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));

test('the template picker opens at launch with the starter templates', async ({ page }) => {
  const { errors } = await H.openApp(page, { templates: 'default', pattern: false });
  await expect(page.locator('#tpdlg')).toBeVisible();
  await expect(page.locator('#tppane button[data-tp]').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('the stamp library has Starting points: six stamps drawn from the Basic shapes, added with a click', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await H.openPanel(page, 'stmp'); await H.settle(page);
  const set = page.locator('#slpane .lrw:has(.lfr[data-k="s:Starting points"]) + .lib button[data-sl]');
  await expect(set).toHaveCount(6);
  await expect(set.first().locator('svg path, svg rect, svg ellipse, svg polygon, svg circle').first()).toBeAttached();
  const n0 = (await st(page)).tiles.length;
  await set.nth(1).click(); await H.settle(page);
  const s = await st(page), t = s.tiles.at(-1);
  expect(s.tiles.length).toBe(n0 + 1);
  expect(t.nm).toBe('Star');
  expect(t.items.length).toBe(1);
  expect(t.items[0].m).toMatch(/^b\d+$/);
  expect(errors).toEqual([]);
});

test('the Shape button arms a rectangle at once: one click on the canvas places it', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, background: true });
  await page.click('#elb [data-k="motif"]'); await H.settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await H.settle(page);
  const m = (await st(page)).els.filter(q => q.k === 'motif');
  expect(m.length).toBe(1);
  expect(await page.evaluate(k => document.querySelector(`#lib button[data-m="${k}"]`) ? document.querySelector(`#lib button[data-m="${k}"]`).getAttribute('aria-label') || document.querySelector(`#lib button[data-m="${k}"]`).title : '', m[0].m)).toMatch(/Rectangle|^$/);
  expect(errors).toEqual([]);
});

test('a new Pattern takes the project\'s only stamp and goes just above the Background; Make pattern uses the selected shape', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, background: true });
  await H.addStamp(page); await page.keyboard.press('Escape'); await H.settle(page);
  await H.addShape(page, 'ellipse'); await page.keyboard.press('Escape'); await H.settle(page);   // something on top of the Background
  await page.click('#elb [data-k="pattern"]'); await H.addKind(page, 'pattern'); await H.settle(page);
  let s = await st(page), i = s.els.findIndex(q => q.k === 'pattern');
  expect(s.els[i].src).toEqual([{ k: 'stamp', t: s.tiles[0].id, w: 1 }]);
  expect(s.els[i - 1].bgd).toBeTruthy();   // just above the Background, under the shape
  // Make pattern from the selected shape (right-click menu)
  const shape = s.els.find(q => q.k === 'motif');
  await page.evaluate(u => window.__wbTest.commands.get ? 0 : 0, shape.u);
  await page.keyboard.press('Escape');
  const box = await page.locator('#art').boundingBox(), vb = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
  const at = [box.x + shape.x / vb[0] * box.width, box.y + shape.y / vb[1] * box.height];
  await page.mouse.click(at[0], at[1]); await H.settle(page);
  await page.mouse.click(at[0], at[1], { button: 'right' });
  await page.locator('#ctxm button[data-a="pat"]').click(); await H.settle(page);
  s = await st(page);
  const pats = s.els.filter(q => q.k === 'pattern');
  expect(pats.length).toBe(2);
  expect(pats.some(p => p.src.length === 1 && p.src[0].k === 'motif' && p.src[0].m === shape.m)).toBe(true);
  expect(errors).toEqual([]);
});

test('wording: the title reads Untitled project, an empty stamp\'s Elements list says No elements', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, workspaces: 'launch' });
  await expect(page.locator('#pnm')).toHaveAttribute('placeholder', 'Untitled project');
  await H.addStamp(page); await H.unlockStamp(page); await H.settle(page);
  await expect(page.locator('.ml .em').first()).toHaveText('No elements');
  expect(errors).toEqual([]);
});

test('the canvas stays put when the left column opens, and a fifth tab folds into More tabs', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, background: true, workspaces: 'launch' });
  const mid = () => page.evaluate(() => { const r = document.getElementById('art').getBoundingClientRect(); return r.left + r.width / 2 });
  const m0 = await mid();
  await H.openPanel(page, 'motifs'); await H.settle(page);
  expect(Math.abs(await mid() - m0)).toBeLessThan(2);
  for (const p of ['text', 'layers', 'stmp', 'image']) { await H.openPanel(page, p); await H.settle(page); }
  const g = page.locator('.dock.dk-l .wg').first();
  const shown = await g.locator('.wtab:visible').count();
  expect(shown).toBeGreaterThanOrEqual(1); expect(shown).toBeLessThanOrEqual(4);   // at most four, fewer when they do not fit
  expect(await g.locator('.wt').evaluate(t => t.scrollWidth <= t.clientWidth + 1)).toBe(true);   // nothing scrolls
  await expect(g.locator('.wtab.on')).toBeVisible();
  await expect(g.locator('[data-act="tmore"]')).toBeVisible();
  await g.locator('[data-act="tmore"]').click();
  const items = page.locator('.rowm .ddi');
  await expect(items).toHaveCount(5 - shown);
  await items.first().click(); await H.settle(page);
  await expect(g.locator('.wtab.on')).toHaveCount(1);
  expect(errors).toEqual([]);
});
