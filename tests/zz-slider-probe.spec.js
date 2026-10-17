const { test, expect } = require('@playwright/test');
const { TARGET, openApp, openPanel, setMode, settle } = require('./helpers/harness');
test.skip(!process.env.PROBE, 'probe');
async function vis(page, id) { return page.evaluate(id => { const r = document.getElementById(id); const lo = +r.min, hi = +r.max, p = hi > lo ? (r.value - lo) / (hi - lo) * 100 : 0; const sp = parseFloat(r.style.getPropertyValue('--p')); return { v: +r.value, pOk: Math.abs(sp - p) < 0.2 || isNaN(sp), n: r._n ? +r._n.value : null }; }, id); }
test('probe sliders vs undo', async ({ page }) => {
  test.setTimeout(900000);
  await openApp(page, { seed: 4 });
  if (process.env.PROBE_MODE === 'stamp') {
    await setMode(page, 'stamp');
    await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 160; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 160, 160); x.fillStyle = '#000'; x.beginPath(); x.arc(80, 80, 55, 0, 7); x.fill(); const blob = await new Promise(r => c.toBlob(r, 'image/png')); const dt = new DataTransfer(); dt.items.add(new File([blob], 'a.png', { type: 'image/png' })); document.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); });
    await settle(page);
  } else { await openPanel(page, 'tex'); await page.click('#tx_add'); await settle(page); }
  const panels = await page.evaluate(() => [...document.querySelectorAll('.rail [data-pn]')].filter(b => !b.hidden && b.offsetParent).map(b => b.dataset.pn));
  const bad = []; let tested = 0;
  for (const pn of panels) {
    if (['rand', 'nav', 'wspc'].includes(pn)) continue;
    try { await openPanel(page, pn); } catch (e) { continue; }
    await settle(page);
    const ids = await page.evaluate(() => [...document.querySelectorAll('section.pn:not([hidden]) input[type=range]')].filter(r => r.offsetParent && !r.disabled && r.id).map(r => r.id));
    for (const id of ids) {
      const r = await page.evaluate(id => { const e = document.getElementById(id); const o = +e.value, mn = +e.min, mx = +e.max; const nv = o > (mn + mx) / 2 ? mn + (o - mn) * .4 : o + (mx - o) * .5; return { o, nv: Math.round(nv / (+e.step || 1)) * (+e.step || 1) }; }, id);
      if (r.o === r.nv) continue;
      await page.waitForTimeout(600);
      await page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, [id, r.nv]);
      await page.waitForTimeout(700);
      const after = await page.evaluate(id => +document.getElementById(id).value, id);
      await page.click('#undo'); await page.waitForTimeout(400);
      const uv = await vis(page, id); const u = uv.v;
      await page.click('#redo'); await page.waitForTimeout(400);
      const rv = await vis(page, id); const rd = rv.v;
      tested++; const _l = 0;
      if (Math.abs(u - r.o) > 1e-6 || Math.abs(rd - after) > 1e-6 || !uv.pOk || !rv.pOk || (uv.n != null && Math.abs(uv.n - u) > 0.011) || (rv.n != null && Math.abs(rv.n - rd) > 0.011)) bad.push(`${pn}/${id}: orig ${r.o} set ${after} undo ${JSON.stringify(uv)} redo ${JSON.stringify(rv)}`);
      await page.click('#undo').catch(() => {}); await page.waitForTimeout(300);
    }
  }
  console.log('TESTED ' + tested + '\nBAD\n' + bad.join('\n'));
});
