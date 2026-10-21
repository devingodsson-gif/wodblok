// Layer update, step 5 (1.46.5): drawing into an unlocked stamp from the canvas. With a stamp unlocked, a shape picked in the Shapes panel is put into
// that stamp where the pointer is (through the instance under it), a click selects a shape inside an instance, dragging moves it, the square handles
// resize it, the round one turns it, Delete removes it. Locked stamps are not touched.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, fitView } = require('./helpers/harness');

const state = async page => JSON.parse(await getState(page));
const items = async page => (await state(page)).tiles[0].items;
const unlock = async page => { await showPanel(page, 'stmp'); await page.locator('#stmpl .smklk').first().click(); await settle(page); await fitView(page); };
const pick = async page => { await openPanel(page, 'motifs'); if (!(await page.locator('#lib button[data-m]').count())) await page.locator('#lib .lfr[data-f^="b:"]').first().click(); await page.locator('#lib button[data-m]').first().click(); await settle(page); };
const toClient = (page, x, y) => page.evaluate(([x, y]) => { const a = document.getElementById('art'), r = a.getBoundingClientRect(), vb = a.viewBox.baseVal; return { x: r.left + x / vb.width * r.width, y: r.top + y / vb.height * r.height, k: r.width / vb.width }; }, [x, y]);
// an instance whose middle is well inside the canvas: its number and where its middle is, in canvas units and on screen
const inst = async page => {
  const c = await page.evaluate(() => { const vb = document.getElementById('art').viewBox.baseVal;
    for (let i = 0; i < 400; i++) { const p = __wbTest.stampToCanvas(i, 120, 120); if (!p) break; if (p.x > 90 && p.x < vb.width - 90 && p.y > 90 && p.y < vb.height - 90) return { i, ...p }; } return null; });
  expect(c).toBeTruthy();
  return { i: c.i, cx: c.x, cy: c.y, ...(await toClient(page, c.x, c.y)) };
};
const click = async (page, p) => { await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.up(); await settle(page); };
const handle = (page, k) => page.locator(`#stoh [data-hd="${k}"]`);
const centre = async loc => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
const drag = async (page, from, to) => { await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 3 }); await page.mouse.move(to.x, to.y, { steps: 3 }); await page.mouse.up(); await settle(page); };

test('the Shapes panel is on the Pattern rail', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await expect(page.locator('#elb [data-k="shape"]')).toBeVisible();   // the element bar opens it
  await openPanel(page, 'motifs');
  expect(await page.locator('#lib .lfr').count()).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('a picked shape goes into the unlocked stamp where it is pointed at, and every instance shows it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  const before = (await items(page)).length;
  await unlock(page);
  await pick(page);
  const p = await inst(page);
  const nUse = await page.locator('#art use[href^="#s1"]').count();
  await click(page, { x: p.x + p.k * 30, y: p.y + p.k * 20 });
  const it = await items(page);
  expect(it.length).toBe(before + 1);
  // the stamp is 240 wide and the layer prints it at 180, so 0.75 canvas units per stamp unit: 30 and 20 canvas units are 40 and 26.7 stamp units
  expect(Math.abs(it[it.length - 1].x - 160)).toBeLessThan(3);
  expect(Math.abs(it[it.length - 1].y - 146.7)).toBeLessThan(3);
  expect(await page.locator('#art use[href^="#s1"]').count()).toBe(nUse);
  await expect(page.locator('#stoh .steh')).toHaveCount(9);
  expect(errors).toEqual([]);
});

