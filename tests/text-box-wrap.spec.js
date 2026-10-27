// Text: Box width wraps the lines, Box height + Vertical place them in a fixed box, and the side squares of a placed text pull those two (1.37.0).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, unlockStamp, stampInstance, clickStamp, canvasToClient, addStampText, addKind } = require('./helpers/harness');

const set = (page, id, v) => page.evaluate(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
const rows = ys => new Set(ys.map(y => Math.round(y / 4))).size;
const tileYs = async page => JSON.parse(await getState(page)).tiles[0].items.map(q => q.y);

// text goes into the unlocked stamp: set it up in the Text panel, then click an instance of the stamp on the canvas (the placed text stays selected)
const putStampText = async page => {
  const p = await stampInstance(page); await addStampText(page);
  await expect.poll(async () => JSON.parse(await getState(page)).tiles[0].items.filter(q => q.tg).length, { timeout: 15000 }).toBeGreaterThan(0);
  await settle(page, { max: 30000 });
  // a plain click on a letter selects the whole text, so the Text panel edits it live
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  const q = JSON.parse(await getState(page)).tiles[0].items.find(x => x.tg);
  const c = await page.evaluate(([i, u, v]) => __wbTest.stampToCanvas(i, u, v), [p.i, q.x, q.y]), cl = await canvasToClient(page, c.x, c.y);
  await page.mouse.click(cl.x, cl.y); await settle(page);
  await expect(page.locator('#tx_ed')).toBeVisible();
  return p;
};

test('Stamp text: a Box width breaks the lines; Box height with Top or Bottom moves the block', async ({ page }) => {
  const { errors } = await openApp(page);
  await unlockStamp(page); await showPanel(page, 'text');
  await page.fill('#tx_t', 'Wod lok mark here');
  await set(page, 'tx_sz', 12);
  await putStampText(page);
  const one = rows(await tileYs(page));
  await set(page, 'tx_wd', 40); await settle(page, { max: 30000 });
  await expect.poll(async () => rows(await tileYs(page)), { timeout: 15000 }).toBeGreaterThan(one);
  await set(page, 'tx_ht', 90); await settle(page, { max: 30000 });
  const mean = async () => { const y = await tileYs(page); return y.reduce((a, b) => a + b, 0) / y.length; };
  await page.click('#tx_va [data-v="t"]'); await settle(page, { max: 30000 });
  const top = await mean();
  await page.click('#tx_va [data-v="b"]'); await settle(page, { max: 30000 });
  await expect.poll(mean, { timeout: 15000 }).toBeGreaterThan(top + 5);
  expect(errors).toEqual([]);
});

// 2.63.0: a text on the canvas is a box its letters fill; its corners and sides are tested in text-box-2-63.spec.js (the side squares no longer wrap lines of fixed letters)
