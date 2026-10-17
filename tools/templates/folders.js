// Hand-made templates: every .wodblok file in templates/canvas, templates/tile and templates/book (the folder is the picker tab) becomes a
// starting point, listed before the generated ones, by name. The build calls this (tools/build.js, and tools/serve-esm.js for `npm run dev`),
// so adding a template is: put the file in the folder. The name is the project's own name; the id is "tpl-" + the file name without .wodblok.
// The stored copy drops the file's own picture (the list keeps it as the card picture, as it is).
const fs = require('fs'), path = require('path'), { unzipSync, zipSync } = require('fflate');
const ROOT = path.join(__dirname, '..', '..'), KINDS = ['canvas', 'tile', 'book'];
function folderTemplates() {
  const out = [];
  for (const kind of KINDS) {
    const dir = path.join(ROOT, 'templates', kind);
    if (!fs.existsSync(dir)) continue;
    const mine = [];
    for (const f of fs.readdirSync(dir).filter(f => /\.wodblok$/i.test(f)).sort()) {
      const files = unzipSync(new Uint8Array(fs.readFileSync(path.join(dir, f))));
      if (!files['project.json'] || !files['thumbnail.png']) throw new Error('templates/' + kind + '/' + f + ' is not a .wodblok project with a picture');
      const name = String(JSON.parse(Buffer.from(files['project.json']).toString('utf8')).name || '').trim().slice(0, 40) || f.replace(/\.wodblok$/i, '');
      const zip = {};                                                        // same order as the file; the type marker stays first and unpacked
      for (const k of Object.keys(files)) if (k !== 'thumbnail.png') zip[k] = [files[k], { level: k === 'mimetype' || k.startsWith('assets/') ? 0 : 6 }];
      mine.push({ id: 'tpl-' + f.replace(/\.wodblok$/i, ''), type: kind, n: name, th: 'data:image/png;base64,' + Buffer.from(files['thumbnail.png']).toString('base64'), b: Buffer.from(zipSync(zip)).toString('base64') });
    }
    out.push(...mine.sort((a, b) => a.n.localeCompare(b.n)));
  }
  return out;
}
// Takes the text of src/data/templates.js and returns it with the folder templates in front (a folder file replaces a generated one with the same id).
function withFolders(src) {
  const m = /const TPL_BUILTIN=(\[.*\]);\nexport/s.exec(src);
  if (!m) throw new Error('data/templates.js: TPL_BUILTIN not found');
  const mine = folderTemplates(), list = [...mine, ...JSON.parse(m[1]).filter(t => !mine.some(x => x.id === t.id))];
  return src.slice(0, m.index) + 'const TPL_BUILTIN=' + JSON.stringify(list) + ';\nexport' + src.slice(m.index + m[0].length);
}
module.exports = { folderTemplates, withFolders };
