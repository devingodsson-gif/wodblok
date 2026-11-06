#!/usr/bin/env node
// Rule: UI follows docs/developing-wodblok.md Part 9 (the UI standard). Fails on a font size, radius, font weight or font family outside the standard scales,
// in the page CSS (src/shell.html) and in styles written by modules; on an icon button in the page without a name; and on a hover text that is an instruction (2.29.0).
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
// Exemptions (style guide 3.2 and 4.3): splash 20 display text; "+" glyphs 18 and 28 (the wordmark, 21, is set with the font shorthand).
const FS_OK = new Set(['11px', '12px', '13px', 'inherit', '15px', '18px', '20px', '28px']);
// radii: the three of the scale (2, 3, 6), round (50%, 999px) and 1px tracks.
const R_OK = new Set(['0', '1px', '2px', '3px', '6px', '50%', '999px', 'inherit']);   // 2.3.0: radii 2 / 3 / 6 (Photoshop look)
// weights: 400, 500, 600 (section 4); nothing else, in font-weight or the font shorthand
const W_OK = new Set(['400', '500', '600', 'normal', 'inherit']);
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = [path.join(SRC, 'shell.html'), ...walk(path.join(SRC, 'modules')).filter(f => f.endsWith('.js'))];
let bad = 0;
const report = (f, i, msg) => { console.error(`${path.relative(SRC, f)}:${i + 1}: ${msg}`); bad++; };
for (const f of files) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/@font-face/.test(line)) return;
    for (const m of line.matchAll(/(?<![\w-])font-size\s*:\s*([^;}"']+)/g)) { const v = m[1].trim(); if (!v.startsWith('var(') && !FS_OK.has(v)) report(f, i, `font-size ${v}`); }
    for (const m of line.matchAll(/(?<![\w-])border-radius\s*:\s*([^;}"']+)/g)) { for (const v of m[1].trim().split(/\s+/)) if (!v.startsWith('var(') && !R_OK.has(v)) report(f, i, `border-radius ${v}`); }
    for (const m of line.matchAll(/(?<![\w-])font-weight\s*:\s*([^;}"'\s]+)/g)) if (!W_OK.has(m[1]) && !m[1].startsWith('$')) report(f, i, `font-weight ${m[1]}`);   // ${…}: a weight the person chose for their own lettering
    for (const m of line.matchAll(/(?<![\w-])font\s*:\s*(\d{3})\s/g)) if (!W_OK.has(m[1])) report(f, i, `font weight ${m[1]}`);
    for (const m of line.matchAll(/\btitle\s*=\s*["'`](?:Drag|Click|Press|Hold|Double-click)\b[^"'`]*/g)) report(f, i, `hover text is an instruction: ${m[0]}`);
    if (f.endsWith('.html')) for (const m of line.matchAll(/<button\b[^>]*\bclass="[^"]*\bib\b[^"]*"[^>]*>/g)) if (!/aria-label=/.test(m[0])) report(f, i, `icon button without a name: ${m[0].slice(0, 80)}`);
    for (const m of line.matchAll(/font-family\s*:\s*([^;}"]+)/g)) if (/serif|fraunces/i.test(m[1].replace(/sans-serif/gi, ''))) report(f, i, `font-family ${m[1].trim()}`);
  });
}
// 2.84.0 (owner Oct 31 2026: "make sure everything conforms to our style guidelines"): the size in the font shorthand; layers in the bands of section 6; gaps on the
// spacing scale; motion at the two durations of section 7. Exempt motion: the launch splash (splin, splbar) and the loops that show work going on (spin, rspin, vrsh).
const Z_OK = z => (z >= 0 && z <= 9) || (z >= 40 && z <= 45) || (z >= 50 && z <= 60) || (z >= 70 && z <= 80) || z >= 9000;
const GAP_OK = new Set(['0', '1px', '2px', '4px', '6px', '8px', '12px', '16px', 'inherit', 'normal']);
const ANIM_OK = /^(splin|splbar|spin|rspin|vrsh)$/;
for (const f of files) {
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/@font-face/.test(line)) return;
    for (const m of line.matchAll(/(?<![\w-])font\s*:\s*(?:\d{3}\s+)?(?:italic\s+)?(\d*\.?\d+px)/g)) if (!FS_OK.has(m[1]) && m[1] !== '32px') report(f, i, `font size ${m[1]} (shorthand)`);   // 32px: the splash wordmark (brand)
    for (const m of line.matchAll(/(?<![\w-])z-index\s*:\s*(-?\d+)/g)) if (!Z_OK(+m[1])) report(f, i, `z-index ${m[1]} outside the bands`);
    for (const m of line.matchAll(/(?<![\w-])(?:row-|column-)?gap\s*:\s*([^;}"'`]+)/g)) for (const v of m[1].trim().split(/\s+/)) if (/^\d*\.?\d+(px|em|rem)$/.test(v) && !GAP_OK.has(v)) report(f, i, `gap ${v} off the spacing scale`);
    for (const m of line.matchAll(/(?<![\w-])transition\s*:\s*([^;}"'`]+)/g)) for (const d of m[1].matchAll(/(?<![\w.-])(\d*\.?\d+m?s)\b/g)) if (!/^0m?s$/.test(d[1])) report(f, i, `transition ${d[1]}: use --t-fast or --t-slow`);
    for (const m of line.matchAll(/(?<![\w-])animation\s*:\s*([\w-]+)\s+([^;}"'`]+)/g)) { if (ANIM_OK.test(m[1])) continue; for (const d of m[2].matchAll(/(?<![\w.-])(\d*\.?\d+m?s)\b/g)) report(f, i, `animation ${m[1]} ${d[1]}: use --t-fast or --t-slow`); }
  });
}
// icons draw at 13, 15 or 18 px (section 8); thumbnails of artwork are not icons
{const IC_OK = new Set(['13', '15', '18']), THUMB = /\.rpth svg|\.mr\.kid svg/, css = fs.readFileSync(path.join(SRC, 'shell.html'), 'utf8');
 for (const m of css.matchAll(/([^{}<>]+)\{([^{}]*)\}/g)) { const sel = m[1].trim(); if (THUMB.test(sel) || !sel.split(',').every(x => /(svg|\.ic)\s*$/.test(x.trim()))) continue;
  for (const d of m[2].matchAll(/width:(\d+)px;height:(\d+)px/g)) if (!IC_OK.has(d[1])) { console.error(`shell.html: icon ${sel.slice(0, 60)} at ${d[1]}px (13, 15 or 18)`); bad++; } }}
// 2.118.0 (full check S6): padding on the spacing scale: 0, 1, 2, 4, 6, 8, 12, 16 px, and above 16 a multiple of 4 (section 6)
{const PAD_OK = v => { const n = +v.replace('px', ''); return [0, 1, 2, 4, 6, 8, 12, 16].includes(n) || (n > 16 && n % 4 === 0); };
 for (const f of files) fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
  for (const m of line.matchAll(/(?<![\w-])padding(?:-(?:top|right|bottom|left))?\s*:\s*([^;}"'`]+)/g)) for (const v of m[1].trim().split(/\s+/)) if (/^\d*\.?\d+px$/.test(v) && !PAD_OK(v)) report(f, i, `padding ${v} off the spacing scale`);
 });}
if (bad) { console.error(bad + ' style violations'); process.exit(1); }
console.log('style check OK');
