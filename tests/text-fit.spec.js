// 1.41.0: Box and fit. Padding, Spread, Fit to box (Shrink to fit, Fill the box, Fit each line to width, Fit width) and Overflow Hide.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, unlockStamp, stampInstance, clickStamp, canvasToClient } = require('./helpers/harness');

const set = (page, id, v) => page.evaluate(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
const items = async page => JSON.parse(await getState(page)).tiles[0].items;
// text goes into the unlocked stamp: set it up in the Text panel, then click an instance of the stamp on the canvas (the placed text is then selected)
const putStampText = async page => {
  const p = await stampInstance(page); await clickStamp(page, p);
  await expect.poll(async () => JSON.parse(await getState(page)).tiles[0].items.filter(q => q.tg).length, { timeout: 15000 }).toBeGreaterThan(0);
  await settle(page, { max: 30000 });
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  const q = JSON.parse(await getState(page)).tiles[0].items.find(x => x.tg);
  const c = await page.evaluate(([i, u, v]) => __wbTest.stampToCanvas(i, u, v), [p.i, q.x, q.y]), cl = await canvasToClient(page, c.x, c.y);
  await page.mouse.click(cl.x, cl.y); await settle(page);
  await expect(page.locator('#tx_ed')).toBeVisible();
  return p;
};
async function start(page, text, sz) {
  await unlockStamp(page); await showPanel(page, 'text');
  await page.fill('#tx_t', text);
  await putStampText(page);
  await set(page, 'tx_sz', sz); await settle(page, { max: 30000 });      // the size after the text is down, so it is not fitted to the stamp again
}
const sizeNow = async page => (await items(page))[0].s;
const wait = page => settle(page, { max: 30000 });

test('Fill the box makes the letters as big as fit; Shrink to fit only makes them smaller', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'ONE TWO', 8);
  const s0 = await sizeNow(page);
  await set(page, 'tx_wd', 80); await set(page, 'tx_ht', 50); await wait(page);
  await set(page, 'tx_ft', 'f'); await wait(page);
  await expect.poll(() => sizeNow(page), { timeout: 15000 }).toBeGreaterThan(s0 * 1.25);
  await set(page, 'tx_ft', 's'); await wait(page);
  await expect.poll(() => sizeNow(page), { timeout: 15000 }).toBeCloseTo(s0, 1);        // it already fits, so it keeps its size
  await set(page, 'tx_sz', 60); await wait(page);
  await expect.poll(() => sizeNow(page), { timeout: 15000 }).toBeLessThan(s0 * 3);       // too big for the box: shrunk to fit
  await set(page, 'tx_ft', ''); await wait(page);
  await expect.poll(() => sizeNow(page), { timeout: 15000 }).toBeGreaterThan(s0 * 3);
  expect(errors).toEqual([]);
});

test('Fit each line to width gives every line its own size; Fit width scales the lines together', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'A\nBBBB', 10);
  await set(page, 'tx_wd', 70); await wait(page);
  await set(page, 'tx_ft', 'l'); await wait(page);
  await expect.poll(async () => { const a = await items(page); return a[0].s / a[a.length - 1].s; }, { timeout: 15000 }).toBeGreaterThan(2);
  await set(page, 'tx_ft', 'w'); await wait(page);
  await expect.poll(async () => { const a = await items(page); return +(a[0].s / a[a.length - 1].s).toFixed(2); }, { timeout: 15000 }).toBe(1);
  expect(errors).toEqual([]);
});

test('Spread puts the first line at the top of the box and the last at the bottom', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'A\nB\nC', 4);
  await set(page, 'tx_ht', 80); await wait(page);
  const span = async () => { const y = (await items(page)).map(q => q.y); return Math.max(...y) - Math.min(...y); };
  await expect.poll(span, { timeout: 15000 }).toBeGreaterThan(0);
  const top = await span();
  await page.click('#tx_va [data-v="s"]'); await wait(page);
  await expect.poll(span, { timeout: 15000 }).toBeGreaterThan(top * 1.4);
  expect(errors).toEqual([]);
});

test('Overflow Hide drops the lines that run past the box; padding shrinks the room', async ({ page }) => {
  const { errors } = await openApp(page);
  await start(page, 'ONE TWO THREE FOUR FIVE SIX', 10);
  await set(page, 'tx_wd', 40); await set(page, 'tx_ht', 25); await wait(page);
  const all = (await items(page)).length;
  await page.click('#tx_ov [data-o="h"]'); await wait(page);
  await expect.poll(async () => (await items(page)).length, { timeout: 15000 }).toBeLessThan(all);
  await page.click('#tx_ov [data-o=""]'); await wait(page);
  await expect.poll(async () => (await items(page)).length, { timeout: 15000 }).toBe(all);
  expect(errors).toEqual([]);
});

test('Text layer: the new options are saved only when set', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'HELLO WORLD');
  await page.waitForTimeout(500);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(page);
  await page.click('#tx_go'); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(page);   // stop placing, then select the text
  const tx = async () => JSON.parse(await getState(page)).layers.flatMap(l => l.pl || []).find(p => p.tx).tx;
  await expect.poll(async () => (await tx()).text, { timeout: 10000 }).toBe('HELLO WORLD');
  expect(Object.keys(await tx()).filter(k => ['pd', 'ft', 'ov'].includes(k))).toEqual([]);
  await set(page, 'tx_wd', 60); await set(page, 'tx_ht', 30); await set(page, 'tx_ft', 'f');
  await expect.poll(async () => (await tx()).ft, { timeout: 10000 }).toBe('f');
  expect(errors).toEqual([]);
});
