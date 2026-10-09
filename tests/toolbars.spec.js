// Customizable toolbars (v105): the top bar and the left tool rail can be reordered, items removed and brought back, and the layout is kept.
// The default bars must look and behave exactly as before until the user changes them.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp: openPlain, settle } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build; v100 has no customizable toolbars'); });

// Edit mode wiggles the items; with reduced motion on (as for anyone who asks for it) they hold still, so clicks can be aimed.
const openApp = async page => { await page.emulateMedia({ reducedMotion: 'reduce' }); return openPlain(page); };

const DEFAULT_RAIL = ['canvas', 'colors', 'stamp', 'slib', 'motifs', 'text', 'grid', 'preview', 'mlist', 'lyrs', 'layers', 'pgrid', 'grade', 'tex', 'rand', 'hist'];
const PATTERN_RAIL = ['canvas', 'colors', 'slib', 'lyrs', 'layers', 'pgrid', 'grade', 'tex', 'rand', 'hist'];
const railOrder = page => page.evaluate(() => [...document.querySelectorAll('.rail [data-pn]')].map(b => b.dataset.pn));
const railShown = page => page.evaluate(() => [...document.querySelectorAll('.rail [data-pn]')].filter(b => b.getClientRects().length).map(b => b.dataset.pn));
const topShown = page => page.evaluate(() => [...document.querySelectorAll('.top .tb button')].filter(b => b.getClientRects().length).map(b => b.id));
const saved = page => page.evaluate(() => JSON.parse(window.__wbTest.kv.get('wb105_tbar') || 'null'));
const edit = page => page.evaluate(() => window.__wbTest.commands.run('view.customizeToolbars'));
const done = async page => { await page.click('#tzdn'); await expect(page.locator('body')).not.toHaveClass(/tzedit/); };
async function reload(page) {
  await page.reload();
  await page.waitForFunction(() => !!window.__wbTest && document.fonts.status === 'loaded');
  await settle(page);
}

test('the bars start exactly as they were, and edit mode is off', async ({ page }) => {
  const { errors } = await openApp(page);
  expect(await railOrder(page)).toEqual(DEFAULT_RAIL);
  expect(await railShown(page)).toEqual(PATTERN_RAIL);
  expect(await topShown(page)).toEqual(['undo', 'redo']);
  await expect(page.locator('body')).not.toHaveClass(/tzedit/);
  await expect(page.locator('#tzbar')).toBeHidden();
  expect(await page.locator('.tzb').count()).toBe(0);
  expect(await saved(page)).toBeNull();                       // nothing is written until the user changes something
  expect(errors).toEqual([]);
});

test('edit mode opens from the command, the File menu and a right-click, and Esc or Done leaves it', async ({ page }) => {
  const { errors } = await openApp(page);
  expect(await edit(page)).toBe(true);
  await expect(page.locator('body')).toHaveClass(/tzedit/);
  await expect(page.locator('#tzbar')).toBeVisible();
  expect(await page.locator('.tzb').count()).toBe(DEFAULT_RAIL.length + 13);   // every rail item and every top-bar item has a dot
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/tzedit/);
  expect(await page.locator('.tzb').count()).toBe(0);
  await page.click('#fileb'); await page.click('#tzopen');
  await expect(page.locator('body')).toHaveClass(/tzedit/);
  await done(page);
  await page.click('.rail [data-pn="canvas"]', { button: 'right' });
  await expect(page.locator('body')).toHaveClass(/tzedit/);
  await done(page);
  await page.dispatchEvent('.top .tb', 'contextmenu');       // (Undo itself is disabled at launch, and browsers send no mouse events to a disabled button)
  await expect(page.locator('body')).toHaveClass(/tzedit/);
  await done(page);
  expect(errors).toEqual([]);
});

test('while editing, the buttons do not act', async ({ page }) => {
  const { errors } = await openApp(page);
  await edit(page);
  await page.locator('.rail [data-pn="colors"]').click();
  expect(await page.locator('.rail button.on').count()).toBe(0);
  expect(await page.locator('.wg').count()).toBe(0);
  await done(page);
  await page.locator('.rail [data-pn="colors"]').click();
  await expect(page.locator('.rail [data-pn="colors"]')).toHaveClass(/\bon\b/);   // and they work again afterwards
  expect(errors).toEqual([]);
});

test('an item can be removed with its dot, is kept after a reload, and comes back with a click', async ({ page }) => {
  const { errors } = await openApp(page);
  await edit(page);
  await page.locator('.rail [data-pn="hist"] .tzb').click();
  await expect(page.locator('.rail [data-pn="hist"]')).toHaveClass(/tzoff/);
  expect(await railShown(page)).toContain('hist');            // still visible, dimmed, while editing
  await done(page);
  expect(await railShown(page)).toEqual(PATTERN_RAIL.filter(p => p !== 'hist'));
  expect(await railOrder(page)).toEqual(DEFAULT_RAIL);        // removed means hidden, never deleted from the page
  expect((await saved(page)).rail.off).toEqual(['hist']);
  await reload(page);
  expect(await railShown(page)).toEqual(PATTERN_RAIL.filter(p => p !== 'hist'));
  await edit(page);
  await page.locator('.rail [data-pn="hist"]').click();       // a click on a dimmed item brings it back
  await done(page);
  expect(await railShown(page)).toEqual(PATTERN_RAIL);
  expect((await saved(page)).rail.off).toEqual([]);
  expect(errors).toEqual([]);
});

