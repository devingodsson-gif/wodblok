// Dropping a picture into the Stamp editor makes a shape from it at once; in the Pattern view it still opens the import window.
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, setMode, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const count = async page => JSON.parse(await getState(page)).tiles.reduce((n, t) => n + t.items.length, 0);
const drop = page => page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 160; c.height = 160;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 160, 160); x.fillStyle = '#000'; x.beginPath(); x.arc(80, 80, 55, 0, 7); x.fill();
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const dt = new DataTransfer(); dt.items.add(new File([blob], 'speckle texture.png', { type: 'image/png' }));
  document.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
});

test('a picture dropped in the Stamp editor becomes a shape on the stamp, with no window', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  const n0 = await count(page);
  await drop(page);
  await expect.poll(() => count(page), { timeout: 15000 }).toBe(n0 + 1);
  await settle(page);
  await expect(page.locator('#idlg')).toBeHidden();
  expect(errors).toEqual([]);
});

test('in the Pattern view a dropped picture still opens the import window', async ({ page }) => {
  const { errors } = await openApp(page);
  await drop(page);
  await expect(page.locator('#idlg')).toBeVisible();
  expect(errors).toEqual([]);
});
