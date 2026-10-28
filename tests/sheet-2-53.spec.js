// 2.53.0 (owner Oct 26 2026, docs/sheet-plan.md): the Sheet, an element that always covers the whole canvas. A new Sheet has no fill and works as a filter on what is under it;
// its fill can be a colour or a picture (Cover, Fit, Stretch, Tile); its effects work on its fill and on everything under it. A new project's Background is a Sheet with a colour.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), os = require('os'), path = require('path');
const H = require('./helpers/harness');

const PIC = path.join(__dirname, 'fixtures', 'picture.png');
const st = async page => JSON.parse(await H.getState(page));
const view = page => page.locator('#art').evaluate(a => { const v = a.viewBox.baseVal; return { w: v.width, h: v.height }; });
const sheetPanel = 'section.pn[data-p="sheet"]';
// the rectangle a Sheet's colour draws: the whole canvas
const fullRects = page => page.locator('#art').evaluate(a => { const v = a.viewBox.baseVal; return [...a.querySelectorAll('rect')].filter(r => !r.closest('.bgu') && r.getAttribute('x') === '0' && r.getAttribute('y') === '0' && Math.abs(+r.getAttribute('width') - v.width) < .02 && Math.abs(+r.getAttribute('height') - v.height) < .02).map(r => r.getAttribute('fill')); });
async function addSheet(page) { await page.click('#elb [data-k="sheet"]'); await H.settle(page); }
async function addFx(page, grp, label) {
  await page.locator('.fxg[data-fxk="sheet"] .fxadd').scrollIntoViewIfNeeded(); await page.click('.fxg[data-fxk="sheet"] .fxadd');
  if (grp) { await page.locator('.rowm .ddi', { hasText: grp }).first().hover(); await page.locator('.rowsub .ddi', { hasText: label }).click(); }
  else await page.locator('.rowm:not(.rowsub) .ddi', { hasText: label }).first().click();
  await H.settle(page);
}

test('a new project\'s Background is a Sheet with the paper colour; Add sheet makes a Sheet with no fill above the selection, with its own panel', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  const s = await st(page), bg = s.els[0];
  expect(bg).toMatchObject({ k: 'sheet', n: 'Background', bgd: 1, ink: '@' + s.proj.ts[0] });
  expect(bg.x).toBeUndefined(); expect(bg.s).toBeUndefined();
  expect((await fullRects(page)).length).toBe(1);
  await expect(page.locator('#elb [data-k="sheet"]')).toHaveAttribute('aria-label', 'Sheet');
  await addSheet(page);
  const s2 = await st(page), sh = s2.els[s2.els.length - 1];
  expect(sh).toMatchObject({ k: 'sheet', n: 'Sheet 1', fl: 'none' });
  await expect(page.locator(sheetPanel)).toBeVisible();
  await expect(page.locator(`${sheetPanel} .elk [data-add]`)).toHaveText('Add sheet');
  await expect(page.locator(`${sheetPanel} #mf_f`)).toBeVisible();
  await expect(page.locator('#mf_fk [data-f="none"]')).toHaveAttribute('aria-pressed', 'true');
  for (const id of ['#mf_s', '#mf_o', '#mf_fltr', '#mf_fcr']) await expect(page.locator(id)).toBeHidden();
  await expect(page.locator(`${sheetPanel} .fxg[data-fxk="sheet"]`)).toBeVisible();
  // Add sheet in the panel and in the Elements menu (a command) make another
  await page.click(`${sheetPanel} .elk [data-add]`); await H.settle(page);
  expect((await st(page)).els.filter(q => q.k === 'sheet').map(q => q.n)).toEqual(['Background', 'Sheet 1', 'Sheet 2']);
  expect(await page.evaluate(() => !!window.__wbTest.commands.get('element.add.sheet'))).toBe(true);
  expect(errors).toEqual([]);
});

test('a Sheet with no fill filters what is under it, not what is above; a colour covers what is under it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addShape(page, 'ellipse'); await page.keyboard.press('Escape'); await H.settle(page);
  await addSheet(page);
  await addFx(page, 'Blur', 'Gaussian Blur');
  const s = await st(page), sh = s.els.find(q => q.n === 'Sheet 1');
  expect(sh.fx.map(e => e.k)).toEqual(['blur']);
  // what is under the Sheet is drawn once as it is, and again through the blur
  const under = await page.locator('#art').evaluate(a => { const g = [...a.querySelectorAll('g[id^="flu"]')]; return g.length ? { n: g.length, uses: a.querySelectorAll(`use[href="#${g[0].id}"]`).length, blur: !!a.querySelector('filter feGaussianBlur') } : null; });
  expect(under).toEqual({ n: 1, uses: 1, blur: true });
  // a colour fill covers what is under it; the effects then also work on the colour
  await page.click('#mf_fk [data-f="solid"]'); await H.settle(page);
  await expect(page.locator('#mf_fcr')).toBeVisible();
  expect((await st(page)).els.find(q => q.n === 'Sheet 1').fl).toBeUndefined();
  expect((await fullRects(page)).length).toBe(2);
  // opacity: the Sheet's strength
  await H.showPanel(page, 'lyrs'); await page.evaluate(() => { const r = document.getElementById('ly_op'); r.value = 40; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); }); await H.settle(page);
  expect((await st(page)).els.find(q => q.n === 'Sheet 1').op).toBe(40);
  expect(errors).toEqual([]);
});

