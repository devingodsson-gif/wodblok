// 2.98.2 (owner Nov 4 2026, docs/asset-split-plan.md step 2): in the hosted app the built-in textures are files in assets/textures/. None is fetched at start; a
// Texture effect fetches its own picture (and the first set of the library it opens with), and the library fetches the ones it shows, not the rest.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const H = require('./helpers/harness');
const { webBuild } = require('./helpers/web-build');
const W = webBuild();
const G = '.fxg[data-fxk="motif"]';
const tex = a => a.filter(u => u.startsWith('/assets/textures/'));

test('the hosted build: textures are files in assets/, fetched only when an effect or the library wants them', async ({ page }) => {
  test.setTimeout(120000);
  const files = fs.readdirSync(path.join(W.dir, 'assets', 'textures'));
  expect(files.length).toBeGreaterThan(20);
  expect(files.every(f => /^[a-z0-9-]+\.[0-9a-f]{10}\.webp$/.test(f))).toBe(true);
  expect(fs.readFileSync(path.join(W.dir, 'index.html'), 'utf8')).not.toContain('"src":"data:image/webp');   // no texture picture inside the page
  const { errors, asked } = await W.open(page, { seed: 4 });
  expect(tex(asked)).toEqual([]);   // none at start
  // a Texture effect: its own picture is fetched, and its row shows it
  await H.addShape(page); await H.settle(page);
  await page.locator(`${G} .fxadd`).scrollIntoViewIfNeeded(); await page.click(`${G} .fxadd`);
  await page.locator('.rowm .ddi', { hasText: 'Texture' }).first().click(); await H.settle(page);
  await expect(page.locator('.fxs[data-e="texture"] .rpth img').first()).toBeVisible({ timeout: 30000 });
  const one = tex(asked).length;
  expect(one).toBeGreaterThan(0);
  expect(one).toBeLessThan(files.length);
  // the library: the textures it shows are fetched and drawn as tiles
  const b = page.locator('.fxg:not([hidden]) .fxs[data-e="texture"]:not([hidden]) .fxtr .rpgo').first(); await b.scrollIntoViewIfNeeded(); await b.click();
  await page.locator('.rpop .txtr').waitFor();
  await expect.poll(() => page.locator('.rpop .txtr .lib button img').count(), { timeout: 30000 }).toBeGreaterThan(4);
  expect(tex(asked).length).toBeLessThan(files.length);   // the sets it does not show are not fetched
  expect(new Set(tex(asked)).size).toBe(tex(asked).length);   // each file fetched once
  expect(errors).toEqual([]);
});
