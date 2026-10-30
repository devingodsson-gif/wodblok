// 2.76.11 (owner Oct 29 2026, docs/pattern-plan.md step 9, from the 2.76 review): for experienced users. Order, lock, hide, rename, group and select all in the
// right-click and Edit menus (and Ctrl+[ ]); command search finds every action, also by its words; Ctrl+wheel zooms in clear steps; Image and Sheet in the Window
// menu, a fuller Image menu; History names the step; Point crop on a shape's picture; Randomize puts your title in the Look's title place.
const { test, expect } = require('@playwright/test');
const path = require('path');
const H = require('./helpers/harness');
const IMG = path.join(__dirname, 'fixtures', 'picture.png');

const st = async page => JSON.parse(await H.getState(page));
const menuOf = async (page, bar) => { await page.click('#' + bar); const ids = await page.locator('.pop.mnbm:visible [data-cmd]').evaluateAll(a => a.map(b => b.dataset.cmd)); await page.keyboard.press('Escape'); return ids };
const order = async page => (await st(page)).els.filter(q => !q.bgd).map(q => q.u);

test('the right-click menu orders, groups, locks, hides, renames and selects all; Ctrl+] and Ctrl+[ move one step', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false, background: true });
  const a = await H.addShape(page, 'rect'), b = await H.addShape(page, 'ellipse'); await H.settle(page);
  expect(await order(page)).toEqual([a, b]);
  // b is selected: send it backward with the keys, then forward again
  await page.keyboard.press('Control+BracketLeft'); await H.settle(page);
  expect(await order(page)).toEqual([b, a]);
  await page.keyboard.press('Control+BracketRight'); await H.settle(page);
  expect(await order(page)).toEqual([a, b]);
  const q = (await st(page)).els.find(x => x.u === b), box = await page.locator('#art').boundingBox(), vb = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height] });
  const at = [box.x + q.x / vb[0] * box.width, box.y + q.y / vb[1] * box.height];
  await page.mouse.click(at[0], at[1], { button: 'right' });
  const rows = await page.locator('#ctxm button[data-a]').evaluateAll(x => x.map(b => b.dataset.a));
  for (const r of ['fwd', 'bwd', 'grp', 'lock', 'hide', 'ren', 'all']) expect(rows, r).toContain(r);
  await page.click('#ctxm button[data-a="lock"]'); await H.settle(page);
  expect((await st(page)).els.find(x => x.u === b).lk).toBe(1);
  await page.evaluate(() => window.__wbTest.commands.run('element.unlock')); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('element.hide')); await H.settle(page);
  expect((await st(page)).els.find(x => x.u === b).v).toBe(false);
  await page.evaluate(() => window.__wbTest.commands.run('element.show')); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('edit.selectAll')); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('element.group')); await H.settle(page);
  expect((await st(page)).els.some(x => x.k === 'group')).toBe(true);
  expect(errors).toEqual([]);
});

test('the Edit, Image and Window menus', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  const edit = await menuOf(page, 'mnb-edit');
  for (const id of ['edit.selectAll', 'edit.deselect', 'element.lock', 'element.hide', 'element.rename']) expect(edit, id).toContain(id);
  const img = await menuOf(page, 'mnb-image');
  expect(img.length).toBeGreaterThan(4);
  const win = await menuOf(page, 'mnb-window');
  expect(win).toContain('panel.image'); expect(win).toContain('panel.sheet');
  expect(errors).toEqual([]);
});

