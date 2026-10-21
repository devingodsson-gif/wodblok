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
  await expect(page.locator('#smkedit')).toHaveClass(/primary/);
  await page.click('#smkedit'); await settle(page);
  expect(await tabs(page)).toEqual(['Canvas', 'Stamp 1*']);
  await edit(page);                                               // the pencil on the open stamp closes it
  await expect(page.locator('#stetabs')).toBeHidden();
  const p = await stampInstance(page), c = await canvasToClient(page, p.cx, p.cy);
  await page.mouse.dblclick(c.x, c.y); await settle(page);
  expect(await tabs(page)).toEqual(['Canvas', 'Stamp 1*']);
  expect(errors).toEqual([]);
});

test('several stamps can be open as tabs; closing the shown one goes to the Canvas; a stamp that is not on the layer opens no tab', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await addStamp(page);
  expect(await page.locator('#stmpl .smkr').count()).toBe(2);
  await edit(page, 1);                                           // the new stamp is on no layer yet
  expect(await tabs(page)).toEqual([]);
  await expect(page.locator('#pmsg')).toContainText('not on this layer');
  // put it in the pattern (a stamp is edited where it is printed), then both can be open
  await page.click('#elb [data-k="pattern"]'); await settle(page);
  await patSource(page, 'stamp', 1);
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
