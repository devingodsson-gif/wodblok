// Shared helpers for every spec. Everything here drives the app through the DOM (plus one state hook),
// never through its internal function names. The target is the built app (dist/wodblok.html, the default) or, with WB_TARGET=esm, the
// unbundled modules served by `node tools/serve-esm.js`.
//
// State hook: the app exposes `window.__wbTest = { state() }`, the JSON of the document; getState() reads it.
const path = require('path');
const crypto = require('crypto');
const { expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..', '..');
const TARGETS = {
  build: path.join(ROOT, 'dist', 'wodblok.html'),
};
const TARGET = process.env.WB_TARGET || 'build';
// WB_TARGET=esm loads the unbundled ES modules from `node tools/serve-esm.js` (http://127.0.0.1:5199/)
const ESM_URL = 'http://127.0.0.1:5199/';
const APP_URL = TARGET === 'esm' ? ESM_URL : 'file://' + TARGETS[TARGET];
const FIXED_TIME = Date.UTC(2026, 9, 8, 12, 0, 0);   // 2026-10-08 12:00:00 UTC, the day of the baseline

// Injected before any page script runs: seeded Math.random, plus (optionally) a stand-in for the claude.ai
// artifact runtime (`window.claude.use('db'|'user'|'downloads')`).
function initScript({ seed, runtime, workspaces, templates }) {
  return `(() => {
    // Tests start with no workspaces saved (so no tool window opens at launch) unless a test asks for the starting ones.
    try { if (!sessionStorage.getItem('wb_t_ws')) {
      if (!${!!workspaces}) { localStorage.setItem('wb96_workspaces', '[]'); localStorage.setItem('wb96_ws_seeded', '2'); }
      if (!${!!templates}) localStorage.setItem('wb111_tplstart', '0');      // the template picker does not open at launch
      sessionStorage.setItem('wb_t_ws', '1');
    } } catch (e) {}
    let a = ${seed >>> 0};
    Math.random = function () {              // mulberry32
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    window.__wbDownloads = [];
    ${runtime === 'artifact' ? `
    const store = {};                         // path -> { id -> data }
    const col = p => (store[p] = store[p] || {});
    const dbApi = {
      collection(p) {
        return {
          async get() { return { docs: Object.entries(col(p)).map(([id, v]) => ({ id, data: () => JSON.parse(JSON.stringify(v)) })) }; },
          doc(id) {
            return {
              async get() { const v = col(p)[id]; return { exists: v !== undefined, id, data: () => (v === undefined ? undefined : JSON.parse(JSON.stringify(v))) }; },
              async set(v) { col(p)[id] = JSON.parse(JSON.stringify(v)); },
              async delete() { delete col(p)[id]; },
            };
          },
        };
      },
    };
    window.__wbDb = store;
    window.claude = {
      async use(name) {
        if (name === 'db') return dbApi;
        if (name === 'user') return { async id() { return 'test-user'; } };
        if (name === 'downloads') return { async save(o) {
          // text is kept as text; a Blob (zip, png) is kept as base64 so the test side can read the bytes
          if (typeof Blob !== 'undefined' && o.data instanceof Blob) {
            const u = new Uint8Array(await o.data.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
            window.__wbDownloads.push({ filename: o.filename, base64: btoa(s), type: o.data.type });
          } else window.__wbDownloads.push({ filename: o.filename, data: o.data });
        } };
        return null;
      },
    };` : ''}
  })();`;
}

// Open the app with controlled randomness, time and network. Returns { errors } (page errors and console errors).
async function openApp(page, { seed = 1, runtime = 'artifact', url = APP_URL, workspaces = false, templates = false, before = null } = {}) {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(initScript({ seed, runtime, workspaces, templates }));
  // No network: the app asks Google Fonts for two stylesheets; answer them empty so layout is the same everywhere.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:5199\/)/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  if (before) await before(page);     // a test may add its own routes here, after the ones above (the last one added is asked first)
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(url);
  await page.waitForFunction(() => !!window.__wbTest && document.fonts.status === 'loaded');
  await settle(page);
  return { errors };
}

async function getState(page) {
  return page.evaluate(() => window.__wbTest.state());
}

// Wait until the document state and the drawing stop changing (async stamp prints, textures, loading bar).
async function settle(page, { quiet = 4, step = 120, max = 15000 } = {}) {
  const t0 = Date.now();
  let last = null, same = 0;
  while (Date.now() - t0 < max) {
    const sig = await page.evaluate(() => {
      const art = document.getElementById('art');
      const busy = document.body.classList.contains('babusy') || !!document.querySelector('.rzbusy,.lding:not([hidden])') || !!(window.__wbTest && window.__wbTest.printsBusy && window.__wbTest.printsBusy());   // stamp prints still being drawn
      // a stamp print that is not on the page yet leaves its <use> pointing at nothing: the pattern is not finished, however still it looks
      const missing = [...document.querySelectorAll('#art use')].some(u => { const h = u.getAttribute('href'); return h && h[0] === '#' && !document.getElementById(h.slice(1)); });
      // a content hash, not just lengths: a redraw that rebuilds the same amount of markup in a different shape still counts as change
      const h = str => { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); };
      return h(window.__wbTest.state()) + '|' + (art ? h(art.innerHTML) : 0) + '|' + busy + missing;
    });
    if (sig === last) { if (++same >= quiet) return; } else { same = 0; last = sig; }
    await page.waitForTimeout(step);
  }
  throw new Error('settle: the page never went quiet (last signature ' + last + ')');
}

// Pretty JSON of the document state (stable key order as the app writes it).
async function stateText(page) {
  return JSON.stringify(JSON.parse(await getState(page)), null, 1) + '\n';
}

// A compact, machine-independent description of an SVG subtree: tag counts, size and a hash of the normalised
// markup. Numbers are rounded, ids and data URLs are replaced, so only real structural change shows up.
async function svgSummary(page, selector) {
  const raw = await page.evaluate(sel => { const e = document.querySelector(sel); return e ? e.outerHTML : ''; }, selector);
  let norm = raw
    .replace(/data:[a-z]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, m => 'data:#' + crypto.createHash('sha1').update(m).digest('hex').slice(0, 8))
    // The block-rim print cache (v66) is a sprite sheet whose size, symbol numbers and offsets depend on which
    // prints finished first. That is cache state, not the picture, so it is reduced to "there is a rim print".
    .replace(/bk\d+/g, 'bk#')
    .replace(/(<symbol id="bk#" viewBox=")[^"]*"/g, '$1#"')
    .replace(/(<image href="blob:[^"]*")\s+width="\d+"\s+height="\d+"/g, '$1 width="#" height="#"')
    .replace(/blob:[^"')\s]*/g, 'blob:#')                       // blob URLs carry a random id every run
    .replace(/-?\d+\.\d{3,}/g, m => (+m).toFixed(2));
  // Ids that are a counter (letters + digits: ks6260, bk124, ...) are numbered by how many renders happened first,
  // which depends on timing. Keep the letters, drop the number, wherever that id is used.
  for (const id of new Set([...norm.matchAll(/\bid="([a-z]+\d+)"/g)].map(m => m[1]))) {
    const prefix = id.replace(/\d+$/, '');
    norm = norm.replace(new RegExp('(?<![\\w-])' + id + '(?![\\w-])', 'g'), prefix + '#');
  }
  const tags = {};
  for (const m of raw.matchAll(/<([a-zA-Z][\w:-]*)/g)) tags[m[1]] = (tags[m[1]] || 0) + 1;
  const out = {
    length: norm.length,
    sha256: crypto.createHash('sha256').update(norm).digest('hex'),
    tags: Object.fromEntries(Object.entries(tags).sort(([a], [b]) => a.localeCompare(b))),
  };
  return { text: JSON.stringify(out, null, 1) + '\n', norm };
}

// Open a project file the way a user does: File menu is not needed, the hidden file input takes the file.
async function openProjectFile(page, filePath) {
  await page.setInputFiles('#pfile', filePath);
  await page.waitForFunction(() => /Opened/.test((document.getElementById('pmsg') || {}).textContent || ''), null, { timeout: 30000 });
  await settle(page);
}

// the element panels have no rail button: they open from the element bar
const EL_BAR = { layers: 'pattern', stmp: 'stamp', motifs: 'shape', text: 'text', elimg: 'image', elsheet: 'sheet', elpaint: 'paint' };
// Since 2.3.0 the element bar makes a new element on every press, so an element panel is opened through its (hidden) tool-bar button instead, which only opens it.
async function openPanel(page, id) { if (EL_BAR[id]) await page.evaluate(id => document.querySelector(`.rail [data-pn="${id}"]`).click(), id); else await page.click(`.rail [data-pn="${id}"]`);
  await page.waitForSelector(`section.pn[data-p="${id}"]:not([hidden])`); }

// The standard checks every scenario ends with: state, markup summary, no errors.
async function checkpoint(page, testInfo, errors, name, { shot = true, selector = '#art' } = {}) {
  await settle(page, { quiet: 10 });   // longer than the default: on a slow machine (CI) textures finish drawing a moment after everything else looks still
  expect(await stateText(page)).toMatchSnapshot(`${name}.state.json`);
  const sum = await svgSummary(page, selector);
  if (process.env.WB_DUMP) { require('fs').mkdirSync(process.env.WB_DUMP, { recursive: true }); require('fs').writeFileSync(path.join(process.env.WB_DUMP, `${name}.svg`), sum.norm); }   // debugging aid: where do two runs differ?
  expect(sum.text).toMatchSnapshot(`${name}.svg.json`);
  await testInfo.attach(`${name}.svg`, { body: sum.norm, contentType: 'image/svg+xml' });
  if (shot && process.env.WB_PIXELS !== '0') {
    await expect(page.locator('#boardP').first()).toHaveScreenshot(`${name}.png`);   // compare view clones the board: first() is the live one
  }
  expect(errors, 'page errors').toEqual([]);
}

// Canvas flow (layer update step 11): the Stamp editor is gone, so a test that edits a stamp unlocks it in the Stamps panel and works on the Pattern canvas.
const showPanel = async (page, id) => { const sec = page.locator(`section.pn[data-p="${id}"]:not([hidden])`).first(); if (!(await sec.isVisible())) await openPanel(page, id); };
// unlock a stamp (the first in the list by default) so shapes, text and pictures placed on the canvas go into it
const unlockStamp = async (page, n = 0) => { await showPanel(page, 'stmp'); const b = page.locator('#stmpl .smklk').nth(n); if ((await b.getAttribute('aria-pressed')) !== 'true') await b.click(); await settle(page); };
// pick the first library shape as the brush (opens the first folder if none is open)
const pickShape = async page => { await showPanel(page, 'motifs'); if (!(await page.locator('#lib button[data-m]').count())) await page.locator('#lib .lfr[data-f^="b:"]').first().click(); await page.locator('#lib button[data-m]').first().click(); await settle(page); };
// canvas units (the artwork's viewBox) to client pixels
const canvasToClient = (page, x, y) => page.evaluate(([x, y]) => { const a = document.getElementById('art'), r = a.getBoundingClientRect(), vb = a.viewBox.baseVal; return { x: r.left + x / vb.width * r.width, y: r.top + y / vb.height * r.height, k: r.width / vb.width }; }, [x, y]);
// the middle of a printed instance of the stamp, clear of the edges of the canvas: { i, cx, cy } in canvas units
const stampInstance = async page => {
  const c = await page.evaluate(() => { const vb = document.getElementById('art').viewBox.baseVal;
    for (let i = 0; i < 400; i++) { const p = __wbTest.stampToCanvas(i, 120, 120); if (!p) break; if (p.x > 90 && p.x < vb.width - 90 && p.y > 90 && p.y < vb.height - 90) return { i, ...p }; } return null; });
  return { i: c.i, cx: c.x, cy: c.y };
};
// press and release on the canvas at a point of an instance (offset in canvas units)
const clickStamp = async (page, p, dx = 0, dy = 0) => { const c = await canvasToClient(page, p.cx + dx, p.cy + dy); await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.up(); await settle(page); };
// New stamp from the Stamps panel (the bottom tray is gone).
async function addStamp(page) {
  if (await page.locator('section.pn[data-p="stmp"]').isHidden()) await openPanel(page, 'stmp');
  await page.click('#smknew');
  await page.click('.rowm .ddi >> nth=0');
  await settle(page);
}

// a new layer starts with a Pattern element; this takes it away so the layer holds only what the test places
async function noPattern(page) {
  await showPanel(page, 'layers');
  while (await page.locator('#pelist [data-pd]').count()) { await page.click('#pelist [data-pd] >> nth=0'); await settle(page); }
}

// 2.2.3: using the interface puts an armed stamp away, so a test that placed stamps after changing a setting arms the stamp again just before it clicks the canvas
async function armStamp(page) {
  if (await page.locator('#lfpst [data-t].on').count()) return;
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click'); await settle(page);
}
// 2.2.4: the Sheet is a row of the element list ({k:'sheet'}), not proj.sh
const sheetOf = st => (st.els || []).find(q => q.k === 'sheet');
module.exports = { sheetOf, armStamp, noPattern, addStamp, ROOT, TARGET, APP_URL, openApp, settle, getState, stateText, svgSummary, openProjectFile, openPanel, checkpoint, showPanel, unlockStamp, pickShape, canvasToClient, stampInstance, clickStamp };
