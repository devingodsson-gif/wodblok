// 2.16.0: bugs found in a new-user walk-through of 2.15.0.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, addShape } = require('./helpers/harness');

const st = async page => JSON.parse(await getState(page));

test('Add shape in the import window works in a project with no stamp: the shape goes to the library only', async ({ page }) => {
  const { errors } = await openApp(page, { pattern: false });
  await openPanel(page, 'motifs');
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 200; c.height = 200; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 200, 200); x.fillStyle = '#000'; x.beginPath(); x.arc(100, 100, 60, 0, 7); x.fill();
    return c.toDataURL('image/png').split(',')[1];
  });
  expect((await st(page)).tiles.length).toBe(0);
  await page.setInputFiles('#ifile', { name: 'dot.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') });
  await expect(page.locator('#idlg')).toBeVisible();
  await page.click('#iadd'); await settle(page);
  await expect(page.locator('#idlg')).toBeHidden();
  await expect(page.locator('#lib button[data-m]')).toHaveCount(1);
  expect((await st(page)).tiles.length).toBe(0);
  expect(errors).toEqual([]);
});

test('the Elements row menu button and the Pattern source remove button show their icons', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page); await openPanel(page, 'lyrs'); await settle(page);
  await expect(page.locator('#lyl2 .lyr [data-more] svg > *').first()).toBeAttached();
  await openPanel(page, 'layers'); await settle(page);
  await expect(page.locator('#pesrc .psr2 svg:not(.pth svg) > *').first()).toBeAttached();
  expect(errors).toEqual([]);
});

test('Ctrl+D duplicates the selected element on the canvas', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page); await settle(page);
  const n = (await st(page)).els.length;
  await page.keyboard.press('Control+d'); await settle(page);
  expect((await st(page)).els.length).toBe(n + 1);
  expect(errors).toEqual([]);
});

test('a segmented control marked with aria-pressed shows its selected button (Motif fill)', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page); await settle(page);
  const bg = f => page.locator(`#mf_fk [data-f="${f}"]`).evaluate(e => getComputedStyle(e).backgroundColor);
  expect(await bg('solid')).not.toBe(await bg('none'));
  expect(errors).toEqual([]);
});

test('command search has no Open Paint (Paint has no button)', async ({ page }) => {
  const { errors } = await openApp(page);
  const ids = await page.evaluate(() => window.__wbTest.commands.list().map(c => c.id));
  expect(ids.length).toBeGreaterThan(10);
  expect(ids).not.toContain('panel.elpaint');
  expect(errors).toEqual([]);
});
