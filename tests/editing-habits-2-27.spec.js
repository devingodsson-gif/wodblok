const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// 2.27.0 "Photoshop editing habits": the keys and mouse moves that people bring from Photoshop work here.
const st = async page => JSON.parse(await H.getState(page));
const els = async (page, k) => (await st(page)).els.filter(q => q.k === k);

test('Ctrl+G groups the selected elements and Ctrl+Shift+G ungroups; Shift+G alone does nothing', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await page.keyboard.press('Escape');
  await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
  await H.showPanel(page, 'lyrs'); await page.locator('#lyl2 .lyr').nth(0).locator('.lyn').click();
  await H.settle(page); await H.showPanel(page, 'lyrs'); await page.locator('#lyl2 .lyr').nth(1).locator('.lyn').click({ modifiers: ['Control'] });
  await page.keyboard.press('Shift+G'); await H.settle(page);
  expect((await els(page, 'group')).length, 'Shift+G is not Group any more').toBe(0);
  await page.keyboard.press('Control+g'); await H.settle(page);
  expect((await els(page, 'group')).length, 'Ctrl+G groups').toBe(1);
  await page.keyboard.press('Control+Shift+G'); await H.settle(page);
  expect((await els(page, 'group')).length, 'Ctrl+Shift+G ungroups').toBe(0);
  expect((await st(page)).els.every(q => !q.g)).toBe(true);
  const c = await page.evaluate(() => window.__wbTest.commands.get('element.group').shortcut);
  expect(c).toBe('Mod+G');
  expect(errors).toEqual([]);
});

test('the Text panel field empties when the selection leaves a text, and a new text starts as "Text", not the old words', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await page.click('#elb [data-k="text"]'); await H.settle(page);             // arms text; a click on the canvas places it and the typing starts there
  const b0 = await page.locator('#art').boundingBox();
  await page.mouse.move(b0.x + b0.width * 0.4, b0.y + b0.height * 0.4);
  await page.waitForFunction(() => document.querySelector('#fpov .gh'), null, { timeout: 5000 });
  await page.mouse.click(b0.x + b0.width * 0.4, b0.y + b0.height * 0.4); await H.settle(page);
  await page.keyboard.type('Hello'); await H.settle(page);
  await page.keyboard.press('Escape'); await H.settle(page);
  const t = (await els(page, 'text'))[0], tc = await H.canvasToClient(page, t.x, t.y);
  await page.mouse.click(tc.x, tc.y); await H.settle(page);               // select it again: its words are in the field
  expect(await page.inputValue('#tx_t')).toBe('Hello');
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width * 0.92, b.y + b.height * 0.95); await H.settle(page);   // empty canvas: nothing selected
  expect(await page.inputValue('#tx_t'), 'nothing selected, nothing in the field').toBe('');
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  expect(await page.inputValue('#tx_t'), 'a new text starts fresh').toBe('Text');
  expect(errors).toEqual([]);
});

test('Esc during a drag puts the element back: no move, no history step; same for a handle drag', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page); await page.waitForTimeout(700);
  const e0 = (await els(page, 'motif'))[0], h0 = await page.evaluate(() => window.__wbTest.histLabels().length);
  const c = await H.canvasToClient(page, e0.x, e0.y);
  await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + 60, c.y + 40, { steps: 6 });
  await page.keyboard.press('Escape'); await page.mouse.up(); await H.settle(page);
  const e1 = (await els(page, 'motif'))[0];
  expect([e1.x, e1.y], 'back where it was').toEqual([e0.x, e0.y]);
  const hd = page.locator('#fpov [data-fh="se"]'); await expect(hd).toHaveCount(1);
  const hb = await hd.boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down(); await page.mouse.move(hb.x + 80, hb.y + 80, { steps: 6 });
  await page.keyboard.press('Escape'); await page.mouse.up(); await H.settle(page);
  const e2 = (await els(page, 'motif'))[0];
  expect([e2.s, e2.wx, e2.wy, e2.x, e2.y], 'size unchanged').toEqual([e0.s, e0.wx, e0.wy, e0.x, e0.y]);
  const hl = await page.evaluate(() => window.__wbTest.histLabels()); expect(hl.length, 'no history step: ' + hl.join(', ')).toBe(h0);
  expect(errors).toEqual([]);
});

test('a squeezed shape drops its side handles so the handles never pile up', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page);
  expect(await page.locator('#fpov [data-fh]').count(), 'normal shape: 8 handles + rotate').toBe(9);
  const hd = page.locator('#fpov [data-fh="e"]'); const hb = await hd.boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down();
  // 2.56.0: pulled past the other side a shape turns over, so squeeze it onto the other side's handle
  const wb = await page.locator('#fpov [data-fh="w"]').boundingBox();
  await page.mouse.move(wb.x + wb.width / 2 + 1, hb.y + hb.height / 2, { steps: 12 }); await page.mouse.up(); await H.settle(page);
  expect(await page.locator('#fpov [data-fh="n"]').count(), 'squeezed: no top/bottom middle handle').toBe(0);
  expect(await page.locator('#fpov [data-fh="se"]').count(), 'corners stay').toBe(1);
  expect(errors).toEqual([]);
});

