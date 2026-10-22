const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
// 2.24.0 "Nothing lost, nothing out of reach": every element can be found and reached, and nothing is thrown away without a word.
const st = async page => JSON.parse(await H.getState(page));

test('after Randomize, stamps placed on their own are in the Elements list and can be clicked', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 23, pattern: false });
  await page.click('#rzdo'); await H.settle(page, { max: 60000 });
  const s = await st(page);
  const free = s.els.filter(e => e.k === 'stamp');
  expect(free.length, 'seed 23 places stamps on their own').toBeGreaterThan(0);
  await page.click('.rail [data-pn="lyrs"]'); await H.settle(page);
  expect(await page.locator('#lyl2 [data-u].lyr').count(), 'one list row per element').toBe(s.els.length);
  const c = await H.canvasToClient(page, free[0].x, free[0].y);
  await page.mouse.click(c.x, c.y); await H.settle(page);
  expect(await page.locator('#fpov [data-fh]').count(), 'the clicked stamp shows its handles').toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('File > Open project with unsaved changes asks "Discard changes?" first; a second click opens', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await page.evaluate(() => { window.__opens = 0; window.showOpenFilePicker = () => { window.__opens++; return new Promise(() => {}); }; });   // count the Open dialogs
  const opens = () => page.evaluate(() => window.__opens);
  await H.addShape(page); await H.settle(page);                        // unsaved work
  await page.click('#fileb'); await page.click('#pop');
  await expect(page.locator('#pop')).toHaveText('Discard changes?');
  await expect(page.locator('#pop svg')).toHaveCount(1);                // the icon stays
  await expect(page.locator('#filem')).toBeVisible();
  await page.waitForTimeout(300); expect(await opens(), 'no Open dialog on the first click').toBe(0);
  await page.click('#pop'); await expect.poll(opens).toBe(1);
  expect(errors).toEqual([]);
});

test('File > Open project on a clean project opens at once', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await page.evaluate(() => { window.__opens = 0; window.showOpenFilePicker = () => { window.__opens++; return new Promise(() => {}); }; });
  await page.click('#fileb'); await page.click('#pop');
  await expect.poll(() => page.evaluate(() => window.__opens)).toBe(1);
  expect(errors).toEqual([]);
});

test('a drag keeps the centre on the sheet, so the element can be clicked and dragged back', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
  const W = await page.evaluate(() => document.getElementById('art').viewBox.baseVal.width);
  let e = (await st(page)).els.find(q => q.k === 'shape');
  const c = await H.canvasToClient(page, e.x, e.y), b = await page.locator('#art').boundingBox();
  await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(b.x + b.width + 200, c.y, { steps: 10 }); await page.mouse.up(); await H.settle(page);
  e = (await st(page)).els.find(q => q.k === 'shape');
  expect(e.x, 'centre stays on the sheet').toBeLessThanOrEqual(W);
  await page.keyboard.press('Escape'); await H.settle(page);
  const c2 = await H.canvasToClient(page, e.x - 2, e.y);
  await page.mouse.move(c2.x, c2.y); await page.mouse.down(); await page.mouse.move(c2.x - 150, c2.y, { steps: 8 }); await page.mouse.up(); await H.settle(page);
  expect((await st(page)).els.find(q => q.k === 'shape').x, 'dragged back').toBeLessThan(e.x - 20);
  expect(errors).toEqual([]);
});

test('a hidden element takes no clicks: clicking where it is selects nothing, Delete leaves it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
  const s = await st(page); const e = s.els.find(q => q.k === 'shape'); e.v = false;
  await page.evaluate(j => window.__wbTest.apply(j), JSON.stringify(s)); await H.settle(page);
  const c = await H.canvasToClient(page, e.x, e.y);
  await page.mouse.click(c.x, c.y); await H.settle(page);
  expect(await page.locator('#fpov [data-fh]').count(), 'no handles').toBe(0);
  await page.keyboard.press('Delete'); await H.settle(page);
  expect((await st(page)).els.filter(q => q.k === 'shape').length, 'still there').toBe(1);
  expect(errors).toEqual([]);
});

