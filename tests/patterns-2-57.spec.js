// 2.57.0 (owner Oct 26 2026, docs/polish-plan.md release 3): a Pattern tiles its area edge to edge by a tile shape and an arrangement, with Size and Spacing;
// its area has corners that change it (the pieces keep their size); file format 29.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), os = require('os'), path = require('path');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));
const pat = async page => (await st(page)).els.find(q => q.k === 'pattern');
const setPat = (page, o) => page.evaluate(o => { const s = JSON.parse(window.__wbTest.state()), p = s.els.find(q => q.k === 'pattern'); Object.assign(p, o); window.__wbTest.apply(JSON.stringify(s)); }, o);
const pick = (page, sel, v) => page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);
const range = (page, sel, v) => page.evaluate(([sel, v]) => { const e = document.querySelector(sel); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [sel, v]);
async function shapePattern(page, ar, sp) {
  await H.openPanel(page, 'layers'); await H.settle(page);
  await H.patSource(page, 'motif', 0); await H.settle(page);   // the first Basic shape: a rectangle
  await setPat(page, { src: (await pat(page)).src.filter(s => s.k === 'motif'), ts: 'square', ar, ps: 10, sp }); await H.settle(page);
}

test('a new Pattern tiles: Tiling layout, tile shape From stamp, its arrangements, Size and Spacing; no columns and rows', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  const p = await pat(page);
  expect(p).toMatchObject({ lay: 'tile', ts: 'auto', sp: 0, af: 1 });
  expect(p.ps).toBeGreaterThan(1);
  await H.openPanel(page, 'layers'); await H.settle(page);
  await expect(page.locator('#pelay [data-l="tile"]')).toHaveClass(/on/);
  await expect(page.locator('#petl')).toBeVisible();
  await expect(page.locator('#pefr')).toBeHidden();
  expect(await page.locator('#pets option').allTextContents()).toEqual(['From stamp', 'Square', 'Hexagon', 'Triangle', 'Diamond', 'Circle', 'Octagon', 'Wallpaper']);
  expect(await page.locator('#pear option').allTextContents()).toEqual(['Grid', 'Checkerboard', 'Brick', 'Half drop', 'Diagonal', 'Basketweave', 'Turned', 'Pinwheel', 'Mirror', 'Stripes', 'Bands', 'Chevron', 'Herringbone']);   // a rectangle stamp tiles by Square
  await pick(page, '#pets', 'hex'); await H.settle(page);
  expect(await page.locator('#pear option').allTextContents()).toEqual(['Honeycomb', 'Honeycomb, turned', 'Three colours']);
  expect((await pat(page)).ts).toBe('hex');
  await pick(page, '#pear', 'three'); await H.settle(page);
  expect((await pat(page)).ar).toBe('three');
  await range(page, '#pesp', 40); await H.settle(page);
  expect((await pat(page)).sp).toBe(40);
  // Radial still has its columns and rows
  await page.click('#pelay [data-l="radial"]'); await H.settle(page);
  await expect(page.locator('#pefr')).toBeVisible(); await expect(page.locator('#petl')).toBeHidden();
  expect(errors).toEqual([]);
});

test('pieces sit edge to edge (Spacing 0): no paper shows between them; Spacing opens gaps', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addPattern(page);
  await shapePattern(page, 'grid', 0);
  // the share of paper (light pixels) in the middle of the canvas
  const paper = async () => { const b = await page.locator('#art').boundingBox(), shot = await page.screenshot({ clip: { x: b.x + b.width * .3, y: b.y + b.height * .3, width: b.width * .4, height: b.height * .4 } });
    return page.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 450) n++; return n / (d.length / 4); }, shot.toString('base64')); };
  expect(await paper()).toBeLessThan(0.03);   // touching: the rectangles cover the paper
  await setPat(page, { sp: 50 }); await H.settle(page);
  const open = await paper();
  expect(open).toBeGreaterThan(0.3); expect(open).toBeLessThan(0.75);   // a piece is 1/1.5 of each step: about 56% paper
  expect(errors).toEqual([]);
});

test('a selected pattern shows its area; pulling a corner resizes the area, the pieces keep their size, and the pattern is cut at the area', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addPattern(page);
  const p0 = await pat(page);
  await H.showPanel(page, 'lyrs');
  await page.locator('#lyl2 .lyr', { hasText: p0.n }).locator('.lyn').click(); await H.settle(page);
  await expect(page.locator('#fpov [data-fh="se"]')).toHaveCount(1);
  await expect(page.locator('#fpov [data-fh="rot"]')).toHaveCount(0);   // the area does not turn
  const h = await page.locator('#fpov [data-fh="se"]').boundingBox();
  const hx = h.x + h.width * .3, hy = h.y + h.height * .3;   // a whole-canvas area's corner sits on the canvas's edge: take its inner part
  await page.mouse.move(hx, hy); await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(hx - i * 20, hy - i * 30);
  await page.mouse.up(); await H.settle(page);
  const p1 = await pat(page);
  expect(p1.af).toBeUndefined();
  expect(p1.aw).toBeLessThan(p0.aw || 1e9); expect(p1.ps).toBe(p0.ps);
  await expect(page.locator('#art clipPath[id^="pc"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('patterns are saved and opened at format 30 (with their Print fields); a file of format 29 is refused', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await setPat(page, { ts: 'tri', ar: 'alt', sp: 10, pcm: 'place', pcc: ['#ff0000', '#0000ff'], iv: 40, ov: 1 }); await H.settle(page);
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#fileb'); await page.click('#psv');
  await page.waitForFunction(() => window.__wbDownloads.length > 0); await page.keyboard.press('Escape');
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-pat-')), f = path.join(dir, 'p.wodblok'); fs.writeFileSync(f, Buffer.from(dl.base64, 'base64'));
  const { unzipSync, strFromU8, zipSync, strToU8 } = require('fflate');
  const files = unzipSync(new Uint8Array(fs.readFileSync(f))), proj = JSON.parse(strFromU8(files['project.json']));
  expect(proj.v).toBe(30);
  await H.openProjectFile(page, f);
  expect(await pat(page)).toMatchObject({ lay: 'tile', ts: 'tri', ar: 'alt', sp: 10, pcm: 'place', pcc: ['#ff0000', '#0000ff'], iv: 40, ov: 1 });
  files['project.json'] = strToU8(JSON.stringify({ ...proj, v: 29 }));
  const old = path.join(dir, 'old.wodblok'); fs.writeFileSync(old, Buffer.from(zipSync(files)));
  await page.setInputFiles('#pfile', old); await H.settle(page);
  await expect(page.locator('#pmsg')).toContainText('older WODBLOK');
  expect(errors).toEqual([]);
});
