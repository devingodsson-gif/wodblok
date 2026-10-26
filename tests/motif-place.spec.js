const { test, expect } = require('@playwright/test');
const { openApp, settle, getState } = require('./helpers/harness');
// 2.4.0: the Motif button makes nothing; it opens the library. A pick arms that motif (a ghost follows the pointer) and every click on the canvas places one.
const motifs = async page => JSON.parse(await getState(page)).els.filter(q => q.k === 'motif');
async function openLib(page) {
  await page.click('#elb [data-k="motif"]'); await settle(page);
  if (!(await page.locator('#lib button[data-m]').count())) await page.locator('#lib .lfr[data-f^="b:"]').first().click();
}
test('motif: the Motif button makes nothing, a pick arms it, each click on the canvas places one', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openLib(page);
  expect(await motifs(page)).toHaveLength(0);
  await expect(page.locator('#elb [data-k="motif"]')).toHaveAttribute('aria-pressed', 'true');
  const btns = page.locator('#lib button[data-m]:visible');
  await btns.nth(0).click(); await settle(page);
  expect(await motifs(page)).toHaveLength(0);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await expect(page.locator('#fpov [data-ghost], #art .fpgh, #fpov')).not.toHaveCount(0);
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3); await settle(page);
  await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.6); await settle(page);
  const ms = await motifs(page);
  expect(ms).toHaveLength(2);
  expect(ms[0].m).toBe(ms[1].m);
  // picking another motif while armed changes what the next click places
  await btns.nth(1).click(); await settle(page);
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.8); await settle(page);
  const m3 = await motifs(page);
  expect(m3).toHaveLength(3);
  expect(m3[2].m).not.toBe(m3[0].m);
  expect(JSON.parse(await getState(page)).tiles[0].items.length).toBe(0);   // nothing went into the stamp
  expect(errors).toEqual([]);
});
test('motif: with nothing armed, picking a shape changes the selected Motif; the Element bar has no Background (2.53.0: it has a Sheet)', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openLib(page);
  const btns = page.locator('#lib button[data-m]:visible');
  await btns.nth(0).click(); await settle(page);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4); await settle(page);
  await page.keyboard.press('v'); await settle(page);
  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.4); await settle(page);
  const m0 = (await motifs(page))[0].m;
  await btns.nth(1).click(); await settle(page);
  const ms = await motifs(page);
  expect(ms).toHaveLength(1);
  expect(ms[0].m).not.toBe(m0);
  const ks = await page.$$eval('#elb .elbb', b => b.map(x => x.dataset.k));
  expect(ks.some(k => /back|bg/i.test(k))).toBe(false);
  expect(ks).toContain('sheet');
  expect(errors).toEqual([]);
});
test('motif: a dragged Motif is drawn moving while the pointer is down, not only when it is let go', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openLib(page);
  await page.locator('#lib button[data-m]:visible').first().click();
  const box = await page.locator('#art').boundingBox(), cx = box.x + box.width * 0.4, cy = box.y + box.height * 0.4;
  await page.mouse.click(cx, cy); await settle(page);
  await page.keyboard.press('v'); await settle(page);
  const left = () => page.evaluate(() => { const g = document.querySelector('#art [data-mv]'); return g ? g.getBoundingClientRect().left : null; });
  const x0 = await left();
  expect(x0).not.toBeNull();
  await page.mouse.move(cx, cy); await page.mouse.down();
  await page.mouse.move(cx + 60, cy + 20); await page.waitForTimeout(100);
  await page.mouse.move(cx + 120, cy + 40); await page.waitForTimeout(100);
  const xMid = await left();
  expect(Math.abs(xMid - x0 - 120)).toBeLessThan(3);   // it follows the pointer before the button is let go
  await page.mouse.up(); await settle(page);
  expect(Math.abs((await left()) - x0 - 120)).toBeLessThan(3);
  expect(errors).toEqual([]);
});
