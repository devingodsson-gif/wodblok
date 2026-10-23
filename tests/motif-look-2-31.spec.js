// 2.31.0 (owner Oct 23 2026): the Shape element is gone; motifs took over what it did. The Basic shapes set (first in the library) holds the old presets as fixed outlines,
// and every motif can be stretched, have no fill or an image in place of its colour, and an outline: on the canvas, in a stamp and as a pattern's source.
const { test, expect } = require('@playwright/test');
const path = require('path');
const H = require('./helpers/harness');

const els = async page => JSON.parse(await H.getState(page)).els;
const motifs = async page => (await els(page)).filter(q => q.k === 'motif' && !q.bgd);
const setRange = (page, id, v) => page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);
const IMG = path.join(__dirname, 'fixtures', 'picture.png');   // a made-up picture: four blocks of colour

test('no Shape button; Basic shapes is the first set of the library, with the old presets as motifs', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await expect(page.locator('#elb [data-k="shape"]')).toHaveCount(0);
  await H.showPanel(page, 'motifs');
  const sets = await page.locator('#lib .lfr[data-f^="b:"]').evaluateAll(a => a.map(e => e.dataset.f));
  expect(sets[0]).toBe('b:Basic shapes');
  await page.locator('#lib .lfr[data-f="b:Basic shapes"]').click(); await H.settle(page);
  const names = await page.locator('#lib button[data-m]').evaluateAll(a => a.map(e => e.getAttribute('aria-label')));
  expect(names).toEqual(['Rectangle', 'Rounded rectangle', 'Oval', 'Triangle', 'Diamond', 'Pentagon', 'Hexagon', 'Star', 'Arrow', 'Heart', 'Line']);
  expect(errors).toEqual([]);
});

test('a canvas motif: Fill None, Colour and Image; an Outline whose width does not grow with the motif', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await H.addShape(page, 'star');
  let q = (await motifs(page))[0];
  expect(q).toBeTruthy();
  await expect(page.locator('#mf_f')).toBeVisible();
  await expect(page.locator('#mf_s')).toBeHidden();                 // width and height are in the Edit group for a canvas motif
  await page.click('#mf_fk [data-f="none"]'); await H.settle(page);
  expect((await motifs(page))[0].fl).toBe('none');
  await page.check('#mf_oon'); await H.settle(page);
  expect((await motifs(page))[0].sw).toBeGreaterThan(0);
  await setRange(page, 'mf_ow', 12); await H.settle(page);
  expect((await motifs(page))[0].sw).toBe(12);
  const blur = () => page.evaluate(() => { const f = document.querySelector('#art filter[id$="o"] feGaussianBlur'); return f && +f.getAttribute('stdDeviation'); });
  expect(await blur()).toBe(6);
  await setRange(page, 'lfps', 60); await H.settle(page);                // a bigger motif keeps its outline width
  expect((await motifs(page))[0].s).not.toBe(q.s);
  expect(await blur()).toBe(6);
  await page.click('#mf_fk [data-f="solid"]'); await H.settle(page);
  expect((await motifs(page))[0].fl).toBeUndefined();
  await page.click('#mf_fk [data-f="img"]'); await H.settle(page);
  await page.setInputFiles('#lfafile', IMG); await H.settle(page, { max: 30000 });
  q = (await motifs(page))[0];
  expect(q.fl).toBe('img');
  expect(q.a).toBeTruthy();
  expect(await page.locator('#art g[data-mv] use[href^="#mai_"]').count()).toBe(1);
  await page.click('#mf_im [data-i="contain"]'); await H.settle(page);
  expect((await motifs(page))[0].im).toBe('contain');
  expect(errors).toEqual([]);
});

