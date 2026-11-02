// 2.80.1 and on (owner Oct 31 2026, docs/mobile-touch-plan.md): a phone's touch controls. Touch is sent as real touch events (CDP), which the page sees
// as touch pointers, on a phone-sized screen; the desktop checks run at the normal size with a mouse.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };

// one finger along a path: [[x, y], ...]
async function swipe(page, pts, steps = 6) {
  const c = await page.context().newCDPSession(page);
  const tp = (x, y) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(...pts[0]) });
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    for (let k = 1; k <= steps; k++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(x0 + (x1 - x0) * k / steps, y0 + (y1 - y0) * k / steps) }); await page.waitForTimeout(16); }
  }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(100);
}
// a slider in an open panel, scrolled into the middle of the screen
async function slider(page, id) {
  await page.evaluate(id => document.getElementById(id).scrollIntoView({ block: 'center' }), id);
  await page.waitForTimeout(150);
  return page.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width }; }, id);
}
const val = (page, id) => page.evaluate(id => +document.getElementById(id).value, id);
const scrollY = page => page.evaluate(() => scrollY);

test.describe('on a phone', () => {
  test.use(PHONE);
  test('a slider moves only by a sideways drag, from where it was; a swipe up or down scrolls and a tap changes nothing', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true });
    expect(await page.evaluate(() => document.documentElement.classList.contains('wbtouch'))).toBe(true);
    const pu = JSON.parse(await H.getState(page)).els.find(q => q.k === 'pattern').u;
    await page.evaluate(u => document.querySelector(`#lybody .lyr[data-u="${u}"]`).click(), pu); await H.settle(page);   // the pattern selected: its panel edits it
    await H.showPanel(page, 'layers'); await H.settle(page);
    const id = 'peps', s = await slider(page, id), v0 = await val(page, id), y0 = await scrollY(page);
    // up the page across the slider: it scrolls, the value stays
    await swipe(page, [[s.x + s.w * .5, s.y + 10], [s.x + s.w * .52, s.y - 200]]);
    expect(await val(page, id), 'a vertical swipe').toBe(v0);
    expect(await scrollY(page), 'the page scrolled').not.toBe(y0);
    // a tap on the far end of its track
    const s2 = await slider(page, id);
    await swipe(page, [[s2.x + s2.w * .95, s2.y], [s2.x + s2.w * .95 + 1, s2.y]], 1);
    expect(await val(page, id), 'a tap').toBe(v0);
    await page.waitForTimeout(400);   // a second tap at once would be a double tap, which sets the slider back to its default (as a double click does)
    // sideways: it moves, from where it was
    const h0 = (await page.evaluate(() => window.__wbTest.histLabels())).length;
    await swipe(page, [[s2.x + s2.w * .2, s2.y], [s2.x + s2.w * .5, s2.y + 4]]);
    expect(await val(page, id), 'a sideways drag').toBeGreaterThan(v0);
    expect(JSON.parse(await H.getState(page)).els.find(q => q.k === 'pattern').ps, 'the pattern took it').toBe(await val(page, id));
    expect((await page.evaluate(() => window.__wbTest.histLabels())).length, 'one History step').toBe(h0 + 1);
    expect(errors).toEqual([]);
  });

  test('2.81.3: the canvas stays on screen while the panels scroll; tool panels open as tabs of one group', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true, workspaces: 'launch' });
    for (const p of ['rand', 'layers', 'motifs', 'xrec']) { await page.evaluate(p => document.querySelector(`.rail [data-pn="${p}"]`).click(), p); await H.settle(page); }
    const groups = await page.evaluate(() => [...document.querySelectorAll('.wg')].map(g => [...g.querySelectorAll('.wtab')].map(t => t.dataset.t)));
    expect(groups, 'the Elements list, then one group of tools').toEqual([['lyrs'], ['rand', 'motifs', 'xrec']]);   // 2.84.5: one element panel at a time (Shape closed Pattern)
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(200);
    expect(await page.evaluate(() => scrollY), 'the page scrolled').toBeGreaterThan(100);
    const art = await page.locator('#art').boundingBox();
    expect(art.y, 'the canvas is still on screen').toBeGreaterThanOrEqual(40);
    expect(art.y + art.height).toBeLessThan(844 * .6);
    expect(errors).toEqual([]);
  });

  test('2.81.4: the top bar fits the screen and its icon buttons are touch-sized; the rest are in its menus', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true });
    const top = await page.evaluate(() => { const t = document.querySelector('.top'); return { sw: t.scrollWidth, cw: t.clientWidth, small: [...t.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.height < 36 || r.width < 36) && !b.matches('.mnbb'); }).map(b => b.id) }; });
    expect(top.sw, 'nothing past the edge').toBeLessThanOrEqual(top.cw);
    expect(top.small, 'touch-sized icon buttons').toEqual([]);
    for (const id of ['hstb', 'cmdkb', 'rzopt', 'thm']) await expect(page.locator('#' + id)).toBeHidden();
    await expect(page.locator('#rzdo')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('the colour tray shows right of the element bar, as on a desktop', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true });
    await expect(page.locator('#tyd')).toBeVisible();
    const tray = await page.locator('#tyd').boundingBox(), bar = await page.locator('#elb').boundingBox();
    expect(Math.abs((tray.y + tray.height / 2) - (bar.y + bar.height / 2)), 'one row').toBeLessThan(6);
    expect(tray.x, 'right of the element bar').toBeGreaterThanOrEqual(bar.x + bar.width);
    expect(tray.x + tray.width).toBeLessThanOrEqual(391);
    expect(errors).toEqual([]);
  });
});

