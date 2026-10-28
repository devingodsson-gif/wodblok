// 2.67.1: a stamp with Pressure offset is drawn from a printed picture once its print is ready. A comment in the printer ran on into the next line (since 2.31.0),
// so the pressure variants' definitions never reached the print and every printed pressure variant came out empty: the stamp vanished once printed.
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, openApp, openPanel, settle, getState, openProjectFile } = require('./helpers/harness');

// how many inked pixels the printed picture of each drawn placement of an element holds (null while a placement still draws live)
const inked = (page, u) => page.evaluate(async u => {
  const out = [];
  for (const g of document.querySelectorAll(`#art [data-fp="${u}"], #art [data-fp^="${u}."]`)) {
    const use = g.querySelector('use'), h = use && use.getAttribute('href'), sym = h && document.getElementById(h.slice(1));
    if (!sym || sym.tagName.toLowerCase() !== 'symbol') { out.push(null); continue; }
    const vb = sym.getAttribute('viewBox').split(' ').map(Number), img = new Image();
    img.src = sym.querySelector('image').getAttribute('href'); await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(vb[0], vb[1], Math.max(1, vb[2]), Math.max(1, vb[3])).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    out.push(n);
  }
  return out;
}, u);

test('the printed placements of a Pattern with Pressure offset have ink', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openProjectFile(page, path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok'));
  await settle(page);
  const p = JSON.parse(await getState(page)).els.find(q => q.k === 'pattern' && (q.fx || []).some(e => e.k === 'pressure'));
  expect(p).toBeTruthy();
  await expect.poll(async () => { const a = await inked(page, p.u); return a.length > 0 && a.every(n => n !== null); }, { timeout: 20000 }).toBe(true);
  const a = await inked(page, p.u);
  expect(a.filter(n => n > 0).length).toBe(a.length);
  expect(errors).toEqual([]);
});

test('a placed stamp keeps its ink when it is given Pressure offset', async ({ page }) => {
  const { errors } = await openApp(page, { seed: 4 });
  await openProjectFile(page, path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok'));
  await settle(page);
  const q = JSON.parse(await getState(page)).els.find(x => x.k === 'stamp' && !(x.fx || []).length);
  await openPanel(page, 'lyrs');
  await page.click(`#lyl2 .lyr[data-u="${q.u}"]`);
  await settle(page);
  await openPanel(page, 'stmp');
  await page.locator('.fxg[data-fxk="stamp"] .fxadd').scrollIntoViewIfNeeded();
  await page.click('.fxg[data-fxk="stamp"] .fxadd');
  await page.locator('.rowm .ddi', { hasText: 'Pressure offset' }).first().click();
  await settle(page);
  expect(JSON.parse(await getState(page)).els.find(x => x.u === q.u).fx[0].k).toBe('pressure');
  await expect.poll(async () => { const a = await inked(page, q.u); return a.length === 1 && a[0] !== null; }, { timeout: 20000 }).toBe(true);
  expect((await inked(page, q.u))[0]).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
