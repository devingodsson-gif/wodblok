// 2.60.1 (artist test, release 2 of docs/artist-test-todo.md): paste stays on the canvas; a Pattern's area is never smaller than one piece; the colour picker has Done;
// menus are as wide as their longest item; a shaped canvas draws its see-through squares at the rectangle's size; each panel tab closes on its own.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));
const cv = page => page.locator('#art').evaluate(a => [a.viewBox.baseVal.width, a.viewBox.baseVal.height]);

test('pasting again and again near the bottom keeps the copies inside the canvas', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addShape(page, 'rect');
  const [cw, ch] = await cv(page), d = await st(page), q = d.els[d.els.length - 1];
  Object.assign(q, { x: cw / 2, y: ch * .9, s: cw * .2 }); await page.evaluate(s => __wbTest.apply(s), JSON.stringify(d)); await H.settle(page);
  const b = await H.canvasToClient(page, cw / 2, ch * .9); await page.mouse.click(b.x, b.y); await H.settle(page);
  await page.keyboard.press('Control+c');
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Control+v'); await H.settle(page); }
  const all = (await st(page)).els.filter(x => x.k === 'motif');
  expect(all.length).toBe(6);
  all.forEach(x => { expect(x.y + x.s / 2).toBeLessThanOrEqual(ch + .5); expect(x.x + x.s / 2).toBeLessThanOrEqual(cw + .5); });
  expect(errors).toEqual([]);
});

test('a Tiling pattern\'s area cannot be pulled smaller than one piece', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addPattern(page);
  const p0 = (await st(page)).els.find(x => x.k === 'pattern');
  await H.showPanel(page, 'lyrs');
  await page.locator('#lyl2 .lyr', { hasText: p0.n }).locator('.lyn').click(); await H.settle(page);
  const h = await page.locator('#fpov [data-fh="se"]').boundingBox(), hx = h.x + h.width * .3, hy = h.y + h.height * .3;
  const nw = await page.locator('#fpov [data-fh="nw"]').boundingBox();
  await page.mouse.move(hx, hy); await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(hx + (nw.x - hx) * i / 10, hy + (nw.y - hy) * i / 10);
  await page.mouse.up(); await H.settle(page);
  const [cw, ch] = await cv(page), p = (await st(page)).els.find(x => x.k === 'pattern'), piece = Math.min(cw, ch) * p.ps / 100;
  expect(Math.max(p.aw, p.ah)).toBeGreaterThanOrEqual(piece * .99);
  expect(errors).toEqual([]);
});

test('the colour picker closes with Done', async ({ page }) => {
  const { errors } = await H.openApp(page, { background: true });
  await page.click('#tyc .tys >> nth=0');
  await expect(page.locator('.cpk')).toBeVisible();
  await expect(page.locator('.cpk .cpkok button')).toHaveText('Done');
  await page.click('.cpk .cpkok button');
  await expect(page.locator('.cpk')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a menu is as wide as its longest item: each item sits on one line', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.showPanel(page, 'motifs');
  await page.locator('section.pn[data-p="motifs"] .lnav button[aria-label="Import"]').click();
  const items = page.locator('.rowm .ddi');
  await expect(items.first()).toBeVisible();
  const hs = await items.evaluateAll(a => a.map(b => [b.scrollHeight, b.clientHeight]));
  hs.forEach(([s, c]) => expect(s).toBeLessThanOrEqual(c + 1));
  expect(errors).toEqual([]);
});

test('a hexagon stamp shows its see-through squares at the same size as a rectangle\'s (8 screen pixels)', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addStamp(page); await H.unlockStamp(page, 0); await H.settle(page);
  await page.locator('#skind [data-k="hex"]').click(); await H.settle(page);
  const px = await page.evaluate(() => { const p = document.getElementById('ckp'), a = document.getElementById('art'), k = a.getBoundingClientRect().width / a.viewBox.baseVal.width, m = /scale\(([\d.]+)\)/.exec(p.getAttribute('patternTransform')); return 8 * +m[1] * k; });
  expect(px).toBeCloseTo(8, 0);
  expect(errors).toEqual([]);
});

test('each tab of a panel group has its own close button', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, workspaces: true });
  const g = page.locator('.wg').filter({ has: page.locator('section.pn[data-p="lyrs"]') });
  await g.locator('[data-act="lock"]').click(); await H.settle(page);
  const n = await g.locator('.wtab').count();
  expect(n).toBeGreaterThan(1);
  const last = await g.locator('.wtab').nth(n - 1).getAttribute('data-t');
  await g.locator(`.wtx[data-tx="${last}"]`).click(); await H.settle(page);
  await expect(page.locator(`section.pn[data-p="${last}"]`)).toBeHidden();
  expect(await g.locator('.wtab').count()).toBe(n - 1);
  expect(errors).toEqual([]);
});

// 2.60.5: Film Grain is fine grain laid over the picture by Overlay: the picture keeps its brightness
test('Film Grain is fine and keeps the brightness: Overlay, no grey shift', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  const s = JSON.parse(await H.getState(page)), q = s.els.find(x => x.k === 'sheet');
  q.ink = '#808080'; q.fx = [{ u: 'fg1', k: 'grain', sd: 7 }];
  await page.evaluate(x => __wbTest.apply(x), JSON.stringify(s)); await H.settle(page);
  expect(await page.locator('#art filter feBlend[mode="overlay"]').count()).toBeGreaterThan(0);
  const b = await page.locator('#art').boundingBox(), shot = await page.screenshot({ clip: { x: b.x + b.width * .3, y: b.y + b.height * .3, width: 200, height: 200 } });
  const [mean, sd] = await page.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let s = 0, s2 = 0, n = 0; for (let i = 0; i < d.length; i += 4) { const v = d[i]; s += v; s2 += v * v; n++ } const m = s / n; return [m, Math.sqrt(s2 / n - m * m)]; }, shot.toString('base64'));
  expect(Math.abs(mean - 128)).toBeLessThan(12);   // the grey stays grey
  expect(sd).toBeGreaterThan(4);                   // there is grain
  expect(errors).toEqual([]);
});
