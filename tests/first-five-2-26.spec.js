const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// 2.26.0 "A clear first five minutes": the bar buttons make things, the first picks are guided, the plain menus say what they do.
const st = async page => JSON.parse(await H.getState(page));
const els = async (page, k) => (await st(page)).els.filter(q => q.k === k);

for (const k of ['pattern', 'stamp']) {
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
  await page.click('#elb [data-k="pattern"]'); await H.settle(page);
  await page.click('#elb [data-k="select"]'); await H.settle(page);
  await expect(page.locator('#elb [data-k="select"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#elb [data-k="pattern"]')).toHaveAttribute('aria-pressed', 'false');
  await page.mouse.click(b.x + b.width * 0.8, b.y + b.height * 0.8); await H.settle(page);
  expect((await els(page, 'pattern')).length, 'Select puts the tool away: a click places nothing').toBe(0);
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

test('the template picker has starting points: a stamped pattern and a framed border, a repeat tile and a book cover, after Blank', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await page.click('#fileb'); await page.click('#tpnew');
  const names = async k => { await page.click(`#tpty [data-k="${k}"]`); await H.settle(page, { quiet: 4 }); return page.locator('#tppane .lrw:has(.lfr[data-k="s:Starting points"]) + .lib button[data-tp]').evaluateAll(c => c.map(x => x.getAttribute('aria-label'))); };
  expect(await names('canvas')).toEqual(['Blank', 'Framed border', 'Stamped flowers']);
  expect(await names('tile')).toEqual(['Blank', 'Half-drop diamonds']);
  expect(await names('book')).toEqual(['Blank', 'Cover 6 × 9 in']);
  expect(errors).toEqual([]);
});

test('a panel with more tabs than fit gets arrows at the ends that have more behind them', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  const { errors } = await H.openApp(page, { seed: 4, workspaces: true });
  for (const pn of ['hist', 'xrec', 'rand', 'canvas', 'colors', 'pgrid']) { const b = page.locator(`.rail [data-pn="${pn}"]:not([hidden])`); if (await b.count()) { await b.dispatchEvent('click'); await H.settle(page); } }
  const wh = page.locator('.wg .wh').first(), wt = page.locator('.wg .wt').first();
  await expect(wh).toHaveClass(/ovl/);                                  // the open tab is the last one, in view; the earlier ones are behind the left edge
  await expect(wh.locator('.wta.l')).toBeVisible();
  const x0 = await wt.evaluate(t => t.scrollLeft);
  await wh.locator('.wta.l').click();
  await expect.poll(() => wt.evaluate(t => t.scrollLeft)).toBeLessThan(x0);
  await expect(wh.locator('.wta.r')).toBeVisible();                     // and now there is more behind the right edge
  expect(errors).toEqual([]);
});

test('stamp tabs that do not fit get arrows too, and the open tab is scrolled into view', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.openPanel(page, 'stmp');
  for (let i = 0; i < 9; i++) { await page.click('#smknew'); await H.settle(page); }
  const bar = page.locator('#stetabs');
  await expect(bar).toHaveClass(/ovl/);                                // the newest tab is open and in view, so the earlier ones are behind the left edge
  await expect(bar.locator('.wta.l')).toBeVisible();
  const x0 = await bar.evaluate(b => b.scrollLeft);
  await bar.locator('.wta.l').click();
  await expect.poll(() => bar.evaluate(b => b.scrollLeft)).toBeLessThan(x0);
  expect(await bar.locator('.wtab.on').count()).toBe(1);
  expect(errors).toEqual([]);
});

test('Copy a prompt is in the Import menu of the motif library (an image prompt, a sheet prompt) and the group of its own is gone', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await page.evaluate(() => { window.__clip = []; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async t => { window.__clip.push(t); } } }); });
  await H.showPanel(page, 'motifs');
  await expect(page.locator('#iprg')).toHaveCount(0);
  await page.click('#limp');
  await expect(page.locator('.rowm').getByRole('menuitem')).toHaveText(['Image…', 'Sheet…', 'Copy a prompt for an image', 'Copy a prompt for a sheet']);
  await page.getByRole('menuitem', { name: 'Copy a prompt for an image' }).click();
  await expect.poll(() => page.evaluate(() => window.__clip.length)).toBe(1);
  expect(await page.evaluate(() => window.__clip[0])).toContain('single [subject]');
  await expect(page.locator('#pmsg')).toContainText('Prompt copied');
  await page.click('#limp'); await page.getByRole('menuitem', { name: 'Copy a prompt for a sheet' }).click();
  await expect.poll(() => page.evaluate(() => window.__clip.length)).toBe(2);
  expect(await page.evaluate(() => window.__clip[1])).toContain('different [subject]');
  expect(errors).toEqual([]);
});

test('a recipe exports from its own Export button; a click on its name exports nothing', async ({ page }) => {
  const { errors } = await H.openApp(page);
  await H.openPanel(page, 'xrec');
  const row = page.locator('#xrl .xrr', { hasText: 'Preview' });
  await expect(row.locator('[data-act="exp"]')).toHaveAttribute('aria-label', 'Export Preview');
  await row.locator('b').click(); await H.settle(page);
  expect(await page.evaluate(() => window.__wbDownloads.length), 'the name is not a button').toBe(0);
  await row.locator('[data-act="exp"]').click();
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  expect((await page.evaluate(() => window.__wbDownloads[0].filename))).toMatch(/-preview\.jpg$/);
  expect(errors).toEqual([]);
});

test('the Canvas panel has a Texture group with a switch when the project has a canvas texture (a roll makes one); off hides it, Undo brings it back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 1, pattern: false, background: true });
  await page.click('#rzdo'); await H.settle(page, { max: 60000 });
  await H.openPanel(page, 'canvas');
  expect((await st(page)).tex.u.length, 'the roll made a canvas texture').toBeGreaterThan(0);
  await expect(page.locator('#ctxg')).toBeVisible();
  await expect(page.locator('#ctxg summary')).toHaveText('Texture');
  await expect(page.locator('#ctxon')).toBeChecked();
  expect(await page.evaluate(() => document.getElementById('texg').innerHTML.length), 'drawn').toBeGreaterThan(0);
  await page.locator('#ctxg .chk').click(); await H.settle(page);
  await expect(page.locator('#ctxon')).not.toBeChecked();
  expect((await st(page)).tex.off, 'a project setting').toBe(1);
  expect(await page.evaluate(() => document.getElementById('texg').innerHTML.length), 'not drawn').toBe(0);
  await page.click('#undo'); await H.settle(page);
  await expect(page.locator('#ctxon')).toBeChecked();
  expect((await st(page)).tex.off).toBeUndefined();
  expect(await page.evaluate(() => document.getElementById('texg').innerHTML.length)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
