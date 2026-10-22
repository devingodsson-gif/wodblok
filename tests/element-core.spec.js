// Element update, step 1 (2.1.1): a layer's elements (placed stamps, pictures, text) draw in the order of the layer's element list,
// not grouped by kind. Before this, every placed stamp drew under every text whatever the order they were added in.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState, noPattern, addKind } = require('./helpers/harness');

const layers = async page => JSON.parse(await getState(page)).els;
const canvasClick = async (page, fx, fy) => {
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await settle(page);
};
const drawnOrder = page => page.$$eval('#art [data-fp]', els => els.map(e => e.getAttribute('data-fp')));

test('text placed before a stamp draws under it: the canvas follows the element list', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'Hi');
  await settle(page);
  await addKind(page, 'text'); await settle(page);   // 2.12.0: Add text makes it
  await page.evaluate(() => document.activeElement && document.activeElement.blur());   // Escape is ignored while the text field has focus
  await page.keyboard.press('Escape');          // stop placing text before the stamp is picked
  await settle(page);
  await openPanel(page, 'stmp');
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  await canvasClick(page, 0.2, 0.2);          // away from the text, which is wider on the CI renderer
  const pl = (await layers(page));
  expect(pl.map(q => (q.tx != null ? 'text' : q.t != null ? 'stamp' : '?'))).toEqual(['text', 'stamp']);
  await expect.poll(() => drawnOrder(page)).toEqual(pl.map(q => String(q.u)));
  expect(errors).toEqual([]);
});

test('a stamp placed before text still draws under it', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await noPattern(page);
  await openPanel(page, 'stmp');
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  await canvasClick(page, 0.4, 0.4);
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click');
  await openPanel(page, 'text');
  await page.fill('#tx_t', 'Hi');
  await settle(page);
  await addKind(page, 'text'); await settle(page);   // 2.12.0: Add text makes it
  const pl = (await layers(page));
  expect(pl.map(q => (q.tx != null ? 'text' : q.t != null ? 'stamp' : '?'))).toEqual(['stamp', 'text']);
  await expect.poll(() => drawnOrder(page)).toEqual(pl.map(q => String(q.u)));
  expect(errors).toEqual([]);
});
