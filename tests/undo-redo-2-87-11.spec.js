// 2.87.11 (docs/pro-basics-plan.md step 11; owner Nov 3 2026: "undo/redo dont work"). Ctrl+Z / Ctrl+Shift+Z (and Ctrl+Y) and the top bar's buttons undo and redo
// every kind of change. The fault found: once a text or number field had been used (the unit fields keep the focus after Enter), the keys did nothing to the
// document until the field was left. Now a field keeps Ctrl+Z only while it holds typing not yet applied.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const doc = async page => H.getState(page);
async function roundTrip(page, name, act, how) {
  const a = await doc(page); await act(); await H.settle(page); await page.waitForTimeout(600);
  const b = await doc(page); expect(b, name + ' changes the document').not.toBe(a);
  if (how === 'key') await page.keyboard.press('Control+z'); else await page.locator('#undo').click();
  await H.settle(page); expect(await doc(page), name + ': undo').toBe(a);
  if (how === 'key') await page.keyboard.press('Control+Shift+z'); else await page.locator('#redo').click();
  await H.settle(page); expect(await doc(page), name + ': redo').toBe(b);
}
for (const how of ['key', 'button']) test(`undo and redo by ${how}: add, drag, a typed field (still focused), a slider, Randomize, Blend, a stamp's tab, a guide`, async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await roundTrip(page, 'add shape', () => H.addShape(page), how);
  const q = JSON.parse(await doc(page)).els.find(e => e.k === 'motif'), c = await H.canvasToClient(page, q.x, q.y);
  await roundTrip(page, 'drag', async () => { await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + 60, c.y + 40, { steps: 5 }); await page.mouse.up(); }, how);
  await roundTrip(page, 'typed X', async () => { const e = page.locator('#lfux'); await e.click(); await e.fill('20'); await e.press('Enter'); }, how);
  await roundTrip(page, 'slider', async () => { const r = page.locator('#lfps'), b = await r.boundingBox(); await page.mouse.click(b.x + b.width * .8, b.y + b.height / 2); }, how);
  await roundTrip(page, 'randomize', () => page.evaluate(() => window.__wbTest.commands.run('randomize.roll')), how);
  await roundTrip(page, 'blend', async () => { await H.openPanel(page, 'lyrs'); await page.locator('#lyl2 .lyr').first().click(); await page.evaluate(() => { const e = document.getElementById('ly_bl'); e.value = 'multiply'; e.dispatchEvent(new Event('change', { bubbles: true })); }); }, how);
  await roundTrip(page, 'new guide', async () => { await page.evaluate(() => window.__wbTest.commands.run('view.newGuide')); await page.locator('#rngp').fill('20'); await page.locator('#rngp').press('Enter'); }, how);
  await page.keyboard.press('Escape'); await H.openPanel(page, 'stmp'); await page.click('#smknew'); await H.settle(page); await page.keyboard.press('Escape'); await H.settle(page);
  await roundTrip(page, 'stamp tab shape', () => H.stampTabRect(page), how);
  expect(errors).toEqual([]);
});

test('a field with typing not yet applied keeps Ctrl+Z for its own text; after Enter the keys undo the document and the field shows the value back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page);
  const e = page.locator('#lfux'); await e.click(); const x0 = await e.inputValue();
  await e.fill('20'); const a = await doc(page);
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect(await doc(page)).toBe(a);                                   // the document is untouched while the field holds typing
  await e.fill('20'); await e.press('Enter'); await H.settle(page);
  expect(await doc(page)).not.toBe(a);
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect(await doc(page)).toBe(a); await expect(e).toHaveValue(x0);
  await page.keyboard.press('Control+y'); await H.settle(page);
  await expect(e).toHaveValue('20');
  expect(errors).toEqual([]);
});
