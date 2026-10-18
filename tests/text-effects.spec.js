// 1.43.0: letter effects. Random position, rotation and size, Bounce, Scatter, and Vary. Same text and seed always give the same letters.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle, getState, putText } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const set = (page, id, v) => page.evaluate(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
const items = async page => JSON.parse(await getState(page)).tiles[0].items;
const spread = a => Math.max(...a) - Math.min(...a);
async function start(page, text) {
  await setMode(page, 'stamp'); await openPanel(page, 'text');
  await page.fill('#tx_t', text); await putText(page);
  await set(page, 'tx_sz', 8); await settle(page, { max: 30000 });
}

test('random position, rotation and size change the letters; zero puts them back', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'IIIII');
  const flat = await items(page);
  expect(spread(flat.map(q => q.y))).toBeLessThan(1);
  expect(spread(flat.map(q => q.r))).toBe(0);
  await set(page, 'tx_rp', 60); await set(page, 'tx_rr', 40); await set(page, 'tx_rs', 50); await settle(page, { max: 30000 });
  await expect.poll(async () => spread((await items(page)).map(q => q.y)), { timeout: 15000 }).toBeGreaterThan(1.5);
  const a = await items(page);
  expect(spread(a.map(q => q.r))).toBeGreaterThan(5);
  expect(spread(a.map(q => q.s))).toBeGreaterThan(0.05);
  await set(page, 'tx_rp', 0); await set(page, 'tx_rr', 0); await set(page, 'tx_rs', 0); await settle(page, { max: 30000 });
  await expect.poll(async () => spread((await items(page)).map(q => q.y)), { timeout: 15000 }).toBeLessThan(1);
  expect(errors).toEqual([]);
});

test('the same seed gives the same letters; Vary gives different ones', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'IIIII');
  await set(page, 'tx_rp', 60); await settle(page, { max: 30000 });
  await expect.poll(async () => spread((await items(page)).map(q => q.y)), { timeout: 15000 }).toBeGreaterThan(1.5);
  const ys = async () => (await items(page)).map(q => Math.round(q.y * 10));
  const a = await ys();
  await set(page, 'tx_sz', 9); await set(page, 'tx_sz', 8); await settle(page, { max: 30000 });
  expect(await ys()).toEqual(a);                                             // nothing random about editing again
  await page.click('#tx_vary'); await settle(page, { max: 30000 });
  await expect.poll(ys, { timeout: 15000 }).not.toEqual(a);
  expect(errors).toEqual([]);
});

test('Bounce moves every other letter up and down; Scatter spreads the letters over the box', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'IIII');
  await set(page, 'tx_bb', 60); await settle(page, { max: 30000 });
  await expect.poll(async () => { const y = (await items(page)).map(q => q.y); return Math.abs((y[0] + y[2]) / 2 - (y[1] + y[3]) / 2); }, { timeout: 15000 }).toBeGreaterThan(5);
  await set(page, 'tx_bb', 0);
  await set(page, 'tx_wd', 80); await set(page, 'tx_ht', 60); await settle(page, { max: 30000 });
  const before = spread((await items(page)).map(q => q.y));
  await page.click('#tx_sc [data-s="f"]'); await settle(page, { max: 30000 });
  await expect.poll(async () => spread((await items(page)).map(q => q.y)), { timeout: 15000 }).toBeGreaterThan(before + 10);
  await page.click('#tx_sc [data-s=""]'); await settle(page, { max: 30000 });
  await expect.poll(async () => spread((await items(page)).map(q => q.y)), { timeout: 15000 }).toBeLessThan(before + 1);
  expect(errors).toEqual([]);
});

test('Text layer: effects are saved only when set', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await setMode(page, 'pattern'); await openPanel(page, 'text');
  await page.fill('#tx_t', 'HELLO');
  await page.waitForTimeout(500);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(page);
  await page.click('#tx_go'); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(page);
  const tx = async () => JSON.parse(await getState(page)).layers.flatMap(l => l.pl || []).find(p => p.tx).tx;
  await expect.poll(async () => (await tx()).text, { timeout: 10000 }).toBe('HELLO');
  expect(Object.keys(await tx()).filter(k => ['rp', 'rr', 'rs', 'bb', 'sc', 'sd'].includes(k))).toEqual([]);
  await set(page, 'tx_rp', 40);
  await expect.poll(async () => (await tx()).rp, { timeout: 10000 }).toBe(40);
  await page.click('#tx_vary');
  await expect.poll(async () => (await tx()).sd, { timeout: 10000 }).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