test('with the stamp locked, a picked shape makes a free Motif element and leaves the stamp alone (2.3.0)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await pick(page);
  const before = (await items(page)).length;
  await click(page, await inst(page));
  expect((await items(page)).length).toBe(before);
  expect((await state(page)).els.filter(q => q.k === 'motif')).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('on a turned layer the shape still lands under the pointer and stands upright', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers');
  await page.evaluate(() => document.querySelector('#pelist .mr').click());
  await page.evaluate(() => { const r = document.getElementById('pert'); r.value = 30; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle(page);
  await unlock(page);
  await pick(page);
  const before = (await items(page)).length;
  const p = await inst(page);
  const hit = await page.evaluate(([x, y]) => __wbTest.stampAt(x, y), [p.cx + 6, p.cy + 4]);
  await click(page, { x: p.x + 6 * p.k, y: p.y + 4 * p.k });
  const it = await items(page);
  expect(it.length).toBe(before + 1);
  const q = it[it.length - 1];
  const back = await page.evaluate(([i, u, v]) => __wbTest.stampToCanvas(i, u, v), [hit.i, q.x, q.y]);
  expect(Math.abs(back.x - (p.cx + 6))).toBeLessThan(1);
  expect(Math.abs(back.y - (p.cy + 4))).toBeLessThan(1);
  // the shape is turned back by the layer's 30 degrees so it stands upright on the canvas
  expect(Math.abs(((q.r + 30 + 540) % 360) - 180)).toBeLessThan(1.5);
  expect(errors).toEqual([]);
});

test('a click selects a shape, dragging moves it, a handle resizes it, the round handle turns it, Delete removes it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page);
  await pick(page);
  let p = await inst(page);
  await click(page, p);
  p = await inst(page);   // measured again after the click, as the canvas can move
  let it = await items(page);
  const n = it.length;
  // click empty paper of the instance far from the shape (a corner): selection goes
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await click(page, { x: p.x - p.k * 95, y: p.y - p.k * 95 });
  await expect(page.locator('#stoh .steh')).toHaveCount(0);
  // click the shape: it is selected again
  await click(page, p);
  await expect(page.locator('#stoh .steh')).toHaveCount(9);
  // move it 30 screen pixels right
  const x0 = (await items(page))[n - 1].x;
  await drag(page, p, { x: p.x + 30, y: p.y });
  it = await items(page);
  expect(it.length).toBe(n);
  expect(Math.abs(it[n - 1].x - x0 - 30 / (p.k * 0.75))).toBeLessThan(3);
  // resize from the south east corner, outwards
  const s0 = it[n - 1].s, se = await centre(handle(page, 'se'));
  await drag(page, se, { x: se.x + 25, y: se.y + 25 });
  expect((await items(page))[n - 1].s).toBeGreaterThan(s0);
  // turn with the round handle: drag it to the right of the shape's middle
  it = await items(page);
  const mc = await page.evaluate(([i, u, v]) => __wbTest.stampToCanvas(i, u, v), [p.i, it[n - 1].x, it[n - 1].y]);
  const mid = await toClient(page, mc.x, mc.y);
  const rot = await centre(handle(page, 'rot'));
  await drag(page, rot, { x: mid.x + 120, y: mid.y });
  expect(Math.abs((await items(page))[n - 1].r - 90)).toBeLessThan(2);
  // Delete removes the selected shape
  await page.keyboard.press('Delete');
  await settle(page);
  expect((await items(page)).length).toBe(n - 1);
  await expect(page.locator('#stoh .steh')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('placing is one undo step, and locking the stamp hides the selection', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page);
  await pick(page);
  const before = (await items(page)).length;
  await click(page, await inst(page));
  expect((await items(page)).length).toBe(before + 1);
  await page.keyboard.press('Escape');
  await showPanel(page, 'stmp');
  await page.locator('#stmpl .smklk').first().click();
  await settle(page);
  await expect(page.locator('#stoh .steh')).toHaveCount(0);
  await page.keyboard.press('Control+z');
  await settle(page);
  expect((await items(page)).length).toBe(before);
  expect(errors).toEqual([]);
});

test('text typed in the Text panel goes into the unlocked stamp as letters, on every instance', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page);
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'AB');
  await settle(page);
  const before = (await items(page)).length;
  const p = await inst(page);
  await click(page, p);
  await expect.poll(async () => (await items(page)).length, { timeout: 15000 }).toBe(before + 2);
  const it = await items(page);
  expect(it.slice(-2).every(q => q.tg)).toBe(true);
  expect(((await state(page)).els || []).filter(p => p.k !== 'pattern')).toHaveLength(0);   // only the Pattern is on the layer
  expect(errors).toEqual([]);
});

// ---- step 6 (1.46.6): the Element editor and Stamp settings in the Pattern view, symmetry copies, marquee, snapping ----
const at = async (page, p, dx, dy) => { const c = await toClient(page, p.cx + dx, p.cy + dy); return { x: c.x, y: c.y, k: c.k }; };

