// 1.44.0: styling selected letters (size, raise, spacing) and paragraph options (first-line indent, paragraph spacing, balance lines). The styles stay with their letters when the words change.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, unlockStamp, stampInstance, clickStamp, canvasToClient } = require('./helpers/harness');
// Canvas flow: the text typed in the Text panel is put on the first printed instance of the unlocked stamp, then one of its letters is clicked so the whole text is selected (the panel edits it)
async function putTextCanvas(page) {
  const p = await stampInstance(page);
  await clickStamp(page, p);
  const tg = async () => JSON.parse(await getState(page)).tiles[0].items.filter(q => q.tg);
  await expect.poll(async () => (await tg()).length, { timeout: 15000 }).toBeGreaterThan(0);
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await settle(page, { max: 30000 });
  const q0 = (await tg())[0];
  const c = await page.evaluate(([i, u, v]) => __wbTest.stampToCanvas(i, u, v), [p.i, q0.x, q0.y]);
  const cl = await canvasToClient(page, c.x, c.y);
  await page.mouse.click(cl.x, cl.y); await settle(page, { max: 30000 });
}

const set = (page, id, v) => page.evaluate(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
const items = async page => JSON.parse(await getState(page)).tiles[0].items;
const select = (page, a, b) => page.evaluate(([a, b]) => { const t = document.getElementById('tx_t'); t.setSelectionRange(a, b); t.dispatchEvent(new Event('select')); }, [a, b]);
async function start(page, text, size = 8) {
  await unlockStamp(page); await openPanel(page, 'text');
  await page.fill('#tx_t', text); await putTextCanvas(page);
  await set(page, 'tx_sz', size); await settle(page, { max: 30000 });
}

test('selected letters can be made bigger, raised and spaced; Clear puts them back', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'III');
  const flat = await items(page);
  expect(flat.length).toBe(3);
  await select(page, 1, 2); await set(page, 'tx_zs', 200); await settle(page, { max: 30000 });
  await expect.poll(async () => (await items(page))[1].s / (await items(page))[0].s, { timeout: 15000 }).toBeGreaterThan(1.7);
  const big = await items(page);
  expect(big[2].s / big[0].s).toBeLessThan(1.05);
  await select(page, 1, 2); await set(page, 'tx_dy', 60); await settle(page, { max: 30000 });
  await expect.poll(async () => { const a = await items(page); return a[0].y - a[1].y; }, { timeout: 15000 }).toBeGreaterThan(3);
  await select(page, 1, 2); await set(page, 'tx_sl', 80); await settle(page, { max: 30000 });
  await expect.poll(async () => { const a = await items(page); return (a[2].x - a[1].x) - (flat[2].x - flat[1].x); }, { timeout: 15000 }).toBeGreaterThan(2);
  await select(page, 0, 3); await page.click('#tx_clr'); await settle(page, { max: 30000 });
  await expect.poll(async () => { const a = await items(page); return Math.abs(a[1].s / a[0].s - 1); }, { timeout: 15000 }).toBeLessThan(0.02);
  expect(errors).toEqual([]);
});

test('Super and Sub shrink the selected letters and move them up or down', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'III');
  await select(page, 2, 3); await page.click('#tx_sup'); await settle(page, { max: 30000 });
  await expect.poll(async () => { const a = await items(page); return a[0].y - a[2].y; }, { timeout: 15000 }).toBeGreaterThan(3);
  const a = await items(page);
  expect(a[2].s / a[0].s).toBeLessThan(0.7);
  await select(page, 2, 3); await page.click('#tx_sub'); await settle(page, { max: 30000 });
  await expect.poll(async () => { const b = await items(page); return b[2].y - b[0].y; }, { timeout: 15000 }).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('a styled letter keeps its style when letters are typed before it', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'III');
  await select(page, 1, 2); await set(page, 'tx_zs', 200); await settle(page, { max: 30000 });
  await expect.poll(async () => (await items(page))[1].s, { timeout: 15000 }).toBeGreaterThan(0);
  await page.fill('#tx_t', 'IIII'); await settle(page, { max: 30000 });
  await expect.poll(async () => (await items(page)).length, { timeout: 15000 }).toBe(4);
  await settle(page, { max: 30000 });
  const a = await items(page), big = a.filter(q => q.s > a[0].s * 1.5 || a[0].s > q.s * 1.5);
  expect(big.length).toBeGreaterThan(0);
  expect(big.length).toBeLessThan(4);
  expect(errors).toEqual([]);
});

