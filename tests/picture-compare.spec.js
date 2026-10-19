// Picture compare. Draws the same projects in an older build and in this one, in the same run on the same machine, and checks that the pictures are
// identical: the Pattern at Fit, after a stamp size change, zoomed in (every copy drawn live), and a PNG export (which draws the full
// vector picture). Pixel goldens cannot do this in CI because they only match the machine that made them; two builds in one run can.
// Needs WB_BASELINE=<absolute path to the older dist/wodblok.html>; skipped without it. CI builds `main` for this (see .github/workflows/test.yml).
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, TARGET, APP_URL, openApp, openProjectFile, openPanel, settle } = require('./helpers/harness');
const { FIXTURES } = require('./helpers/speed');

const BASE = process.env.WB_BASELINE;
// WB_PICTURE_TOLERANCE=<mean difference, 0-255>: only for a release that changes how prints are packed (their grain moves a little). Unset = exactly equal.
const TOL = +process.env.WB_PICTURE_TOLERANCE || 0;
test.beforeEach(() => { test.skip(!BASE, 'needs WB_BASELINE=<older dist/wodblok.html> and the build as target'); });

// "busy" has layers with an ink saved in the file ("Moon Ivory" on layers 2-4). Before 1.10 those inks were left out when the file opened; the colour tray
// brings them back (docs/known-issues.md), so the layers print in that colour now. That is a deliberate change: this one file is compared loosely
// (a mean difference of 2.5 of 255, and at most 1 pixel in 100 off by more than 48); the other files must still match.
// 1.35.0: "diamond" has inverted stamps. Their tiles now overlap by a hair of their own colour, so the light line between neighbouring tiles is gone; the outline of
// each inverted tile also grows by half a pixel, so its edge pixels differ (mean about 0.45 of 255). Nothing else in that picture may differ.
// 2.0.4: the stamp tray is gone, so the Fit picture of "wide" sits a fraction of a pixel differently from the baseline's (mean 0.24 of 255, 7 pixels off by more than 48). Drop the "wide" entry once the baseline is 2.0.4 or later.
const LOOSE = { busy: { mean: 2.5, big: 0.01 }, diamond: { mean: 0.8, big: 0.01 }, wide: { mean: 0.5, big: 0.001 } };
const CTX = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'dark', reducedMotion: 'reduce', acceptDownloads: true };

async function render(browser, url, fixture) {
  const ctx = await browser.newContext(CTX);
  const page = await ctx.newPage();
  const { errors } = await openApp(page, { seed: 21, url });
  await openProjectFile(page, fixture);
  const shots = {};
  // the rail's name labels move when a tool is added to the rail, and the stamp outlines (1.46.4, drawn over the artwork in their own overlay, never part of it) are an editing aid: neither is part of the picture. The PNG export still compares the artwork itself.
  await page.addStyleTag({ content: '.tip,#stolsvg,.film{display:none!important}' });
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));   // the baseline still has its stamp tray (hidden above): fit again, as it would without it
  await settle(page);
  const shoot = async (label, sel) => { await settle(page, { quiet: 8 });
    // a build before 1.9.1 cannot say when its prints are done: give it time
    if (!(await page.evaluate(() => !!(window.__wbTest && window.__wbTest.printsBusy)))) { await page.waitForTimeout(2500); await settle(page, { quiet: 8 }); }
    shots[label] = (await page.locator(sel).first().screenshot()).toString('base64'); };
  await shoot('pattern at Fit', '#boardP');
  await openPanel(page, 'lyrs');
  await page.locator('#lybody .lyr').last().click({ position: { x: 60, y: 10 } });
  await openPanel(page, 'layers');
  await settle(page);
  await page.evaluate(() => { const e = document.getElementById('ts'); e.value = 200; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
  await shoot('after stamp size 200', '#boardP');
  await page.mouse.move(700, 450);
  await page.keyboard.press('1');
  await shoot('zoomed to 100% (drawn live)', '#boardP');
  await page.locator('#zl').dispatchEvent('click');
  await settle(page);
  // the Textures tool's Amount slider, dragged and let go: the exact picture comes back once it is let go
  await openPanel(page, 'tex');
  await settle(page);
  await page.evaluate(async () => { const e = document.getElementById('tx_a'); for (const v of [20, 45, 63]) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 220)); } e.dispatchEvent(new Event('change', { bubbles: true })); });
  await shoot('texture Amount 63 (let go)', '#boardP');
  // PNG export at 800 px: draws the full vector picture, not the on-screen prints
  await openPanel(page, 'xrec');
  await page.fill('#xrpx', '800');
  await page.click('#xrf [data-f="png"]');
  await page.evaluate(() => { window.__wbDownloads = []; });
  await page.click('#xrnow');
  await page.waitForFunction(() => (window.__wbDownloads || []).length > 0, null, { timeout: 120000 });
  shots['PNG export 800 px'] = await page.evaluate(() => window.__wbDownloads[0].base64);
  await ctx.close();
  return { shots, errors };
}

