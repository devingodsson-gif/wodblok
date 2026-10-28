// 2.67.0 (owner Oct 27 2026): Place copies shows the element itself under the pointer, as a shape picked in the library does; a gradient Sheet's effects follow
// the gradient: full at its End, fading out towards its Start.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

test('Place copies: the element itself follows the pointer', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  await H.addShape(page, 'rect');
  await page.click('#lfpcp'); await H.settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width * .2, b.y + b.height * .2); await page.mouse.move(b.x + b.width * .25, b.y + b.height * .25);
  await expect(page.locator('#art #plsrc')).toHaveCount(1);
  await expect(page.locator('#fpov use[href="#plsrc"]')).toHaveCount(1);
  await page.keyboard.press('Escape'); await H.settle(page);
  await expect(page.locator('#art #plsrc')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a gradient Sheet\'s noise is strong at its End and fades out towards its Start', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  const s = JSON.parse(await H.getState(page)), q = s.els.find(x => x.k === 'sheet');
  Object.assign(q, { fl: 'grad', ink: '#808080', ink2: '#808080', ga: 0 }); q.fx = [{ u: 'n1', k: 'noise', sd: 3, amt: 80 }];
  await page.evaluate(x => __wbTest.apply(x), JSON.stringify(s)); await H.settle(page);
  await expect(page.locator('#art mask[id$="fm"]')).toHaveCount(1);
  const b = await page.locator('#art').boundingBox();
  const sd = async fx => { const shot = await page.screenshot({ clip: { x: b.x + b.width * fx - 30, y: b.y + b.height * .5 - 30, width: 60, height: 60 } });
    return page.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let s = 0, s2 = 0, n = 0; for (let i = 0; i < d.length; i += 4) { s += d[i]; s2 += d[i] * d[i]; n++ } const m = s / n; return Math.sqrt(Math.max(0, s2 / n - m * m)); }, shot.toString('base64')); };
  const start = await sd(.06), end = await sd(.94);
  expect(end).toBeGreaterThan(4);
  expect(start).toBeLessThan(end * .4);
  expect(errors).toEqual([]);
});

test('a gradient end can be None: the gradient fades to nothing there', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false, background: true });
  const u = JSON.parse(await H.getState(page)).els.find(x => x.k === 'sheet').u;
  await H.showPanel(page, 'lyrs'); await page.locator(`#lyl2 .lyr[data-u="${u}"] .lyn`).click(); await H.settle(page);
  await page.click('#mf_fk [data-f="grad"]'); await H.settle(page);
  await page.locator('#mf_g2w .cwsb').scrollIntoViewIfNeeded(); await page.click('#mf_g2w .cwsb');
  await page.click('.cwp [data-none]'); await H.settle(page);
  expect(JSON.parse(await H.getState(page)).els.find(x => x.k === 'sheet').ink2).toBe('#00000000');
  await expect(page.locator('#mf_g2w .cwsb span')).toHaveText('None');
  await expect(page.locator('#art linearGradient stop[offset="1"]')).toHaveAttribute('stop-opacity', '0');
  expect(errors).toEqual([]);
});
