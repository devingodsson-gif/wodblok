// Shared helpers for every spec. Everything here drives the app through the DOM (plus one state hook),
// never through its internal function names, so the same tests run on legacy/wodblok-v100.html now and on
// the modular build later.
//
// State hook: the legacy page exposes `coreStr()` (the JSON of the document). The repo build must expose
// `window.__wbTest = { state() }` returning the same string; getState() prefers it.
const path = require('path');
const crypto = require('crypto');
const { expect } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..', '..');
const TARGETS = {
  legacy: path.join(ROOT, 'legacy', 'wodblok-v100.html'),
  build: path.join(ROOT, 'dist', 'wodblok.html'),
};
const TARGET = process.env.WB_TARGET || 'legacy';
// WB_TARGET=esm loads the unbundled ES modules from `node tools/serve-esm.js` (http://127.0.0.1:5199/)
const ESM_URL = 'http://127.0.0.1:5199/';
const APP_URL = TARGET === 'esm' ? ESM_URL : 'file://' + TARGETS[TARGET];
const FIXED_TIME = Date.UTC(2026, 9, 8, 12, 0, 0);   // 2026-10-08 12:00:00 UTC, the day of the baseline

// Injected before any page script runs: seeded Math.random, plus (optionally) a stand-in for the claude.ai
// artifact runtime (`window.claude.use('db'|'user'|'downloads')`).
function initScript({ seed, runtime }) {
  return `(() => {
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
        if (name === 'downloads') return { async save(o) { window.__wbDownloads.push({ filename: o.filename, data: o.data }); } };
        return null;
      },
    };` : ''}
  })();`;
}

// Open the app with controlled randomness, time and network. Returns { errors } (page errors and console errors).
async function openApp(page, { seed = 1, runtime = 'artifact', url = APP_URL } = {}) {
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(initScript({ seed, runtime }));
  // No network: the app asks Google Fonts for two stylesheets; answer them empty so layout is the same everywhere.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:5199\/)/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.clock.setFixedTime(FIXED_TIME);
  await page.goto(url);
  await page.waitForFunction(() => typeof (window.__wbTest ? 1 : coreStr) !== 'undefined' && document.fonts.status === 'loaded');
  await settle(page);
  return { errors };
}

async function getState(page) {
  return page.evaluate(() => (window.__wbTest ? window.__wbTest.state() : coreStr()));
}

// Wait until the document state and the drawing stop changing (async stamp prints, textures, loading bar).
async function settle(page, { quiet = 4, step = 120, max = 15000 } = {}) {
  const t0 = Date.now();
  let last = null, same = 0;
  while (Date.now() - t0 < max) {
    const sig = await page.evaluate(() => {
      const art = document.getElementById('art'), ed = document.getElementById('ed');
      const busy = document.body.classList.contains('babusy') || !!document.querySelector('.rzbusy,.lding:not([hidden])');
      // a content hash, not just lengths: a redraw that rebuilds the same amount of markup in a different shape still counts as change
      const h = str => { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); };
      return h(window.__wbTest ? window.__wbTest.state() : coreStr()) + '|' + (art ? h(art.innerHTML) : 0) + '|' + (ed ? h(ed.innerHTML) : 0) + '|' + busy;
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

async function openPanel(page, id) { await page.click(`.rail [data-pn="${id}"]`); await page.waitForSelector(`section.pn[data-p="${id}"]:not([hidden])`); }
async function setMode(page, v) { await page.click(`.seg2 [data-v="${v}"]`); await settle(page); }

// The standard checks every scenario ends with: state, markup summary, no errors.
async function checkpoint(page, testInfo, errors, name, { shot = true, selector = '#art' } = {}) {
  await settle(page);
  expect(await stateText(page)).toMatchSnapshot(`${name}.state.json`);
  const sum = await svgSummary(page, selector);
  if (process.env.WB_DUMP) { require('fs').mkdirSync(process.env.WB_DUMP, { recursive: true }); require('fs').writeFileSync(path.join(process.env.WB_DUMP, `${name}.svg`), sum.norm); }   // debugging aid: where do two runs differ?
  expect(sum.text).toMatchSnapshot(`${name}.svg.json`);
  await testInfo.attach(`${name}.svg`, { body: sum.norm, contentType: 'image/svg+xml' });
  if (shot && process.env.WB_PIXELS !== '0') {
    await expect(page.locator(selector === '#ed' ? '#boardS' : '#boardP').first()).toHaveScreenshot(`${name}.png`);   // compare view clones the board: first() is the live one
  }
  expect(errors, 'page errors').toEqual([]);
}

module.exports = { ROOT, TARGET, APP_URL, openApp, settle, getState, stateText, svgSummary, openProjectFile, openPanel, setMode, checkpoint };
