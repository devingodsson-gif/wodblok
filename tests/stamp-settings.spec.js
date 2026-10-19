// Layer update, step 7 (1.46.7): Stamp settings from the Pattern view, and stamps with several colours (each shape can have a colour of its own).
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, getState } = require('./helpers/harness');

const state = async page => JSON.parse(await getState(page));
const tile = async page => (await state(page)).tiles[0];
const unlock = async page => { await openPanel(page, 'stmp'); await page.locator('#stmpl .smklk').first().click(); await settle(page); };
const pick = async page => { await openPanel(page, 'motifs'); if (!(await page.locator('#lib button[data-m]').count())) await page.locator('#lib .lfr[data-f^="b:"]').first().click(); await page.locator('#lib button[data-m]').first().click(); await settle(page); };
const toClient = (page, x, y) => page.evaluate(([x, y]) => { const a = document.getElementById('art'), r = a.getBoundingClientRect(), vb = a.viewBox.baseVal; return { x: r.left + x / vb.width * r.width, y: r.top + y / vb.height * r.height, k: r.width / vb.width }; }, [x, y]);
const inst = async page => {
  const c = await page.evaluate(() => { const vb = document.getElementById('art').viewBox.baseVal;
    for (let i = 0; i < 400; i++) { const p = __wbTest.stampToCanvas(i, 120, 120); if (!p) break; if (p.x > 90 && p.x < vb.width - 90 && p.y > 90 && p.y < vb.height - 90) return { i, ...p }; } return null; });
  return { i: c.i, cx: c.x, cy: c.y };
};
const clickAt = async (page, p, dx, dy) => { const c = await toClient(page, p.cx + dx, p.cy + dy); await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.up(); await settle(page); };
const set = (page, id, v) => page.evaluate(([id, v]) => { const r = document.getElementById(id); r.value = v; r.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);

// how many pixels of the pattern are red (a fixed colour #cc2200 was given to one shape): the prints are bitmaps, so the markup cannot say
async function redPixels(page) {
  const b64 = (await page.locator('#art').screenshot()).toString('base64');
  return page.evaluate(async b => { const im = new Image(); im.src = 'data:image/png;base64,' + b; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 150 && d[i + 1] < 90 && d[i + 2] < 70) n++; return n; }, b64);
}
async function fixedRed(page) {
  await page.locator('#wl_sh .cwsb').click();
  await page.locator('.cwp [data-fix="1"]').click();
  await page.fill('.cpk [data-f="hex"]', '#cc2200');
  await page.press('.cpk [data-f="hex"]', 'Enter');
  await page.keyboard.press('Escape');
  await settle(page);
}

// two shapes in the stamp, the second one selected; the Element editor has opened under the canvas
async function twoShapes(page) {
  await unlock(page); await pick(page);
  let p = await inst(page);
  await clickAt(page, p, -30, 0);
  p = await inst(page);
  await clickAt(page, p, 30, 0);
}

test('Stamp settings work from the Pattern view on the unlocked stamp: shape, size, invert, ink, edge', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await unlock(page);
  await openPanel(page, 'stamp');
  const d0 = await page.locator('#stol path.olu').first().getAttribute('d');
  await page.click('#skind [data-k="circle"]');
  await settle(page);
  expect((await tile(page)).sh.k).toBe('circle');
  expect(await page.locator('#stol path.olu').first().getAttribute('d')).not.toBe(d0);
  expect(await page.evaluate(() => { const vb = document.getElementById('art').viewBox.baseVal; for (let y = 40; y < vb.height; y += 31) for (let x = 40; x < vb.width; x += 29) if (__wbTest.stampAt(x, y)) return true; return false; })).toBe(true);
  await set(page, 'shz', 60); await settle(page);
  expect((await tile(page)).sh.z).toBe(60);
  await page.check('#neg'); await settle(page);
  expect((await tile(page)).neg).toBe(true);
  await page.uncheck('#neg'); await settle(page);
  await set(page, 'let', 6); await settle(page);
  expect((await tile(page)).et).toBe(6);
  await page.locator('#wl_st .cwsb').click();
  await page.locator('.cwp .cwpc[data-s="k1"]').click();
  await settle(page);
  expect((await tile(page)).ink).toBe('@k1');
  expect(errors).toEqual([]);
});

