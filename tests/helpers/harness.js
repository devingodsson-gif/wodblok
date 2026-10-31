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
  build: process.env.WB_BUILD_FILE || path.join(ROOT, 'dist', 'wodblok.html'),
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
    // Tests start with no panel open at launch unless a test asks for the built-in panel layout (workspaces: true) or the app's own start (workspaces: 'launch').
    try { if (!sessionStorage.getItem('wb_t_ws')) {
      if (${workspaces === 'launch'}) localStorage.removeItem('wb96_launch'); else localStorage.setItem('wb96_launch', ${workspaces ? "'on'" : "'none'"});   // 'launch': the app's own start (2.55.0: the Elements list on the right, locked)
      if (${templates !== 'default'} && localStorage.getItem('wb111_tplstart') == null) localStorage.setItem('wb111_tplstart', ${templates ? "'1'" : "'0'"});      // the template picker opens at launch only when a test asks (2.21.0: it is off by default; 'default' leaves the setting alone)
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
async function openApp(page, { seed = 1, runtime = 'artifact', url = APP_URL, workspaces = false, templates = false, before = null, pattern = true, background = false, sections = 'open' } = {}) {
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
  // 2.79.1: a panel's sections start folded but for the first; the specs reach controls in any section, so they start with every section open (the app remembers it).
  // A spec about the folding passes `sections: 'default'`.
  if (sections === 'open') await page.evaluate(() => document.querySelectorAll('section.pn details.g').forEach(d => { d.open = true; }));
  // 2.27.0: a new project starts with a Background shape. Most specs are about something else and count elements, so they start without it unless they pass `background: true`.
  if (!background) {
    await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); s.els = s.els.filter(q => !q.bgd); window.__wbTest.apply(JSON.stringify(s)); window.__wbTest.resetHistory(); window.__wbTest.markClean(); });
    await settle(page);
  }
  if (pattern) await addPattern(page);
  return { errors };
}