// fingers: frames of [[x, y], ...] (one entry per finger); each frame is sent as one touch event
async function touch(page, frames, hold = 0) {
  const c = await page.context().newCDPSession(page);
  const tp = f => f.map(([x, y], i) => ({ x: Math.round(x), y: Math.round(y), id: i + 1 }));
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(frames[0]) });
  if (hold) await page.waitForTimeout(hold);
  for (const f of frames.slice(1)) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(f) }); await page.waitForTimeout(16); }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(150);
}
const path = (a, b, n = 8) => Array.from({ length: n + 1 }, (_, i) => a.map((p, j) => [p[0] + (b[j][0] - p[0]) * i / n, p[1] + (b[j][1] - p[1]) * i / n]));
const scr = (page, x, y) => page.evaluate(([x, y]) => { const a = document.getElementById('art'), p = a.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(a.getScreenCTM()); return [q.x, q.y]; }, [x, y]);
const cv = (page, x, y) => page.evaluate(([x, y]) => { const a = document.getElementById('art'), p = a.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(a.getScreenCTM().inverse()); return [q.x, q.y]; }, [x, y]);
const shapes = async page => JSON.parse(await H.getState(page)).els.filter(q => q.k === 'motif' && !q.bgd);

test.describe('on a phone, the canvas', () => {
  test.use(PHONE);
  test('a shape on the finger follows it and is placed where the finger lifts; one finger moves it keeping where it was held', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
    await H.armRect(page);
    const b = await page.locator('#art').boundingBox();
    const A = [b.x + b.width * .3, b.y + b.height * .3], B = [b.x + b.width * .6, b.y + b.height * .65];
    await touch(page, path([A], [B]));
    await H.settle(page);
    let q = (await shapes(page))[0];
    expect(q, 'placed').toBeTruthy();
    const want = await cv(page, ...B);
    expect(Math.hypot(q.x - want[0], q.y - want[1]), 'where the finger lifted').toBeLessThan(q.s * .1 + 2);
    // put away what is on the finger, select it, drag it from off its centre
    await page.keyboard.press('Escape'); await H.settle(page);
    q = (await shapes(page))[0];
    const [cx, cy] = await scr(page, q.x, q.y);
    await touch(page, [[[cx, cy]]]); await H.settle(page);   // a tap selects it (the panels under the canvas can change, so the canvas may move)
    const [sx, sy] = await scr(page, q.x, q.y), C = [sx + 2, sy + 1], D = [sx + 2 + 60, sy + 1 + 40];   // near its middle: on a small shape the side handles are close
    await touch(page, path([C], [D]));
    await H.settle(page);
    const q2 = (await shapes(page))[0], d0 = await cv(page, ...C), d1 = await cv(page, ...D);
    // as far as the finger, give or take the smart guides' snap (a mouse drag here ends at the same place)
    expect(Math.abs((q2.x - q.x) - (d1[0] - d0[0])), 'moved as far as the finger').toBeLessThan(20);
    expect(Math.abs((q2.y - q.y) - (d1[1] - d0[1]))).toBeLessThan(20);
    expect(q2.wx || 1, 'moved, not stretched').toBe(1);
    expect((await shapes(page)).length, 'nothing else placed').toBe(1);
    expect(errors).toEqual([]);
  });

  test('a finger held still on the canvas (the phone sends a long press) still places the shape where it lifts', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
    await H.armRect(page);
    const b = await page.locator('#art').boundingBox(), A = [b.x + b.width * .4, b.y + b.height * .4], B = [b.x + b.width * .55, b.y + b.height * .5];
    const c = await page.context().newCDPSession(page);
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: A[0], y: A[1], id: 1 }] });
    await page.waitForTimeout(600);
    // what a phone sends for a press held this long
    await page.evaluate(([x, y]) => document.elementFromPoint(x, y).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 })), A);
    for (const [x, y] of path([A], [B]).map(f => f[0])) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, id: 1 }] }); await page.waitForTimeout(16); }
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(150); await H.settle(page);
    expect((await shapes(page)).length, 'placed').toBe(1);
    expect(errors).toEqual([]);
  });

  test('2.81.2: a swipe that starts on the empty canvas scrolls the page and keeps the selection; placing stops after one', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
    await H.armRect(page);
    const b = await page.locator('#art').boundingBox();
    await touch(page, [[[b.x + b.width / 2, b.y + b.height / 3]]]); await H.settle(page);
    expect(await page.evaluate(() => !!document.querySelector('#elb [aria-pressed="true"]')), 'placing stopped after one').toBe(false);
    const q = (await shapes(page))[0], [x, y] = await scr(page, q.x, q.y);
    await touch(page, [[[x, y]]]); await H.settle(page);
    expect((await shapes(page)).length, 'a tap on it selects it, no copy').toBe(1);
    await expect(page.locator('#fpov rect.sel')).toHaveCount(1);
    const bd = await page.locator('#boardP').boundingBox();
    await touch(page, path([[bd.x + 24, bd.y + bd.height - 30]], [[bd.x + 24, bd.y + 40]]));
    await H.settle(page);
    expect(await page.evaluate(() => scrollY), 'the page scrolled').toBeGreaterThan(50);
    await expect(page.locator('#fpov rect.sel'), 'still selected').toHaveCount(1);
    // a tap on the empty canvas still deselects
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(100);
    const bd2 = await page.locator('#boardP').boundingBox();
    await touch(page, [[[bd2.x + 24, bd2.y + bd2.height - 30]]]); await H.settle(page);
    await expect(page.locator('#fpov rect.sel'), 'a tap on the empty canvas deselects').toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('two fingers on the empty canvas zoom and leave the document alone; on a selected element they size and turn it in one History step', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
    await H.addShape(page); await page.keyboard.press('Escape'); await page.evaluate(() => window.__wbTest.commands.run('edit.deselect')); await H.settle(page);
    const s0 = await H.getState(page), z0 = await page.locator('#zl').textContent();
    const b = await page.locator('#art').boundingBox(), m = [b.x + b.width / 2, b.y + b.height * .85];
    await touch(page, path([[m[0] - 20, m[1]], [m[0] + 20, m[1]]], [[m[0] - 70, m[1]], [m[0] + 70, m[1]]]));
    await H.settle(page);
    expect(await page.locator('#zl').textContent(), 'zoomed').not.toBe(z0);
    expect(await H.getState(page), 'the document').toBe(s0);
    await page.evaluate(() => window.__wbTest.commands.run('view.fit')); await H.settle(page);
    // on the selected shape
    await page.evaluate(() => window.__wbTest.commands.run('edit.selectAll')); await H.settle(page);
    const q = (await shapes(page))[0], [cx, cy] = await scr(page, q.x, q.y), h0 = (await page.evaluate(() => window.__wbTest.histLabels())).length, z1 = await page.locator('#zl').textContent();
    await touch(page, path([[cx - 10, cy], [cx + 10, cy]], [[cx - 28, cy - 12], [cx + 28, cy + 12]]));
    await H.settle(page);
    const q2 = (await shapes(page))[0];
    expect(q2.s, 'bigger').toBeGreaterThan(q.s * 1.5);
    expect(Math.abs((q2.r || 0) - (q.r || 0)), 'turned').toBeGreaterThan(10);
    expect((await page.evaluate(() => window.__wbTest.histLabels())).length, 'one History step').toBe(h0 + 1);
    expect(await page.locator('#zl').textContent(), 'the view stays').toBe(z1);
    expect(errors).toEqual([]);
  });

  test('in a stamp\'s tab a shape on the finger is placed where the finger lifts', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
    await H.addStamp(page); await H.unlockStamp(page, 0); await H.settle(page);
    await H.pickShape(page);
    const n0 = await page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles[0].items.length);
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(100);   // picking the shape scrolled down to the library
    const b = await page.locator('#art').boundingBox(), A = [b.x + b.width * .35, b.y + b.height * .35], B = [b.x + b.width * .55, b.y + b.height * .55];
    await touch(page, path([A], [B]));
    await H.settle(page);
    const it = await page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles[0].items);
    expect(it.length, 'one placed').toBe(n0 + 1);
    const q = it[it.length - 1];
    expect(q.x > 0 && q.y > 0, 'right and below the middle, where the finger lifted').toBe(true);
    expect(errors).toEqual([]);
  });

  test('a handle takes a touch from just beside it', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
    await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
    const q = (await shapes(page))[0];
    { const [x, y] = await scr(page, q.x, q.y); await touch(page, [[[x, y]]]); await H.settle(page); }   // a tap selects it
    const h = await page.evaluate(() => { const hs = [...document.querySelectorAll('#art [data-fh]')].map(e => ({ k: e.dataset.fh, r: e.getBoundingClientRect() })).filter(o => o.r.width); const o = hs.find(o => /se|br|corner/.test(o.k)) || hs[0]; return o ? { k: o.k, x: o.r.left + o.r.width / 2, y: o.r.top + o.r.height / 2 } : null; });
    expect(h, 'a handle').toBeTruthy();
    const [cx, cy] = await scr(page, q.x, q.y), ux = Math.sign(h.x - cx) || 1, uy = Math.sign(h.y - cy) || 1;
    const A = [h.x + ux * 12, h.y + uy * 12], B = [A[0] + ux * 50, A[1] + uy * 50];
    await touch(page, path([A], [B]));
    await H.settle(page);
    const q2 = (await shapes(page))[0];
    expect((q2.wx || 1) > 1.2 && (q2.wy || 1) > 1.2, `the handle (${h.k}) took it: the shape grew`).toBe(true);   // a corner stretches it from the opposite corner (as with a mouse)
    expect(errors).toEqual([]);
  });
});

