// 2.84.4 (patch 3 of docs/patch-todo-2.85.md): the stamp tab.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

async function newStampTab(page) {
  await H.showPanel(page, 'stmp'); await page.click('#smknew'); await H.settle(page); await page.click('#smkedit'); await H.settle(page);
  return page.evaluate(() => window.__wbTest.unlockedStamp());
}
const items = (page, sid) => page.evaluate(sid => JSON.parse(window.__wbTest.state()).tiles.find(t => t.id === sid).items, sid);
const gridOn = page => page.evaluate(() => { for (const id of ['pgs', 'pgn']) { const s = document.getElementById(id); s.checked = true; s.dispatchEvent(new Event('change', { bubbles: true })); } });

// T8
test('in a stamp\'s tab the alignment grid divides the stamp, and a dragged shape snaps to it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  const sid = await newStampTab(page);
  await H.stampTabRect(page);
  await gridOn(page); await H.settle(page);
  const vb = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height]; });
  const d = await page.evaluate(() => document.querySelector('#fpgrid path').getAttribute('d'));
  expect(d, 'the lines run the height of the stamp').toContain(`V${vb[1]}`);
  expect(d).not.toContain('V800');
  const n = await page.evaluate(() => JSON.parse(window.__wbTest.state()).proj.pgrid ? JSON.parse(window.__wbTest.state()).proj.pgrid.n : null);
  const b = await page.locator('#art').boundingBox(), q0 = (await items(page, sid))[0];
  const x = b.x + q0.x / vb[0] * b.width, y = b.y + q0.y / vb[1] * b.height;
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 70, y + 45, { steps: 6 }); await page.mouse.up(); await H.settle(page);
  const q = (await items(page, sid))[0], cells = d.match(/M[\d.]+ 0V/g).length - 1, c = vb[0] / cells;
  const onGrid = v => Math.abs(v / (c / 2) - Math.round(v / (c / 2))) < 0.01;
  expect(q.x).not.toBe(q0.x);
  expect(onGrid(q.x) && onGrid(q.y), `${q.x}, ${q.y} on a grid of ${c}`).toBe(true);
  expect(errors).toEqual([]);
});

test('Snap all to grid in a stamp\'s tab snaps the stamp\'s shapes and leaves the canvas\'s elements alone', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: true });
  const els0 = JSON.stringify(JSON.parse(await H.getState(page)).els);
  const sid = await newStampTab(page);
  await H.stampTabRect(page);
  await page.evaluate(sid => { const d = JSON.parse(window.__wbTest.state()), t = d.tiles.find(x => x.id === sid); Object.assign(t.items[0], { x: 101.3, y: 77.7 }); return window.__wbTest.apply(JSON.stringify(d)); }, sid); await H.settle(page);
  await H.openPanel(page, 'pgrid'); await H.settle(page);
  await page.click('#pgq'); await H.settle(page);
  const q = (await items(page, sid))[0], vb = await page.evaluate(() => document.getElementById('art').viewBox.baseVal.width);
  const c = vb / 8;   // the grid's default 8 cells across
  const onGrid = v => Math.abs(v / (c / 2) - Math.round(v / (c / 2))) < 0.01;
  expect(onGrid(q.x) && onGrid(q.y), `${q.x}, ${q.y} on a grid of ${c}`).toBe(true);
  expect(await page.textContent('#pmsg')).toMatch(/Snapped 1 shape to the grid/);
  expect(JSON.stringify(JSON.parse(await H.getState(page)).els), 'the canvas\'s elements did not move').toBe(els0);
  expect(errors).toEqual([]);
});

test('on the canvas the grid still divides the canvas', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await gridOn(page); await H.settle(page);
  const vb = await page.evaluate(() => document.getElementById('art').viewBox.baseVal.height);
  expect(await page.evaluate(() => document.querySelector('#fpgrid path').getAttribute('d'))).toContain(`V${vb}`);
  expect(errors).toEqual([]);
});

