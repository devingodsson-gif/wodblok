// Renders the batch: opens the built app headless (like tests/make-templates.spec.js), makes one square design per image with Randomize,
// sets one of the plain palettes, and exports a PNG through the app's own Export recipes panel, so the files match what a user gets.
// Nothing here changes the app. Needs `npm run build` first (dist/wodblok.html).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('@playwright/test');
const { openApp, openPanel, settle } = require('../../tests/helpers/harness');
const { LAYOUTS } = require('./validate');

const ROOT = path.resolve(__dirname, '..', '..');
const APP = path.join(ROOT, 'dist', 'wodblok.html');
const HEX = /#[0-9a-f]{6}(?:[0-9a-f]{2})?\b/gi;
const THUMB = 360;

const utcDate = (now = new Date()) => now.toISOString().slice(0, 10);
const seedBaseOf = (cfg, now = new Date()) => cfg.seedBase === 'date' ? +utcDate(now).replace(/-/g, '') : cfg.seedBase;
// attempt 0 is the image's own seed; each retry moves to a far-away seed
const seedFor = (base, index, attempt) => (base * 100 + index + attempt * 100003) >>> 0;
const paletteFor = (cfg, seed) => cfg.roll.palettes[(Math.imul(seed, 2654435761) >>> 0) % cfg.roll.palettes.length];

// Why a roll is not kept (empty string = kept)
function checkRoll(cfg, st) {
  const { layers: [lo, hi], layouts } = cfg.roll;
  if (st.layers.length < lo || st.layers.length > hi) return `${st.layers.length} layers (wanted ${lo} to ${hi})`;
  const ok = new Set(layouts.map(l => LAYOUTS[l]));
  const bad = st.layers.find(l => !ok.has(l.grid || ''));
  if (bad) return `layout "${bad.grid || 'auto'}" is not allowed`;
  return '';
}

// Every colour the document uses must come from the chosen palette (the app's own defaults for white and black aside), so no outside set can leak into a post
function strayColours(st, palette) {
  const allowed = new Set(palette.map(c => c.toLowerCase()));
  const seen = new Set((JSON.stringify(st).match(HEX) || []).map(c => c.toLowerCase()));
  return [...seen].filter(c => !allowed.has(c) && !['#000000', '#ffffff', '#00000000', '#ffffff00'].includes(c));
}

async function setAspectSquare(page) {
  await openPanel(page, 'canvas');
  const ok = await page.evaluate(() => {
    const s = document.getElementById('casp');
    const o = [...s.options].find(x => /^1:1/.test(x.textContent));
    if (!o) return false;
    s.value = o.value; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true }));   // the app listens for input
    return true;
  });
  if (!ok) throw new Error('the canvas has no 1:1 option');
  await settle(page, { max: 60000 });
}

async function rollWithFeatures(page, features) {
  await openPanel(page, 'rand');
  await page.click('#rznone');                                   // everything off, colours included
  for (const [k, v] of Object.entries(features)) if (v > 0) await page.locator(`[data-ft="${k}"]`).fill(String(v));
  await page.click('#rzdo');
  await settle(page, { max: 90000 });
}

async function applyPalette(page, palette) {
  const n = await page.locator('#tyc .tys').count();
  for (let i = 0; i < n; i++) {
    await page.locator('#tyc .tys').nth(i).click();
    await page.waitForSelector('.cpk [data-f="hex"]', { state: 'visible' });
    await page.fill('.cpk [data-f="hex"]', palette[i % palette.length]);
    await page.press('.cpk [data-f="hex"]', 'Enter');
    await page.press('.cpk [data-f="hex"]', 'Escape');
    await page.waitForSelector('.cpk', { state: 'hidden' });
    await settle(page, { max: 60000 });
  }
}

async function exportPng(page, size) {
  await openPanel(page, 'xrec');
  await page.fill('#xrpx', String(size));
  await page.click('#xrf [data-f="png"]');
  await page.evaluate(() => { window.__wbDownloads.length = 0; });
  await page.click('#xrnow');
  await page.waitForFunction(() => window.__wbDownloads.length > 0, null, { timeout: 180000 });
  const dl = await page.evaluate(() => window.__wbDownloads[0]);
  return Buffer.from(dl.base64, 'base64');
}

const pngSize = b => (b.length > 24 && b.toString('latin1', 1, 4) === 'PNG') ? [b.readUInt32BE(16), b.readUInt32BE(20)] : [0, 0];

