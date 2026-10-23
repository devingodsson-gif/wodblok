const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// 2.25.0 "The stamp tab works like the canvas": Undo and Redo stay in the tab, the canvas keys and the right-click menu work on the stamp's shapes.
const st = async page => JSON.parse(await H.getState(page));
let sid = 1;   // 2.30.0: the stamp the roll put under the pointer (it is whichever one the seed drew there)
const items = async page => (await st(page)).tiles.find(t => t.id === sid).items;
const inTab = page => page.evaluate(() => window.__wbTest.unlockedStamp());

// a rolled piece, its first stamp open in its tab, one of its shapes selected
async function enter(page) {
  const o = await H.openApp(page, { seed: 4, pattern: false });
  await page.click('#rzdo'); await H.settle(page, { max: 60000 });
  const p = await H.stampInstance(page, 1); const c = await H.canvasToClient(page, p.cx, p.cy);
  await page.mouse.dblclick(c.x, c.y); await H.settle(page);
  sid = await inTab(page); expect(sid, 'a stamp is open in its tab').toBeGreaterThan(0);
  const b = await page.locator('#art').boundingBox(), pt = { x: b.x + b.width * 0.5, y: b.y + b.height * 0.62 };
  await page.mouse.click(pt.x, pt.y); await H.settle(page);
  return { ...o, pt };
}

test('Undo and Redo stay in the stamp tab', async ({ page }) => {
  const { errors, pt } = await enter(page);
  const x0 = JSON.stringify(await items(page));
  await page.mouse.move(pt.x, pt.y); await page.mouse.down(); await page.mouse.move(pt.x + 60, pt.y, { steps: 6 }); await page.mouse.up(); await H.settle(page);
  expect(JSON.stringify(await items(page)), 'moved').not.toBe(x0);
  await page.click('#undo'); await H.settle(page);
  expect(JSON.stringify(await items(page)), 'undone').toBe(x0);
  expect(await inTab(page), 'still in the tab after Undo').toBe(sid);
  await page.click('#redo'); await H.settle(page);
  expect(await inTab(page), 'still in the tab after Redo').toBe(sid);
  expect(errors).toEqual([]);
});

test('arrow keys nudge the selected shape in the tab', async ({ page }) => {
  const { errors } = await enter(page);
  const a = JSON.stringify(await items(page));
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft');
  await H.settle(page);
  expect(JSON.stringify(await items(page))).not.toBe(a);
  expect((await items(page)).length).toBe(JSON.parse(a).length);
  expect(errors).toEqual([]);
});

test('Ctrl+X cuts the selected shape in the tab and Ctrl+V brings it back', async ({ page }) => {
  const { errors } = await enter(page);
  const n0 = (await items(page)).length;
  await page.keyboard.press('Control+x'); await H.settle(page);
  expect((await items(page)).length, 'cut').toBeLessThan(n0);
  await page.keyboard.press('Control+v'); await H.settle(page);
  expect((await items(page)).length, 'pasted').toBe(n0);
  expect(await inTab(page)).toBe(sid);
  expect(errors).toEqual([]);
});

test('the right-click menu works in the tab: Delete removes the shape under the pointer', async ({ page }) => {
  const { errors, pt } = await enter(page);
  const n0 = (await items(page)).length;
  await page.mouse.click(pt.x, pt.y, { button: 'right' });
  await expect(page.locator('#ctxm')).toBeVisible();
  await expect(page.locator('#ctxm [data-a="del"]')).toBeEnabled();
  await page.click('#ctxm [data-a="del"]'); await H.settle(page);
  expect((await items(page)).length).toBe(n0 - 1);
  expect(errors).toEqual([]);
});

test('New stamp opens its tab; a roll closes every stamp tab', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.openPanel(page, 'stmp');
  await page.click('#smknew'); await H.settle(page);
  const id = (await st(page)).tiles.at(-1).id;
  expect(await inTab(page), 'the new stamp is open').toBe(id);
  await expect(page.locator('#stetabs [data-sv]')).toHaveCount(2);      // Canvas and the new stamp
  await page.click('#rzdo'); await H.settle(page, { max: 60000 });
  expect(await inTab(page), 'back on the Canvas').toBe(null);
  await expect(page.locator('#stetabs [data-sv]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('in a tab the Elements header counts the stamp\'s contents, and a row\'s … button opens the element menu', async ({ page }) => {
  const { errors } = await enter(page);
  await page.click('.rail [data-pn="lyrs"]'); await H.settle(page);
  const t = (await st(page)).tiles.find(x => x.id === sid).items;
  const n = t.filter(q => !q.tg).length + new Set(t.filter(q => q.tg).map(q => q.tg)).size;
  await expect(page.locator('#lycnt')).toHaveText(`${n} element${n === 1 ? '' : 's'}`);
  await page.locator('#mlist [data-rm]').first().click();
  await expect(page.locator('#ctxm')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('#stetabs [data-sv="c"]').click(); await H.settle(page);
  const els = (await st(page)).els.filter(q => q.k !== 'group').length;
  await expect(page.locator('#lycnt')).toHaveText(`${els} element${els === 1 ? '' : 's'}`);
  expect(errors).toEqual([]);
});

test('after a stamp tab, Add text on the canvas still places a text (it was left switched off)', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.openPanel(page, 'stmp'); await page.click('#smknew'); await H.settle(page);
  await page.click('#stetabs [data-sv="c"]'); await H.settle(page);
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  await H.addKind(page, 'text');
  expect((await st(page)).els.filter(q => q.tx).length).toBe(1);
  expect(errors).toEqual([]);
});