test('dragging a box on empty canvas selects what it touches, and a click on empty canvas clears it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await page.keyboard.press('Escape');
  await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * 0.01, b.y + b.height * 0.01); await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.99, b.y + b.height * 0.99, { steps: 8 });
  await expect(page.locator('#fpov .fpmq')).toHaveCount(1);
  await page.mouse.up(); await H.settle(page);
  await expect(page.locator('#fpov .fpmq')).toHaveCount(0);
  const n = await page.evaluate(() => window.__wbTest.fpSelCount ? window.__wbTest.fpSelCount() : document.querySelectorAll('#fpov .sel').length);
  expect(n, 'both shapes are selected').toBeGreaterThanOrEqual(2);
  await page.mouse.click(b.x + b.width * 0.01, b.y + b.height * 0.99); await H.settle(page);
  expect(await page.locator('#fpov .sel').count(), 'a click on empty canvas clears it').toBe(0);
  await page.mouse.move(b.x + b.width * 0.01, b.y + b.height * 0.01); await page.mouse.down();
  await page.mouse.move(b.x + b.width * 0.2, b.y + b.height * 0.2, { steps: 4 }); await page.mouse.up(); await H.settle(page);
  expect(await page.locator('#fpov .sel').count(), 'a box over nothing selects nothing').toBe(0);
  expect(errors).toEqual([]);
});

test('history steps are named by what was done, and typing in a text is one step', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page); await page.waitForTimeout(700);
  const e0 = (await els(page, 'motif'))[0], c = await H.canvasToClient(page, e0.x, e0.y);
  await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(c.x + 50, c.y + 30, { steps: 5 }); await page.mouse.up(); await H.settle(page); await page.waitForTimeout(700);
  const L = async () => page.evaluate(() => window.__wbTest.histLabels());
  expect((await L()).slice(-1)[0], 'a move is named').toBe('Moved shape');
  await page.keyboard.press('Escape');
  await page.click('#elb [data-k="text"]'); await H.settle(page);
  const b0 = await page.locator('#art').boundingBox();
  await page.mouse.move(b0.x + b0.width * 0.2, b0.y + b0.height * 0.2);
  await page.waitForFunction(() => document.querySelector('#fpov .gh'), null, { timeout: 5000 });
  await page.mouse.click(b0.x + b0.width * 0.2, b0.y + b0.height * 0.2); await H.settle(page); await page.waitForTimeout(700);
  const n0 = (await L()).length;
  for (const w of ['Hel', 'lo ', 'wor', 'ld']) { await page.keyboard.type(w); await H.settle(page); await page.waitForTimeout(700); }
  const after = (await L()).slice(n0);
  expect(after.filter(x => x === 'Edited text').length, 'one step for the whole typing: ' + after.join(', ')).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('a drag ends when the button is let go anywhere: if the release is missed, the next move without a button stops it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page);
  const shp = async () => (await st(page)).els.filter(q => q.k === 'motif' && !q.bgd)[0];
  const hb = await page.locator('#fpov [data-fh="e"]').boundingBox(), ab = await page.locator('#art').boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down();
  await page.mouse.move(ab.x + ab.width + 30, hb.y, { steps: 6 });
  const w1 = (await shp()).s;
  // the release never reached the page (outside the window, say); the next move arrives with no button down
  await page.evaluate(({ x, y }) => window.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, buttons: 0, bubbles: true })), { x: ab.x + ab.width * 0.5, y: hb.y });
  await page.mouse.move(ab.x + ab.width * 0.3, hb.y, { steps: 6 });
  expect((await shp()).s, 'it no longer follows the mouse').toBe(w1);
  await page.mouse.up(); await H.settle(page);
  expect(errors).toEqual([]);
});

test('a stamp tab shows a canvas in the stamp\'s own shape, and the Symmetry buttons are squares', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.showPanel(page, 'stmp'); await page.click('#smknew'); await H.settle(page); await page.click('#smkedit'); await H.settle(page); await H.showPanel(page, 'stmp'); await H.settle(page);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#artsh')).display), 'a rectangle stamp: the plain canvas').toBe('none');
  await page.click('#skind [data-k="circle"]'); await H.settle(page);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#artsh')).display), 'a circle stamp: the canvas is a circle').toBe('block');
  expect(await page.locator('#cvdefs clipPath#cvclip path').getAttribute('d')).toMatch(/A/);
  await page.evaluate(() => document.querySelector('#sym').scrollIntoView({ block: 'center' }));
  const sizes = await page.evaluate(() => [...document.querySelectorAll('#sym button')].map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  expect(sizes.length).toBeGreaterThan(5);
  sizes.forEach(([w, h]) => { expect(Math.abs(w - h), 'square: ' + w + 'x' + h).toBeLessThanOrEqual(1); });
  expect(errors).toEqual([]);
});