const rows = async page => { const a = await items(page); const ys = [...new Set(a.map(q => Math.round(q.y)))].sort((x, y) => x - y); return ys.map(y => { const r = a.filter(q => Math.round(q.y) === y); return { y, n: r.length, x: Math.min(...r.map(q => q.x)) }; }); };

test('First-line indent moves only the first line of a paragraph', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'ii ii ii ii ii ii ii', 10);
  await page.click('#tx_al [data-a="l"]'); await set(page, 'tx_wd', 40); await settle(page, { max: 30000 });
  await expect.poll(async () => (await rows(page)).length, { timeout: 15000 }).toBeGreaterThan(1);
  const r0 = await rows(page);
  await set(page, 'tx_ind', 150); await settle(page, { max: 30000 });
  await expect.poll(async () => { const r = await rows(page); return (r[0].x - r[1].x) - (r0[0].x - r0[1].x); }, { timeout: 15000 }).toBeGreaterThan(5);
  const m = Object.values(JSON.parse(await getState(page)).tiles[0].tgm)[0];
  expect(m.ind).toBe(150);
  expect(errors).toEqual([]);
});

test('Paragraph spacing opens a gap between paragraphs only', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'II\nII', 8);
  const gap = async () => { const r = await rows(page); return r.length > 1 ? r[1].y - r[0].y : 0; };
  await expect.poll(gap, { timeout: 15000 }).toBeGreaterThan(5);
  const g0 = await gap();
  await set(page, 'tx_psp', 200); await settle(page, { max: 30000 });
  await expect.poll(gap, { timeout: 15000 }).toBeGreaterThan(g0 + 5);
  expect((Object.values(JSON.parse(await getState(page)).tiles[0].tgm)[0]).psp).toBe(200);
  expect(errors).toEqual([]);
});

test('Balance lines evens out the lines of a paragraph', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'ii ii ii ii ii ii', 10);
  await page.click('#tx_al [data-a="l"]'); await set(page, 'tx_wd', 40); await settle(page, { max: 30000 });
  await expect.poll(async () => (await rows(page)).length, { timeout: 15000 }).toBeGreaterThan(1);
  const spread = async () => { const l = (await rows(page)).map(r => r.n); return Math.max(...l) - Math.min(...l); };
  const before = await spread();
  expect(before).toBeGreaterThan(0);
  await page.click('#tx_bal [data-b="1"]'); await settle(page, { max: 30000 });
  await expect.poll(spread, { timeout: 15000 }).toBeLessThan(before);
  expect(errors).toEqual([]);
});

test('Text layer: styled letters and paragraph options are saved on the text, and a double-click starts typing', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await openPanel(page, 'text');
  await settle(page);
  await page.fill('#tx_t', 'ONE TWO');
  await page.waitForTimeout(500);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page);
  const piece = async () => JSON.parse(await getState(page)).els.filter(p => p.tx)[0];
  await expect.poll(async () => (await piece() || {}).tx).toBeTruthy();
  await page.click('#tx_go');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(page);
  await select(page, 1, 2); await set(page, 'tx_zs', 200);
  await expect.poll(async () => JSON.stringify((await piece()).tx.sty), { timeout: 8000 }).toBe('[[1,2,200,0,0]]');
  await set(page, 'tx_psp', 120); await set(page, 'tx_ind', 50);
  await expect.poll(async () => (await piece()).tx.psp, { timeout: 8000 }).toBe(120);
  expect((await piece()).tx.ind).toBe(50);
  await page.fill('#tx_t', 'XONE TWO');
  await expect.poll(async () => JSON.stringify((await piece()).tx.sty), { timeout: 8000 }).toBe('[[2,3,200,0,0]]');
  await page.locator('#tx_t').blur();
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('#tx_t')).toBeFocused();
  expect(errors).toEqual([]);
});

test('double-clicking a text in the unlocked stamp on the canvas focuses the text field', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'I', 30);
  await page.locator('#tx_t').blur();
  const p = await stampInstance(page);
  const q0 = (await items(page)).find(q => q.tg);
  const c = await page.evaluate(([i, u, v]) => __wbTest.stampToCanvas(i, u, v), [p.i, q0.x, q0.y]);
  const cl = await canvasToClient(page, c.x, c.y);
  await page.mouse.dblclick(cl.x, cl.y);
  await expect(page.locator('#tx_t')).toBeFocused();
  expect(errors).toEqual([]);
});