test.describe('on a phone, the selection bar', () => {
  test.use(PHONE);
  test('shows over the selection with Rotate 90°, Flip, Duplicate and Delete; hides with nothing selected', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
    await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
    await page.evaluate(() => scrollTo(0, 0));
    await expect(page.locator('#tsb')).toBeHidden();
    let q = (await shapes(page))[0];
    { const [x, y] = await scr(page, q.x, q.y); await touch(page, [[[x, y]]]); await H.settle(page); }
    await expect(page.locator('#tsb')).toBeVisible();
    const bar = await page.locator('#tsb').boundingBox(), sel = await page.locator('#fpov rect.sel').boundingBox();
    expect(bar.y + bar.height, 'above the selection').toBeLessThanOrEqual(sel.y + 1);
    const tap = async a => { const b = await page.locator(`#tsb [data-a="${a}"]`).boundingBox(); await touch(page, [[[b.x + b.width / 2, b.y + b.height / 2]]]); await H.settle(page); };
    await tap('rot'); expect(((await shapes(page))[0].r + 360) % 360, 'turned a quarter').toBe(90);
    await tap('flip'); expect((await shapes(page))[0].f, 'flipped').toBe(-1);
    await tap('dup'); expect((await shapes(page)).length, 'duplicated').toBe(2);
    await tap('del'); expect((await shapes(page)).length, 'deleted').toBe(1);
    await page.evaluate(() => window.__wbTest.commands.run('edit.deselect')); await H.settle(page);
    await expect(page.locator('#tsb')).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('in a stamp\'s tab it turns the selected shape', async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
    await H.addStamp(page); await H.unlockStamp(page, 0); await H.settle(page);
    await H.stampTabRect(page);
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(100);
    const b = await page.locator('#art').boundingBox(); await touch(page, [[[b.x + b.width / 2, b.y + b.height / 2]]]); await H.settle(page);
    await expect(page.locator('#tsb')).toBeVisible();
    const it = async () => (await page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles[0].items)).slice(-1)[0];
    const r0 = (await it()).r || 0, t = await page.locator('#tsb [data-a="rot"]').boundingBox();
    await touch(page, [[[t.x + t.width / 2, t.y + t.height / 2]]]); await H.settle(page);
    expect((((await it()).r || 0) - r0 + 360) % 360).toBe(90);
    expect(errors).toEqual([]);
  });
});