// 2.10.0: a new project is empty. Tests add the Pattern the old start had through the bar (and put the panels away) unless they pass `pattern: false`.
async function addPattern(page) {
  if (!(await page.evaluate(() => JSON.parse(window.__wbTest.state()).tiles.length))) await addStamp(page);   // 2.15.0: a new project has no stamp; the old start's one is made here
  await page.click('#elb [data-k="pattern"]');
  await addKind(page, 'pattern');
  // 2.76.8: a new Pattern takes the project's only stamp by itself; only add it when it is not there (the old start's Pattern printed the stamp)
  if (!(await page.evaluate(() => JSON.parse(window.__wbTest.state()).els.some(q => q.k === 'pattern' && (q.src || []).length)))) await patSource(page);
  if ((await page.getAttribute('#rcls', 'aria-label')) === 'Close all panels') await page.locator('#rcls').dispatchEvent('click');
  await page.keyboard.press('Escape'); await settle(page);
  await page.evaluate(() => window.__wbTest.resetHistory());   // the set-up steps are not the test's history: the first step is the Start again
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
      return h(window.__wbTest.state()) + '|' + (art ? h(art.innerHTML) : 0) + '|' + busy + missing + '|' + (document.getElementById('fzst') && document.getElementById('fzst').classList.contains('on') ? 'hold' : '');   // 2.30.0: the Randomize cover (it fades out when the roll is drawn) is not quiet, so a click is not met by it
    });
    if (sig === last && !sig.endsWith('|hold')) { if (++same >= quiet) return; } else { same = 0; last = sig; }
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
const EL_BAR = { mlist: 'shape', layers: 'pattern', stmp: 'stamp', motifs: 'motif', text: 'text', elpaint: 'paint' };
// Since 2.3.0 the element bar makes a new element on every press, so an element panel is opened through its (hidden) tool-bar button instead, which only opens it.
// Close all panels (a locked panel stays)
const closeAllPanels = async page => { if ((await page.getAttribute('#rcls', 'aria-label')) == 'Close all panels') await page.locator('#rcls').dispatchEvent('click'); };
// 2.44.0: there is no rail on screen any more; every panel opens through its hidden opener (the one the menus and commands press)
async function openPanel(page, id) { await page.evaluate(id => document.querySelector(`.rail [data-pn="${id}"]`).click(), id);
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
// 2.5.0: Edit opens the stamp's tab, which zooms to the stamp; the specs work on the whole canvas, so the view goes back to fit
const fitView = async page => { await page.evaluate(() => { const z = document.getElementById('zl'); if (/Fit to screen/.test(z.title)) z.click(); }); await settle(page); };
const unlockStamp = async (page, n = 0) => { await showPanel(page, 'stmp'); const b = page.locator('#stmpl .smklk').nth(n); if ((await b.getAttribute('aria-pressed')) !== 'true') await b.click(); await settle(page); await fitView(page); };
// pick the first library shape as the brush (opens the first folder if none is open)
// (2.31.0: the Basic shapes set is listed first; this keeps picking from the first set of artwork, as before)
const pickShape = async page => { await showPanel(page, 'motifs'); if (!(await page.locator('#lib button[data-m]').count())) await page.locator('#lib .lfr[data-f^="b:"]:not([data-f="b:Basic shapes"])').first().click(); await page.locator('#lib button[data-m]').first().click(); await settle(page); };
// canvas units (the artwork's viewBox) to client pixels
const canvasToClient = (page, x, y) => page.evaluate(([x, y]) => { const a = document.getElementById('art'), r = a.getBoundingClientRect(), vb = a.viewBox.baseVal; return { x: r.left + x / vb.width * r.width, y: r.top + y / vb.height * r.height, k: r.width / vb.width }; }, [x, y]);
// the middle of a printed instance of the stamp, clear of the edges of the canvas: { i, cx, cy } in canvas units
const stampInstance = async (page, id = null) => {   // 2.30.0: `id` picks an instance of that stamp (a roll puts whichever stamp it draws under a given point)
  const c = await page.evaluate(id => { const vb = document.getElementById('art').viewBox.baseVal;
    for (let i = 0; i < 400; i++) { const p = __wbTest.stampToCanvas(i, 120, 120); if (!p) break; if (id != null && (__wbTest.stampIdOf(i) !== id || (__wbTest.stampAt(p.x, p.y, null) || {}).i !== i)) continue; if (p.x > 90 && p.x < vb.width - 90 && p.y > 90 && p.y < vb.height - 90) return { i, ...p }; } return null; }, id);
  return { i: c.i, cx: c.x, cy: c.y };
};
// press and release on the canvas at a point of an instance (offset in canvas units)
const clickStamp = async (page, p, dx = 0, dy = 0) => { const c = await canvasToClient(page, p.cx + dx, p.cy + dy); await page.mouse.move(c.x, c.y); await page.mouse.down(); await page.mouse.up(); await settle(page); };
// New stamp from the Stamps panel (the bottom tray is gone).
async function addStamp(page) {
  if (await page.locator('section.pn[data-p="stmp"]').isHidden()) await openPanel(page, 'stmp');
  await page.click('#smknew');
  await settle(page);
  // 2.25.0: a new stamp opens in its tab; the helper closes that tab, so the tests go on on the Canvas as before
  const x = page.locator('#stetabs .wtg.on [data-sx]');
  if (await x.count()) { await x.click(); await settle(page); }
}

// a new layer starts with a Pattern element; this takes it away so the layer holds only what the test places
async function noPattern(page) {
  await showPanel(page, 'layers');
  while (await page.locator('#pelist [data-pd]').count()) { await page.evaluate(() => document.querySelector('#pelist [data-pd]').click()); await settle(page); }
}

// 2.76.3: the Randomize panel's switches (data-rz: bg, pat, focal, text, frame, col, efx, fin, size) set by name: { size: true, efx: false }; `only` switches every other one off
async function rzSet(page, on, only) {
  await page.evaluate(([on, only]) => { document.querySelectorAll('[data-rz]').forEach(c => { const want = c.dataset.rz in on ? !!on[c.dataset.rz] : only ? false : c.checked; if (c.checked !== want) { c.checked = want; c.dispatchEvent(new Event('change', { bubbles: true })); } }); }, [on, !!only]);
}

// 2.2.3: using the interface puts an armed stamp away, so a test that placed stamps after changing a setting arms the stamp again just before it clicks the canvas
async function armStamp(page) {
  if (await page.locator('#lfpst [data-t].on').count()) return;
  await page.locator('#lfpst [data-t] >> nth=0').dispatchEvent('click'); await settle(page);
}
// 2.31.0: the Shape element is gone; its shapes are the Basic shapes motifs. This places one (by its old preset name) in the middle of the canvas, selected.
const BASIC = { rect: 'Rectangle', rrect: 'Rounded rectangle', ellipse: 'Oval', tri: 'Triangle', dia: 'Diamond', pent: 'Pentagon', hex: 'Hexagon', star: 'Star', arrow: 'Arrow', heart: 'Heart', line: 'Line' };
async function addShape(page, g = 'rect') {
  await showPanel(page, 'motifs');
  // 2.54.2: while a shape is selected the panel edits it and its library is hidden; Esc ends the selection, so the panel is creating again
  if (!(await page.locator('#lib').isVisible())) { await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur()); await page.keyboard.press('Escape'); await settle(page); await showPanel(page, 'motifs'); }
  const set = page.locator('#lib .lfr[data-f="b:Basic shapes"]');
  if (!(await page.locator(`#lib button[data-m][aria-label="${BASIC[g]}"]`).count())) { await set.click(); await settle(page); }
  await page.locator(`#lib button[data-m][aria-label="${BASIC[g]}"]`).click(); await settle(page);
  const b = await page.locator('#art').boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await settle(page);
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await page.keyboard.press('v'); await settle(page);
  // the new motif stays selected (the click that placed it selected it)
  const u = await page.evaluate(() => { const s = JSON.parse(window.__wbTest.state()); const q = s.els[s.els.length - 1]; return q && q.u; });
  return u;
}
// 2.4.0: a new Pattern is empty; this puts a source in it (a stamp by default, or 'motif' / 'text').
// 2.28.0: Add source is a menu: the project's stamps, then its texts, then "Shape from the library…", which opens the library; the motif clicked there is added.
async function patSource(page, kind = 'stamp', n = 0) {
  // the menu closes when its panel scrolls, so bring the button into view first and let the scroll event pass before opening it
  await page.locator('#peadd').scrollIntoViewIfNeeded(); await page.waitForTimeout(100);
  await page.click('#peadd');
  const items = page.locator('.rowm .ddi');
  if (kind === 'motif') {
    await items.filter({ hasText: 'Shape from the library' }).click(); await settle(page);
    if (!(await page.locator('#lib button[data-m]:visible').count())) await page.locator('#lib .lfr[data-f^="b:"]:visible').first().click();
    await page.locator('#lib button[data-m]:visible').nth(n).click();
  } else {
    const stamps = JSON.parse(await getState(page)).tiles.length;
    await items.nth(kind === 'text' ? stamps + n : n).click();
  }
  await settle(page);
}
// 2.12.0: text is made with the Add text button (no more arming and clicking the canvas); in a stamp's tab it lands in the middle of the stamp
async function addStampText(page) {
  await addKind(page, 'text');
}