test('a picture on a Sheet fits by Cover, Fit, Stretch or Tile and always fills the canvas frame', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await addSheet(page);
  await page.click('#mf_fk [data-f="img"]'); await H.settle(page);
  await page.setInputFiles('#lfafile', PIC); await H.settle(page);
  const v = await view(page);
  for (const f of ['cover', 'contain', 'stretch', 'tile']) {
    await page.click(`#mf_im [data-i="${f}"]`); await H.settle(page);
    await expect(page.locator(`#mf_im [data-i="${f}"]`)).toHaveAttribute('aria-pressed', 'true');
    const q = (await st(page)).els.find(x => x.n === 'Sheet 1');
    expect(q.fl).toBe('img'); expect(q.im).toBe(f === 'cover' ? undefined : f);
    const got = await page.locator('#art').evaluate(a => { const c = [...a.querySelectorAll('clipPath[id^="sh"] rect')][0]; return { clip: c ? [+c.getAttribute('width'), +c.getAttribute('height')] : null, pat: !!a.querySelector('pattern[id^="sh"]') }; });
    expect(got.clip[0]).toBeCloseTo(v.w, 1); expect(got.clip[1]).toBeCloseTo(v.h, 1);
    expect(got.pat).toBe(f === 'tile');
  }
  // a Shape's picture keeps the two fits
  await H.addShape(page, 'rect'); await H.settle(page);
  await page.click('#mf_fk [data-f="img"]'); await H.settle(page);
  await expect(page.locator('#mf_im [data-i="stretch"]')).toBeHidden(); await expect(page.locator('#mf_im [data-i="tile"]')).toBeHidden();
  expect(errors).toEqual([]);
});

test('the Background is a normal Sheet: a click goes through it, the list picks it, it can be hidden and deleted, Undo brings it back; it follows the canvas size', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await H.settle(page);
  await expect(page.locator(sheetPanel)).toBeHidden();
  await H.showPanel(page, 'lyrs'); await page.locator('#lyl2 .lyr').last().locator('.lyn').click(); await H.settle(page);
  await expect(page.locator(sheetPanel)).toBeVisible();
  await expect(page.locator('#mf_fk [data-f="solid"]')).toHaveAttribute('aria-pressed', 'true');
  // arrows and Duplicate leave a Sheet without a place
  await page.keyboard.press('ArrowRight'); await H.settle(page);
  expect((await st(page)).els[0].x).toBeUndefined();
  await page.keyboard.press('Delete'); await H.settle(page);
  expect((await st(page)).els.filter(q => q.k === 'sheet')).toHaveLength(0);
  expect((await fullRects(page)).length).toBe(0);
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await st(page)).els.filter(q => q.bgd)).toHaveLength(1);
  // a new canvas ratio: the Sheet still covers it
  await H.openPanel(page, 'canvas');
  await page.evaluate(() => { const e = document.getElementById('casp'); e.selectedIndex = e.selectedIndex === 0 ? 3 : 0; e.dispatchEvent(new Event('input', { bubbles: true })); }); await H.settle(page);
  expect((await fullRects(page)).length).toBe(1);
  expect(errors).toEqual([]);
});

test('Sheets are saved and opened as they are (format 28); a file from an older WODBLOK is refused', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addStamp(page); await H.settle(page);
  await addSheet(page); await addFx(page, null, 'Colour grade');
  const before = (await st(page)).els.map(q => ({ k: q.k, n: q.n, fl: q.fl, fx: (q.fx || []).map(e => e.k) }));
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#fileb'); await page.click('#psv');
  await page.waitForFunction(() => window.__wbDownloads.length > 0); await page.keyboard.press('Escape');
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-sheet-')), f = path.join(dir, 'sheets.wodblok'); fs.writeFileSync(f, Buffer.from(dl.base64, 'base64'));
  const { unzipSync, strFromU8, zipSync, strToU8 } = require('fflate');
  const files = unzipSync(new Uint8Array(fs.readFileSync(f))), proj = JSON.parse(strFromU8(files['project.json']));
  expect(proj.v).toBe(29);
  await H.openProjectFile(page, f);
  expect((await st(page)).els.map(q => ({ k: q.k, n: q.n, fl: q.fl, fx: (q.fx || []).map(e => e.k) }))).toEqual(before);
  // the same file marked as format 27 is refused
  files['project.json'] = strToU8(JSON.stringify({ ...proj, v: 27 }));
  const old = path.join(dir, 'old.wodblok'); fs.writeFileSync(old, Buffer.from(zipSync(files)));
  await page.setInputFiles('#pfile', old); await H.settle(page);
  await expect(page.locator('#pmsg')).toContainText('older WODBLOK');
  expect(errors).toEqual([]);
});

// found while building 2.53.0: a new project has no stamp (2.15.0), and such a project saved and opened again was refused as damaged
test('a project with no stamps opens again after it is saved', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  expect((await st(page)).tiles).toHaveLength(0);
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#fileb'); await page.click('#psv');
  await page.waitForFunction(() => window.__wbDownloads.length > 0); await page.keyboard.press('Escape');
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'wb-sheet-')), 'empty.wodblok'); fs.writeFileSync(f, Buffer.from(dl.base64, 'base64'));
  await H.openProjectFile(page, f);
  const s = await st(page);
  expect(s.tiles).toHaveLength(0); expect(s.els.map(q => q.k)).toEqual(['sheet']);
  expect(errors).toEqual([]);
});
