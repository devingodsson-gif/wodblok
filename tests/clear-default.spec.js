// File > Clear canvas turns into Default after it has been used; Default starts from the first starting point; it goes back to Clear when there is artwork again (1.35.0).
const { test, expect } = require('@playwright/test');
const { TARGET, openApp, setMode, settle, getState } = require('./helpers/harness');

test.beforeEach(() => { test.skip(TARGET === 'legacy', 'new in the repo build'); });

const count = async page => JSON.parse(await getState(page)).tiles.reduce((n, t) => n + t.items.length, 0);
const addShape = page => page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 160; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 160, 160); x.fillStyle = '#000'; x.beginPath(); x.arc(80, 80, 55, 0, 7); x.fill();
  const blob = await new Promise(r => c.toBlob(r, 'image/png')); const dt = new DataTransfer(); dt.items.add(new File([blob], 'a.png', { type: 'image/png' }));
  document.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
});
const label = page => page.evaluate(() => document.getElementById('clr').textContent.trim());

test('Clear turns into Default, Default opens the first starting point, and it turns back into Clear', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await addShape(page);
  await expect.poll(() => count(page), { timeout: 15000 }).toBe(1);
  expect(await label(page)).toBe('Clear canvas');
  await page.click('#fileb'); await page.click('#clr'); await settle(page);
  expect(await count(page)).toBe(0);
  await expect.poll(() => label(page)).toBe('Default');
  await page.click('#fileb'); await page.click('#clr'); await settle(page, { max: 30000 });
  await expect.poll(() => count(page), { timeout: 20000 }).toBeGreaterThan(0);   // the starting point has artwork
  await expect.poll(() => label(page)).toBe('Clear canvas');
  expect(errors).toEqual([]);
});

test('after Clear, drawing again puts the item back to Clear', async ({ page }) => {
  const { errors } = await openApp(page);
  await setMode(page, 'stamp');
  await addShape(page);
  await expect.poll(() => count(page), { timeout: 15000 }).toBe(1);
  await page.click('#fileb'); await page.click('#clr'); await settle(page);
  await expect.poll(() => label(page)).toBe('Default');
  await addShape(page);
  await expect.poll(() => label(page), { timeout: 10000 }).toBe('Clear canvas');
  expect(errors).toEqual([]);
});
