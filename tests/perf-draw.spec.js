// 2.44.1: how long drawing takes with many elements and effects, the same way every time (docs/speed-plan.md). Only runs with WB_PERF=1
// (npm run perf:draw). Nothing is compared to a stored number: write the printed table into docs/perf-baseline.md and compare the same machine before and after a change.
// The scene is made here, not read from a fixture: N shapes laid on a grid, each with K of the shape effects (a fixed mix, seeded), plus the Background.
// Three interactions are measured on it: an effect slider dragged on the selected shape, the selected shape dragged on the canvas, undo and redo (full redraws).
// For each: the time between frames (what the user sees) and, from the browser's trace, the work of every thread split into slices.
const fs = require('fs');
const path = require('path');
const { test } = require('@playwright/test');
const H = require('./helpers/harness');

test.skip(!process.env.WB_PERF, 'WB_PERF=1 only');
const N = +(process.env.WB_DRAW_N || 40), K = +(process.env.WB_DRAW_K || 4), STEPS = 30;
const ORDER = ['texture', 'grain', 'noise', 'blur', 'halftone', 'rough', 'dust', 'bleed', 'jitter', 'grade', 'motion', 'lines', 'stipple', 'misreg', 'ripple'];

const raf2 = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
// quiet: no long task for 400 ms (the app finishes some drawing in queued steps)
const quiet = page => page.evaluate(() => new Promise(res => { let last = performance.now(); const po = new PerformanceObserver(l => { for (const e of l.getEntries()) last = Math.max(last, e.startTime + e.duration); }); po.observe({ type: 'longtask' }); const t = () => { if (performance.now() - last > 400) { po.disconnect(); res(); } else setTimeout(t, 50); }; setTimeout(t, 50); }));

async function makeScene(page) {
  await H.addShape(page); await H.settle(page);
  for (const k of ORDER) await page.evaluate(k => { const c = window.__wbTest.commands, id = 'effect.' + k; if (c.isEnabled(id)) c.run(id); }, k);
  await H.settle(page);
  const base = JSON.parse(await H.getState(page)), motif = base.els.find(e => e.k === 'motif' && !e.bgd);
  let n = 0; const U = () => 'pf' + (n++).toString(36);
  const els = base.els.filter(e => e !== motif), cols = Math.ceil(Math.sqrt(N * 533 / 800)), rows = Math.ceil(N / cols);
  for (let i = 0; i < N; i++) {
    const q = JSON.parse(JSON.stringify(motif)); q.u = U();
    q.x = Math.round((i % cols + 0.5) * 533 / cols); q.y = Math.round((Math.floor(i / cols) + 0.5) * 800 / rows);
    q.s = 25 + (i * 7) % 30; q.r = (i * 23) % 90; q.fx = [];
    for (let j = 0; j < K; j++) { const k = ORDER[(i + j * 3) % ORDER.length], f = JSON.parse(JSON.stringify(motif.fx.find(x => x.k === k) || motif.fx[0])); f.u = U(); if (f.sd != null) f.sd = 1000 + i * 31 + j; q.fx.push(f); }
    els.push(q);
  }
  await page.evaluate(s => window.__wbTest.apply(s), JSON.stringify({ ...base, els }));
  await quiet(page); await page.evaluate(() => window.__wbTest.resetHistory()); await quiet(page);
}

