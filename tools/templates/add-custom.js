// Adds the hand-made templates (CUSTOM in recipes.js) to the built-in list. Safe to run again: it replaces its own entries.
// Stores each file without its own picture (the list holds a small one), like the generated templates.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..', '..'), { CUSTOM } = require('./recipes.js');
const PY_STRIP = 'import sys,zipfile\nz=zipfile.ZipFile(sys.argv[1])\nk=[(i,z.read(i)) for i in z.infolist() if i.filename!="thumbnail.png"]\nz.close()\no=zipfile.ZipFile(sys.argv[2],"w")\n[o.writestr(i,b,i.compress_type) for i,b in k]\no.close()';
const PY_THUMB = 'import sys,zipfile,io,base64\nfrom PIL import Image\nim=Image.open(io.BytesIO(zipfile.ZipFile(sys.argv[1]).read("thumbnail.png"))).convert("RGB")\nw=240;h=max(1,round(w*im.height/im.width))\nim=im.resize((w,h),Image.LANCZOS)\nb=io.BytesIO();im.save(b,"JPEG",quality=80)\nsys.stdout.write("data:image/jpeg;base64,"+base64.b64encode(b.getvalue()).decode())';
const py = (code, ...a) => cp.execFileSync('python3', ['-I', '-c', code, ...a], { maxBuffer: 1 << 26 }).toString();
const dataFile = path.join(ROOT, 'src', 'data', 'templates.js');
const src = fs.readFileSync(dataFile, 'utf8');
const m = /const TPL_BUILTIN=(\[.*\]);\nexport/s.exec(src);
let list = JSON.parse(m[1]);
const mine = [];
for (const c of CUSTOM) {
  const from = path.join(__dirname, 'custom', c.file), dir = path.join(ROOT, 'src', 'templates', c.kind), to = path.join(dir, c.id + '.wodblok');
  fs.mkdirSync(dir, { recursive: true });
  const th = py(PY_THUMB, from);
  py(PY_STRIP, from, to);
  mine.push({ id: 'tpl-' + c.id, type: c.kind, n: c.n, th, b: fs.readFileSync(to).toString('base64') });
}
list = [...mine, ...list.filter(t => !mine.some(x => x.id === t.id))];
fs.writeFileSync(dataFile, src.slice(0, m.index) + 'const TPL_BUILTIN=' + JSON.stringify(list) + ';\nexport' + src.slice(m.index + m[0].length));
console.log('custom templates:', mine.map(t => t.n).join(', '));
