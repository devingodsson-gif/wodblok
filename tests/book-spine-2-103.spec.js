// 2.103.0 (owner Nov 5 2026): "When I adjust the spine width I want all the elements on the front and back cover and also the spine to stay where they are relative
// to the section they are in. So if I have text centered on the front cover then double the spine width, the text stays centered on the front cover."
// While the trim size stays, a change of spine (width, pages) or bleed keeps every element at the same place, in inches, in its own part (back cover, spine, front
// cover); another trim size moves everything with the front cover, as before.
const { test, expect } = require('@playwright/test');
const H = require('./helpers/harness');
const geo = page => page.evaluate(() => { const t = document.getElementById('bkinfo').textContent, v = document.getElementById('art').viewBox.baseVal;
  return { W: +/Full cover\s*([\d.]+)/.exec(t)[1], H: +/Full cover\s*[\d.]+\s*×\s*([\d.]+)/.exec(t)[1], sw: +/Spine\s*([\d.]+)/.exec(t)[1], bl: +document.getElementById('bkbl').value, CW: v.width, CH: v.height }; });
const parts = g => { const tw = (g.W - 2 * g.bl - g.sw) / 2; return { tw, back: g.bl, spine: g.bl + tw, front: g.bl + tw + g.sw, top: g.bl }; };
// each test element's place in its own part, in inches: across from the part's left edge (the spine's: from its middle) and down from the trim's top
const places = async page => { const g = await geo(page), s = JSON.parse(await H.getState(page)), u = g.W / g.CW, p = parts(g);
  return Object.fromEntries(s.els.filter(q => q.n && q.n.startsWith('t:')).map(q => { const part = q.n.split(':')[1];
    return [q.n, [+(q.x * u - (part === 'spine' ? p.spine + g.sw / 2 : p[part])).toFixed(3), +(q.y * u - p.top).toFixed(3)]]; })); };
async function cover(page) {
  const r = await H.openApp(page, { seed: 4, pattern: false });
  await H.addShape(page); await H.settle(page);
  await H.openPanel(page, 'canvas'); await page.locator('#cfmt [data-f="book"]').click(); await H.settle(page);
  const g = await geo(page), p = parts(g), u = g.W / g.CW, th = g.H - 2 * g.bl;
  // five copies of the shape: the middles of the back cover, the spine and the front cover; 1 in from each cover's left edge and 2 in down
  const at = { 't:back:mid': ['back', p.tw / 2, th / 2], 't:spine:mid': ['spine', 0, th / 2], 't:front:mid': ['front', p.tw / 2, th / 2], 't:back:in': ['back', 1, 2], 't:front:in': ['front', 1, 2] };
  await page.evaluate(([at, p, g, u]) => { const s = JSON.parse(window.__wbTest.state()), m = s.els.find(q => q.k === 'motif');
    s.els = s.els.filter(q => q.k !== 'motif');
    Object.entries(at).forEach(([n, [part, x, y]], i) => s.els.push({ ...m, id: m.id + 'x' + i, n, x: ((part === 'spine' ? p.spine + g.sw / 2 : p[part]) + x) / u, y: (p.top + y) / u, s: 30 }));
    window.__wbTest.apply(JSON.stringify(s)); }, [at, p, g, u]);
  await H.settle(page);
  return { ...r, g };
}
const set = async (page, sel, v) => { await page.fill(sel, String(v)); await page.locator(sel).dispatchEvent('input'); await H.settle(page); };

test('doubling the spine keeps the front, the spine and the back where they were in their own parts', async ({ page }) => {
  const { errors, g } = await cover(page);
  const p0 = await places(page);
  expect(p0['t:front:mid'][0]).toBeCloseTo(parts(g).tw / 2, 2); expect(p0['t:spine:mid'][0]).toBeCloseTo(0, 2);
  await page.locator('#bkman').check(); await H.settle(page);
  await set(page, '#bksw', +(g.sw * 2).toFixed(4));
  expect((await geo(page)).sw).toBeCloseTo(g.sw * 2, 2);
  const p1 = await places(page);
  for (const k of Object.keys(p0)) { expect(p1[k][0], k + ' across').toBeCloseTo(p0[k][0], 2); expect(p1[k][1], k + ' down').toBeCloseTo(p0[k][1], 2); }
  expect(errors).toEqual([]);
});

test('more pages (a wider spine) and another bleed keep the places too; another trim size moves everything with the front cover', async ({ page }) => {
  const { errors } = await cover(page);
  const p0 = await places(page);
  await set(page, '#bkpg', 500);
  let p1 = await places(page);
  for (const k of Object.keys(p0)) { expect(p1[k][0], k + ' across (pages)').toBeCloseTo(p0[k][0], 2); expect(p1[k][1], k + ' down (pages)').toBeCloseTo(p0[k][1], 2); }
  await set(page, '#bkbl', 0.25);
  p1 = await places(page);
  for (const k of Object.keys(p0)) { expect(p1[k][0], k + ' across (bleed)').toBeCloseTo(p0[k][0], 2); expect(p1[k][1], k + ' down (bleed)').toBeCloseTo(p0[k][1], 2); }
  // another trim size: the middle of the front cover stays its middle (2.76.2)
  const v = await page.locator('#bktr option').evaluateAll(o => o.map(x => x.value).filter(x => x !== 'custom'));
  await page.evaluate(t => { const e = document.getElementById('bktr'); e.value = t; e.dispatchEvent(new Event('change', { bubbles: true })); }, v.find(x => x !== v[0]) || v[0]); await H.settle(page);   // the styled dropdown stands in for the native select
  const g2 = await geo(page), q = (JSON.parse(await H.getState(page))).els.find(e => e.n === 't:front:mid'), u = g2.W / g2.CW;
  expect(q.x * u).toBeCloseTo(g2.bl + parts(g2).tw + g2.sw + parts(g2).tw / 2, 1);
  expect(errors).toEqual([]);
});
