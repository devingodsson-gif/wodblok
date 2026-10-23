// Makes the built-in starting points (templates/<kind>/*.wodblok) from the built app (run `npm run build` first, then `node tools/templates/make.js`).
// Each recipe is plain data: the stamps (library shapes only, no artwork of our own) and the elements. The script opens the built app, starts a blank project of the kind,
// puts the recipe in, saves it with "Save as template" and writes the file the picker's Download gives. Same recipe, same seed, same bytes.
// Rerun it whenever the file format or the look of the app changes.
const fs = require('fs'), path = require('path');
const { chromium } = require('@playwright/test');
const H = require('../../tests/helpers/harness');
const ROOT = path.join(__dirname, '..', '..');
// stamps are 240 units square (the middle is 120, 120); an item is [shape, x, y, size, turn]
// shapes: b151 Five-petal flower, b287 Dot, b288 Eight-point star, b285 Diamond, b313 Greek key square, b324 Star tile, b300 Star, b292 Lozenge
const RECIPES = [
  { kind: 'canvas', file: 'stamped-flowers', name: 'Stamped flowers',
    stamps: [[['b151', 120, 120, 1.5, 0], ['b287', 28, 28, .45, 0], ['b287', 212, 212, .45, 0], ['b287', 212, 28, .45, 0], ['b287', 28, 212, .45, 0]]],
    els: c => [{ k: 'pattern', n: 'Pattern 1', lay: 'grid', cn: 5, rn: 7, sz: 80, rt: 0, ds: 'cycle', sd: 11, src: [{ k: 'stamp', t: 1, w: 1 }], x: c.w / 2, y: c.h / 2, s: Math.min(c.w, c.h), r: 0, f: 1 }] },
  { kind: 'canvas', file: 'framed-border', name: 'Framed border',
    stamps: [[['b313', 120, 120, 1.7, 0]], [['b288', 120, 120, 2, 0]]],
    els: c => [{ k: 'pattern', n: 'Border', lay: 'frame', cn: 7, rn: 10, sz: 80, rt: 0, ds: 'cycle', sd: 5, in: 4, src: [{ k: 'stamp', t: 1, w: 1 }], x: c.w / 2, y: c.h / 2, s: Math.min(c.w, c.h), r: 0, f: 1 },
      { k: 'stamp', t: 2, x: c.w / 2, y: c.h / 2, s: Math.min(c.w, c.h) * .55, r: 0, f: 1 }] },
  { kind: 'tile', file: 'half-drop-diamonds', name: 'Half-drop diamonds',
    stamps: [[['b285', 120, 120, 1.6, 0], ['b287', 30, 30, .45, 0], ['b287', 210, 210, .45, 0]]],
    els: c => [{ k: 'pattern', n: 'Pattern 1', lay: 'half', cn: 3, rn: 3, sz: 80, rt: 0, ds: 'cycle', sd: 3, src: [{ k: 'stamp', t: 1, w: 1 }], x: c.w / 2, y: c.h / 2, s: Math.min(c.w, c.h), r: 0, f: 1 }] },
  { kind: 'book', file: 'cover-6x9', name: 'Cover 6 × 9 in',
    stamps: [[['b324', 120, 120, 1.7, 0]], [['b288', 120, 120, 2, 0]]],
    els: c => [{ k: 'pattern', n: 'Border', lay: 'frame', cn: 16, rn: 12, sz: 70, rt: 0, ds: 'cycle', sd: 7, in: 3, src: [{ k: 'stamp', t: 1, w: 1 }], x: c.w / 2, y: c.h / 2, s: Math.min(c.w, c.h), r: 0, f: 1 },
      { k: 'stamp', t: 2, x: c.w * .75, y: c.h / 2, s: Math.min(c.w * .4, c.h * .4), r: 0, f: 1 }] },
];
const only = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  for (const R of RECIPES) {
    if (only && R.file !== only) continue;
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })).newPage();
    const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
    if (R.kind !== 'canvas') {                                           // a blank project of the kind, as the picker starts it
      await page.click('#fileb'); await page.click('#tpnew'); await page.click(`#tpty [data-k="${R.kind}"]`); await H.settle(page, { quiet: 4 });
      await page.locator('#tpg .tpc').first().click(); await H.settle(page, { quiet: 6 });
      if (await page.locator('#tpdlg').isVisible()) await page.keyboard.press('Escape');
    }
    for (let i = 0; i < R.stamps.length; i++) await H.addStamp(page);
    const dims = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return { w: v.width, h: v.height }; });
    const s = JSON.parse(await H.getState(page));
    s.tiles.forEach((t, i) => { t.items = R.stamps[i].map(([m, x, y, sc, r]) => ({ m, x, y, s: sc, r, f: 1 })); });
    const bg = s.els.filter(q => q.bgd).map(q => ({ ...q, x: +(dims.w / 2).toFixed(1), y: +(dims.h / 2).toFixed(1), s: +dims.w.toFixed(1), wy: +(dims.h / dims.w).toFixed(4) }));   // the Background fits this canvas
    s.els = [...bg, ...R.els(dims).map((q, i) => ({ u: 'tp' + i, ...q }))];
    s.name = R.name;
    await page.evaluate(j => window.__wbTest.apply(j), JSON.stringify(s)); await H.settle(page);
    await page.evaluate(() => { window.__wbTest.resetHistory(); });
    await page.click('#fileb'); await page.click('#tpsave'); await page.fill('#tpsn', R.name); await page.click('#tpsok'); await H.settle(page);
    await page.evaluate(() => { window.__wbDownloads.length = 0; });
    await page.click('#fileb'); await page.click('#tpnew'); await page.click(`#tpty [data-k="${R.kind}"]`);
    await page.click('#tpy [data-more]'); await page.getByRole('menuitem', { name: /Download/ }).click();
    await page.waitForFunction(() => window.__wbDownloads.length > 0);
    const dl = await page.evaluate(() => window.__wbDownloads[0]);
    const dir = path.join(ROOT, 'templates', R.kind); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, R.file + '.wodblok'), Buffer.from(dl.base64, 'base64'));
    console.log(R.kind + '/' + R.file + '.wodblok', Buffer.from(dl.base64, 'base64').length, 'bytes', errors.length ? 'ERRORS ' + errors.join('; ') : '');
    await page.context().close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
