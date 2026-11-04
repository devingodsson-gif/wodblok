// 2.98.3 (owner Nov 4 2026, docs/asset-split-plan.md step 3): in the hosted app the lettering fonts are files in assets/fonts/ (the interface and wordmark fonts stay
// in the page). At start only the Text tool's default font may be fetched; setting text fetches its font, and the Text tool still reads the font's own outlines, the same letters as the single file.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const H = require('./helpers/harness');
const { webBuild } = require('./helpers/web-build');
const W = webBuild();
const fonts = a => a.filter(u => u.startsWith('/assets/fonts/'));
const shapes = page => page.evaluate(() => [...document.querySelectorAll('#tx_pv path[fill-rule]')].map(p => p.getAttribute('d')));
const pick = (page, sel, v) => page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);
async function letters(page, font) {
  await H.unlockStamp(page); await H.openPanel(page, 'text');
  if (font) await pick(page, '#tx_f', font);
  await page.fill('#tx_t', 'Og');
  await H.clickStamp(page, await H.stampInstance(page));
  await expect.poll(async () => (await shapes(page)).length, { timeout: 30000 }).toBeGreaterThanOrEqual(2);
  await page.waitForTimeout(600);
  return shapes(page);
}

for (const font of [null, 'lora']) test('the hosted build: lettering fonts are files, fetched when text is set, with the same outlines as the single file (' + (font || 'the default font') + ')', async ({ page, browser }) => {
  test.setTimeout(120000);
  const files = fs.readdirSync(path.join(W.dir, 'assets', 'fonts'));
  expect(files.length).toBeGreaterThan(100);
  expect(files.every(f => /^[a-z0-9-]+\.[0-9a-f]{10}\.woff$/.test(f))).toBe(true);
  const html = fs.readFileSync(path.join(W.dir, 'index.html'), 'utf8');
  expect(html).toContain('font-family:"Hanken Grotesk";font-style:normal;font-weight:400 600;font-display:swap;src:url(data:font/woff2;base64,');   // the interface font stays inside
  expect(html).toContain('font-family:"IM Fell English";font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff;base64,');   // and the wordmark font
  expect(html.split('data:font/woff;base64,').length).toBe(2);   // no other lettering font inside
  const { errors, asked } = await W.open(page, { seed: 4 });
  expect(fonts(asked).every(u => u.startsWith('/assets/fonts/cinzel.'))).toBe(true);   // at start, at most the Text tool's default font (18 KB)
  const got = await letters(page, font);
  for (const d of got) expect((d.match(/[MLQZ]/g) || []).length).toBeLessThan(200);   // the font's own outlines (a traced letter has several hundred steps)
  const f = fonts(asked);
  expect(f.some(u => u.startsWith('/assets/fonts/' + (font || 'cinzel') + '.'))).toBe(true);
  expect(new Set(f).size).toBeLessThan(files.length / 4);   // only what the text needs
  // the same letters as the single file
  const p2 = await browser.newPage(); await H.openApp(p2, { seed: 4 });
  expect(await letters(p2, font)).toEqual(got);
  await p2.close();
  expect(errors).toEqual([]);
});
