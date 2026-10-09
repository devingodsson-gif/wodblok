// SVG from any file is cleaned before use. Strict allow-list, no DOM needed (so it runs in tests and Workers).
// Anything not on the list is removed with everything inside it. Returns the cleaned markup, or null if nothing safe remains.
const MAX = 600000;
const TAGS = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'defs', 'clipPath', 'mask', 'title']);
const ATTRS = new Set(['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset',
  'fill-rule', 'clip-rule', 'fill-opacity', 'stroke-opacity', 'opacity', 'transform', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2',
  'points', 'viewBox', 'preserveAspectRatio', 'xmlns', 'id', 'clip-path', 'mask']);
const TAG_RE = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const ATTR_RE = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
// a value is safe if it holds no script, no entities and no reference except to something inside the same file
const safeValue = v => !/[&<>\u0000-\u001f]/.test(v) && !/javascript:|data:|vbscript:|expression\(|@import/i.test(v) && !/url\(\s*(?!#)/i.test(v);
function cleanSvg(src) {
  if (typeof src !== 'string' || !src || src.length > MAX) return null;
  if (/<!|<\?/.test(src)) return null;                                   // comments, doctype, entities, processing instructions
  let out = '', skip = 0, open = [], rootSeen = false, m, last = 0;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(src))) {
    const closing = m[1] === '/', name = m[2], attrs = m[3], selfClose = /\/\s*$/.test(attrs);
    const text = src.slice(last, m.index); last = TAG_RE.lastIndex;
    if (skip) {                                                          // inside a removed element: only track nesting
      if (!closing && !selfClose) skip++; else if (closing) skip--;
      continue;
    }
    if (open.length && open[open.length - 1] === 'title' && text.trim() && !/[<>&]/.test(text)) out += text.trim().slice(0, 200);
    if (closing) {
      const i = open.lastIndexOf(name);
      if (i < 0) continue;
      while (open.length > i) out += '</' + open.pop() + '>';
      continue;
    }
    if (!TAGS.has(name) || (!rootSeen && name !== 'svg')) { if (!selfClose) skip = 1; continue; }
    rootSeen = true;
    let a = '', k;
    ATTR_RE.lastIndex = 0;
    while ((k = ATTR_RE.exec(attrs))) {
      const n = k[1], v = k[2] !== undefined ? k[2] : k[3];
      if (ATTRS.has(n) && safeValue(v) && !(n === 'xmlns' && v !== 'http://www.w3.org/2000/svg')) a += ' ' + n + '="' + esc(v) + '"';
    }
    if (selfClose) out += '<' + name + a + '/>'; else { out += '<' + name + a + '>'; open.push(name); }
  }
  while (open.length) out += '</' + open.pop() + '>';
  return rootSeen && out.length <= MAX ? out : null;
}
export {cleanSvg};
