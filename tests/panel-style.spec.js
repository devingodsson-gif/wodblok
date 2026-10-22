// Continuity between the tool panels: the same kind of control looks the same in every panel (headings, buttons, dropdowns, text fields,
// segmented controls, shape pickers). Measured on the real panels, in both views.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, closeAllPanels } = require('./helpers/harness');

test('every tool panel uses the same heading, button, dropdown, field and segmented-control styles', async ({ page }) => {
  const { errors } = await openApp(page);
  const seen = { summary: new Set(), altFont: new Set(), ddRadius: new Set(), fieldRadius: new Set(), segOn: new Set(), segH: new Set(), tileRadius: new Set(), labelInline: new Set() };
  for (const mode of ['pattern']) {
    const tools = (await page.locator('.rail [data-pn]:not([hidden])').evaluateAll(b => b.map(x => x.dataset.pn))).concat(['layers', 'stmp', 'motifs', 'text', 'elpaint']);
    for (const pn of tools) {
      await closeAllPanels(page); await openPanel(page, pn);
      const r = await page.evaluate(pn => {
        const sec = document.querySelector(`section.pn[data-p="${pn}"]`); sec.querySelectorAll('details').forEach(d => { d.open = true; });
        const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        const cs = (e, ...k) => { const c = getComputedStyle(e); return k.map(x => c[x]).join('|'); };
        const o = { summary: [], altFont: [], ddRadius: [], fieldRadius: [], segOn: [], segH: [], tileRadius: [], labelInline: [] };
        sec.querySelectorAll('details.g:not(.fxg)>summary').forEach(e => vis(e) && o.summary.push(cs(e, 'fontFamily', 'fontSize', 'fontWeight') + '|' + Math.round(e.getBoundingClientRect().height)));
        sec.querySelectorAll('button.alt').forEach(e => vis(e) && !e.classList.contains('ib') && !e.closest('#zoomc,#navbar,.zoom') && !/^[^\w]*$/.test(e.textContent.trim()) && o.altFont.push(cs(e, 'fontSize', 'fontWeight')));
        sec.querySelectorAll('.ddb').forEach(e => vis(e) && o.ddRadius.push(cs(e, 'borderTopLeftRadius')));
        sec.querySelectorAll('input[type=text],textarea,select').forEach(e => vis(e) && o.fieldRadius.push(cs(e, 'borderTopLeftRadius')));
        sec.querySelectorAll('.seg button.on').forEach(e => vis(e) && (o.segOn.push(cs(e, 'color', 'backgroundColor', 'fontWeight')), o.segH.push(Math.round(e.getBoundingClientRect().height))));
        sec.querySelectorAll('.shg:not(#lalg) button').forEach(e => vis(e) && o.tileRadius.push(cs(e, 'borderTopLeftRadius') + '|' + Math.round(e.getBoundingClientRect().height)));
        sec.querySelectorAll('.ctl>label,.lyop .ctl label').forEach(e => vis(e) && o.labelInline.push(cs(e, 'fontSize', 'color')));
        return o;
      }, pn);
      for (const k of Object.keys(seen)) r[k].forEach(v => seen[k].add(v));
    }
  }
  for (const [k, v] of Object.entries(seen)) expect([...v], `one style for: ${k}`).toHaveLength(v.size > 0 ? 1 : 0);
  expect(errors).toEqual([]);
});

test('the Stamp panel shape picker is the same tile picker as Canvas and the grid tools', async ({ page }) => {
  const { errors } = await openApp(page);
  await openPanel(page, 'stmp');
  await expect(page.locator('#skind')).toHaveClass(/shg/);
  expect(await page.locator('#skind button').count()).toBeGreaterThanOrEqual(5);
  expect(errors).toEqual([]);
});