// the trace of one interaction -> work in ms per slice, all threads of the page's renderer process
async function traced(page, fn) {
  const cdp = await page.context().newCDPSession(page), ev = [];
  cdp.on('Tracing.dataCollected', d => ev.push(...d.value));
  const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
  await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: [...(process.env.WB_PROFILER ? ['disabled-by-default-v8.cpu_profiler', 'v8', 'disabled-by-default-v8.gc'] : []), 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8.execute', 'blink.user_timing', 'cc', 'disabled-by-default-skia', 'skia', 'blink'], recordMode: 'recordAsMuchAsPossible' } });
  const r = await fn();
  await cdp.send('Tracing.end'); await done; await cdp.detach();
  return { ...r, slices: slices(ev) };
}
function slices(ev) {
  const names = {}; for (const e of ev) if (e.ph === 'M' && e.name === 'thread_name') names[e.pid + ':' + e.tid] = e.args.name;
  const cnt = {}; for (const e of ev) if (e.ph === 'X') { const k = e.pid + ':' + e.tid; cnt[k] = (cnt[k] || 0) + 1; }
  const mains = Object.keys(names).filter(k => names[k] === 'CrRendererMain').sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0)), main = mains[0], pid = main.split(':')[0];
  const by = {}; for (const e of ev) if (e.ph === 'X' && e.dur != null && String(e.pid) === pid) (by[e.pid + ':' + e.tid] = by[e.pid + ':' + e.tid] || []).push(e);
  const selfOf = list => { list = list.slice().sort((a, b) => a.ts - b.ts || b.dur - a.dur); const st = [], out = {}; for (const e of list) { while (st.length && st[st.length - 1].ts + st[st.length - 1].dur <= e.ts) st.pop(); if (st.length) st[st.length - 1].kids = (st[st.length - 1].kids || 0) + e.dur; st.push(e); } for (const e of list) out[e.name] = (out[e.name] || 0) + Math.max(0, e.dur - (e.kids || 0)); return out; };
  const S = { raster: 0, compositor: 0, js: 0, styleLayout: 0, paint: 0, parse: 0, gc: 0, other: 0 };
  for (const [k, list] of Object.entries(by)) {
    const nm = names[k] || '', s = selfOf(list);
    if (k === main) for (const [n, us] of Object.entries(s)) {
      if (n === 'ParseHTML') S.parse += us; else if (/GC|Sweep|Marking/.test(n)) S.gc += us;
      else if (/recalcStyle|rebuildLayoutTree|performLayout|UpdateLayoutTree|^Layout$|UpdateStyleAndLayout/.test(n)) S.styleLayout += us;
      else if (/PrePaint|Paint|Commit|Layerize|UpdateLifecycle|requestResource/.test(n)) S.paint += us;
      else if (/FunctionCall|EvaluateScript|v8|V8|TimerFire|EventDispatch|FireAnimationFrame|RunMicrotasks|RunTask/.test(n)) S.js += us;
      else if (n !== 'CpuProfiler::StartProfiling') S.other += us;
    } else if (/ThreadPoolForeground/.test(nm)) { for (const [n, us] of Object.entries(s)) if (/^(Sk|void Sk|int Sk|DisplayItemList|RasterTask|RasterizerTask|ZeroCopy)/.test(n) || /Playback/.test(n)) S.raster += us; }   // the drawing itself: Skia calls and their wrappers, once each (self time)
    else if (nm === 'Compositor' || nm === 'Chrome_ChildIOThread') for (const us of Object.values(s)) S.compositor += us;
  }
  for (const k of Object.keys(S)) S[k] = Math.round(S[k] / 1000);
  return S;
}
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
const p90 = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * .9))]; };

