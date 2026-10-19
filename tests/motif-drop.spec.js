// Dropping a picture on the Pattern view opens the import window. (Dropping into the Stamp editor made a shape at once; that editor is gone. Copy and paste of shapes is tested in stamp-editor-port.spec.js.)
const { test, expect } = require('@playwright/test');
const { openApp, settle, getState, unlockStamp } = require('./helpers/harness');

const count = async page => JSON.parse(await getState(page)).tiles.reduce((n, t) => n + t.items.length, 0);
const drop = page => page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 160; c.height = 160;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 160, 160); x.fillStyle = '#000'; x.beginPath(); x.arc(80, 80, 55, 0, 7); x.fill();
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const dt = new DataTransfer(); dt.items.add(new File([blob], 'speckle texture.png', { type: 'image/png' }));
  document.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
});

test('in the Pattern view a dropped picture still opens the import window', async ({ page }) => {
  const { errors } = await openApp(page);
  await drop(page);
  await expect(page.locator('#idlg')).toBeVisible();
  expect(errors).toEqual([]);
});

test('with a stamp unlocked a dropped picture becomes a shape in that stamp at once', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlockStamp(page);
  const n = await count(page);
  await drop(page);
  await expect.poll(() => count(page), { timeout: 15000 }).toBe(n + 1);
  await settle(page);
  expect(errors).toEqual([]);
});
