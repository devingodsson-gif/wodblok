const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// 2.26.0 "A clear first five minutes": the bar buttons make things, the first picks are guided, the plain menus say what they do.
const st = async page => JSON.parse(await H.getState(page));
const els = async (page, k) => (await st(page)).els.filter(q => q.k === k);

for (const k of ['shape', 'pattern', 'stamp']) {
  test(`the ${k} bar button arms its tool at once: one click on the bar, one click on the canvas, one ${k}`, async ({ page }) => {
    const { errors } = await H.openApp(page, { seed: 4 });
    await H.noPattern(page);
    await page.click(`#elb [data-k="${k}"]`); await H.settle(page);
    await expect(page.locator(`#elb [data-k="${k}"]`)).toHaveAttribute('aria-pressed', 'true');
    expect((await els(page, k)).length, 'the button alone places nothing').toBe(0);
    const b = await page.locator('#art').boundingBox();
    await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.4); await H.settle(page);
    await page.mouse.click(b.x + b.width * 0.4, b.y + b.height * 0.4); await H.settle(page);
    expect((await els(page, k)).length, 'one click on the canvas').toBe(1);
    await page.mouse.click(b.x + b.width * 0.7, b.y + b.height * 0.7); await H.settle(page);
    expect((await els(page, k)).length, 'stays armed').toBe(2);
    expect(errors).toEqual([]);
  });
}

test('the Text bar button arms text at once; Select (V) is the first button, shown pressed, and takes the tool away', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.noPattern(page);
  await expect(page.locator('#elb .elbb').first()).toHaveAttribute('data-k', 'select');
  await expect(page.locator('#elb [data-k="select"]')).toHaveAttribute('aria-pressed', 'true');
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  await expect(page.locator('#elb [data-k="text"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#elb [data-k="select"]')).toHaveAttribute('aria-pressed', 'false');
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.4);
  await page.waitForFunction(() => document.querySelector('#fpov .gh'), null, { timeout: 5000 });
  await page.mouse.click(b.x + b.width * 0.4, b.y + b.height * 0.4); await H.settle(page);
  expect((await els(page, 'text')).length).toBe(1);
  await page.keyboard.press('Escape'); await H.settle(page);
  await page.click('#elb [data-k="shape"]'); await H.settle(page);
  await page.click('#elb [data-k="select"]'); await H.settle(page);
  await expect(page.locator('#elb [data-k="select"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#elb [data-k="shape"]')).toHaveAttribute('aria-pressed', 'false');
  await page.mouse.click(b.x + b.width * 0.8, b.y + b.height * 0.8); await H.settle(page);
  expect((await els(page, 'shape')).length, 'Select puts the tool away: a click places nothing').toBe(0);
  expect(errors).toEqual([]);
});

test('Add motif with nothing chosen opens the library and places nothing; a pick arms it; the next Add motif uses that pick', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.noPattern(page);
  await page.click('#elb [data-k="motif"]'); await H.settle(page);
  await expect(page.locator('section.pn[data-p="motifs"]')).toBeVisible();
  await expect(page.locator('#lib')).toBeVisible();
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.5); await H.settle(page);
  expect((await els(page, 'motif')).length, 'no shape was chosen, so none is placed').toBe(0);
  await H.pickShape(page);
  await page.mouse.click(b.x + b.width * 0.3, b.y + b.height * 0.3); await H.settle(page);
  const m = (await els(page, 'motif'))[0];
  expect(m, 'the picked shape is placed').toBeTruthy();
  await page.keyboard.press('v'); await H.settle(page);
  await page.click('#elb [data-k="motif"]'); await H.settle(page);
  await page.mouse.click(b.x + b.width * 0.7, b.y + b.height * 0.7); await H.settle(page);
  const all = await els(page, 'motif');
  expect(all.length).toBe(2);
  expect(all[1].m, 'the same shape').toBe(m.m);
  expect(errors).toEqual([]);
});

test('selecting a motif on the canvas opens the Motif panel (not Shape); its Element group and its Edit Width, Height and Colour work on it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.noPattern(page);
  await page.click('#elb [data-k="motif"]'); await H.pickShape(page);
  const b = await page.locator('#art').boundingBox(), px = b.x + b.width * 0.4, py = b.y + b.height * 0.4;
  await page.mouse.click(px, py); await H.settle(page);
  await page.keyboard.press('v'); await H.settle(page);
  await page.mouse.click(b.x + b.width * 0.9, b.y + b.height * 0.9); await H.settle(page);   // nothing selected
  await H.openPanel(page, 'lyrs');                                     // some other panel is in front
  await page.mouse.click(px, py); await H.settle(page);
  await expect(page.locator('section.pn[data-p="motifs"]')).toBeVisible();
  await expect(page.locator('section.pn[data-p="mlist"]')).toBeHidden();
  await expect(page.locator('section.pn[data-p="motifs"] #lfree')).toBeVisible();   // the Element group
  await expect(page.locator('#sel')).toHaveClass(/mtel/);
  await expect(page.locator('#ssx')).toBeVisible(); await expect(page.locator('#ssz')).toBeHidden();
  const q0 = (await els(page, 'motif'))[0];
  await page.locator('#ssx').fill('150'); await H.settle(page);
  await page.locator('#ssy').fill('60'); await H.settle(page);
  const q1 = (await els(page, 'motif'))[0];
  expect(q1.wx, 'Width').toBeCloseTo(1.5, 2); expect(q1.wy, 'Height').toBeCloseTo(0.6, 2);
  expect(q1.x).toBe(q0.x);
  await page.click('#undo'); await H.settle(page);
  expect((await els(page, 'motif'))[0].wy ?? 1).not.toBeCloseTo(0.6, 2);
  expect(errors).toEqual([]);
});
