// The Basic shapes set (2.31.0): the plain geometric shapes that used to be the Shape element, as ordinary motifs in a -50..50 box.
// Each is [motif name, svg markup with FILL (ink)], the same form as the sets in src/data/shapes.js. The set sits LAST in that file, so its
// keys (b + index) stay put when new sets are added after it; the library shows it first.
// node tools/basic-shapes.mjs appends it to src/data/shapes.js (once: it refuses when the set is already there). tools/build-shapes.mjs adds it too.
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const f = v => +(+v).toFixed(2);
const P = pts => 'M' + pts.map(q => f(q[0]) + ' ' + f(q[1])).join('L') + 'Z';
const ngon = (n, a0, R = 50) => P(Array.from({length: n}, (_, i) => { const t = (a0 + i * 360 / n) * Math.PI / 180; return [R * Math.cos(t), R * Math.sin(t)]; }));
const path = d => `<path d="${d}" fill="FILL"/>`;
const r = 18;   // the rounded rectangle's corner, in the 100 box
const star = (() => { const pts = []; for (let i = 0; i < 10; i++) { const t = (-90 + i * 36) * Math.PI / 180, k = i % 2 ? .42 : 1; pts.push([50 * k * Math.cos(t), 50 * k * Math.sin(t)]); } return P(pts); })();
const heart = (() => { const X = v => f(v * 100); return `M${X(0)} ${X(.5)}C${X(-.55)} ${X(.12)} ${X(-.5)} ${X(-.36)} ${X(-.25)} ${X(-.42)}C${X(-.1)} ${X(-.45)} ${X(0)} ${X(-.32)} ${X(0)} ${X(-.2)}C${X(0)} ${X(-.32)} ${X(.1)} ${X(-.45)} ${X(.25)} ${X(-.42)}C${X(.5)} ${X(-.36)} ${X(.55)} ${X(.12)} ${X(0)} ${X(.5)}Z`; })();

// [name, markup, geometry id] — the id is what Map to shape uses to walk the outline (src/modules/76-basic-shapes.js)
const BASIC = [
  ['Rectangle', path(P([[-50, -50], [50, -50], [50, 50], [-50, 50]])), 'rect'],
  ['Rounded rectangle', path(`M${-50 + r} -50H${50 - r}A${r} ${r} 0 0 1 50 ${-50 + r}V${50 - r}A${r} ${r} 0 0 1 ${50 - r} 50H${-50 + r}A${r} ${r} 0 0 1 -50 ${50 - r}V${-50 + r}A${r} ${r} 0 0 1 ${-50 + r} -50Z`), 'rrect'],
  ['Oval', path('M-50 0A50 50 0 1 0 50 0A50 50 0 1 0 -50 0Z'), 'ellipse'],
  ['Triangle', path(P([[0, -50], [50, 50], [-50, 50]])), 'tri'],
  ['Diamond', path(P([[0, -50], [50, 0], [0, 50], [-50, 0]])), 'dia'],
  ['Pentagon', path(ngon(5, -90)), 'pent'],
  ['Hexagon', path(ngon(6, 0)), 'hex'],
  ['Star', path(star), 'star'],
  ['Arrow', path(P([[-50, -18], [5, -18], [5, -50], [50, 0], [5, 50], [5, 18], [-50, 18]])), 'arrow'],
  ['Heart', path(heart), 'heart'],
  ['Line', path(P([[-50, -3], [50, -3], [50, 3], [-50, 3]])), 'line'],
];
const SET = ['Basic shapes', BASIC.map(([n, m]) => [n, m])];
export {BASIC, SET};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = new URL('../src/data/shapes.js', import.meta.url), js = readFileSync(file, 'utf8');
  if (js.includes('["Basic shapes",')) { console.log('Basic shapes is already in shapes.js'); process.exit(0); }
  const end = js.lastIndexOf(']];\nexport {SHAPES};');
  if (end < 0) throw new Error('unexpected end of shapes.js');
  writeFileSync(file, js.slice(0, end) + '],' + JSON.stringify(SET) + '];\nexport {SHAPES};\n');
  console.log('Basic shapes added: ' + BASIC.length + ' motifs');
}
