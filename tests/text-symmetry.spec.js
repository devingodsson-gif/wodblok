// Text on a stamp stays readable under symmetry; mirroring it is a choice (UX review D6).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, showPanel, settle, getState, unlockStamp, stampInstance, clickStamp, canvasToClient } = require('./helpers/harness');
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


test('with 4-way symmetry the letters are drawn once; Mirror text with symmetry draws the copies', async ({ page }) => {
  const { errors } = await openApp(page);
  await unlockStamp(page);
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'Ab');
  await putTextCanvas(page);
  await showPanel(page, 'stmp');
  await page.click('#sym [data-y="quad"]');
  await settle(page);
  const n = JSON.parse(await getState(page)).tiles[0].items.filter(q => q.tg).length;
  expect(n).toBeGreaterThan(0);
  await expect(page.locator('#symtxr')).toBeVisible();
  await expect(page.locator('#symtx')).not.toBeChecked();
  await page.addStyleTag({ content: '#stolsvg{display:none!important}' });   // the outlines are an editing aid, not the picture
  const shot = () => page.locator('#art').screenshot();   // the stamp is printed as a picture, so the copies show as a change in the pixels
  const once = await shot();
  await page.check('#symtx');
  await settle(page);
  expect((await shot()).equals(once)).toBe(false);
  expect(JSON.parse(await getState(page)).tiles[0].sym.tx).toBe(1);
  expect(errors).toEqual([]);
});
