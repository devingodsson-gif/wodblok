// 2.98.4 (owner Nov 4 2026, docs/asset-split-plan.md step 4; he chose "cached file at start"): in the hosted app the built-in shapes and templates are two data
// files, assets/data/shapes.<hash>.json and templates.<hash>.json, fetched alongside the page and waited for before start-up; the single file starts as it
// always did. If a file cannot be fetched, the loading screen says so.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const H = require('./helpers/harness');
const { webBuild } = require('./helpers/web-build');
const W = webBuild();
const lib = page => page.evaluate(() => ({ sets: document.querySelectorAll('#lib .lfr[data-f^="b:"]').length }));
const cards = page => page.locator('#tpdlg [aria-label]').evaluateAll(a => a.map(e => e.getAttribute('aria-label')));

test('the hosted build: shapes and templates are data files the app waits for, and it has every one of them', async ({ page, browser }) => {
  test.setTimeout(150000);
  const files = fs.readdirSync(path.join(W.dir, 'assets', 'data'));
  expect(files.filter(f => /^shapes\.[0-9a-f]{10}\.json$/.test(f)).length).toBe(1);
  expect(files.filter(f => /^templates\.[0-9a-f]{10}\.json$/.test(f)).length).toBe(1);
  const html = fs.readFileSync(path.join(W.dir, 'index.html'), 'utf8');
  expect(html).toContain('const SHAPES="assets/data/shapes.');
  expect(html).toContain('const TPL_BUILTIN="assets/data/templates.');
  expect(html).not.toContain('Battle axe');   // no shape inside the page
  expect(html.length).toBeLessThan(3e6);
  const { errors, asked } = await W.open(page, { seed: 4, templates: true, pattern: false });
  expect(asked.filter(u => u.startsWith('/assets/data/')).length).toBe(2);
  // the template picker lists the built-in templates, the same as the single file
  await expect(page.locator('#tpdlg')).toBeVisible();
  const p2 = await browser.newPage(); await H.openApp(p2, { seed: 4, templates: true, pattern: false });
  await expect(p2.locator('#tpdlg')).toBeVisible();
  const c1 = await cards(page), c2 = await cards(p2);
  expect(c1.length).toBeGreaterThan(1); expect(c1).toEqual(c2);
  await page.click('#tpclose'); await p2.click('#tpclose');
  // the shapes: every set, and a shape adds
  await H.showPanel(page, 'motifs'); await H.showPanel(p2, 'motifs');
  const l1 = await lib(page); expect(l1.sets).toBeGreaterThan(15); expect(l1).toEqual(await lib(p2));
  await p2.close();
  await H.addShape(page, 'ellipse');
  expect(JSON.parse(await H.getState(page)).els.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('the hosted build: when the shapes file cannot be fetched, the loading screen says so', async ({ page }) => {
  await page.route(/^https?:\/\//, r => /\/assets\/data\/shapes\./.test(r.request().url()) ? r.fulfill({ status: 404, body: '' }) : r.request().url().startsWith(W.base) ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto(W.base);
  await expect(page.locator('#splver')).toHaveText('Could not load Wodblok. Check the connection, then reload.', { timeout: 30000 });
});