test('each shape can have a colour of its own: the stamp prints in runs and the tray knows the use', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await twoShapes(page);
  expect(await page.locator('#s1 rect[mask^="url(#m1r"]').count()).toBe(0);
  await expect(page.locator('#wl_sh')).toBeVisible();
  await page.locator('#wl_sh .cwsb').click();
  await page.locator('.cwp .cwpc[data-s="k1"]').click();
  await settle(page);
  const it = (await tile(page)).items;
  expect(it[it.length - 1].ic).toBe('@k1');
  expect(it[0].ic).toBeUndefined();
  // two runs: the shape with the stamp's ink, then the shape with colour 1
  const fills = await page.evaluate(() => [...document.querySelectorAll('#s1 rect[mask^="url(#m1r"]')].map(r => r.getAttribute('fill')));
  expect(fills.length).toBe(2);
  expect(fills[0]).not.toBe(fills[1]);
  // the exported picture carries both colours
  await page.evaluate(() => document.getElementById('sv').click());
  await page.waitForFunction(() => window.__wbDownloads.some(d => /\.svg$/.test(d.filename)), null, { timeout: 30000 });
  const svg = await page.evaluate(() => { const d = window.__wbDownloads.find(x => /\.svg$/.test(x.filename)); return d.base64 ? atob(d.base64) : String(d.data); });
  expect(svg).toContain('id="m1r0"');
  expect(svg).toContain('id="m1r1"');
  // the Colours tool says where colour 1 is used
  await openPanel(page, 'colors');
  await expect(page.locator('#tyl')).toContainText('1 shape');
  // putting the shape back on the stamp's ink prints one colour again
  await page.locator('#wl_sh .cwsb').click();
  await page.locator('.cwp [data-def="1"]').click();
  await settle(page);
  expect((await tile(page)).items.every(q => q.ic === undefined)).toBe(true);
  expect(await page.locator('#s1 rect[mask^="url(#m1r"]').count()).toBe(0);
  expect(errors).toEqual([]);
});

test('a colour that is a tray colour follows the tray: another colourway recolours the shape', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await twoShapes(page);
  await page.locator('#wl_sh .cwsb').click();
  await page.locator('.cwp .cwpc[data-s="k1"]').click();
  await settle(page);
  const before = await page.evaluate(() => [...document.querySelectorAll('#s1 rect[mask^="url(#m1r"]')].map(r => r.getAttribute('fill')));
  await page.evaluate(() => { const s = JSON.parse(__wbTest.state()); return s; });
  await openPanel(page, 'cways');
  await page.click('#cwnew');
  await settle(page);
  await openPanel(page, 'colors');
  // change colour 1 in the new colourway through its picker field
  await page.locator('#tyc .tys').first().click();
  await page.fill('.cpk [data-f="hex"]', '#cc2200');
  await page.press('.cpk [data-f="hex"]', 'Enter');
  await settle(page);
  const after = await page.evaluate(() => [...document.querySelectorAll('#s1 rect[mask^="url(#m1r"]')].map(r => r.getAttribute('fill')));
  expect(after.length).toBe(2);
  expect(after.join()).not.toBe(before.join());
  expect(errors).toEqual([]);
});

test('shape colours show in the printed pattern, also under uneven pressure', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await twoShapes(page);
  expect(await redPixels(page)).toBe(0);
  await fixedRed(page);
  expect((await tile(page)).items.pop().ic).toBe('#cc2200');
  const plain = await redPixels(page);
  expect(plain).toBeGreaterThan(200);
  await set(page, 'lps', 6);
  await settle(page);
  expect((await state(page)).layers[0].pst).toBe(6);
  expect(await redPixels(page)).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});
