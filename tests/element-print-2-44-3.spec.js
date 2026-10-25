// 2.44.3 (docs/speed-plan.md): a shape with effects is printed once into an image, like a stamp; the shape being edited draws live; the document is not changed by it.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const ORDER = ['texture', 'grain', 'noise', 'blur', 'halftone', 'rough', 'dust', 'bleed', 'jitter', 'grade', 'motion', 'lines', 'stipple', 'misreg', 'ripple'];

async function scene(page, n) {
  await H.addShape(page); await H.settle(page);
  for (const k of ORDER) await page.evaluate(k => { const c = window.__wbTest.commands, id = 'effect.' + k; if (c.isEnabled(id)) c.run(id); }, k);
  await H.settle(page);
  const base = JSON.parse(await H.getState(page)), motif = base.els.find(e => e.k === 'motif' && !e.bgd);
  const els = base.els.filter(e => e !== motif);
  for (let i = 0; i < n; i++) {
    const q = JSON.parse(JSON.stringify(motif)); q.u = 'pr' + i; q.x = 80 + (i % 3) * 170; q.y = 120 + Math.floor(i / 3) * 200; q.s = 80; q.r = i * 20;
    q.fx = [JSON.parse(JSON.stringify(motif.fx.find(f => f.k === ORDER[(i * 4 + 1) % ORDER.length]) || motif.fx[0]))]; q.fx[0].u = 'prf' + i;
    els.push(q);
  }
  await page.evaluate(s => window.__wbTest.apply(s), JSON.stringify({ ...base, els }));
}
const counts = page => page.evaluate(() => ({ imgs: document.querySelectorAll('#dyn use[href^="#bk"]').length, live: document.querySelectorAll('#dyn [filter]').length }));

test('shapes with effects are printed; the selected one draws live; the document is the same', async ({ page }) => {
  await H.openApp(page, { seed: 4 });
  await scene(page, 6);
  const before = await H.getState(page);
  await expect.poll(async () => (await counts(page)).live, { timeout: 30000 }).toBe(0);
  expect((await counts(page)).imgs).toBeGreaterThanOrEqual(6);
  expect(await H.getState(page)).toBe(before);
  // select one (a click on it): it draws live while the others stay printed
  const st = JSON.parse(before), q = st.els.find(e => e.u === 'pr5'), c = await H.canvasToClient(page, q.x, q.y);
  await page.mouse.click(c.x, c.y);
  await expect.poll(async () => (await counts(page)).live, { timeout: 10000 }).toBeGreaterThan(0);
  expect((await counts(page)).imgs).toBeGreaterThanOrEqual(5);
  // and it is printed again when it is let go of
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await counts(page)).live, { timeout: 20000 }).toBe(0);
  expect(await H.getState(page)).toBe(before);
});

test('an SVG export made while shapes are printed is still the vector picture: filters, no markers, no print images', async ({ page }) => {
  await H.openApp(page, { seed: 4 });
  await scene(page, 4);
  await expect.poll(async () => (await counts(page)).live, { timeout: 30000 }).toBe(0);
  await H.openPanel(page, 'xrec');
  await page.click('#xrf [data-f="svg"]');
  await page.click('#xrnow');
  await page.waitForFunction(() => window.__wbDownloads.length > 0);
  const t = await page.evaluate(() => atob(window.__wbDownloads[0].base64));
  expect(t).toContain('<filter');
  expect(t).not.toContain('<!--@');
  expect(t).not.toMatch(/href="#bk\d+"/);
});