test('a click picks a motif by its outline: beside a Line, inside its box, it misses', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  const u = await H.addShape(page, 'line');
  await page.keyboard.press('Escape'); await H.settle(page);
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); s.els.forEach(q => { if (q.k === 'motif') q.s = 200; }); window.__wbTest.apply(JSON.stringify(s)); });
  await H.settle(page); await page.waitForTimeout(300);   // the motif's shape is drawn small once, then hits use it
  const art = await page.locator('#art').boundingBox(), vb = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
  const k = art.width / vb[0], cx = art.x + art.width / 2, cy = art.y + art.height / 2;
  await page.mouse.click(cx, cy + 60 * k); await H.settle(page);           // 60 units below the line, inside its 200-unit box
  expect(await page.evaluate(() => document.querySelectorAll('#fpov rect.sel').length)).toBe(0);
  await page.mouse.click(cx, cy); await H.settle(page);                    // on the line
  expect(await page.evaluate(() => document.querySelectorAll('#fpov rect.sel').length)).toBe(1);
  expect(u).toBeTruthy();
  expect(errors).toEqual([]);
});

test('a motif in a stamp: an outline of its own colour and an image print with the stamp', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await page.click('#rzdo'); await H.settle(page, { max: 60000 });
  const p = await H.stampInstance(page, 1); const c = await H.canvasToClient(page, p.cx, p.cy);
  await page.mouse.dblclick(c.x, c.y); await H.settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.62); await H.settle(page);
  await H.showPanel(page, 'motifs');
  await expect(page.locator('#mf_o')).toBeVisible();
  await page.check('#mf_oon'); await H.settle(page);
  await page.click('#mf_fk [data-f="img"]'); await H.settle(page);
  await page.setInputFiles('#lfafile', IMG); await H.settle(page, { max: 30000 });
  const it = JSON.parse(await H.getState(page)).tiles.find(t => t.id === 1).items.find(q => q.fl === 'img');
  expect(it).toBeTruthy();
  expect(it.sw).toBeGreaterThan(0);
  expect(await page.locator('#stpix image').count()).toBe(1);             // the picture is defined once for every print
  expect(errors).toEqual([]);
});

test('a pattern\'s motif source: picked in the list, it takes width and height, no fill and an outline, and every placement shows them', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await page.click('#elb [data-k="pattern"]'); await H.addKind(page, 'pattern');
  await H.patSource(page, 'motif', 0);
  await H.showPanel(page, 'layers');
  await page.locator('#pesrc [data-look]').first().click(); await H.settle(page);
  await expect(page.locator('section.pn[data-p="layers"] #mf_s')).toBeVisible();   // the groups come under the sources
  await expect(page.locator('section.pn[data-p="layers"] #mf_o')).toBeVisible();
  await setRange(page, 'mf_sx', 150); await H.settle(page);
  await page.click('#mf_fk [data-f="none"]'); await H.settle(page);
  await page.check('#mf_oon'); await H.settle(page);
  const src = (await els(page)).find(q => q.k === 'pattern').src[0];
  expect(src).toMatchObject({ k: 'motif', wx: 1.5, fl: 'none' });
  expect(src.sw).toBeGreaterThan(0);
  expect(await page.locator('#art filter[id$="o"]').count()).toBeGreaterThan(4);   // an outline for each placement
  await page.locator('#pesrc [data-look]').first().click(); await H.settle(page);  // picked again: let go
  await expect(page.locator('#mf_f')).toBeHidden();
  expect(errors).toEqual([]);
});

test('a dragged motif is drawn moving while the pointer is down', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await H.addShape(page, 'ellipse');
  const left = () => page.evaluate(() => { const g = document.querySelector('#art [data-mv]'); return g ? g.getBoundingClientRect().left : null; });
  const b = await page.locator('#art').boundingBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  const x0 = await left();
  expect(x0).not.toBeNull();
  await page.mouse.move(cx, cy); await page.mouse.down();
  await page.mouse.move(cx + 50, cy + 10); await page.waitForTimeout(100);
  await page.mouse.move(cx + 100, cy + 20); await page.waitForTimeout(100);
  expect(Math.abs((await left()) - x0 - 100)).toBeLessThan(3);
  await page.mouse.up(); await H.settle(page);
  expect(Math.abs((await left()) - x0 - 100)).toBeLessThan(3);
  expect(errors).toEqual([]);
});
