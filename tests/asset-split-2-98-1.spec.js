// 2.98.1 (owner Nov 4 2026, docs/asset-split-plan.md step 1): the hosted app (npm run build:web) keeps the app's own files next to the page, in assets/, and fetches
// each only when it is needed; the single file keeps them inside. Mockup products are the first: their photos and masks load from assets/mockups/ when the
// Mockup tab shows them, nothing else is fetched at start, and the library's Export still gets their bytes.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const { webBuild } = require('./helpers/web-build');
const ROOT = path.join(__dirname, '..');
const W = webBuild();

test('the hosted build: mockup photos are files in assets/, fetched only when the Mockup tab shows them', async ({ page }) => {
  test.setTimeout(120000);
  const files = fs.readdirSync(path.join(W.dir, 'assets', 'mockups'));
  expect(files.filter(f => /^[a-z]+\.[0-9a-f]{10}\.webp$/.test(f)).length).toBe(6);
  expect(files.filter(f => /-mask\.[0-9a-f]{10}\.png$/.test(f)).length).toBe(6);
  const html = fs.readFileSync(path.join(W.dir, 'index.html'), 'utf8');
  expect(html).toContain('"assets/mockups/tshirt.');
  expect(html).not.toContain(fs.readFileSync(path.join(ROOT, 'mockups', 'tshirt.webp')).toString('base64').slice(0, 400));   // the photo is not inside the page
  const { errors, asked } = await W.open(page, { seed: 4 });
  expect(asked.filter(u => u.startsWith('/assets/mockups/'))).toEqual([]);   // no mockup at start
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock'));
  await page.waitForFunction(() => { const c = document.getElementById('mkc'); return c && c.width > 0; }, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  expect(asked.some(u => /^\/assets\/mockups\/tshirt\.[0-9a-f]{10}\.webp$/.test(u))).toBe(true);
  expect(asked.some(u => /^\/assets\/mockups\/tshirt-mask\.[0-9a-f]{10}\.png$/.test(u))).toBe(true);
  // the thumbnails are the files too, and they load
  const ok = await page.locator('#mkpane [data-mk^="p-"] img').evaluateAll(a => Promise.all(a.map(i => i.decode().then(() => i.naturalWidth > 0, () => false))));
  expect(ok).toEqual([true, true, true, true, true, true]);
  // the view drew the photo (not an empty canvas)
  const lit = await page.evaluate(() => { const c = document.getElementById('mkc'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 400) if (d[i]) n++; return n; });
  expect(lit).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});
