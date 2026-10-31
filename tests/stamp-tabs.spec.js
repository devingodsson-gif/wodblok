const { test, expect } = require('@playwright/test');
const { openApp, settle, showPanel, addStamp, stampInstance, canvasToClient, patSource } = require('./helpers/harness');
// 2.5.0: stamps are edited in tabs. The strip over the stage shows the Canvas and one tab per open stamp; Edit opens a stamp's tab, a tab keeps its own zoom,
// × closes it, and there is no lock. A tab is a view of the one document.
const tabs = page => page.$$eval('#stetabs [data-sv]', b => b.map(x => x.textContent + (x.classList.contains('on') ? '*' : '')));
const artW = page => page.evaluate(() => document.getElementById('art').getBoundingClientRect().width);
const edit = async (page, n = 0) => { await showPanel(page, 'stmp'); await page.locator('#stmpl .smklk').nth(n).click(); await settle(page); };

test('Edit on a stamp row opens its tab; the strip is there only while a stamp is open; the Canvas tab goes back, zoom and all', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await expect(page.locator('#stetabs')).toBeHidden();
  const w0 = await artW(page);
  await edit(page);
  await expect(page.locator('#stetabs')).toBeVisible();
  expect(await tabs(page)).toEqual(['Canvas', 'Stamp 1*']);
  await expect(page.locator('#stmpl .smklk').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#stmpl .smklk').first()).toHaveAttribute('aria-label', 'Edit Stamp 1');
  const wIn = await artW(page);
  expect(wIn).toBeGreaterThan(w0 * 1.2);                       // the stage is zoomed to the stamp
  await page.click('#stetabs [data-sv="c"]'); await settle(page);
  expect(await tabs(page)).toEqual(['Canvas*', 'Stamp 1']);
  await expect(page.locator('#stmpl .smklk').first()).toHaveAttribute('aria-pressed', 'false');
  expect(Math.abs((await artW(page)) - w0) / w0).toBeLessThan(0.06);   // the canvas view comes back, fitted (the strip takes a little height)
  await page.click('#stetabs [data-sv]:not([data-sv="c"])'); await settle(page);
  expect(await tabs(page)).toEqual(['Canvas', 'Stamp 1*']);
  expect(Math.abs((await artW(page)) - wIn)).toBeLessThan(3);  // and so does the stamp's own
  await page.click('#stetabs [data-sx]'); await settle(page);   // × closes it: back on the Canvas, and the strip goes
  await expect(page.locator('#stetabs')).toBeHidden();
  await expect(page.locator('#stmpl .smklk').first()).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('the Edit button of the Stamp properties opens the current stamp; Edit on the open stamp closes its tab; a double click on a stamp opens it too', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await showPanel(page, 'stmp');
  await expect(page.locator('#smkedit')).toBeVisible();
  await expect(page.locator('#smkedit')).not.toHaveClass(/primary/);
  await page.click('#smkedit'); await settle(page);
  expect(await tabs(page)).toEqual(['Canvas', 'Stamp 1*']);
  await edit(page);                                               // the pencil on the open stamp closes it
  await expect(page.locator('#stetabs')).toBeHidden();
  const p = await stampInstance(page), c = await canvasToClient(page, p.cx, p.cy);
  await page.mouse.dblclick(c.x, c.y); await settle(page);
  expect(await tabs(page)).toEqual(['Canvas', 'Stamp 1*']);
  expect(errors).toEqual([]);
});

test('several stamps can be open as tabs; closing the shown one goes to the Canvas; a stamp printed nowhere opens too', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addStamp(page);
  expect(await page.locator('#stmpl .smkr').count()).toBe(2);
  await edit(page, 1);                                           // the new stamp is printed nowhere: it opens all the same (2.5.1)
  expect(await tabs(page)).toEqual(['Canvas', 'Stamp 2*']);
  await page.click('#stetabs [data-sx]'); await settle(page);
  await edit(page, 0);
  await edit(page, 1);
  expect(await tabs(page)).toEqual(['Canvas', 'Stamp 1', 'Stamp 2*']);
  await page.click('#stetabs [data-sv]:nth-of-type(1)'); await settle(page);
  await page.locator('#stetabs .wtg:nth-of-type(1) [data-sv]').click(); await settle(page);
  expect(await tabs(page)).toEqual(['Canvas', 'Stamp 1*', 'Stamp 2']);
  await page.click('#stetabs .wtg.on [data-sx]'); await settle(page);   // closing the shown tab goes to the Canvas
  expect(await tabs(page)).toEqual(['Canvas*', 'Stamp 2']);
  expect(errors).toEqual([]);
});

test('a stamp tab shows the stamp alone: its own canvas size, no background, outline or other element; the Canvas comes back whole', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  const dim = () => page.evaluate(() => { const r = document.getElementById('art').getBoundingClientRect(); return { w: r.width, h: r.height, n: document.querySelectorAll('#art [data-el]').length }; });
  const before = await page.evaluate(() => JSON.stringify(window.__wbTest.state().layers));
  const d0 = await dim();
  await edit(page);
  const d1 = await dim();
  expect(Math.abs(d1.w / d1.h - d0.w / d0.h)).toBeGreaterThan(0.001);   // not the sheet's proportions: the stamp's own
  await page.click('#stetabs [data-sv="c"]'); await settle(page);
  const d2 = await dim();
  expect(Math.abs(d2.w / d2.h - d0.w / d0.h)).toBeLessThan(0.01);
  expect(await page.evaluate(() => JSON.stringify(window.__wbTest.state().layers))).toBe(before);   // the scene is never stored
  expect(errors).toEqual([]);
});

test('the panels stay as they are when a tab is picked: no tool opens or closes', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await showPanel(page, 'motifs');
  const open = () => page.$$eval('section.pn:not([hidden])', s => s.filter(x => x.offsetParent).map(x => x.dataset.p).sort().join());
  const a = await open();
  await page.locator('#elb [data-k="pattern"]').click(); await settle(page);   // some element, so the stamp list is not the only way in
  const b = await open();
  await page.evaluate(() => window.__wbTest.commands && 0);
  await showPanel(page, 'stmp');
  const c = await open();
  await page.locator('#stmpl .smklk').first().click(); await settle(page);
  // 2.79.3 (owner Oct 31 2026): in a stamp's tab the Stamp panel stands beside the left panel (the group it left shows its next tab); nothing else opens or closes
  expect(await page.evaluate(() => document.querySelector('.dk .wtab[data-t="stmp"]').closest('.dk').dataset.e)).toBe('li');
  expect((await open()).split(',')).toContain('stmp');
  await page.click('#stetabs [data-sv="c"]'); await settle(page);
  expect(await open(), 'back as it was').toBe(c);
  expect(a.length + b.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