test('command search finds every action, also by its words', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  const find = async q => { await page.keyboard.press('Control+k'); await page.locator('#cmdki').fill(q); const r = await page.locator('#cmdkl .ckr b').allTextContents(); await page.keyboard.press('Escape'); return r };
  for (const [q, want] of [['rotate', /Rotate 90/], ['flip', /Flip/], ['canvas size', /Canvas/], ['hide', /Hide/], ['lock', /Lock/], ['bring', /Bring/], ['font', /Text/], ['select', /Select all/]]) {
    const r = await find(q);
    expect(r.some(l => want.test(l)), q + ' -> ' + r.slice(0, 5).join(' | ')).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('Ctrl+wheel zooms one clear step a notch', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await page.evaluate(() => window.__wbTest.commands.run('view.actualSize')); await H.settle(page);
  const z = () => page.locator('#zl').textContent();
  expect(await z()).toBe('100%');
  const b = await page.locator('#boardP').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.keyboard.down('Control'); await page.mouse.wheel(0, -100); await page.keyboard.up('Control'); await H.settle(page);
  expect(await z()).toBe('150%');
  await page.waitForTimeout(450);
  await page.keyboard.down('Control'); await page.mouse.wheel(0, 100); await page.keyboard.up('Control'); await H.settle(page);
  expect(await z()).toBe('100%');
  expect(errors).toEqual([]);
});

test('History names the step: Moved Rectangle, an effect on Rectangle', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await H.addShape(page, 'rect'); await H.settle(page);
  await H.openPanel(page, 'hist');
  const s = await st(page), m = s.els.find(q => q.k === 'motif'); m.x += 30;
  await page.evaluate(x => window.__wbTest.apply(x), JSON.stringify(s)); await H.settle(page);
  await page.evaluate(() => window.__wbTest.commands.run('element.rotateCw')); await H.settle(page);
  { const s2 = await st(page); s2.els.find(q => q.k === 'motif').fx = [{ u: 'fxb1', k: 'blur', on: true }]; await page.evaluate(x => window.__wbTest.apply(x), JSON.stringify(s2)); await H.settle(page); }
  await page.waitForTimeout(600);
  const rows = await page.locator('#hhl .hr b').allTextContents();
  expect(rows.some(r => /Moved Rectangle/.test(r)), rows.join(' | ')).toBe(true);
  expect(rows.some(r => /Rotated Rectangle/.test(r)), rows.join(' | ')).toBe(true);
  expect(rows.some(r => / on Rectangle$/.test(r)), rows.join(' | ')).toBe(true);   // the effect, by its name
  expect(errors).toEqual([]);
});

test('Point crop works on a shape filled with a picture', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await page.click('#elb [data-k="image"]'); await H.settle(page);
  await page.setInputFiles('section.pn[data-p="image"] .pcfile', IMG); await H.settle(page, { max: 30000 });
  const a = (await st(page)).els.find(q => q.k === 'image').a;
  await H.addShape(page, 'rect'); await H.settle(page);
  const s = await st(page), m = s.els.find(q => q.k === 'motif'); Object.assign(m, { fl: 'img', a });
  s.els = s.els.filter(q => q.k !== 'image');
  await page.evaluate(x => window.__wbTest.apply(x), JSON.stringify(s)); await H.settle(page);
  await expect(page.locator('#mf_pcrop')).toBeVisible();
  await page.click('#mf_pcrop');
  await expect(page.locator('#pmsg')).toContainText('click the picture to add points');
  const b = await page.locator('#art').boundingBox(), vb = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.width, v.height] }), q = (await st(page)).els.find(x => x.k === 'motif'), half = q.s / 2 * .6;
  for (const [dx, dy] of [[-half, -half], [half, -half], [0, half]]) await page.mouse.click(b.x + (q.x + dx) / vb[0] * b.width, b.y + (q.y + dy) / vb[1] * b.height);
  await page.keyboard.press('Enter'); await H.settle(page);
  const pc = (await st(page)).els.find(x => x.k === 'motif').pc;
  expect(Array.isArray(pc) && pc.length).toBe(3);
  expect(await page.evaluate(() => [...document.querySelectorAll('#art clipPath[id$="pc"] path')].length)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Randomize puts your title in the Look\'s title place, in its size and colour', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 3, pattern: false });
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  const b = await page.locator('#art').boundingBox(); await page.mouse.click(b.x + b.width * .15, b.y + b.height * .9); await H.settle(page);
  await page.keyboard.press('Escape'); await H.settle(page);
  const mine0 = (await st(page)).els.find(q => q.tx);
  expect(mine0).toBeTruthy();
  await page.evaluate(() => window.__wbTest.kv.set('wb167_rzlook', 'poster'));
  await page.click('#rzdo'); await page.waitForTimeout(300); await H.settle(page, { max: 60000 });
  const s = await st(page), mine = s.els.find(q => q.u === mine0.u);
  expect(mine, 'your text is kept').toBeTruthy();
  expect(Math.hypot(mine.x - mine0.x, mine.y - mine0.y)).toBeGreaterThan(20);   // moved to the Look's title place
  expect(mine.s).toBeGreaterThan(mine0.s);
  expect(errors).toEqual([]);
});
