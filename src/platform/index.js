// The platform seam: everything the app needs from outside itself goes through here, so a desktop or mobile version
// means writing another adapter and nothing else. This is the artifact/browser adapter: what the app can see and do is what v100 did.
// Rules: no work on import; no alert/confirm/prompt; callers keep their own try/catch (these do not swallow errors).

// Small key/value settings and records. v100 kept about 36 separate localStorage keys (wb2_ ... wb95_). They now live in ONE
// versioned record, `wb_settings` = {v:1, values:{key:string}}, so they can be exported, versioned and moved as a unit.
// Values over 64 KB (imported fonts, saved projects, the stamp library, the working-copy autosave) stay in their own keys.
// The first read migrates the old keys into the record and leaves them where they are (nothing is deleted on migration).
// Callers keep their own try/catch: these functions do not swallow storage errors.
const SETTINGS_KEY = 'wb_settings', SETTINGS_V = 1, BIG = 64 * 1024, OWNED = /^wb\d+_/;
let record = null;
const saveRecord = () => localStorage.setItem(SETTINGS_KEY, JSON.stringify(record));
function loadRecord() {
  if (record) return record;
  try {
    const t = localStorage.getItem(SETTINGS_KEY);
    if (t) { const o = JSON.parse(t); if (o && o.v === SETTINGS_V && o.values && typeof o.values === 'object') return (record = o); }
  } catch (e) { /* unreadable: rebuild from the old keys below */ }
  record = { v: SETTINGS_V, values: {} };
  try {
    for (const k of Object.keys(localStorage)) if (OWNED.test(k)) { const v = localStorage.getItem(k); if (v !== null && v.length <= BIG) record.values[k] = v; }
    saveRecord();
  } catch (e) { /* storage unavailable: keep the in-memory record so the session still works */ }
  return record;
}
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const kv = {
  get: k => { const r = loadRecord(); return has(r.values, k) ? r.values[k] : localStorage.getItem(k); },
  set: (k, v) => {
    const r = loadRecord(), s = String(v);
    if (OWNED.test(k) && s.length <= BIG) { r.values[k] = s; saveRecord(); localStorage.removeItem(k); }
    else { if (has(r.values, k)) { delete r.values[k]; saveRecord(); } localStorage.setItem(k, s); }
  },
  remove: k => { const r = loadRecord(); if (has(r.values, k)) { delete r.values[k]; saveRecord(); } localStorage.removeItem(k); },
  keys: () => [...new Set([...Object.keys(loadRecord().values), ...Object.keys(localStorage)])].filter(k => k !== SETTINGS_KEY),
};

// Restart the app (used after Import everything so every module reads the restored data).
const reload = () => location.reload();

// The claude.ai artifact runtime: use('db' | 'user' | 'downloads' | 'sample'). Resolves to null when there is no runtime.
const use = n => window.claude ? claude.use(n).catch(() => null) : Promise.resolve(null);

// Clipboard (text and images).
const clipboard = {
  available: () => !!navigator.clipboard,
  writeText: t => navigator.clipboard.writeText(t),
  readText: () => navigator.clipboard.readText(),
  read: () => navigator.clipboard.read(),
  write: items => navigator.clipboard.write(items),
};

export {kv,use,clipboard,reload};
