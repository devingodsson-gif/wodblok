// 2.54.2 (owner Oct 26 2026, docs/panel-modes-plan.md): an element panel creates or edits. Creating (nothing of its kind selected) shows the library;
// editing (a shape selected) hides it and shows what the shape is made from with Replace, which opens the same library in a popover; a pick there swaps the shape.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));
const libGroup = page => page.locator('section.pn[data-p="motifs"] details.g:has(#lib)');
const row = page => page.locator('section.pn[data-p="motifs"] .rprow[data-pmk="motif"]');

test('the Shape panel shows its library while creating and a Replace row while a shape is selected', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await page.click('#elb [data-k="motif"]'); await H.settle(page);
  await expect(page.locator('#lib')).toBeVisible();
  await expect(row(page)).toBeHidden();
  await H.addShape(page, 'rect');
  // the placed shape is selected: the panel edits it
  await expect(page.locator('section.pn[data-p="motifs"]')).toBeVisible();
  await expect(page.locator('#lib')).toBeHidden();
  await expect(row(page)).toBeVisible();
  await expect(row(page).locator('.rpn')).toHaveText('Rectangle');
  await expect(row(page).locator('.rpth svg')).toHaveCount(1);
  await expect(row(page).locator('.rpgo')).toHaveText('Replace');
  // Esc ends the selection: creating again
  await page.keyboard.press('Escape'); await H.settle(page);
  await expect(row(page)).toBeHidden();
  await expect(page.locator('#lib')).toBeVisible();
  // the Elements list picks it: editing again
  await H.showPanel(page, 'lyrs'); await page.locator('#lyl2 .lyr').first().locator('.lyn').click(); await H.settle(page);
  await expect(row(page)).toBeVisible();
  await expect(libGroup(page)).toBeHidden();
  expect(errors).toEqual([]);
});

test('Replace opens the library in a popover; a pick swaps the shape in one history step and puts the library back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addShape(page, 'rect');
  const before = await st(page), u = before.els[before.els.length - 1].u, m0 = before.els[before.els.length - 1].m;
  await page.click('.rprow[data-pmk="motif"] .rpgo'); await H.settle(page);
  const pop = page.locator('.rpop');
  await expect(pop).toBeVisible();
  await expect(pop.locator('#lib')).toHaveCount(1);
  await expect(pop.locator('#lq')).toBeVisible();
  const tile = pop.locator('#lib button[data-m][aria-label="Oval"]');
  if (!(await tile.count())) { await pop.locator('#lib .lfr[data-f="b:Basic shapes"]').click(); await H.settle(page); }
  await pop.locator('#lib button[data-m][aria-label="Oval"]').click(); await H.settle(page);
  const after = await st(page), q = after.els.find(x => x.u === u);
  expect(q.m).not.toBe(m0);
  expect(after.els.length).toBe(before.els.length);
  await expect(pop).toHaveCount(0);
  await expect(page.locator('section.pn[data-p="motifs"] details.g #lib')).toHaveCount(1);
  await expect(row(page).locator('.rpn')).toHaveText('Oval');
  // one step back brings the rectangle back
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await st(page)).els.find(x => x.u === u).m).toBe(m0);
  expect(errors).toEqual([]);
});

test('Esc or a click outside closes the Replace popover without changing the shape', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addShape(page, 'rect');
  const m0 = (await st(page)).els.slice(-1)[0].m;
  await page.click('.rprow[data-pmk="motif"] .rpgo'); await expect(page.locator('.rpop')).toBeVisible();
  await page.keyboard.press('Escape'); await H.settle(page);
  await expect(page.locator('.rpop')).toHaveCount(0);
  await expect(row(page)).toBeVisible();   // Esc closed the popover, the shape is still selected
  await page.click('.rprow[data-pmk="motif"] .rpgo'); await expect(page.locator('.rpop')).toBeVisible();
  await page.mouse.click(5, 300); await H.settle(page);
  await expect(page.locator('.rpop')).toHaveCount(0);
  expect((await st(page)).els.slice(-1)[0].m).toBe(m0);
  await expect(page.locator('section.pn[data-p="motifs"] details.g #lib')).toHaveCount(1);
  expect(errors).toEqual([]);
});

// 2.55.0: the other kinds
test('a placed stamp is edited without the Stamps list and the Library; Replace swaps it for another stamp of the project', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addStamp(page); await H.addStamp(page);
  await H.addKind(page, 'stamp');
  const bx = await page.locator('#art').boundingBox();
  await page.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2); await H.settle(page);   // select the placed stamp
  const s = await st(page), q = s.els.find(x => x.t != null && x.k !== 'pattern'), other = s.tiles.find(t => t.id !== q.t).id;
  const r = page.locator('section.pn[data-p="stmp"] .rprow[data-pmk="stamp"]');
  await expect(r).toBeVisible();
  await expect(page.locator('#stmpl')).toBeHidden();
  await expect(page.locator('#slpane')).toBeHidden();
  await r.locator('.rpgo').click();
  await expect(page.locator('.rpop #stmpl')).toBeVisible();
  await page.locator(`.rpop #stmpl .smkr[data-t="${other}"] .smkth`).click(); await H.settle(page);
  await expect(page.locator('.rpop')).toHaveCount(0);
  const q2 = (await st(page)).els.find(x => x.u === q.u);
  expect(q2.t).toBe(other);
  await expect(r).toBeVisible();   // still selected, still editing
  await page.keyboard.press('Control+z'); await H.settle(page);
  expect((await st(page)).els.find(x => x.u === q.u).t).toBe(q.t);
  expect(errors).toEqual([]);
});

test('a selected text is edited without the Text styles library; the Text style row opens it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  await H.placeArmed(page, 'text');
  const bx = await page.locator('#art').boundingBox();
  await page.mouse.click(bx.x + bx.width / 2, bx.y + bx.height / 2); await H.settle(page);   // select the placed text
  const r = page.locator('section.pn[data-p="text"] .rprow[data-pmk="text"]');
  await expect(r).toBeVisible();
  await expect(page.locator('#tsl')).toBeHidden();
  await r.locator('.rpgo').click();
  await expect(page.locator('.rpop #tsl')).toBeVisible();
  await page.keyboard.press('Escape'); await H.settle(page);
  await expect(page.locator('.rpop')).toHaveCount(0);
  await page.keyboard.press('Escape'); await H.settle(page);   // nothing selected: creating, the library shows
  await H.showPanel(page, 'text');
  await expect(page.locator('#tsl')).toBeVisible();
  expect(errors).toEqual([]);
});
