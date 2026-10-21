// Layer update, step 9a (1.46.9): the four things only the Stamp editor did, now on the Pattern canvas with a stamp unlocked:
// copy and paste of shapes, editing text that is already in a stamp, Split shape, and grade masks that belong to one stamp.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, fitView } = require('./helpers/harness');

const state = async page => JSON.parse(await getState(page));
const items = async page => (await state(page)).tiles[0].items;
const show = async (page, id) => { if (await page.locator(`section.pn[data-p="${id}"]:not([hidden])`).count() === 0) await openPanel(page, id); };
const unlock = async page => { await show(page, 'stmp'); await page.locator('#stmpl .smklk').first().click(); await settle(page); await fitView(page); };
const pick = async page => { await show(page, 'motifs'); if (!(await page.locator('#lib button[data-m]').count())) await page.locator('#lib .lfr[data-f^="b:"]').first().click(); await page.locator('#lib button[data-m]').first().click(); await settle(page); };
const toClient = (page, x, y) => page.evaluate(([x, y]) => { const a = document.getElementById('art'), r = a.getBoundingClientRect(), vb = a.viewBox.baseVal; return { x: r.left + x / vb.width * r.width, y: r.top + y / vb.height * r.height, k: r.width / vb.width }; }, [x, y]);
const inst = async page => {
  const c = await page.evaluate(() => { const vb = document.getElementById('art').viewBox.baseVal;
    for (let i = 0; i < 400; i++) { const p = __wbTest.stampToCanvas(i, 120, 120); if (!p) break; if (p.x > 90 && p.x < vb.width - 90 && p.y > 90 && p.y < vb.height - 90) return { i, ...p }; } return null; });
  return { i: c.i, cx: c.x, cy: c.y };
};
const clickAt = async (page, p, dx = 0, dy = 0) => { const c = await toClient(page, p.cx + dx, p.cy + dy); await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.up(); await settle(page); };

test('copy and paste of shapes works on the canvas with a stamp unlocked', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page); await pick(page);
  let p = await inst(page);
  await clickAt(page, p);
  await page.keyboard.press('Escape');
  const n = (await items(page)).length;
  await clickAt(page, await inst(page));
  await page.keyboard.press('Control+c');
  await page.keyboard.press('Control+v');
  await settle(page);
  const it = await items(page);
  expect(it.length).toBe(n + 1);
  expect(Math.abs(it[it.length - 1].x - it[it.length - 2].x)).toBeGreaterThan(5);
  await expect(page.locator('#stoh .steh')).toHaveCount(9);
  expect(errors).toEqual([]);
});

test('text that is in a stamp is selected as one text, edited live from the Text panel, and can be turned into shapes', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page);
  await show(page, 'text');
  await page.fill('#tx_t', 'AB');
  await settle(page);
  let p = await inst(page);
  await clickAt(page, p);
  await expect.poll(async () => (await items(page)).filter(q => q.tg).length, { timeout: 15000 }).toBe(2);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  p = await inst(page);
  // find a letter and click it: the whole text is selected and the panel shows it
  const letter = await page.evaluate(() => { const vb = document.getElementById('art').viewBox.baseVal; return { n: vb.width }; });
  expect(letter.n).toBeGreaterThan(0);
  const q0 = (await items(page)).find(q => q.tg);
  const c = await page.evaluate(([i, u, v]) => __wbTest.stampToCanvas(i, u, v), [p.i, q0.x, q0.y]);
  const cl = await toClient(page, c.x, c.y);
  await page.mouse.click(cl.x, cl.y);
  await settle(page);
  await expect(page.locator('#stoh polygon.stes')).toHaveCount(2);
  await expect(page.locator('#tx_ed')).toBeVisible();
  await expect(page.locator('#tx_edn')).toHaveText('AB');
  // the text follows the panel
  await page.fill('#tx_t', 'ABC');
  await expect.poll(async () => (await items(page)).filter(q => q.tg).length, { timeout: 15000 }).toBe(3);
  // turn it into plain shapes
  await page.click('#tx_conv');
  await settle(page);
  const t = (await state(page)).tiles[0];
  expect(t.items.filter(q => q.tg).length).toBe(0);
  expect(Object.keys(t.tgm || {}).length).toBe(0);
  expect(errors).toEqual([]);
});

test('with every stamp locked the Text panel still fills a Text layer', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await show(page, 'text');
  await page.fill('#tx_t', 'Hi');
  await settle(page);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await settle(page);
  const s = await state(page);
  expect(s.tiles[0].items.filter(q => q.tg).length).toBe(0);
  expect((s.els || []).filter(q => q.tx).length).toBe(1);
  expect(errors).toEqual([]);
});

test('Split shape: a line over the selected shape on the canvas is moved and turned with its handles, then cuts the shape in two', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page); await pick(page);
  await clickAt(page, await inst(page));
  const n = (await items(page)).length;
  await expect(page.locator('#stoh .steh')).toHaveCount(9);
  await page.click('#ssp');
  await settle(page);
  await expect(page.locator('#spbar')).toBeVisible();
  await expect(page.locator('#stoh .stsp')).toHaveCount(1);
  // drag the round end: the line turns
  const end = await page.locator('#stoh circle[data-sp="r"]').boundingBox();
  const from = { x: end.x + end.width / 2, y: end.y + end.height / 2 };
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(from.x + 40, from.y - 30, { steps: 4 }); await page.mouse.up();
  await settle(page);
  const end2 = await page.locator('#stoh circle[data-sp="r"]').boundingBox();
  expect(Math.abs(end2.x - end.x) + Math.abs(end2.y - end.y)).toBeGreaterThan(10);
  await page.click('#spok');
  await settle(page);
  const it = await items(page);
  expect(it.length).toBe(n + 1);
  expect(it[it.length - 1].cl).toBeTruthy();
  expect(it[it.length - 2].cl).toBeTruthy();
  await expect(page.locator('#spbar')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Grade masks belong to the unlocked stamp: added while it is unlocked, listed only then', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page);
  await openPanel(page, 'grade');
  await expect(page.locator('#gm_list .lyn').first()).toContainText('Stamp 1');
  await page.click('#gm_add');
  await page.locator('#gm_menu [data-gt="col"]').click();
  await settle(page);
  const sc = async () => (JSON.parse(await getState(page)).grade?.masks || []).map(m => m.sc);
  const id = await page.evaluate(() => String(__wbTest.unlockedStamp()));
  expect(await sc()).toContain(id);
  await expect(page.locator('#gm_list .lyr')).toHaveCount(2);
  await page.evaluate(() => __wbTest.commands.run('stamp.unlock'));
  await openPanel(page, 'stmp');
  await page.locator('#stmpl .smklk').first().click();
  await settle(page);
  await openPanel(page, 'grade');
  await expect(page.locator('#gm_list .lyr')).toHaveCount(1);
  expect(errors).toEqual([]);
});
