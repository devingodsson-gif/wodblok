// 2.100.1 (owner Nov 4 2026, docs/ai-select-plan.md: "let's add it right now just for the mockup masks"; he chose "Find with: Colour | AI"): in the hosted app the
// Mockup panel finds your mockup's product with SAM 2.1 (src/platform/ai.js), and with Show mask on a click takes a part out or adds it, read by the AI too. The model
// and runtime are files of the app's own, none over the host's 25 MiB (split into pieces), fetched only when AI is first used. The single file has no AI.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const H = require('./helpers/harness');
const { webBuild } = require('./helpers/web-build');
const W = webBuild();
const ROOT = path.join(__dirname, '..');
// every status message, as it appears (one can be replaced at once, before a check would see it)
const said = page => page.evaluate(() => { window.__said = []; new MutationObserver(() => window.__said.push(document.getElementById('pmsg').textContent)).observe(document.getElementById('pmsg'), { childList: true, characterData: true, subtree: true }); });
const hears = (page, t, timeout) => page.waitForFunction(t => (window.__said || []).includes(t), t, { timeout });
// the product, as the view shows it with an empty design and Show mask on: a pixel the same as the photo is product, a tinted one is not; sampled on a 60 x 60 grid,
// compared with the hand-made mask (white = product) when given
const product = (page, ref) => page.evaluate(async ref => {
  const v = document.getElementById('mkc'), Wv = v.width, Hv = v.height, d = v.getContext('2d').getImageData(0, 0, Wv, Hv).data;
  const load = async src => { const i = new Image(); i.src = src; await i.decode(); const c = document.createElement('canvas'); c.width = Wv; c.height = Hv; const x = c.getContext('2d'); x.drawImage(i, 0, 0, Wv, Hv); return x.getImageData(0, 0, Wv, Hv).data; };
  const ph = await load(window.__mkPhoto), rf = ref ? await load(ref) : null; let n = 0, on = 0, both = 0, any = 0;
  for (let gy = 0; gy < 60; gy++) for (let gx = 0; gx < 60; gx++) { const i = (Math.floor((gy + .5) / 60 * Hv) * Wv + Math.floor((gx + .5) / 60 * Wv)) * 4, p = Math.abs(d[i] - ph[i]) + Math.abs(d[i + 1] - ph[i + 1]) + Math.abs(d[i + 2] - ph[i + 2]) < 12;
    n++; if (p) on++; if (rf) { const r = rf[i] > 127; if (p && r) both++; if (p || r) any++; } }
  return { share: on / n, iou: rf ? both / any : null };
}, ref);

test('the hosted build: no file over 25 MiB; the AI files are fetched only when Find with AI is used', async ({ page }) => {
  test.setTimeout(240000);
  const big = []; const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (fs.statSync(p).size > 25 * 1024 * 1024) big.push(p); }); walk(W.dir);
  expect(big).toEqual([]);
  const ai = fs.readdirSync(path.join(W.dir, 'assets', 'ai'));
  expect(ai.filter(f => /vision-encoder-fp16-data\.[0-9a-f]{10}\.bin\.\d$/.test(f)).length).toBe(3);   // 67 MB in three pieces
  const { errors, asked } = await W.open(page, { seed: 4, pattern: false });
  await said(page);
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock'));
  await page.waitForSelector('section.pn[data-p="mock"]:not([hidden])');
  const tshirt = fs.readFileSync(path.join(ROOT, 'mockups', 'tshirt.webp'));
  await page.evaluate(b64 => { window.__mkPhoto = 'data:image/webp;base64,' + b64; }, tshirt.toString('base64'));
  await page.setInputFiles('#mkpane .mkfile', { name: 'Shirt.webp', mimeType: 'image/webp', buffer: tshirt });
  await expect(page.locator('#mkpane [data-mk^="m"]')).toHaveCount(1);
  await expect(page.locator('#mkfwr')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#mkfw [data-w="col"]')).toHaveClass(/on/);
  expect(asked.filter(u => u.startsWith('/assets/ai/'))).toEqual([]);   // nothing of the AI yet
  // Find with AI: the model is fetched (in pieces), the product found, Tolerance hidden
  await page.locator('#mkfw [data-w="ai"]').click();
  await hears(page, 'Found the product.', 180000);
  await expect(page.locator('#mkfw [data-w="ai"]')).toHaveClass(/on/);
  await expect(page.locator('#mktolr')).toBeHidden();
  expect(asked.some(u => /^\/assets\/ai\/vision-encoder-fp16-data\.[0-9a-f]{10}\.bin\.3$/.test(u))).toBe(true);
  await page.locator('#mkmv').check(); await page.waitForTimeout(800);
  const ref = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'mockups', 'tshirt-mask.png')).toString('base64');
  const a = await product(page, ref); expect(a.iou).toBeGreaterThan(.95);
  // a click on the shirt takes it out; a second click adds it back
  const c = page.locator('#mkc'), box = await c.boundingBox();
  await c.click({ position: { x: box.width * .5, y: box.height * .55 } });
  await hears(page, 'Taken out of the product.', 60000); await page.waitForTimeout(600);
  const b = await product(page); expect(b.share).toBeLessThan(a.share * .5);
  await c.click({ position: { x: box.width * .5, y: box.height * .55 } });
  await hears(page, 'Added to the product.', 60000); await page.waitForTimeout(600);
  const b2 = await product(page, ref); expect(b2.iou).toBeGreaterThan(.95);
  // Colour finds it by colour again (Tolerance back)
  await page.locator('#mkfw [data-w="col"]').click();
  await expect(page.locator('#mkfw [data-w="col"]')).toHaveClass(/on/, { timeout: 30000 });
  await expect(page.locator('#mktolr')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the single file has no AI: Find with is not shown', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, pattern: false });
  await page.evaluate(() => window.__wbTest.commands.run('panel.mock'));
  await page.waitForSelector('section.pn[data-p="mock"]:not([hidden])');
  await page.setInputFiles('#mkpane .mkfile', { name: 'Shirt.webp', mimeType: 'image/webp', buffer: fs.readFileSync(path.join(ROOT, 'mockups', 'tshirt.webp')) });
  await expect(page.locator('#mkpane [data-mk^="m"]')).toHaveCount(1);
  await expect(page.locator('#mkamr')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#mkfwr')).toBeHidden();
  expect(errors).toEqual([]);
});