// One image from one seed. Returns { ok:true, ... } or { ok:false, why }
async function renderOne(browser, cfg, seed, size) {
  const t0 = Date.now();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'dark', reducedMotion: 'reduce', acceptDownloads: true });
  const page = await ctx.newPage();
  try {
    const { errors } = await openApp(page, { seed, url: 'file://' + APP });
    await setAspectSquare(page);
    await rollWithFeatures(page, cfg.roll.features);
    const roll = JSON.parse(await page.evaluate(() => window.__wbTest.state()));
    const why = checkRoll(cfg, roll);
    if (why) return { ok: false, seed, why };
    const palette = paletteFor(cfg, seed);
    await applyPalette(page, palette);
    const st = JSON.parse(await page.evaluate(() => window.__wbTest.state()));
    const stray = strayColours(st, palette);
    if (stray.length) return { ok: false, seed, why: 'colours outside the palette: ' + stray.slice(0, 4).join(' ') };
    const png = await exportPng(page, size);
    const [w, h] = pngSize(png);
    if (w !== size || h !== size) return { ok: false, seed, why: `picture is ${w} x ${h}, wanted ${size} x ${size}` };
    const thumb = await page.evaluate(([b64, t]) => new Promise(res => {
      const im = new Image();
      im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = t; c.getContext('2d').drawImage(im, 0, 0, t, t); res(c.toDataURL('image/jpeg', .85).split(',')[1]); };
      im.onerror = () => res('');
      im.src = 'data:image/png;base64,' + b64;
    }), [png.toString('base64'), THUMB]);
    if (!thumb) return { ok: false, seed, why: 'the picture could not be read back' };
    const title = await page.title();
    if (errors.length) return { ok: false, seed, why: 'page error: ' + errors[0].slice(0, 120) };
    return { ok: true, seed, png, thumb, palette, stateHash: crypto.createHash('sha256').update(JSON.stringify(st)).digest('hex').slice(0, 12), layers: st.layers.length, fits: [...new Set(st.layers.map(l => l.grid || 'auto'))], app: title, ms: Date.now() - t0 };
  } finally {
    await ctx.close();
  }
}

// One numbered grid of small pictures, drawn in a blank page (no image library needed)
async function contactSheet(browser, thumbs, cols) {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  try {
    const b64 = await page.evaluate(async ([list, c, t]) => {
      const gap = 14, rows = Math.ceil(list.length / c), W = gap + c * (t + gap), H = gap + rows * (t + gap);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
      x.fillStyle = '#1c1b19'; x.fillRect(0, 0, W, H);
      await Promise.all(list.map((b, i) => new Promise(res => {
        const im = new Image();
        im.onload = () => {
          const px = gap + (i % c) * (t + gap), py = gap + Math.floor(i / c) * (t + gap);
          x.drawImage(im, px, py, t, t);
          x.fillStyle = 'rgba(28,27,25,.82)'; x.beginPath(); x.roundRect(px + 8, py + 8, i > 8 ? 44 : 34, 30, 8); x.fill();
          x.fillStyle = '#f4ecd8'; x.font = '600 19px system-ui, sans-serif'; x.textBaseline = 'middle'; x.fillText(String(i + 1), px + 17, py + 24);
          res();
        };
        im.src = 'data:image/jpeg;base64,' + b;
      })));
      return cv.toDataURL('image/jpeg', .88).split(',')[1];
    }, [thumbs, cols, THUMB]);
    return Buffer.from(b64, 'base64');
  } finally { await ctx.close(); }
}

const CHROMIUM = process.env.WB_CHROMIUM || (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);

// opts: { count, seeds (exact seeds to re-render), size, outDir, log }
async function renderBatch(cfg, opts = {}) {
  if (!fs.existsSync(APP)) throw new Error('dist/wodblok.html is missing: run `npm run build` first');
  const log = opts.log || (() => {});
  const size = opts.size || cfg.size;
  const base = seedBaseOf(cfg);
  const exact = opts.seeds && opts.seeds.length ? opts.seeds : null;
  const count = exact ? exact.length : (opts.count || cfg.count);
  const outDir = opts.outDir || path.join(ROOT, 'out', utcDate());
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ ...(CHROMIUM ? { executablePath: CHROMIUM } : {}), args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run'] });
  const t0 = Date.now(), items = [], skipped = [];
  try {
    for (let i = 0; i < count; i++) {
      const attempts = exact ? 1 : cfg.roll.maxAttempts;
      let got = null;
      for (let a = 0; a < attempts && !got; a++) {
        const seed = exact ? exact[i] : seedFor(base, i + 1, a);
        let r;
        try { r = await renderOne(browser, cfg, seed, size); } catch (e) { r = { ok: false, seed, why: 'error: ' + String(e.message || e).split('\n')[0].slice(0, 160) }; }
        if (r.ok) got = r; else { skipped.push({ n: i + 1, seed, why: r.why }); log(`  #${i + 1} seed ${seed} skipped: ${r.why}`); }
      }
      if (!got) { log(`#${i + 1}: no usable design after ${attempts} tries`); continue; }
      const n = items.length + 1, file = String(n).padStart(2, '0') + '.png';
      fs.writeFileSync(path.join(outDir, file), got.png);
      items.push({ n, file, seed: got.seed, palette: got.palette, stateHash: got.stateHash, layers: got.layers, layouts: got.fits, ms: got.ms, thumb: got.thumb, app: got.app });
      log(`#${n} seed ${got.seed} ok in ${(got.ms / 1000).toFixed(1)} s`);
    }
    let sheet = null;
    if (items.length) {
      const cols = items.length <= 4 ? items.length : items.length <= 9 ? 3 : 4;
      sheet = await contactSheet(browser, items.map(x => x.thumb), cols);
      fs.writeFileSync(path.join(outDir, 'contact-sheet.jpg'), sheet);
    }
    const manifest = {
      made: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), app: items[0] ? items[0].app : '', size,
      wanted: count, got: items.length, rerender: 'npm run build && npm run social -- --dry --seeds <seed>[,<seed>...] [--size <px>]',
      roll: cfg.roll, skipped,
      images: items.map(({ thumb, png, ...rest }) => rest),
    };
    fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    return { outDir, items, sheet, manifest };
  } finally {
    await browser.close();
  }
}

module.exports = { renderBatch, checkRoll, strayColours, seedFor, seedBaseOf, paletteFor, utcDate };
