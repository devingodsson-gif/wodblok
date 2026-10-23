import {zipSync,strToU8} from '../vendor/fflate.js';
// Motif library export: one SVG per motif, one folder per library folder / set, all in a zip. Pure code, no browser needed.

const MOTIF_BAD = /[\u0000-\u001f\\/:*?"<>|]/g;
// a name that is safe as a file or folder name on Mac, Windows and in a zip
function safeName(s, fallback) {
  let n = String(s == null ? '' : s).replace(MOTIF_BAD, ' ').replace(/\s+/g, ' ').trim().replace(/^\.+/, '').replace(/[. ]+$/, '').slice(0, 60).trim();
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(n)) n += '_';
  return n || fallback;
}

// A motif is drawn in a -50..50 box with two tokens: FILL = ink, CUT = carved away. Exported as black on a transparent
// background: the cut parts are real holes (a mask), not white paint. `drawn(ink, cut)` returns the motif's markup for two colours.
function motifSvg(drawn) {
  const box = 'x="-50" y="-50" width="100" height="100"';
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100" width="100" height="100">'
    + `<defs><mask id="m" maskUnits="userSpaceOnUse" ${box}><rect ${box} fill="#000"/>${drawn('#fff', '#000')}</mask></defs>`
    + `<rect ${box} fill="#000" mask="url(#m)"/></svg>\n`;
}

// folders: [{path:['Florals','Roses'], items:[{name, svg}]}] (a string `name` works for a single folder) -> {zip bytes, count}.
// Folders inside folders become folders inside folders. Empty folders are left out. Names that collide get -2, -3 ...
// (compared without regard to case, since Mac and Windows treat Motif.svg and motif.svg as one file); a renamed folder
// takes the folders inside it along.
function buildMotifZip(folders) {
  const files = {}, usedDirs = new Set(), made = new Map(), usedNames = new Map();
  let count = 0;
  const dirOf = raw => {                        // raw: the folder's own names, outermost first
    const key = raw.join('\u0000');                      // exact spelling: two folders that differ only in case stay two folders
    if (made.has(key)) return made.get(key);
    const parent = raw.length > 1 ? dirOf(raw.slice(0, -1)) : '', base = safeName(raw[raw.length - 1], 'Folder');
    const full = n => parent ? parent + '/' + n : n;
    let n = base, d = 2;
    while (usedDirs.has(full(n).toLowerCase())) n = base + '-' + d++;
    const dir = full(n);
    usedDirs.add(dir.toLowerCase()); made.set(key, dir);
    return dir;
  };
  for (const f of folders) {
    if (!f.items || !f.items.length) continue;
    const raw = Array.isArray(f.path) ? f.path : [f.name], dir = dirOf(raw);
    const used = usedNames.get(dir) || usedNames.set(dir, new Set()).get(dir);   // per folder in the zip, so nothing is ever overwritten
    for (const it of f.items) {
      const base = safeName(it.name, 'Shape');
      let n = base, k = 2;
      while (used.has(n.toLowerCase())) n = base + '-' + k++;
      used.add(n.toLowerCase());
      files[dir + '/' + n + '.svg'] = strToU8(it.svg);
      count++;
    }
  }
  return { zip: count ? zipSync(files, { level: 6 }) : null, count };
}

export {safeName,motifSvg,buildMotifZip};
