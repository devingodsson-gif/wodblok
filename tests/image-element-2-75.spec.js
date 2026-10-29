// 2.75.0 (owner Oct 29 2026): an Image element (a picture on its own, at its own proportions), a Pictures library in the Image panel (every picture of the project),
// Import image makes an Image, and Point crop: a closed outline of corner and smooth points keeps what is inside; Feather softens the edge.
const { test, expect } = require('@playwright/test');
const path = require('path');
const H = require('./helpers/harness');
const IMG = path.join(__dirname, 'fixtures', 'picture.png');   // a made-up picture: four blocks of colour
const SHOT = process.env.WB_SHOTS || '';

const img = async page => JSON.parse(await H.getState(page)).els.filter(q => q.k === 'image');
const toClient = async (page, x, y) => { const b = await page.locator('#art').boundingBox(), vb = await page.evaluate(() => { const v = document.getElementById('art').viewBox.baseVal; return [v.x, v.y, v.width, v.height]; }); return { x: b.x + (x - vb[0]) / vb[2] * b.width, y: b.y + (y - vb[1]) / vb[3] * b.height }; };
const at = async (page, q, fx, fy) => { const w = q.s * (q.wx || 1), h = q.s * (q.wy || 1); return toClient(page, q.x + (fx - .5) * w, q.y + (fy - .5) * h); };

test('the Image button opens the Image panel; Import image there makes an Image at the picture\'s proportions and lists it in Pictures', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await page.click('#elb [data-k="image"]'); await H.settle(page);
  await expect(page.locator('section.pn[data-p="image"]')).toBeVisible();
  await page.setInputFiles('section.pn[data-p="image"] .pcfile', IMG); await H.settle(page, { max: 30000 });
  const [q] = await img(page);
  expect(q).toBeTruthy(); expect(q.a).toBeTruthy();
  const A = await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); return null; });
  expect(Math.max(q.wx, q.wy)).toBeCloseTo(1, 3);
  await expect(page.locator('#imcrop')).toBeVisible();
  // the library lists the picture; while the Image is selected it is behind Replace
  await page.keyboard.press('Escape'); await H.settle(page);
  await expect(page.locator('#impane .pctr button[data-pc]')).toHaveCount(1);
  if (SHOT) await page.screenshot({ path: SHOT + '/img-panel.png' });
  // a pick in the library while creating makes another Image of the same picture
  await page.locator('#impane .pctr button[data-pc]').click(); await H.settle(page);
  expect((await img(page)).length).toBe(2);
  expect(errors).toEqual([]);
});

test('Point crop: corner points, a smooth point, closed on the first point, Enter applies; Feather; Reset crop', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await page.click('#elb [data-k="image"]'); await H.settle(page);
  await page.setInputFiles('section.pn[data-p="image"] .pcfile', IMG); await H.settle(page, { max: 30000 });
  let [q] = await img(page);
  await page.click('#im_pcrop'); await H.settle(page);
  for (const [fx, fy] of [[.2, .2], [.8, .25]]) { const c = await at(page, q, fx, fy); await page.mouse.click(c.x, c.y); }
  { const c = await at(page, q, .75, .8), d = await at(page, q, .85, .9); await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.move(d.x, d.y, { steps: 4 }); await page.mouse.up(); }   // a smooth point
  { const c = await at(page, q, .25, .75); await page.mouse.click(c.x, c.y); }
  { const c = await at(page, q, .2, .2); await page.mouse.click(c.x, c.y); }   // the first point closes the outline
  await H.settle(page);
  expect(await page.locator('#fpov path.crp').count()).toBe(1);
  if (SHOT) await page.screenshot({ path: SHOT + '/img-pcrop.png' });
  expect((await img(page))[0].pc).toBeUndefined();   // nothing changes until it is applied
  await page.keyboard.press('Enter'); await H.settle(page);
  q = (await img(page))[0];
  expect(q.pc.length).toBe(4);
  const smooth = q.pc[2]; expect(smooth[4]).not.toBeCloseTo(smooth[0], 3);   // its handle went out where it was dragged
  expect(q.pc[0][2]).toBeCloseTo(q.pc[0][0], 4);   // a corner's handles sit on it
  expect(await page.locator('#art clipPath[id$="pc"]').count()).toBeGreaterThan(0);
  await page.evaluate(() => { const e = document.getElementById('im_fe'); e.value = 40; e.dispatchEvent(new Event('input', { bubbles: true })); }); await H.settle(page);
  expect((await img(page))[0].fe).toBe(40);
  expect(await page.locator('#art mask[id$="fm"]').count()).toBeGreaterThan(0);
  if (SHOT) await page.screenshot({ path: SHOT + '/img-feather.png' });
  await page.click('#im_reset'); await H.settle(page);
  q = (await img(page))[0]; expect(q.pc).toBeUndefined(); expect(q.ic).toBeUndefined();
  expect(errors).toEqual([]);
});

test('Crop on an Image trims it to a rectangle and keeps its scale', async ({ page }) => {
  const { errors } = await H.openApp(page, { pattern: false });
  await page.click('#elb [data-k="image"]'); await H.settle(page);
  await page.setInputFiles('section.pn[data-p="image"] .pcfile', IMG); await H.settle(page, { max: 30000 });
  const a = (await img(page))[0];
  await page.click('#im_crop'); await H.settle(page);
  const b = await page.locator('#fpov [data-crh="e"]').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.mouse.move(b.x - 40, b.y + b.height / 2, { steps: 4 }); await page.mouse.up();
  await page.keyboard.press('Enter'); await H.settle(page);
  const c = (await img(page))[0];
  expect(c.ic[2]).toBeGreaterThan(.05); expect(c.ic[0]).toBe(0);
  expect(c.x - c.s * c.wx / 2).toBeCloseTo(a.x - a.s * a.wx / 2, 0);   // the left edge stays
  expect(c.s * c.wy).toBeCloseTo(a.s * a.wy, 1);                         // the height and scale stay
  expect(errors).toEqual([]);
});