test('the Edit group of the Shape panel acts on the shape placed in the unlocked stamp', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page);
  await pick(page);
  await expect(page.locator('#sel')).toHaveClass(/none/);
  await click(page, await inst(page));
  await expect(page.locator('#sel')).not.toHaveClass(/none/, { timeout: 10000 });
  await page.evaluate(() => { const r = document.getElementById('ssz'); r.value = 50; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await settle(page);
  const it = await items(page);
  expect(Math.abs(it[it.length - 1].s - 0.5)).toBeLessThan(0.01);
  expect(errors).toEqual([]);
});

test('Stamp settings is a Pattern tool: symmetry makes copies that can be selected and dragged on the canvas', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page);
  await showPanel(page, 'stmp');
  await page.click('#sym [data-y="lr"]');
  await settle(page);
  expect((await state(page)).tiles[0].sym.m).toBe('lr');
  await pick(page);
  let p = await inst(page);
  await click(page, await at(page, p, -30, 0));
  p = await inst(page);
  const n = (await items(page)).length;
  const x0 = (await items(page))[n - 1].x;
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  // the mirror copy is on the other side: a click there selects the shape it came from
  const copy = await at(page, p, 30, 0);
  await click(page, copy);
  await expect(page.locator('#stoh .steh')).toHaveCount(9);
  // dragging the copy to the right moves the shape itself to the left
  await drag(page, copy, { x: copy.x + 15 * copy.k, y: copy.y });
  const x1 = (await items(page))[n - 1].x;
  expect(x0 - x1).toBeGreaterThan(8);
  expect(errors).toEqual([]);
});

test('a box dragged round shapes selects those that lie wholly inside it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page);
  await pick(page);
  let p = await inst(page);
  await click(page, await at(page, p, -30, 0));
  p = await inst(page);
  await click(page, await at(page, p, 30, 0));
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.locator('#stoh .stes')).toHaveCount(0);
  await drag(page, await at(page, p, -85, -60), await at(page, p, 85, 60));
  await expect(page.locator('#stoh polygon.stes')).toHaveCount(2);
  await expect(page.locator('#stoh .steh')).toHaveCount(0);
  // a box that holds only one of them picks only that one
  await page.keyboard.press('Escape');
  await drag(page, await at(page, p, -85, -60), await at(page, p, -2, 60));
  await expect(page.locator('#stoh polygon.stes')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('the Grid tool snaps shapes put into the unlocked stamp, and Alt skips it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'pgrid');
  await page.check('#pgn');
  await page.click('#pgm [data-g="l"]');
  await unlock(page);
  await pick(page);
  const cell = 533 / 8;
  let p = await inst(page);
  const off = async n => { const it = await items(page); const q = it[it.length - 1]; return page.evaluate(([i, u, v]) => __wbTest.stampToCanvas(i, u, v), [p.i, q.x, q.y]).then(c => ({ rx: ((c.x % cell) + cell) % cell, ry: ((c.y % cell) + cell) % cell })); };
  const near = v => Math.min(v, cell - v);
  await click(page, await at(page, p, 13, 9));
  let o = await off();
  expect(near(o.rx)).toBeLessThan(0.6);
  expect(near(o.ry)).toBeLessThan(0.6);
  p = await inst(page);
  await page.keyboard.down('Alt');
  await click(page, await at(page, p, -33, 21));
  await page.keyboard.up('Alt');
  o = await off();
  expect(near(o.rx) > 0.6 || near(o.ry) > 0.6).toBe(true);
  expect(errors).toEqual([]);
});

test('a shape that runs over the stamp edge shows on the other side, and a click on that part selects it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page);
  await pick(page);
  let p = await inst(page);
  await click(page, await at(page, p, 80, 0));
  p = await inst(page);
  const n = (await items(page)).length;
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.locator('#stoh .steh')).toHaveCount(0);
  await click(page, await at(page, p, -86, 0));
  await expect(page.locator('#stoh .steh')).toHaveCount(9);
  expect((await items(page)).length).toBe(n);
  expect(errors).toEqual([]);
});