// 2.20.0: every Add button arms its kind (a ghost follows the pointer); a click on the canvas places one. This clicks Add, then places one in the middle and puts the tool away (V).
async function addKind(page, k) {
  await page.click(`.elk[data-k="${k}"] [data-add]`);
  await settle(page);
  // 2.26.0: Add motif with nothing chosen yet opens the library instead of placing the first shape; this picks one there
  // 2.76.8: in a stamp's tab Add motif has already put a rectangle in, so nothing is picked there
  if (k === 'motif' && !page.__wbMotifPicked && (await page.evaluate(() => window.__wbTest.unlockedStamp())) == null) { await pickShape(page); page.__wbMotifPicked = true; }   // later Adds use the shape picked here
  await placeArmed(page, k);
}
async function placeArmed(page, k) {
  if (!(await page.evaluate(k => !!document.querySelector(`#elb [data-k="${k}"][aria-pressed="true"]`), k))) return;   // not armed: made at once (a stamp's tab)
  const b = await page.locator('#art').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForFunction(k => k === 'motif' || document.querySelector('#fpov .gh'), k, { timeout: 4000 }).catch(() => {});
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await settle(page);
  await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
  await page.keyboard.press('v'); await settle(page);
}

// a saved stamp's right-click menu (2.51.2): item = "Add to project", "Save as PNG", "Save as file", "Rename", "Delete" ...
async function stampMenu(page, item, n = 0) {
  const t = page.locator('#slgrid button[data-sl]').nth(n);
  await t.scrollIntoViewIfNeeded(); await settle(page);
  await t.click({ button: 'right' });
  await page.locator('.rowm').getByRole('menuitem', { name: item, exact: true }).click();
}
module.exports = { stampMenu, addKind, placeArmed, closeAllPanels, addStampText, addPattern, fitView, patSource, addShape, armStamp, noPattern, rzSet, addStamp, ROOT, TARGET, APP_URL, openApp, settle, getState, stateText, svgSummary, openProjectFile, openPanel, checkpoint, showPanel, unlockStamp, pickShape, canvasToClient, stampInstance, clickStamp };
