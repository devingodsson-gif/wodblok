// The migration chain for project files. Each step is a pure function from format n to n+1. Format numbers continue from the
// single-file app's v:18; the zip container starts at 19. Files older than 18 are treated as 18 (the app has always read them).
// Unknown fields are kept: every step copies the project and only touches what it names.
const FMT_LATEST = 19;
const FMT_STEPS = {
  18: p => ({ ...p, v: 19 }),   // 18 -> 19: same content; images move out of the JSON into assets/ when packed (see container.js)
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
