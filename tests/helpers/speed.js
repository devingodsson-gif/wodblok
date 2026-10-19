// Helpers for the speed-guard and picture-compare specs: counters that do not depend on how fast the machine is.
const path = require('path');
const { ROOT } = require('./harness');

const FIXTURES = {
  diamond: path.join(ROOT, 'tests', 'fixtures', 'project-1-diamond.wodblok'),
  wide: path.join(ROOT, 'tests', 'fixtures', 'project-3-rect-16x9.wodblok'),
  busy: path.join(ROOT, 'tests', 'fixtures', 'project-4-rect-4x3.wodblok'),
};

// Every reference inside the page's SVG that points at an id that does not exist (href="#x", url(#x) in mask/clip-path/filter/fill/stroke/style).
// Returns { 'use -> #s#': count, ... } with numbers in ids replaced by # so the keys stay stable between runs.
// Two old quirks of 1.6.0 are left out (they are in the old build too, see docs/known-issues.md): the free-stamps strip in the Layers panel keeps buttons
// for stamps that Randomize removed (#lfree), and a texture overlay asks for a texture image that is not there (txi<n>_<n>).
function danglingRefs(page) {
  return page.evaluate(() => {
    const ids = new Set(Array.from(document.querySelectorAll('[id]')).map(e => e.id));
    const out = {};
    const note = (tag, id, e) => { if (/^txi\d+_\d+$/.test(id) || e.closest('#lfree')) return; const k = tag + ' -> #' + id.replace(/\d+/g, '#'); out[k] = (out[k] || 0) + 1; };
    for (const e of document.querySelectorAll('svg *')) {
      const h = e.getAttribute('href') || e.getAttribute('xlink:href');
      if (h && h[0] === '#' && !ids.has(h.slice(1))) note(e.tagName, h.slice(1), e);
      for (const a of ['mask', 'clip-path', 'filter', 'fill', 'stroke', 'style']) {
        const v = e.getAttribute(a);
        if (v) for (const m of v.matchAll(/url\(["']?#([^"')]+)/g)) if (!ids.has(m[1])) note(e.tagName + '[' + a + ']', m[1], e);
      }
    }
    return out;
  });
}

// How much markup the pattern holds right now, and whether the stamp thumbnails (stamp buttons in the Layers panel) resolve.
function patternCounters(page) {
  return page.evaluate(() => {
    const dyn = document.getElementById('dyn');
    const thumbs = sel => Array.from(document.querySelectorAll(sel + ' svg use')).map(u => {
      const h = u.getAttribute('href') || '';
      const t = h[0] === '#' ? document.getElementById(h.slice(1)) : null;
      let w = 0; try { w = u.getBBox().width; } catch (e) { /* not rendered */ }
      return { href: h, found: !!t, width: Math.round(w) };
    });
    return {
      dynChars: dyn ? dyn.innerHTML.length : 0,
      dynNodes: dyn ? dyn.getElementsByTagName('*').length : 0,
      artChars: document.getElementById('art').innerHTML.length,
      layerButtons: thumbs('#lst'),
    };
  });
}

module.exports = { FIXTURES, danglingRefs, patternCounters };