test(`drawing speed: ${N} shapes x ${K} effects`, async ({ page }) => {
  test.setTimeout(20 * 60 * 1000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await H.openApp(page, { seed: 4 });
  await makeScene(page);
  const svgKB = Math.round(await page.evaluate(() => document.getElementById('art').outerHTML.length) / 1024);
  // pick the last shape and give it one more effect so there is a history step to go back over
  const q = await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); const e = s.els[s.els.length - 1]; return { x: e.x, y: e.y }; });
  const c = await H.canvasToClient(page, q.x, q.y); await page.mouse.click(c.x, c.y); await quiet(page);
  await page.evaluate(() => window.__wbTest.commands.run('effect.blur')); await quiet(page);

  const res = {};
  const steps = fn => async () => { const t = []; for (let i = 1; i <= STEPS; i++) { const t0 = Date.now(); await fn(i); await raf2(page); t.push(Date.now() - t0); } return { frames: t }; };
  // 1. an effect slider of the selected shape
  await H.showPanel(page, 'motifs'); await quiet(page);
  await page.locator('section.pn[data-p="motifs"] .fxr .fxc').first().click(); await quiet(page);
  const sl = page.locator('section.pn[data-p="motifs"] .fxs input[type=range]:visible').first(); await sl.scrollIntoViewIfNeeded();
  const b = await sl.boundingBox();
  await page.mouse.move(b.x + 4, b.y + b.height / 2); await page.mouse.down();
  res['effect slider drag'] = await traced(page, steps(i => page.mouse.move(b.x + 4 + i * (b.width - 8) / STEPS, b.y + b.height / 2)));
  await page.mouse.up(); await quiet(page);
  // 2. the shape dragged on the canvas
  await page.keyboard.press('Escape'); await page.mouse.click(c.x, c.y); await quiet(page);
  await page.mouse.move(c.x, c.y); await page.mouse.down();
  const before = await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); const e = s.els[s.els.length - 1]; return e.x; });
  res['shape drag'] = await traced(page, steps(i => page.mouse.move(c.x - i * 3, c.y - i * 2)));
  await page.mouse.up(); await quiet(page);
  const after = await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); const e = s.els[s.els.length - 1]; return e.x; });
  if (Math.abs(after - before) < 5) throw new Error('the shape drag did not move the shape (' + before + ' -> ' + after + ')');
  // 3. undo and redo: full redraws
  res['undo / redo'] = await traced(page, async () => { const t = []; for (let i = 0; i < 6; i++) for (const id of ['edit.undo', 'edit.redo']) { const t0 = Date.now(); await page.evaluate(id => window.__wbTest.commands.run(id), id); await raf2(page); t.push(Date.now() - t0); await quiet(page); } return { frames: t }; });

  const rows = Object.entries(res).map(([name, r]) => {
    const tot = Object.values(r.slices).reduce((a, x) => a + x, 0), n = r.frames.length, pc = k => Math.round(100 * r.slices[k] / tot);
    return { name, frameMedian: med(r.frames), frameP90: p90(r.frames), workPerStep: Math.round(tot / n), raster: pc('raster'), paintCompositor: pc('paint') + pc('compositor'), parseStyleLayout: pc('parse') + pc('styleLayout'), js: pc('js'), other: pc('gc') + pc('other') };
  });
  const out = { when: new Date().toISOString().slice(0, 10), target: H.TARGET, shapes: N, effectsEach: K, svgKB, rows };
  fs.mkdirSync(path.join(H.ROOT, 'test-results'), { recursive: true });
  fs.writeFileSync(path.join(H.ROOT, 'test-results', 'perf-draw.json'), JSON.stringify(out, null, 1));
  const pad = (s, n) => String(s).padEnd(n), lpad = (s, n) => String(s).padStart(n);
  console.log(`\nDrawing speed: ${N} shapes x ${K} effects each (canvas SVG ${svgKB} KB)`);
  console.log(pad('interaction', 20) + lpad('frame ms', 10) + lpad('p90', 6) + lpad('work/step', 11) + lpad('pixels%', 9) + lpad('paint%', 8) + lpad('rebuild%', 10) + lpad('js%', 5));
  for (const r of rows) console.log(pad(r.name, 20) + lpad(r.frameMedian, 10) + lpad(r.frameP90, 6) + lpad(r.workPerStep + ' ms', 11) + lpad(r.raster, 9) + lpad(r.paintCompositor, 8) + lpad(r.parseStyleLayout, 10) + lpad(r.js, 5));
  console.log('frame ms = time from the input to two frames later (median, 90th percentile); work/step = CPU time of all threads per step.');
  console.log('pixels% = effects turned into pixels; paint% = paint and frame assembly; rebuild% = SVG parse, style and layout; js% = the app\'s own code.\n');
});
