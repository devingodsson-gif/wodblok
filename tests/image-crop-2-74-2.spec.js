// 2.74.2 (owner Oct 29 2026): "I need to be able to crop images". Crop (in the Fill group) puts a picture in crop mode: a frame with eight squares over the picture;
// a square pulls an edge, Enter or a click outside applies, Esc leaves it as it was. The shape becomes the size of what is left, where it lay.
const { test, expect } = require('@playwright/test');
const path = require('path');
const H = require('./helpers/harness');
const IMG = path.join(__dirname, 'fixtures', 'picture.png');   // a made-up picture: four blocks of colour

const pic = async page => JSON.parse(await H.getState(page)).els.filter(q => q.k === 'motif' && q.fl === 'img')[0];
const left = q => q.x - q.s * (q.wx || 1) / 2, right = q => q.x + q.s * (q.wx || 1) / 2;
const pull = async (page, h, dx, dy) => {
  const b = await page.locator(`#fpov [data-crh="${h}"]`).boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + dx / 2, y + dy / 2, { steps: 3 }); await page.mouse.move(x + dx, y + dy, { steps: 3 }); await page.mouse.up(); await H.settle(page);
};

test('Crop trims a picture: a side pulled in, Enter applies, the other side stays where it was; Esc cancels', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await H.addShape(page, 'rect');
  await H.showPanel(page, 'motifs');
  await page.click('#mf_fk [data-f="img"]'); await H.settle(page);
  await page.setInputFiles('#lfafile', IMG); await H.settle(page, { max: 30000 });
  await expect(page.locator('#mf_crop')).toBeVisible();
  const a = await pic(page);
  await page.click('#mf_crop'); await H.settle(page);
  await expect(page.locator('#fpov [data-crh]')).toHaveCount(8);
  await pull(page, 'e', -40, 0);
  expect((await pic(page)).ic).toBeUndefined();   // nothing changes until it is applied
  await page.keyboard.press('Enter'); await H.settle(page);
  const b = await pic(page);
  expect(b.ic[2]).toBeGreaterThan(b.ic[0] + .05);   // the right side cut more than the left (the left only loses what ran past the shape)
  expect(right(b)).toBeLessThan(right(a) - 5); expect(left(b)).toBeCloseTo(left(a), 0);
  expect(await page.locator('#fpov [data-crh]').count()).toBe(0);
  expect(await page.locator('#art clipPath[id$="ic"]').count()).toBeGreaterThan(0);
  // Esc: the frame goes and the picture is as it was
  await page.click('#mf_crop'); await H.settle(page);
  await pull(page, 'w', 30, 0);
  await page.keyboard.press('Escape'); await H.settle(page);
  expect(await pic(page)).toEqual(b);
  expect(errors).toEqual([]);
});