// compare in a page: decode both PNGs, count pixels that differ
async function diff(browser, a, b) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const r = await page.evaluate(async ([a, b]) => {
    const bmp = async s => createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob());
    const [x, y] = await Promise.all([bmp(a), bmp(b)]);
    if (x.width !== y.width || x.height !== y.height) return { sizeA: [x.width, x.height], sizeB: [y.width, y.height], diff: -1 };
    const px = i => { const c = new OffscreenCanvas(i.width, i.height).getContext('2d', { willReadFrequently: true }); c.drawImage(i, 0, 0); return c.getImageData(0, 0, i.width, i.height).data; };
    const p = px(x), q = px(y);
    let n = 0, max = 0, sum = 0, big = 0;
    for (let i = 0; i < p.length; i += 4) {
      const d = Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2]), Math.abs(p[i + 3] - q[i + 3]));
      if (d) { n++; sum += d; if (d > max) max = d; if (d > 48) big++; }
    }
    return { size: [x.width, x.height], diff: n, maxDelta: max, meanDelta: +(sum / (p.length / 4)).toFixed(3), over48: big };
  }, [a, b]);
  await ctx.close();
  return r;
}

for (const name of Object.keys(FIXTURES)) {
  test(`${name}: this build draws the same pictures as the baseline build`, async ({ browser }) => {
    test.setTimeout(8 * 60 * 1000);
    const was = await render(browser, 'file://' + path.resolve(BASE), FIXTURES[name]);
    const now = await render(browser, APP_URL, FIXTURES[name]);
    const out = {};
    for (const label of Object.keys(was.shots)) {
      out[label] = await diff(browser, was.shots[label], now.shots[label]);
      const lo = LOOSE[name], tol = lo ? Math.max(TOL, lo.mean) : TOL;
      if (tol ? out[label].meanDelta > tol : out[label].diff !== 0) {                                                   // keep both pictures for a person to look at
        fs.mkdirSync(path.join(ROOT, 'test-results', 'picture-compare'), { recursive: true });
        const f = `${name}-${label.replace(/\W+/g, '-')}`;
        fs.writeFileSync(path.join(ROOT, 'test-results', 'picture-compare', f + '-baseline.png'), Buffer.from(was.shots[label], 'base64'));
        fs.writeFileSync(path.join(ROOT, 'test-results', 'picture-compare', f + '-now.png'), Buffer.from(now.shots[label], 'base64'));
      }
    }
    console.log('picture-compare', name, JSON.stringify(out));
    for (const [label, r] of Object.entries(out)) {
      const what = `${name}: ${label}: pixels that differ (size ${JSON.stringify(r.size || [r.sizeA, r.sizeB])}, biggest step ${r.maxDelta}, mean ${r.meanDelta})`;
      const lo = LOOSE[name], tol = lo ? Math.max(TOL, lo.mean) : TOL;
      if (!tol || r.diff === -1) expect(r.diff, what).toBe(0);
      else { expect(r.meanDelta, what).toBeLessThanOrEqual(tol); expect(r.over48, what + ': pixels off by more than 48').toBeLessThanOrEqual(r.size[0] * r.size[1] * (lo ? lo.big : 0.001)); }
    }
    expect(was.errors).toEqual([]);
    expect(now.errors).toEqual([]);
  });
}
