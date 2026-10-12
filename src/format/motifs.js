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

// folders: [{name, items:[{name, svg}]}] -> {zip bytes, count}. Empty folders are left out. Names that collide get -2, -3 ...
// (compared without regard to case, since Mac and Windows treat Motif.svg and motif.svg as one file).
function buildMotifZip(folders) {
  const files = {}, usedDirs = new Set();
  let count = 0;
  for (const f of folders) {
    if (!f.items || !f.items.length) continue;
    let dir = safeName(f.name, 'Folder'), d = 2;
    while (usedDirs.has(dir.toLowerCase())) dir = safeName(f.name, 'Folder') + '-' + d++;
    usedDirs.add(dir.toLowerCase());
    const used = new Set();
    for (const it of f.items) {
      const base = safeName(it.name, 'Motif');
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
