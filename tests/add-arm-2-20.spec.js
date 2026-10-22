const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, noPattern } = require('./helpers/harness');
// 2.20.0: every Add arms its kind; a ghost follows the pointer; each click on the canvas places one at the pointer; Esc or V puts the tool away.
const els = async (page, k) => JSON.parse(await getState(page)).els.filter(q => q.k === k);

for (const k of ['shape', 'pattern', 'text', 'motif', 'stamp']) {
  test(`Add ${k}: makes nothing until the canvas is clicked, places where clicked, stays armed, V puts it away`, async ({ page }) => {
    const { errors } = await openApp(page, { seed: 4 });
    await noPattern(page);
    await page.click(`#elb [data-k="${k}"]`); await settle(page);
    await page.click(`.elk[data-k="${k}"] [data-add]`); await settle(page);
    expect((await els(page, k)).length, 'Add alone').toBe(0);
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
