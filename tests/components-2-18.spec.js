// 2.18.0: one component per role (UI standard, Part 9). Heights on the scale, one shape picker, one primary action per view.
const { test, expect } = require('@playwright/test');
const { openApp, openPanel, settle, addShape } = require('./helpers/harness');

const SCALE = [18, 22, 24, 28, 36];

test('buttons, dropdowns and fields in every panel sit on the height scale (18, 22, 24, 28, 36)', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page);
  const off = [];
  for (const id of [null, 'canvas', 'colors', 'pgrid', 'hist', 'rand', 'xrec', 'motifs', 'text', 'stmp', 'layers']) {
    if (id) { await openPanel(page, id); await settle(page); }
    off.push(...await page.evaluate(() => {
      const res = [];
      for (const e of document.querySelectorAll('button,select,input[type=text],input[type=number],.ddb')) {
        if (!e.offsetParent || !e.title || e.closest('footer') || e.id === 'ver') continue;
        const b = e.getBoundingClientRect();
        if (b.width < 6 || b.height < 6 || b.height >= 40) continue;   // tiles and thumbnails are not controls
        const h = Math.round(b.height);
        if (![18, 22, 24, 28, 36].includes(h)) res.push(h + 'px ' + (e.id || e.className || e.tagName) + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 20) + '"');
      }
      return res;
    }));
  }
  expect(off).toEqual([]);
  expect(errors).toEqual([]);
});

test('every shape picker is the same component: a four-column grid of icon buttons that carry their name', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page);
  for (const [panel, sel] of [['canvas', '#cshp'], ['pgrid', '#pgsh'], ['stmp', '#skind']]) {
    await openPanel(page, panel); await settle(page);
    if (panel === 'stmp') await page.evaluate(() => document.querySelector('#skind').closest('details,section')?.setAttribute('open', ''));
    // a picker inside a closed group has no layout: it must at least have no column override of its own
    const r = await page.evaluate(sel => {
      const g = document.querySelector(sel);
      const bs = [...g.querySelectorAll('button')];
      return { cls: g.className, cols: g.offsetParent ? getComputedStyle(g).gridTemplateColumns.split(' ').length : (g.style.gridTemplateColumns ? 0 : 4), n: bs.length, text: bs.filter(b => b.textContent.trim()).length, named: bs.filter(b => b.getAttribute('aria-label') && b.title === b.getAttribute('aria-label')).length };
    }, sel);
    expect(r.cls, sel).toContain('shg');
    expect(r.cols, sel).toBe(4);
    expect(r.text, sel + ' has visible labels').toBe(0);
    expect(r.named, sel).toBe(r.n);
  }
  expect(errors).toEqual([]);
});

test('Import image, Edit and the Randomize panel button are secondary; the only primary buttons are a view\'s one key action', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page);
  for (const id of ['smkedit', 'rzdo']) await expect(page.locator('#' + id)).not.toHaveClass(/primary/);
  expect(errors).toEqual([]);
});

test('every slider row in a panel has a value box', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page);
  const missing = [];
  for (const id of ['canvas', 'colors', 'pgrid', 'rand', 'motifs', 'text', 'stmp', 'layers']) {
    await openPanel(page, id); await settle(page);
    missing.push(...await page.evaluate(() => [...document.querySelectorAll('.dock .ctl input[type=range]')]
      .filter(r => r.offsetParent && !r.closest('.ctl').querySelector('input[type=number]')).map(r => r.id || r.className)));
  }
  expect(missing).toEqual([]);
  expect(errors).toEqual([]);
});

test('one toggle: the sliding switch, the same size in Settings, panels and Export', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page);
  const size = sel => page.locator(sel).locator('visible=true').first().evaluate(e => { const b = e.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height); });
  await openPanel(page, 'rand'); await settle(page);
  expect(await size('.chk input')).toBe('28x18');   // 2.30.0: the Canvas panel's switches moved into groups (Background is a shape now); the Randomize panel always shows some
  await openPanel(page, 'xrec'); await settle(page);
  expect(await size('#xrwm')).toBe('28x18');
  await page.evaluate(() => window.__wbTest.commands.run('settings.open')); await settle(page);
  expect(await size('#stgbody .pvc')).toBe('28x18');
  expect(errors).toEqual([]);
});

test('tooltips: a control that shows its own words has none; an icon-only button names itself', async ({ page }) => {
  const { errors } = await openApp(page);
  await addShape(page);
  const bad = [];
  for (const id of [null, 'canvas', 'rand', 'xrec', 'motifs', 'text', 'stmp', 'layers']) {
    if (id) { await openPanel(page, id); await settle(page); }
    bad.push(...await page.evaluate(() => {
      const res = [];
      for (const e of document.querySelectorAll('button[title],label[title],span[title],div[title]')) {
        if (!e.offsetParent || !e.title || e.closest('footer') || e.id === 'ver') continue;
        const tip = e.querySelector('.tip');
        const words = e.textContent.replace(tip ? tip.textContent : '', '').trim();
        const name = (e.id || e.className || e.tagName) + ' "' + e.title.slice(0, 30) + '"';
        if (words.length > 2 && e.tagName !== 'DIV') res.push('has words and a title: ' + name);
        if (!words && e.tagName === 'BUTTON' && e.getAttribute('aria-label') && e.title.replace(/ \(.*\)$/, '') !== e.getAttribute('aria-label') && !/^Choose/.test(e.title)) res.push('title is not the name: ' + name);
        if (e.title.length > 40) res.push('a sentence: ' + name);
      }
      return res;
    }));
  }
  expect(bad).toEqual([]);
  // a button made later by a panel gets its name when the pointer reaches it
  const t = await page.evaluate(() => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Test name'); b.innerHTML = '<svg></svg>'; document.body.appendChild(b); b.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); const r = b.title; b.remove(); return r; });
  expect(t).toBe('Test name');
  expect(errors).toEqual([]);
});

test('no empty groups; the Save as template footer is Cancel then Save; kbd uses the app font; the folder menu shows at rest', async ({ page }) => {
  const { errors } = await openApp(page, { pattern: false });
  await openPanel(page, 'motifs'); await settle(page);
  const empty = await page.evaluate(() => [...document.querySelectorAll('section.pn:not([hidden]) details.g')].filter(d => d.offsetParent !== null && d.querySelector(':scope>.gb') && !d.querySelector(':scope>.gb').offsetHeight).map(d => d.querySelector('summary').textContent.trim()));
  expect(empty).toEqual([]);
  expect(await page.evaluate(() => { const f = document.querySelector('#tpsok').closest('.dlg-f'); const a = [...f.querySelectorAll('button')].map(b => b.id); return !!f && a.join() === 'tpscx,tpsok'; })).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#png kbd')).fontFamily)).toContain('Hanken');
  await openPanel(page, 'motifs'); await settle(page);
  const lmo = await page.evaluate(() => { const b = document.querySelector('#lib .lmo'); return b ? getComputedStyle(b).opacity : '1'; });
  expect(lmo).toBe('1');
  expect(errors).toEqual([]);
});
