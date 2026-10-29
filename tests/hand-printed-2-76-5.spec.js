// 2.76.5 (owner Oct 29 2026, docs/pattern-plan.md step 2): a Pattern's pieces look hand-printed: colours from the tray by place or at random, their own pressure,
// overprinting, and Jitter turning in steps of 90 or 180 degrees; file format 30.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');

const st = async page => JSON.parse(await H.getState(page));
const setPat = (page, o) => page.evaluate(o => { const s = JSON.parse(window.__wbTest.state()), p = s.els.find(q => q.k === 'pattern'); Object.assign(p, o); window.__wbTest.apply(JSON.stringify(s)); }, o);
const dyn = page => page.evaluate(() => document.getElementById('art').innerHTML);
async function squares(page, o = {}) {
  await H.openPanel(page, 'layers'); await H.settle(page);
  await H.patSource(page, 'motif', 0); await H.settle(page);
  const p = (await st(page)).els.find(q => q.k === 'pattern');
  await setPat(page, { src: p.src.filter(s => s.k === 'motif'), ts: 'square', ar: 'check', ps: 20, sp: 0, ...o }); await H.settle(page);
}
const count = (s, re) => (s.match(re) || []).length;

test('colours by place: a Checkerboard takes its two colours from the list, one on each kind of place', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await squares(page);
  await setPat(page, { pcm: 'place', pcc: ['#ff0000', '#0000ff'] }); await H.settle(page);
  const m = await dyn(page), r = count(m, /#ff0000/gi), b = count(m, /#0000ff/gi);
  expect(r).toBeGreaterThan(3); expect(b).toBeGreaterThan(3); expect(Math.abs(r - b)).toBeLessThanOrEqual(Math.max(r, b) * .35);
  expect(errors).toEqual([]);
});

test('random colours repeat with the seed and change with it', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await squares(page, { ar: 'grid' });
  await setPat(page, { pcm: 'random', pcc: ['#ff0000', '#00aa00', '#0000ff'], sd: 7 }); await H.settle(page);
  const a = await dyn(page);
  await setPat(page, { sd: 8 }); await H.settle(page);
  const b = await dyn(page);
  await setPat(page, { sd: 7 }); await H.settle(page);
  expect(await dyn(page)).toBe(a);
  expect(b).not.toBe(a);
  for (const c of ['#ff0000', '#00aa00', '#0000ff']) expect(count(a, new RegExp(c, 'gi')), c).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('ink variation gives pieces their own pressure, and Overprint makes them multiply', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await squares(page, { ar: 'grid' });
  const plain = await dyn(page);
  expect(count(plain, /mix-blend-mode:multiply/g)).toBe(0);
  await setPat(page, { iv: 80 }); await H.settle(page);
  const v = await dyn(page), ops = [...v.matchAll(/opacity="(0\.\d+)"/g)].map(x => x[1]);
  expect(new Set(ops).size).toBeGreaterThan(3);
  await setPat(page, { iv: 0, ov: 1 }); await H.settle(page);
  expect(count(await dyn(page), /mix-blend-mode:multiply/g)).toBeGreaterThan(5);
  expect(errors).toEqual([]);
});

test('Jitter can turn pieces in steps of 90 degrees', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await squares(page, { ar: 'grid', rt: 0 });
  await setPat(page, { fx: [{ u: 'fxj1', k: 'jitter', on: true, pos: 0, rot: 0, sz: 0, rs: 90, sd: 3 }] }); await H.settle(page);
  const turns = [...(await dyn(page)).matchAll(/rotate\((-?[\d.]+)\)/g)].map(x => ((+x[1] % 90) + 90) % 90);
  expect(turns.length).toBeGreaterThan(5);
  turns.forEach(t => expect(Math.min(t, 90 - t)).toBeLessThan(.05));
  expect(errors).toEqual([]);
});

test('stamp pieces take their colours too', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await H.unlockStamp(page); await H.addShape(page, 'rect'); await H.settle(page);
  await page.keyboard.press('Escape'); await H.settle(page);
  await H.showPanel(page, 'stmp'); await page.locator('#stmpl .smklk').first().click(); await H.settle(page);   // back to the canvas
  await setPat(page, { pcm: 'random', pcc: ['#ff0000', '#0000ff'] }); await H.settle(page);
  const m = await dyn(page);
  expect(count(m, /#ff0000/gi) + count(m, /#0000ff/gi)).toBeGreaterThan(3);
  expect(errors).toEqual([]);
});

test('the Print group sets them', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4 });
  await squares(page, { ar: 'grid' });
  await page.locator('#pepc [data-c="random"]').scrollIntoViewIfNeeded(); await page.click('#pepc [data-c="random"]'); await H.settle(page);
  let p = (await st(page)).els.find(q => q.k === 'pattern');
  expect(p.pcm).toBe('random'); expect(p.pcc.length).toBeGreaterThan(0);
  await page.click('#pepc [data-c=""]'); await H.settle(page);
  p = (await st(page)).els.find(q => q.k === 'pattern'); expect(p.pcm).toBeUndefined();
  await page.locator('#peov').check(); await H.settle(page);
  expect((await st(page)).els.find(q => q.k === 'pattern').ov).toBe(1);
  expect(errors).toEqual([]);
});