// a stamp element in the middle of the canvas, selected and copied
async function copyStamp(page) {
  const W = await page.evaluate(() => [document.getElementById('art').viewBox.baseVal.width, document.getElementById('art').viewBox.baseVal.height]);
  if (!(await st(page)).tiles.length) await H.addStamp(page);
  const s = await st(page);
  s.els.push({ u: 'tst1', k: 'stamp', t: s.tiles[0].id, x: W[0] / 2, y: W[1] / 2, s: Math.min(...W) / 3, r: 0, f: 1 });
  await page.evaluate(j => window.__wbTest.apply(j), JSON.stringify(s)); await H.settle(page);
  const c = await H.canvasToClient(page, W[0] / 2, W[1] / 2);
  await page.mouse.click(c.x, c.y); await H.settle(page);
  expect(await page.locator('#fpov [data-fh]').count(), 'stamp selected').toBeGreaterThan(0);
  await page.keyboard.press('Control+c');
  return s;
}

test('paste leaves out a copied stamp whose stamp the project no longer has', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  const s = await copyStamp(page);
  const gone = s.tiles[0].id;
  s.tiles = s.tiles.filter(t => t.id !== gone); s.els = s.els.filter(q => q.t !== gone);
  await page.evaluate(j => window.__wbTest.apply(j), JSON.stringify(s)); await H.settle(page);
  await page.keyboard.press('Control+v'); await H.settle(page);
  const a = await st(page);
  expect(a.els.filter(q => q.k === 'stamp' && !a.tiles.some(t => t.id === q.t)), 'no stamp element without its stamp').toEqual([]);
  expect(errors).toEqual([]);
});

test('New project empties the clipboard: nothing from the old project pastes into it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page);                        // selected after it is made
  await page.keyboard.press('Control+c');
  await page.click('#fileb'); await page.click('#pnw'); await page.click('#pnw'); await H.settle(page);
  const n0 = (await st(page)).els.length;
  await page.keyboard.press('Control+v'); await H.settle(page);
  expect((await st(page)).els.length).toBe(n0);
  expect(errors).toEqual([]);
});

test('deleting a stamp a pattern uses says so, and the pattern lets go of it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  const s = await st(page), id = s.tiles[0].id;
  expect(s.els.some(q => q.k === 'pattern' && (q.src || []).some(r => r.t === id)), 'the pattern prints the stamp').toBe(true);
  await page.evaluate(() => window.__wbTest.commands.run('stamp.delete'));
  await expect(page.locator('#pmsg')).toContainText('used by 1 pattern');
  await page.evaluate(() => window.__wbTest.commands.run('stamp.delete')); await H.settle(page);
  const a = await st(page);
  expect(a.tiles.some(t => t.id === id)).toBe(false);
  expect(a.els.filter(q => (q.src || []).some(r => r.k === 'stamp' && r.t === id)), 'no source left pointing at it').toEqual([]);
  expect(errors).toEqual([]);
});

test('Stamp panel: Save and export and Library come last, Save and export only with a stamp; the name follows the selected stamp; Save works after Undo and Redo', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await H.openPanel(page, 'stmp'); await H.settle(page);
  const save = page.locator('section.pn[data-p="stmp"] details.g:has(#slname)');
  await expect(save).toBeHidden();                                       // no stamp yet
  await H.addStamp(page); await H.addStamp(page);
  await expect(save).toBeVisible();
  const s = await st(page);
  s.els.push({ u: 'z2', k: 'stamp', t: s.tiles[1].id, x: 300, y: 300, s: 200, r: 0, f: 1 });
  await page.evaluate(j => window.__wbTest.apply(j), JSON.stringify(s)); await H.settle(page);
  const c = await H.canvasToClient(page, 300, 300); await page.mouse.click(c.x, c.y); await H.settle(page);
  await expect(page.locator('#slname')).toHaveAttribute('placeholder', 'Stamp 2');
  const last = await page.evaluate(() => [...document.querySelectorAll('section.pn[data-p="stmp"] details.g')].filter(d => !d.hidden).map(d => d.querySelector('summary').textContent.trim()).slice(-3));
  expect(last.slice(-2)).toEqual(['Save and export', 'Library']);
  await page.keyboard.press('Control+z'); await H.settle(page); await page.keyboard.press('Control+Shift+z'); await H.settle(page);
  await H.openPanel(page, 'stmp'); await H.settle(page);
  await page.click('#slsave'); await expect(page.locator('#pmsg')).toContainText('Saved');
  expect(errors).toEqual([]);
});
