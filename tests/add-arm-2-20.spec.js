const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, noPattern, pickShape } = require('./helpers/harness');
// 2.20.0: every Add arms its kind; a ghost follows the pointer; each click on the canvas places one at the pointer; Esc or V puts the tool away.
const els = async (page, k) => JSON.parse(await getState(page)).els.filter(q => q.k === k);

for (const k of ['pattern', 'motif', 'stamp']) {
  test(`Add ${k}: makes nothing until the canvas is clicked, places where clicked, stays armed, V puts it away`, async ({ page }) => {
    const { errors } = await openApp(page, { seed: 4 });
    await noPattern(page);
    await page.click(`#elb [data-k="${k}"]`); await settle(page);
    await page.click(`.elk[data-k="${k}"] [data-add]`); await settle(page);
    expect((await els(page, k)).length, 'Add alone').toBe(0);
    if (k === 'motif') await pickShape(page);   // 2.26.0: with nothing chosen yet, Add motif opens the library; a pick arms it
    const b = await page.locator('#art').boundingBox();
    await page.mouse.move(b.x + b.width * 0.3, b.y + b.height * 0.3);
    await expect(page.locator(`#elb [data-k="${k}"]`)).toHaveAttribute('aria-pressed', 'true');   // armed
    await page.mouse.click(b.x + b.width * 0.3, b.y + b.height * 0.3); await settle(page);
    const a = await els(page, k);
    expect(a.length, 'first click').toBe(1);
    expect(a[0].x, 'placed left of centre').toBeLessThan(b.width / 2 > 0 ? 400 : 0);
    await page.mouse.click(b.x + b.width * 0.7, b.y + b.height * 0.7); await settle(page);
    expect((await els(page, k)).length, 'second click').toBe(2);
    await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    await page.keyboard.press('v'); await settle(page);
    await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.9); await settle(page);
    expect((await els(page, k)).length, 'after V').toBe(2);
    expect(errors).toEqual([]);
  });
}

test('Add text: a click places it and you type in it on the canvas; the panel field follows; Esc ends; empty text is removed', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await page.click('#elb [data-k="text"]'); await settle(page);
  await page.click('.elk[data-k="text"] [data-add]'); await settle(page);
  expect((await els(page, 'text')).length, 'Add alone').toBe(0);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.4);
  await page.waitForFunction(() => document.querySelector('#fpov .gh'), null, { timeout: 5000 });
  await page.mouse.click(b.x + b.width * 0.4, b.y + b.height * 0.4); await settle(page);
  expect((await els(page, 'text')).length).toBe(1);
  await expect(page.locator('#txin')).toBeVisible();
  await expect(page.locator('#txin')).toBeFocused();
  await page.keyboard.type('Hello'); await settle(page);                  // the first key replaced the selected word
  expect(await page.inputValue('#tx_t')).toBe('Hello');
  await expect.poll(async () => (await els(page, 'text'))[0].tx.text).toBe('Hello');
  await page.keyboard.press('Escape'); await settle(page);
  await expect(page.locator('#txin')).toBeHidden();
  expect((await els(page, 'text')).length).toBe(1);
  // double-click on the text edits it again; emptying it removes the element
  const q = (await els(page, 'text'))[0];
  const pt = await page.evaluate(([x, y]) => { const a = document.getElementById('art'), p = a.createSVGPoint(); p.x = x; p.y = y; const r = p.matrixTransform(a.getScreenCTM()); return [r.x, r.y]; }, [q.x, q.y]);
  await page.mouse.dblclick(pt[0], pt[1]); await settle(page);
  await expect(page.locator('#txin')).toBeVisible();
  await page.keyboard.press('Control+a'); await page.keyboard.press('Delete'); await page.keyboard.press('Escape'); await settle(page);
  expect((await els(page, 'text')).length).toBe(0);
  expect(errors).toEqual([]);
});