test('dragging reorders the rail, and the order survives a reload', async ({ page }) => {
  const { errors } = await openApp(page);
  await edit(page);
  const a = await page.locator('.rail [data-pn="colors"]').boundingBox(), b = await page.locator('.rail [data-pn="canvas"]').boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2, a.y + 4, { steps: 4 });
  await page.mouse.move(b.x + b.width / 2, b.y + 3, { steps: 6 });
  await expect(page.locator('.tzghost')).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator('.tzghost')).toHaveCount(0);
  expect((await railOrder(page)).slice(0, 3)).toEqual(['colors', 'canvas', 'stamp']);
  expect(await page.locator('.tzoff').count()).toBe(11);   // the drop did not toggle anything: only the 11 extra top-bar items are dimmed
  await done(page);
  expect((await saved(page)).rail.order.slice(0, 3)).toEqual(['colors', 'canvas', 'stamp']);
  await reload(page);
  expect((await railOrder(page)).slice(0, 3)).toEqual(['colors', 'canvas', 'stamp']);
  expect(await railShown(page)).toEqual(['colors', 'canvas', 'slib', 'lyrs', 'layers', 'pgrid', 'grade', 'tex', 'rand', 'hist']);
  expect(errors).toEqual([]);
});

test('the top bar can take more commands, and they behave like the buttons they stand for', async ({ page }) => {
  const { errors } = await openApp(page);
  await edit(page);
  await page.locator('#tz_view_zoomIn .tzb').click();
  await page.locator('#tz_file_clear').click();               // clicking the dimmed item itself also adds it
  await done(page);
  expect(await topShown(page)).toEqual(['undo', 'redo', 'tz_view_zoomIn', 'tz_file_clear']);
  await page.evaluate(() => { window.__zi = 0; document.getElementById('zi').addEventListener('click', () => { window.__zi++; }); });
  await page.click('#tz_view_zoomIn');
  expect(await page.evaluate(() => window.__zi)).toBe(1);
  // each added button is enabled exactly when its command is
  const mism = await page.evaluate(() => window.__wbTest.commands.list().filter(c => document.getElementById('tz_' + c.id.replace(/\./g, '_'))).filter(c => document.getElementById('tz_' + c.id.replace(/\./g, '_')).disabled === window.__wbTest.commands.isEnabled(c.id)).map(c => c.id));
  expect(mism).toEqual([]);
  await reload(page);
  expect(await topShown(page)).toEqual(['undo', 'redo', 'tz_view_zoomIn', 'tz_file_clear']);
  expect(errors).toEqual([]);
});

test('the keyboard can move and remove items, and Reset restores today\'s bars', async ({ page }) => {
  const { errors } = await openApp(page);
  await edit(page);
  await page.focus('.rail [data-pn="canvas"]');
  await page.keyboard.press('Alt+ArrowDown');
  expect((await railShown(page)).slice(0, 2)).toEqual(['colors', 'canvas']);
  await page.keyboard.press('Delete');
  await expect(page.locator('.rail [data-pn="canvas"]')).toHaveClass(/tzoff/);
  expect(await page.locator('.rail button.on').count()).toBe(0);   // and Delete did not reach the app's own key handler
  await page.click('#tzrs');
  expect(await railOrder(page)).toEqual(DEFAULT_RAIL);
  expect(await page.locator('.rail .tzoff').count()).toBe(0);
  await done(page);
  expect(await railShown(page)).toEqual(PATTERN_RAIL);
  expect(await topShown(page)).toEqual(['undo', 'redo']);
  expect(errors).toEqual([]);
});

test('the layout travels with Export everything, and a damaged setting falls back to the defaults', async ({ page }) => {
  const { errors } = await openApp(page);
  await edit(page);
  await page.locator('.rail [data-pn="rand"] .tzb').click();
  await done(page);
  await page.evaluate(() => window.__wbTest.commands.run('file.exportEverything'));
  await settle(page);
  const out = (await page.evaluate(() => window.__wbDownloads)).find(d => /\.wodblok-all\.json$/.test(d.filename));
  expect(JSON.parse(JSON.parse(out.data).kv.wb105_tbar).rail.off).toEqual(['rand']);
  const rev = [...DEFAULT_RAIL].reverse();
  await page.evaluate(order => window.__wbTest.kv.set('wb105_tbar', JSON.stringify({ v: 1, rail: { order: [...order, 'nope', order[0]], off: [5, order[0], 'nope'] }, top: 'x' })), rev);
  await reload(page);
  expect(await railOrder(page)).toEqual(rev);                 // what made sense is kept; the unknown and doubled ids are dropped
  expect(await page.evaluate(() => [...document.querySelectorAll('.rail .tzoff')].map(b => b.dataset.pn))).toEqual([rev[0]]);
  expect(await topShown(page)).toEqual(['undo', 'redo']);     // a nonsense section falls back to its defaults
  await page.evaluate(() => window.__wbTest.kv.set('wb105_tbar', 'not json'));
  await reload(page);
  expect(await railOrder(page)).toEqual(DEFAULT_RAIL);
  expect(errors).toEqual([]);
});
