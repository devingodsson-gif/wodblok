// 1.45.0: text on a wave or spiral, and warp (Bulge, Rise, Flag). Same controls in the Stamp editor and the Text layer.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle, getState, putText } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const set = (page, id, v) => page.evaluate(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
const items = async page => JSON.parse(await getState(page)).tiles[0].items;
const spread = a => Math.max(...a) - Math.min(...a);
async function start(page, text, size = 8) {
  await setMode(page, 'stamp'); await openPanel(page, 'text');
  await page.fill('#tx_t', text); await putText(page);
  await set(page, 'tx_sz', size); await settle(page, { max: 30000 });
}

test('Path: Wave lifts and tilts the letters; None puts them back', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'IIIIIIII');
  expect(spread((await items(page)).map(q => q.y))).toBeLessThan(1);
  await set(page, 'tx_pt', 'w'); await set(page, 'tx_pa', 90); await set(page, 'tx_pw', 60); await settle(page, { max: 30000 });
  await expect.poll(async () => spread((await items(page)).map(q => q.y)), { timeout: 15000 }).toBeGreaterThan(3);
  expect(spread((await items(page)).map(q => q.r))).toBeGreaterThan(5);
  const m = Object.values(JSON.parse(await getState(page)).tiles[0].tgm)[0];
  expect(m.pt).toBe('w'); expect(m.pa).toBe(90); expect(m.pw).toBe(60);
  await set(page, 'tx_pt', ''); await settle(page, { max: 30000 });
  await expect.poll(async () => spread((await items(page)).map(q => q.y)), { timeout: 15000 }).toBeLessThan(1);
  const m2 = Object.values(JSON.parse(await getState(page)).tiles[0].tgm)[0];
  expect(m2.pt).toBeUndefined(); expect(m2.pa).toBeUndefined();
  expect(errors).toEqual([]);
});

test('Path: Spiral turns the letters round', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'IIIIIIIIIIII', 6);
  await set(page, 'tx_pt', 's'); await set(page, 'tx_pw', 60); await settle(page, { max: 30000 });
  await expect.poll(async () => spread((await items(page)).map(q => q.r)), { timeout: 15000 }).toBeGreaterThan(120);
  expect(spread((await items(page)).map(q => q.y))).toBeGreaterThan(5);
  expect(errors).toEqual([]);
});

test('Warp: Bulge swells the middle, a negative amount pinches it; Rise grows to the right', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'IIIII');
  await set(page, 'tx_wp', 'b'); await set(page, 'tx_wa', 100); await settle(page, { max: 30000 });
  await expect.poll(async () => { const a = await items(page); return a[2].s / a[0].s; }, { timeout: 15000 }).toBeGreaterThan(1.4);
  await set(page, 'tx_wa', -100); await settle(page, { max: 30000 });
  await expect.poll(async () => { const a = await items(page); return a[2].s / a[0].s; }, { timeout: 15000 }).toBeLessThan(0.8);
  await set(page, 'tx_wp', 'r'); await set(page, 'tx_wa', 100); await settle(page, { max: 30000 });
  await expect.poll(async () => { const a = await items(page); return a[4].s / a[0].s; }, { timeout: 15000 }).toBeGreaterThan(1.5);
  const m = Object.values(JSON.parse(await getState(page)).tiles[0].tgm)[0];
  expect(m.wp).toBe('r'); expect(m.wa).toBe(100);
  await set(page, 'tx_wa', 0); await settle(page, { max: 30000 });
  await expect.poll(async () => { const a = await items(page); return Math.abs(a[4].s / a[0].s - 1); }, { timeout: 15000 }).toBeLessThan(0.02);
  expect((Object.values(JSON.parse(await getState(page)).tiles[0].tgm)[0]).wp).toBeUndefined();
  expect(errors).toEqual([]);
});

test('Warp: Flag makes a wave that grows to the right', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'IIIIIIII');
  await set(page, 'tx_wp', 'f'); await set(page, 'tx_wa', 100); await settle(page, { max: 30000 });
  await expect.poll(async () => spread((await items(page)).map(q => q.y)), { timeout: 15000 }).toBeGreaterThan(3);
  const a = await items(page);
  expect(a[7].s).toBeGreaterThan(a[0].s * 1.2);
  expect(errors).toEqual([]);
});

test('Text layer: a path and a warp are saved on the text', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await page.click('#ly_add');
  await page.click('#ly_menu [data-lt="t"]'); await openPanel(page, 'text');
  await settle(page);
  await page.fill('#tx_t', 'WAVE TEXT');
  await page.waitForTimeout(500);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page);
  await page.click('#tx_go');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(page);
  await set(page, 'tx_pt', 'w'); await set(page, 'tx_pa', 70);
  const piece = async () => JSON.parse(await getState(page)).layers.flatMap(l => (l.pl || []).filter(p => p.tx))[0];
  await expect.poll(async () => (await piece()).tx.pt, { timeout: 8000 }).toBe('w');
  expect((await piece()).tx.pa).toBe(70);
  await set(page, 'tx_wp', 'b'); await set(page, 'tx_wa', 50);
  await expect.poll(async () => (await piece()).tx.wp, { timeout: 8000 }).toBe('b');
  expect(errors).toEqual([]);
});
