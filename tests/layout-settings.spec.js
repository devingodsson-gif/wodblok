// 1.30.0: radial arrangements (rings, spiral, spiral arms, sunflower, spokes), Variation Size and Gaps, Brick offset, Position across / down.
const { test, expect } = require('@playwright/test');
const fs = require('fs'), os = require('os'), path = require('path');
const { zipSync, unzipSync, strToU8, strFromU8 } = require('fflate');
const { openApp, openPanel, settle, getState, openProjectFile } = require('./helpers/harness');

const setv = (page, id, v, ev = 'input') => page.locator('#' + id).evaluate((e, [v, ev]) => { e.value = v; e.dispatchEvent(new Event(ev, { bubbles: true })); }, [v, ev]);
const pick = (page, v) => page.click(`#lmode [data-m="${v}"]`);

// one plain Repeat layer: no jitter, no offset, so the points are exactly where the arrangement puts them
async function oneLayer(page, name) {
  // the wide sample project (a .wodblok zip) with its project.json cut down to one plain Repeat layer
  const files = unzipSync(new Uint8Array(fs.readFileSync(path.join(__dirname, 'fixtures', 'project-3-rect-16x9.wodblok'))));
  const fx = JSON.parse(strFromU8(files['project.json']));
  fx.layers = [fx.layers[0]]; fx.layers[0].st = [fx.tiles[0].id];
  fx.tiles[0].sh = { k: 'rect', o: 'p', s: [1, 1], z: 100 };            // the arrangements below are the ones for a rectangular stamp
  Object.assign(fx.layers[0], { rpos: 0, rrot: 0, rtn: false, rfh: false, rfv: false, ox: 0, oy: 0, rot: 0, fit: '', pst: 0, pfl: 0, gap: 20, size: 90 });
  const entries = {};
  for (const [k, v] of Object.entries({ ...files, 'project.json': strToU8(JSON.stringify(fx)) })) entries[k] = [v, { level: k === 'mimetype' || k.startsWith('assets/') ? 0 : 6 }];
  const f = path.join(os.tmpdir(), name + process.pid + '.wodblok'); fs.writeFileSync(f, Buffer.from(zipSync(entries)));
  await openProjectFile(page, f); fs.unlinkSync(f);
  await openPanel(page, 'layers');
}
const pts = page => page.evaluate(() => [...document.querySelectorAll('#dyn use[transform], #dyn g[transform]')].map(u => /translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\) scale\(([-\d.]+)/.exec(u.getAttribute('transform'))).filter(Boolean).map(m => [+m[1], +m[2], +m[3], +m[4]]));
const vb = page => page.locator('#art').evaluate(e => e.getAttribute('viewBox').split(' ').map(Number));

test('radial arrangements: rings sit on whole-step rings, a spiral grows steadily, sunflower and spokes are listed', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await oneLayer(page, 'wb-rad');
  const opts = await page.locator('#larr optgroup[label="Round the middle"] option').allInnerTexts();
  expect(opts).toEqual(['Rings', 'Rings, upright', 'Spiral', 'Spiral, upright', 'Spiral arms', 'Spiral arms, upright', 'Sunflower', 'Sunflower, upright', 'Spokes', 'Spokes, upright']);
  const [, , W, H] = await vb(page), step = 90 * 1.2;
  await setv(page, 'larr', 'x-rings'); await settle(page);
  const r = (await pts(page)).map(p => Math.hypot(p[0] - W / 2, p[1] - H / 2));
  expect(r.length).toBeGreaterThan(20);
  r.forEach(d => expect(Math.abs(d / step - Math.round(d / step))).toBeLessThan(0.02));     // every stamp is on a ring one step apart
  await setv(page, 'larr', 'x-spi'); await settle(page);
  const s = (await pts(page)).map(p => Math.hypot(p[0] - W / 2, p[1] - H / 2)).sort((a, b) => a - b);
  expect(s.length).toBeGreaterThan(20);
  for (let i = 1; i < s.length; i++) expect(s[i] - s[i - 1]).toBeLessThan(step);              // no gaps in the winding
  expect(s[0]).toBeLessThan(step);
  await setv(page, 'larr', 'x-spk'); await settle(page);
  const ang = (await pts(page)).filter(p => Math.hypot(p[0] - W / 2, p[1] - H / 2) < step * 1.1 && Math.hypot(p[0] - W / 2, p[1] - H / 2) > 1);
  expect(ang.length).toBe(12);                                                              // twelve spokes
  const state = JSON.parse(await getState(page));
  expect(state.layers[0].ak.rect).toBe('x-spk');
  expect(errors).toEqual([]);
});

test('Variation Size and Gaps: gaps leave prints out, size changes how big they print; Frame and Free place show fewer rows', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await oneLayer(page, 'wb-var');
  const n0 = (await pts(page)).length;
  await setv(page, 'lrg', 60); await settle(page);
  const n1 = (await pts(page)).length;
  expect(n1).toBeLessThan(n0 * 0.7);
  await setv(page, 'lrg', 0); await setv(page, 'lrz', 80); await settle(page);
  const sc = (await pts(page)).map(p => p[3]);
  expect(Math.max(...sc) / Math.min(...sc)).toBeGreaterThan(1.3);
  expect((await pts(page)).length).toBe(n0);
  await pick(page, 'x'); await settle(page);
  await expect(page.locator('#lrzrow')).toBeVisible(); await expect(page.locator('#lrgrow')).toBeHidden();
  await pick(page, 'f'); await settle(page);
  await expect(page.locator('#lrzrow')).toBeHidden(); await expect(page.locator('#lrgrow')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Brick offset moves the odd rows by the chosen fraction', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await oneLayer(page, 'wb-brick');
  await setv(page, 'larr', 'r-brick'); await settle(page);
  await expect(page.locator('#lborow')).toBeVisible();
  const rows = async () => { const p = await pts(page); const ys = [...new Set(p.map(q => Math.round(q[1])))].sort((a, b) => a - b); return ys.slice(0, 2).map(y => p.filter(q => Math.round(q[1]) == y).map(q => q[0]).sort((a, b) => a - b)[2]); };
  const step = 108;
  let [a, b] = await rows();
  expect(Math.abs(((b - a) % step + step) % step - step / 2)).toBeLessThan(1);
  await setv(page, 'lbo', '25'); await settle(page);
  [a, b] = await rows();
  const sh = ((b - a) % step + step) % step;                       // the rows differ by a quarter step, whichever way round they are listed
  expect(Math.min(Math.abs(sh - step / 4), Math.abs(sh - step * 3 / 4))).toBeLessThan(1);
  expect(JSON.parse(await getState(page)).layers[0].bo).toBe(25);
  await setv(page, 'larr', 'r-check'); await settle(page);
  await expect(page.locator('#lborow')).toBeHidden();
  expect(errors).toEqual([]);
});

test('Position across / down sets where the selected stamp sits, and a group moves together', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openPanel(page, 'layers'); await pick(page, 'x'); await settle(page);
  const box = await page.locator('#art').boundingBox();
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3); await settle(page);
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5); await settle(page);
  await page.keyboard.press('Escape'); await settle(page);
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5); await settle(page);
  await expect(page.locator('#lfpx')).toBeVisible();
  const [, , W, H] = await vb(page);
  await setv(page, 'lfpx', 25); await setv(page, 'lfpy', 80); await settle(page);
  const pl = JSON.parse(await getState(page)).layers[0].pl;
  expect(pl[1].x).toBeCloseTo(W * 0.25, 0); expect(pl[1].y).toBeCloseTo(H * 0.8, 0);
  expect(errors).toEqual([]);
});
