// Makes the three sample projects the specs open (project-1-diamond, project-3-rect-16x9, project-4-rect-4x3 as .wodblok files in the current format).
// They are made up: a seeded Randomize in the app on a fixed canvas, kept when the result has the features the specs need, then saved with Save project.
// Run: npm run build && WB_TARGET=build node tests/fixtures/make-fixtures.js   (rerun only to change the samples; every snapshot then changes)
const { chromium } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const { openApp, settle, getState, openPanel } = require('../helpers/harness');

const has = (s, f) => f(s);
const pats = s => s.els.filter(q => q.k === 'pattern').length;
const texts = s => s.tiles.reduce((n, t) => n + t.items.filter(i => i.tg).length, 0) + s.els.filter(p => p.tx).length;
const SAMPLES = [
  { file: 'project-1-diamond.wodblok', name: 'Sample diamond', shape: 'diamond', ok: s => s.dim.k === 'diamond' || s.dim.cs === 'diamond' ? (s.els.length >= 4 && pats(s) >= 2 && s.tiles.some(t => t.neg) && ((s.grade || {}).masks || []).length >= 1) : false },
  { file: 'project-3-rect-16x9.wodblok', name: 'Sample wide', asp: [16, 9], ok: s => s.els.length >= 3 && s.els.some(q => (q.fx || []).length) },
  { file: 'project-4-rect-4x3.wodblok', name: 'Sample busy', asp: [4, 3], ok: s => s.tiles.length >= 6 && s.els.length >= 8 && texts(s) >= 1 },
];

(async () => {
  const browser = await chromium.launch();
  for (const sm of SAMPLES) {
    let done = false;
    for (let seed = 1; seed <= 60 && !done; seed++) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'dark', reducedMotion: 'reduce', acceptDownloads: true });
      const page = await ctx.newPage();
      await openApp(page, { seed });
      await openPanel(page, 'canvas');
      if (sm.shape) await page.click(`#cshp [data-s="${sm.shape}"]`);
      if (sm.asp) { await page.fill('#caw', String(sm.asp[0])); await page.dispatchEvent('#caw', 'change'); await page.fill('#cah', String(sm.asp[1])); await page.dispatchEvent('#cah', 'change'); }
      await settle(page);
      await page.click('#rzbar'); await settle(page, { max: 60000 });
      await page.waitForFunction(() => !document.querySelector('.fzov,.fzbar:not(.out)'));
      const s = JSON.parse(await getState(page));
      if (sm.ok(s)) {
        await page.fill('#pnm', sm.name); await page.dispatchEvent('#pnm', 'change'); await settle(page);
        await page.evaluate(() => { window.__wbDownloads.length = 0; });
        await page.click('#psv'); await page.waitForFunction(() => window.__wbDownloads.some(d => /\.wodblok$/.test(d.filename)), null, { timeout: 30000 });
        const d = await page.evaluate(() => window.__wbDownloads.find(x => /\.wodblok$/.test(x.filename)));
        fs.writeFileSync(path.join(__dirname, sm.file), Buffer.from(d.base64, 'base64'));
        console.log(sm.file, 'seed', seed, 'tiles', s.tiles.length, 'elements', s.els.length, 'bytes', Buffer.from(d.base64, 'base64').length);
        done = true;
      }
      await ctx.close();
    }
    if (!done) { console.error('no seed met the needs of', sm.file); process.exitCode = 1; }
  }
  await browser.close();
})();
