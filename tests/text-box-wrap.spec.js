// Text: Box width wraps the lines, Box height + Vertical place them in a fixed box, and the side squares of a placed text pull those two (1.37.0).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, unlockStamp, stampInstance, clickStamp, canvasToClient } = require('./helpers/harness');

const set = (page, id, v) => page.evaluate(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
const rows = ys => new Set(ys.map(y => Math.round(y / 4))).size;
const tileYs = async page => JSON.parse(await getState(page)).tiles[0].items.map(q => q.y);

// text goes into the unlocked stamp: set it up in the Text panel, then click an instance of the stamp on the canvas (the placed text stays selected)
const putStampText = async page => {
  const p = await stampInstance(page); await clickStamp(page, p);
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

test('Text layer: the side squares set the box width (lines wrap, top stays) and the box height', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'lyrs');
  await page.click('#ly_add'); await openPanel(page, 'text'); await settle(page);
  await page.fill('#tx_t', 'ONE TWO THREE FOUR');
  await set(page, 'tx_sz', 6);
  await page.waitForTimeout(500);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(page);
  await page.click('#tx_go'); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await settle(page);   // put the text down, then select it
  const piece = async () => JSON.parse(await getState(page)).layers.flatMap(l => l.pl || []).find(p => p.tx);
  const a = await piece();
  expect(rows(a.Lt.map(l => l[2]))).toBe(1);
  const left0 = a.x - a.bw * a.s / a.n / 2, top0 = a.y - a.bh * a.s / a.n / 2;
  const pull = async (h, dx, dy) => {
    const b = await page.locator(`#fpov [data-fh="${h}"]`).boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2;
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 3 }); await page.mouse.move(x + dx, y + dy, { steps: 3 }); await page.mouse.up(); await settle(page);
  };
  await pull('e', -box.width * 0.25, 0);
  await expect.poll(async () => rows((await piece()).Lt.map(l => l[2])), { timeout: 15000 }).toBeGreaterThan(1);
  const b = await piece();
  expect(b.tx.wd).toBeGreaterThan(0); expect(b.tx.sz).toBe(a.tx.sz);   // the letters keep their size
  expect(b.x - b.bw * b.s / b.n / 2).toBeCloseTo(left0, 0);           // the far (left) side stayed
  expect(b.y - b.bh * b.s / b.n / 2).toBeCloseTo(top0, 0);            // and so did the top
  expect(b.bh).toBeGreaterThan(a.bh);
  await pull('s', 0, box.height * 0.05);
  await expect.poll(async () => (await piece()).tx.ht, { timeout: 15000 }).toBeGreaterThan(0);
  await expect(page.locator('#tx_wd')).not.toHaveValue('0');
  expect(errors).toEqual([]);
});
