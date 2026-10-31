// 2.79.1 (owner Oct 31 2026, docs/small-updates-plan.md step 1): panels and selection.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const st = async page => JSON.parse(await H.getState(page));
const vis = (page, id) => page.evaluate(id => { const e = document.getElementById(id); return !!e && e.getBoundingClientRect().width > 0; }, id);
const set = (page, id, v) => page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, v]);

test('1. the template picker keeps its size while the card size slider changes the cards', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, templates: true, pattern: false });
  await expect(page.locator('#tpdlg')).toBeVisible();
  const box = () => page.locator('#tpdlg .dlg').boundingBox();
  const r = page.locator('#tppane input[type=range]').first();
  const b0 = await box(), card0 = await page.locator('#tppane button[data-tp]').first().boundingBox();
  for (const v of ['min', 'max']) { await r.evaluate((e, v) => { e.value = e[v]; e.dispatchEvent(new Event('input', { bubbles: true })); }, v); await page.waitForTimeout(200); const b = await box(); expect([Math.round(b.width), Math.round(b.height)], v).toEqual([Math.round(b0.width), Math.round(b0.height)]); }
  expect((await page.locator('#tppane button[data-tp]').first().boundingBox()).width).not.toBe(card0.width);
  expect(errors).toEqual([]);
});

test('2. a shape on the cursor shows Size and Rotate before the first is placed, on the canvas and in a stamp tab', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
  await page.click('#elb [data-k="motif"]'); await H.settle(page);
  expect(await vis(page, 'lfps'), 'Size').toBe(true);
  expect(await vis(page, 'lfpr'), 'Rotate').toBe(true);
  await set(page, 'lfps', 40); await set(page, 'lfpr', 30); await H.settle(page);
  await H.placeArmed(page, 'motif');
  const q = (await st(page)).els.find(e => e.k === 'motif' && !e.bgd);
  expect(Math.round(q.s / Math.min(...await page.evaluate(() => { const b = document.getElementById('art').viewBox.baseVal; return [b.width, b.height]; })) * 100)).toBe(40);
  expect(q.r).toBe(30);
  // a stamp's tab: the shape editor's Size and Rotate are live while a shape is on the cursor
  await page.keyboard.press('Escape'); await H.settle(page);
  await H.addStamp(page); await H.unlockStamp(page, 0); await H.settle(page);
  await H.pickShape(page);   // in a stamp's tab a library shape is what goes on the cursor (the Shape button puts one in at once)
  expect(await page.evaluate(() => document.getElementById('sel').classList.contains('none')), 'the Edit group is live').toBe(false);
  await set(page, 'ssz', 50); await set(page, 'srt', 45);
  const n0 = await page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles[0].items.length);
  { const b = await page.locator('#art').boundingBox(); await page.mouse.move(b.x + b.width * .4, b.y + b.height * .4); await page.mouse.click(b.x + b.width * .4, b.y + b.height * .4); await H.settle(page); }
  const it = await page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles[0].items);
  expect(it.length, 'placed in the stamp').toBe(n0 + 1);
  expect([+it[it.length - 1].s.toFixed(2), it[it.length - 1].r]).toEqual([0.5, 45]);
  expect(errors).toEqual([]);
});

test('3 and 4. Align shows only with a selection; Rotate 90° turns the selection a quarter', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
  await H.addShape(page); await H.settle(page);
  await page.keyboard.press('Escape'); await page.evaluate(() => window.__wbTest.commands.run('edit.deselect')); await H.settle(page);
  expect(await vis(page, 'lalsec'), 'no Align without a selection').toBe(false);
  await page.evaluate(() => window.__wbTest.commands.run('edit.selectAll')); await H.settle(page);
  await H.showPanel(page, 'motifs');
  expect(await vis(page, 'lalsec'), 'Align with a selection').toBe(true);
  const r0 = (await st(page)).els.find(e => e.k === 'motif' && !e.bgd).r || 0;
  await page.click('#lfpr90'); await H.settle(page);
  expect(((await st(page)).els.find(e => e.k === 'motif' && !e.bgd).r - r0 + 360) % 360).toBe(90);
  expect(errors).toEqual([]);
});

test('6. a panel\'s sections start folded but the first; what is opened is remembered', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, sections: 'default' });
  await H.openPanel(page, 'canvas');
  const open = () => page.evaluate(() => [...document.querySelectorAll('section.pn[data-p="canvas"] > details.g')].filter(d => !d.hidden).map(d => d.open));
  const a = await open();
  expect(a[0], 'the top section').toBe(true);
  expect(a.slice(1).every(o => !o), 'the rest folded').toBe(true);
  const d = page.locator('section.pn[data-p="canvas"] > details.g:not([hidden])').nth(1);
  const name = (await d.locator(':scope > summary').textContent()).trim();
  await d.locator(':scope > summary').click();
  await expect(d).toHaveAttribute('open', '');
  await page.reload(); await page.waitForFunction(() => !!window.__wbTest && document.fonts.status === 'loaded'); await H.settle(page);
  await H.openPanel(page, 'canvas');
  const same = page.locator('section.pn[data-p="canvas"] > details.g').filter({ has: page.locator(':scope > summary', { hasText: name }) }).first();
  await expect(same, 'remembered: ' + name).toHaveAttribute('open', '');
  expect(errors).toEqual([]);
});

test('7. in a stamp\'s tab another stamp\'s row opens that stamp\'s tab', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
  await H.addStamp(page); await H.addStamp(page);
  const ids = (await st(page)).tiles.map(t => t.id);
  await H.unlockStamp(page, 0); await H.settle(page);
  const a = await page.evaluate(() => window.__wbTest.unlockedStamp());
  const other = ids.find(i => i !== a);
  await H.showPanel(page, 'stmp');
  await page.locator(`#stmpl .smkr[data-t="${other}"] .smkn`).click(); await H.settle(page);
  expect(await page.evaluate(() => window.__wbTest.unlockedStamp())).toBe(other);
  expect(errors).toEqual([]);
});

test('5. splitting shows only the split line; after it both pieces are selected, each in a box that fits it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true, pattern: false });
  await H.addStamp(page); await H.unlockStamp(page, 0); await H.settle(page);
  await page.click('#elb [data-k="motif"]'); await H.settle(page); await page.keyboard.press('Escape'); await H.settle(page);
  const n = await page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles[0].items.length);
  expect(n, 'a shape in the stamp').toBeGreaterThan(0);
  { const b = await page.locator('#art').boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await H.settle(page); }   // the shape in the stamp's middle
  const boxW = () => page.evaluate(() => [...document.querySelectorAll('polygon.stes')].map(p => { const b = p.getBBox(); return Math.round(b.width * b.height); }));
  const full = await boxW();
  await page.click('#ssp'); await H.settle(page);
  expect(await page.locator('polygon.stes').count(), 'no selection box while splitting').toBe(0);
  expect(await page.locator('.steh[data-hd]').count(), 'no resize handles while splitting').toBe(0);
  expect(await page.locator('.steh[data-sp]').count(), 'the split handles').toBeGreaterThan(0);
  await page.keyboard.press('Enter'); await H.settle(page);
  const after = await boxW();
  expect(after.length, 'both pieces selected').toBe(2);
  expect(Math.max(...after), 'each box fits its piece').toBeLessThan(full[0] * .8);
  expect(errors).toEqual([]);
});
