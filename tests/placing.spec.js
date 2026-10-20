const { test, expect } = require('@playwright/test');
const { openApp, settle, getState } = require('./helpers/harness');
// 2.2.3: one way of placing for a shape, a stamp, a picture and text: the armed item is a ghost on the pointer; using the interface or a right click puts it away
const armShape = async (page, n = 0) => {
  await page.click('#elb [data-k="shape"]'); await settle(page);
  if (!(await page.locator('#lib button[data-m]').count())) await page.locator('#lib .lfr[data-f^="b:"]').first().click();
  await page.locator('#lib button[data-m]').nth(n).click(); await settle(page);
};
const over = async (page, fx, fy) => { const b = await page.locator('#art').boundingBox(); await page.mouse.move(b.x + b.width * fx, b.y + b.height * fy); await settle(page); return b; };
const items = async page => JSON.parse(await getState(page)).tiles[0].items.length;

test('a picked shape is a ghost on the pointer, and it goes when the pointer leaves the canvas', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await armShape(page);
  await expect(page.locator('#stoh .stgh')).toHaveCount(0);   // not on the canvas yet
  await over(page, 0.3, 0.3);
  await expect(page.locator('#stoh .stgh')).toHaveCount(1);
  const a = await page.locator('#stoh .stgh').getAttribute('transform');
  await over(page, 0.6, 0.55);
  expect(await page.locator('#stoh .stgh').getAttribute('transform')).not.toBe(a);
  await page.mouse.move(2, 2); await settle(page);
  await expect(page.locator('#stoh .stgh')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('using the interface puts the shape away: a click on the canvas afterwards places nothing; a button that picks a shape brings the ghost back', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await armShape(page, 0);
  await over(page, 0.3, 0.3);
  await expect(page.locator('#stoh .stgh')).toHaveCount(1);
  await page.click('#elb [data-k="paint"]'); await settle(page);           // any other button in the interface
  await over(page, 0.3, 0.3);
  await expect(page.locator('#stoh .stgh')).toHaveCount(0);
  const n0 = await items(page);
  await page.mouse.click(...(await (async () => { const b = await page.locator('#art').boundingBox(); return [b.x + b.width * 0.3, b.y + b.height * 0.3]; })())); await settle(page);
  expect(await items(page)).toBe(n0);
  await armShape(page, 1);                                                    // pick another shape: it hovers on the pointer again
  await over(page, 0.3, 0.3);
  await expect(page.locator('#stoh .stgh')).toHaveCount(1);
  await page.mouse.click(...(await (async () => { const b = await page.locator('#art').boundingBox(); return [b.x + b.width * 0.3, b.y + b.height * 0.3]; })())); await settle(page);
  expect(await items(page)).toBe(n0 + 1);
  expect(errors).toEqual([]);
});

test('a right click puts away a shape, a stamp and text that were armed', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  // shape
  await armShape(page);
  await over(page, 0.3, 0.3);
  await expect(page.locator('#stoh .stgh')).toHaveCount(1);
  await page.mouse.click(...(await (async () => { const b = await page.locator('#art').boundingBox(); return [b.x + b.width * 0.3, b.y + b.height * 0.3]; })()), { button: 'right' }); await settle(page);
  await expect(page.locator('#stoh .stgh')).toHaveCount(0);
  // stamp
  await page.click('#elb [data-k="stamp"]'); await settle(page);
  await page.click('#lfpst [data-t]'); await settle(page);
  await over(page, 0.4, 0.4);
  await expect(page.locator('#fpov .gh')).toHaveCount(1);
  await page.mouse.click(...(await (async () => { const b = await page.locator('#art').boundingBox(); return [b.x + b.width * 0.4, b.y + b.height * 0.4]; })()), { button: 'right' }); await settle(page);
  await expect(page.locator('#fpov .gh')).toHaveCount(0);
  // text
  await page.click('#elb [data-k="text"]'); await settle(page);
  await page.fill('#tx_t', 'Hi'); await settle(page);   // typing arms the text
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.click(...(await (async () => { const b = await page.locator('#art').boundingBox(); return [b.x + b.width * 0.5, b.y + b.height * 0.6]; })()), { button: 'right' }); await settle(page);
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('using the interface puts away a stamp and text too, and a picking button arms its own kind again', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await page.click('#elb [data-k="stamp"]'); await settle(page);
  await page.click('#lfpst [data-t]'); await settle(page);
  await over(page, 0.4, 0.4);
  await expect(page.locator('#fpov .gh')).toHaveCount(1);
  await page.click('#elb [data-k="paint"]'); await settle(page);
  await over(page, 0.45, 0.45);
  await expect(page.locator('#fpov .gh')).toHaveCount(0);
  await page.click('#elb [data-k="text"]'); await settle(page);
  await page.fill('#tx_t', 'Hi'); await settle(page);   // typing arms the text
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'true');
  await page.click('#elb [data-k="shape"]'); await settle(page);
  await expect(page.locator('#tx_go')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});