// T12
test('a shape picked on its symmetry copy shows its box and handles on that copy, and the copy\'s handles size it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  const sid = await newStampTab(page);
  await H.armRect(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * .25, b.y + b.height * .3, { steps: 3 }); await page.mouse.click(b.x + b.width * .25, b.y + b.height * .3); await H.settle(page);
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.keyboard.press('v'); await H.settle(page);
  await H.showPanel(page, 'stmp'); await page.locator('#sym [data-y="lr"]').click(); await H.settle(page);
  await page.mouse.click(b.x + b.width * .5, b.y + b.height * .9); await H.settle(page);   // nothing selected
  const boxX = () => page.evaluate(() => { const r = document.querySelector('#stoh polygon.stes').getBoundingClientRect(); return r.x + r.width / 2; });
  await page.mouse.click(b.x + b.width * .75, b.y + b.height * .3); await H.settle(page);
  await expect(page.locator('#stoh .steh')).toHaveCount(9);
  expect(await boxX(page), 'the box is on the copy (right half)').toBeGreaterThan(b.x + b.width / 2);
  const s0 = (await items(page, sid))[0].s;
  const se = await page.locator('#stoh .steh[data-hd="se"]').boundingBox(), hx = se.x + se.width / 2, hy = se.y + se.height / 2;
  const pb = await page.evaluate(() => { const r = document.querySelector('#stoh polygon.stes').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  const ox = Math.sign(hx - pb[0]) * 40, oy = Math.sign(hy - pb[1]) * 40;   // outward from the copy's middle (on a mirrored copy the original's se corner is on its left)
  await page.mouse.move(hx, hy); await page.mouse.down(); await page.mouse.move(hx + ox, hy + oy, { steps: 6 }); await page.mouse.up(); await H.settle(page);
  { const q = (await items(page, sid))[0]; expect(q.s * (q.sx || 1), 'the copy\'s corner sizes the shape').toBeGreaterThan(s0 * 1.05); }
  await page.mouse.click(b.x + b.width * .5, b.y + b.height * .9); await H.settle(page);
  await page.mouse.click(b.x + b.width * .25, b.y + b.height * .3); await H.settle(page);
  expect(await boxX(page), 'picked on the original, the box is on the original').toBeLessThan(b.x + b.width / 2);
  expect(errors).toEqual([]);
});

// T13
test('symmetry: Wrap at the zone edges on carries a shape past its zone into the next one; off cuts it at the zone edge', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  const sid = await newStampTab(page);
  await H.stampTabRect(page);
  // Repeat ↔ in two: a 80-wide shape at x 100 runs 20 past its half (the zone edge at 120)
  await page.evaluate(sid => { const d = JSON.parse(window.__wbTest.state()), t = d.tiles.find(x => x.id === sid); Object.assign(t.items[0], { x: 100, y: 120, s: 0.8, sx: 1, sy: 1, r: 0 }); t.sym = { m: 'rx', n: 2 }; return window.__wbTest.apply(JSON.stringify(d)); }, sid);
  await H.settle(page);
  await page.mouse.click(10, 10); await page.keyboard.press('Escape'); await H.settle(page);   // nothing selected, so no box over the spot
  await H.showPanel(page, 'stmp');
  await expect(page.locator('#symzr')).toBeVisible();
  await expect(page.locator('#symz')).toBeChecked();
  const px = async () => { const b = await page.locator('#art').boundingBox(), buf = await page.screenshot({ clip: { x: b.x + b.width * 130 / 240 - 2, y: b.y + b.height * 120 / 240 - 2, width: 4, height: 4 } });
    return page.evaluate(async s => { const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()), c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(1, 1, 1, 1).data; return [d[0], d[1], d[2]]; }, buf.toString('base64')); };
  const ink = await px(page);
  await page.locator('#symzr').click(); await H.settle(page);
  expect((await page.evaluate(sid => JSON.parse(window.__wbTest.state()).tiles.find(x => x.id === sid).sym, sid)).zc).toBe(1);
  const cut = await px(page);
  const diff = Math.abs(ink[0] - cut[0]) + Math.abs(ink[1] - cut[1]) + Math.abs(ink[2] - cut[2]);
  expect(diff, `past the zone edge: ${ink} with wrap, ${cut} cut off`).toBeGreaterThan(60);
  await page.locator('#symzr').click(); await H.settle(page);
  expect((await page.evaluate(sid => JSON.parse(window.__wbTest.state()).tiles.find(x => x.id === sid).sym, sid)).zc).toBeUndefined();
  expect(errors).toEqual([]);
});

