// 1.8: the Textures tool's Amount slider on a canvas texture (relief or stain) that nothing else uses.
//  - while it moves, the pattern is not rebuilt (a relief or stain picture is drawn over the pattern; the pattern does not depend on it) and the picture is
//    made once at full strength with Amount as its opacity;
//  - when it is let go, the exact picture is drawn (no leftover opacity), the document holds the new Amount, and the pattern is still not rebuilt;
//  - changing a texture the stamps or layers also use still rebuilds the pattern.
const { test, expect } = require('@playwright/test');
const { openApp, openProjectFile, openPanel, settle, getState } = require('./helpers/harness');
const { FIXTURES } = require('./helpers/speed');

// counts how many times the pattern (#dyn) is redrawn from now on
const watch = page => page.evaluate(() => { window.__dynBuilds = 0; new MutationObserver(m => { window.__dynBuilds += m.length; }).observe(document.getElementById('dyn'), { childList: true }); });
const drag = (page, id, values) => page.evaluate(async ([id, values]) => {
  const e = document.getElementById(id);
  for (const v of values) { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 220)); }
}, [id, values]);
const release = (page, id) => page.evaluate(id => document.getElementById(id).dispatchEvent(new Event('change', { bubbles: true })), id);

test('busy project: dragging Amount does not rebuild the pattern, and letting go draws the exact picture', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 21 });
  await openProjectFile(page, FIXTURES.busy);
  await openPanel(page, 'tex');
  await settle(page, { quiet: 25 });                                                      // let the stamp prints from opening the file finish
  await page.click('#tx_add'); await settle(page);                                        // a new texture that nothing else uses...
  await page.click('#tx_apply'); await settle(page, { quiet: 25 });                       // ...put on the Canvas (the default target); it is the selected one
  const sel = JSON.parse(await getState(page)).tex.u.map(u => u.x);
  await watch(page);
  await drag(page, 'tx_a', [30, 35, 40, 45, 50, 55, 60, 65, 70]);                            // nine steps; 1.7.0 rebuilt the pattern on every one
  const during = await page.evaluate(() => window.__dynBuilds);
  expect(during, 'the pattern is not rebuilt while the slider moves').toBe(0);
  await settle(page, { quiet: 6 });
  const mid = await page.evaluate(() => ({ builds: window.__dynBuilds, pv: document.getElementById('texg').dataset.pv || '', op: Array.from(document.querySelectorAll('#texg image[data-x]')).map(i => i.getAttribute('opacity')) }));
  expect(mid.builds, 'the pattern is still not rebuilt after a pause').toBe(0);
  expect(sel, 'the canvas uses the selected texture').toContain(mid.pv);
  expect(mid.op, 'Amount is an opacity on the full-strength picture').toEqual(['0.700']);
  await release(page, 'tx_a');
  await settle(page, { quiet: 6 });
  const end = await page.evaluate(() => ({ builds: window.__dynBuilds, pv: document.getElementById('texg').dataset.pv || '', marked: document.querySelectorAll('#texg image[data-x]').length, images: document.querySelectorAll('#texg image').length }));
  expect(end.builds, 'letting go does not rebuild the pattern either').toBe(0);
  expect(end.pv, 'the preview mark is gone').toBe('');
  expect(end.marked, 'no preview opacity is left on the exact picture').toBe(0);
  expect(end.images, 'the canvas texture pictures are still there').toBeGreaterThan(0);
  const lib = JSON.parse(await getState(page)).texLib.find(x => sel.includes(x.id) && x.a === 70);
  expect(lib, 'the document holds the new Amount').toBeTruthy();
  expect(errors).toEqual([]);
});

test('a texture that a stamp or layer also uses still rebuilds the pattern', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 21 });
  await openProjectFile(page, FIXTURES.diamond);
  await openPanel(page, 'tex');
  await settle(page);
  const st = JSON.parse(await getState(page));
  const used = new Set();
  st.tiles.forEach(t => (t.tu || []).forEach(u => used.add(u.x)));
  const other = st.texLib.find(x => used.has(x.id));
  expect(other, 'the diamond project has a texture used by a stamp').toBeTruthy();
  await page.click(`#tx_list .mr[data-x="${other.id}"]`);
  await settle(page);
  await watch(page);
  await drag(page, 'tx_a', [other.a > 50 ? 20 : 80]);
  await release(page, 'tx_a');
  await settle(page, { quiet: 6 });
  expect(await page.evaluate(() => window.__dynBuilds), 'the pattern is rebuilt').toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