test('desktop: no touch class, sliders take a click as before, the tray sits beside the element bar', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true });
  expect(await page.evaluate(() => document.documentElement.classList.contains('wbtouch'))).toBe(false);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('input[type=range]')).pointerEvents)).not.toBe('none');
  const tray = await page.locator('#tyd').boundingBox(), bar = await page.locator('#elb').boundingBox();
  expect(Math.abs(tray.y - bar.y), 'one row').toBeLessThan(20);
  await H.addShape(page); await page.evaluate(() => window.__wbTest.commands.run('edit.selectAll')); await H.settle(page);
  await expect(page.locator('#tsb'), 'no selection bar on a desktop').toBeHidden();
  // a right click still puts away what is on the cursor on a desktop
  await page.keyboard.press('Escape'); await H.armRect(page);
  { const b = await page.locator('#art').boundingBox(); await page.mouse.click(b.x + b.width * .3, b.y + b.height * .3, { button: 'right' }); await H.settle(page); }
  { const n = (await shapes(page)).length, b = await page.locator('#art').boundingBox(); await page.mouse.click(b.x + b.width * .7, b.y + b.height * .7); await H.settle(page); expect((await shapes(page)).length, 'put away by the right click: a click places nothing').toBe(n); }
  expect(errors).toEqual([]);
});