// T14
test('a pattern\'s Accent can be any stamp of the project, not only one of its sources', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addStamp(page); await page.keyboard.press('Escape'); await H.settle(page);
  const sid = JSON.parse(await H.getState(page)).tiles[0].id;
  // a pattern of squares only (its one source is a shape), then the accent on
  await page.click('#elb [data-k="pattern"]'); await H.addKind(page, 'pattern'); await H.settle(page);
  await H.openPanel(page, 'layers'); await H.settle(page);
  await H.patSource(page, 'motif', 0); await H.settle(page);
  await page.click('#pesrc [data-sx="0"]'); await H.settle(page);
  await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()), p = s.els.find(q => q.k === 'pattern'); Object.assign(p, { lay: 'tile', ts: 'square', ar: 'grid', ps: 10, sp: 40 }); window.__wbTest.apply(JSON.stringify(s)); }); await H.settle(page);
  expect(JSON.parse(await H.getState(page)).els.find(q => q.k === 'pattern').src.map(x => x.k)).toEqual(['motif']);
  await page.locator('#peac').check(); await H.settle(page);
  const opts = await page.evaluate(() => [...document.querySelectorAll('#peacs option')].map(o => o.value));
  expect(opts, 'the project\'s stamp is offered').toContain('t' + sid);
  const dyn0 = await page.evaluate(() => document.getElementById('dyn').innerHTML.length);
  await page.evaluate(v => { const s = document.getElementById('peacs'); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, 't' + sid); await H.settle(page);
  const ac = JSON.parse(await H.getState(page)).els.find(q => q.k === 'pattern').ac;
  expect(ac.src).toEqual({ k: 'stamp', t: sid, w: 1 });
  expect(await page.evaluate(() => document.getElementById('peacs').value)).toBe('t' + sid);
  expect(await page.evaluate(() => document.getElementById('dyn').innerHTML.length), 'the accent now prints the stamp').not.toBe(dyn0);
  // back to the pattern's own source
  await page.evaluate(() => { const s = document.getElementById('peacs'); s.value = 's0'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await H.settle(page);
  const ac2 = JSON.parse(await H.getState(page)).els.find(q => q.k === 'pattern').ac;
  expect(ac2.src).toBeUndefined(); expect(ac2.s).toBe(0);
  expect(errors).toEqual([]);
});

// T11
test('in a stamp\'s Elements list a shape row is dragged to change its depth', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  const sid = await newStampTab(page);
  await H.stampTabRect(page);
  // a second, different shape (so the two are not folded into one group)
  await H.showPanel(page, 'motifs');
  await page.locator('#lib button[data-m]:not([data-m="' + (await items(page, sid))[0].m + '"])').first().click(); await H.settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * .3, b.y + b.height * .3, { steps: 3 }); await page.mouse.click(b.x + b.width * .3, b.y + b.height * .3); await H.settle(page);
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.keyboard.press('v'); await H.settle(page);
  const it0 = (await items(page, sid)).map(q => q.m);
  expect(it0.length).toBe(2); expect(it0[0]).not.toBe(it0[1]);
  await H.showPanel(page, 'lyrs');
  const rowOf = i => page.locator(`#mlist .mr[data-r="${i}"]`);
  await expect(rowOf(0)).toHaveAttribute('draggable', 'true');
  // the list puts the front first: row 1 (the second shape) is on top. Dragging the rectangle (row 0) onto its top half puts it in front.
  await rowOf(0).dragTo(rowOf(1), { targetPosition: { x: 20, y: 3 } }); await H.settle(page);
  expect((await items(page, sid)).map(q => q.m)).toEqual([it0[1], it0[0]]);
  // and back behind it, onto the bottom half
  const h = (await rowOf(0).boundingBox()).height;
  await rowOf(1).dragTo(rowOf(0), { targetPosition: { x: 20, y: h - 3 } }); await H.settle(page);
  expect((await items(page, sid)).map(q => q.m)).toEqual(it0);
  expect(errors).toEqual([]);
});
