// 2.120.0 (owner Nov 6 2026: "I prefer the results the sheets are getting ... I kind of want all the effects to be scaled the same regardless of the element size";
// yes to Claude's plan: every effect follows the canvas): a filter effect works out its sizes from the canvas, as a Sheet over the whole canvas did, on every element.
// The same Roughen gives the same noise size and the same displacement on a Sheet, a whole pattern, each stamp of a pattern (in canvas units) and a small shape.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const ROUGH = { k: 'rough', amt: 25, sz: 30, sd: 1 };
// every Roughen on the canvas: [noise size, displacement], in canvas units (a filter inside a scaled stamp is multiplied by the stamp's scale)
const roughs = page => page.evaluate(() => [...document.querySelectorAll('#art filter')].map(f => {
  const t = f.querySelector('feTurbulence'), d = f.querySelector('feDisplacementMap'); if (!t || !d) return null;
  const user = [...document.querySelectorAll(`[filter="url(#${f.id})"]`)][0]; let k = 1;
  if (user) { const m = user.getCTM && user.getCTM(), a = document.getElementById('art').getCTM(); if (m && a) k = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / Math.sqrt(Math.abs(a.a * a.d - a.b * a.c)); }
  return { id: f.id, g: 1 / +t.getAttribute('baseFrequency') * k, sc: +d.getAttribute('scale') * k };
}).filter(Boolean));
const near = (a, b) => expect(Math.abs(a / b - 1), `${a} against ${b}`).toBeLessThan(.02);

test('Roughen has the same size on a Sheet, a whole pattern, each stamp of a pattern and a small shape', async ({ page }) => {
  const { errors } = await H.openApp(page, { seed: 4, background: true });
  await page.click('#elb [data-k="sheet"]'); await H.settle(page);
  await page.click('#elb [data-k="pattern"]'); await H.addKind(page, 'pattern'); await H.settle(page);
  await H.addShape(page); await page.keyboard.press('Escape'); await H.settle(page);
  // the same Roughen on each; the pattern's first as Whole pattern, then as each stamp; the shape made small
  const put = wp => page.evaluate(([R, wp]) => { const s = JSON.parse(window.__wbTest.state());
    s.els.forEach(e => { if (e.k === 'sheet' && !e.bgd) e.fx = [{ ...R }]; if (e.k === 'pattern') e.fx = [{ ...R, ...(wp ? {} : { wp: false }) }]; if (e.k === 'motif') { e.fx = [{ ...R }]; e.s = 40; } });
    window.__wbTest.apply(JSON.stringify(s)); }, [ROUGH, wp]);
  await put(true); await H.settle(page);
  let r = await roughs(page);
  const sheet = r.find(x => /^sh|^fg|sheet/i.test(x.id)) || r[0];
  const whole = r.find(x => /^pfx/.test(x.id));
  expect(whole, 'a whole-pattern Roughen').toBeTruthy();
  for (const x of r) { near(x.g, sheet.g); near(x.sc, sheet.sc); }
  expect(r.length, 'the Sheet, the pattern and the shape').toBeGreaterThanOrEqual(3);
  await put(false); await H.settle(page);
  r = await roughs(page);
  const each = r.filter(x => /^fg/.test(x.id));
  expect(each.length, 'a Roughen in each stamp').toBeGreaterThan(3);
  for (const x of r) { near(x.g, sheet.g); near(x.sc, sheet.sc); }
  expect(errors).toEqual([]);
});
