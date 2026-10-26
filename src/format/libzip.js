import {unzipSync} from '../vendor/fflate.js';
// Library files: a zip a library was exported to (one folder per library folder) or that a person made by hand, read back (2.51.2).
// zipRead(bytes, pattern) -> [{name, dir: [folder names, outermost first, at most 3], data}] for the files whose name matches the pattern, or null when it is not a zip.
// Pure code, no browser needed.
const ZIP_MAX_FILES = 200, ZIP_MAX_BYTES = 8e6;
function zipRead(bytes, pattern) {
  let files;
  try { files = unzipSync(bytes, { filter: f => f.originalSize <= ZIP_MAX_BYTES && pattern.test(f.name) }); }
  catch (e) { return null; }
  const out = [];
  for (const path of Object.keys(files).sort()) {
    if (out.length >= ZIP_MAX_FILES) break;
    const parts = path.split('/').filter(Boolean);
    if (!parts.length || parts.some(p => p == '__MACOSX' || p.startsWith('.'))) continue;
    const file = parts.pop();
    out.push({ name: file.replace(/\.[^.]*$/, ''), dir: parts.slice(0, 3), data: files[path], file });
  }
  return out;
}
export {zipRead};
