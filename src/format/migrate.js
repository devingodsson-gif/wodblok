// The migration chain for project files. Each step is a pure function from format n to n+1. Format numbers continue from the
// single-file app's v:18; the zip container starts at 19. Files older than 18 are treated as 18 (the app has always read them).
// Unknown fields are kept: every step copies the project and only touches what it names.
const FMT_LATEST = 21;
const FMT_STEPS = {
  18: p => ({ ...p, v: 19 }),   // 18 -> 19: same content; images move out of the JSON into assets/ when packed (see container.js)
  19: p => ({ ...p, v: 20 }),   // 19 -> 20: colours live in the tray (proj.ts / proj.cw). Colour names from older files are turned into tray colours
                                //   by the app when it opens the project (src/modules/50-tray-core.js, trayIn): that needs the app's colour tables.
  20: p => ({ ...p, v: 21 }),   // 20 -> 21 (layer update, step 1): any layer may hold items (layer.pl: free stamps t, pictures a, text boxes tx) in any mix, whether
                                //   or not it has an arrangement. Nothing in an old file moves; the number changes so an older app opens a file that uses this read-only.
};
// Returns { project, newer }. A file from a newer app is returned untouched with newer:true (open read-only, never rewrite).
function fmtMigrate(p) {
  const v = Number.isInteger(p && p.v) ? p.v : 18;
  if (v > FMT_LATEST) return { project: p, newer: true };
  let cur = { ...p };
  for (let n = Math.max(v, 1); n < FMT_LATEST; n++) cur = (FMT_STEPS[Math.max(n, 18)] || (x => x))(cur);
  cur.v = FMT_LATEST;
  return { project: cur, newer: false };
}
export {fmtMigrate,FMT_LATEST};
