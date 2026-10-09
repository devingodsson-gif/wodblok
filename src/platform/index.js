// The platform seam: everything the app needs from outside itself goes through here, so a desktop or mobile version
// means writing another adapter and nothing else. This is the artifact/browser adapter: what the app can see and do is what v100 did.
// Rules: no work on import; no alert/confirm/prompt; callers keep their own try/catch (these do not swallow errors).

import {records,files} from './web.js';

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

// A named collection of records for projects and the stamp library, shaped like the artifact db's collection (get() -> {docs}, doc(id).get/set/delete)
// so callers use one code path. Backed by IndexedDB (web adapter). Returns null when the browser has none; callers then use kv.
// The first time a collection is opened, records held in the old single localStorage key are copied in (the old key is left in place).
const hasRecords = () => typeof indexedDB !== 'undefined' && !!indexedDB;
async function collection(name, legacyKey) {
  if (!hasRecords()) return null;
  const pre = name + ':', flag = '__migrated:' + name;
  try {
    if (legacyKey && !(await records.get(flag))) {
      let old = {}; try { old = JSON.parse(kv.get(legacyKey) || '{}') || {}; } catch (e) { /* unreadable: nothing to copy */ }
      for (const [id, v] of Object.entries(old)) if (!(await records.get(pre + id))) await records.put(pre + id, v);
      await records.put(flag, 1);
    }
  } catch (e) { return null; }
  return {
    async get() { const ks = (await records.list()).filter(k => typeof k === 'string' && k.startsWith(pre)); return { docs: await Promise.all(ks.map(async k => { const v = await records.get(k); return { id: k.slice(pre.length), data: () => v }; })) }; },
    doc: id => ({
      async get() { const v = await records.get(pre + id); return { exists: v !== null, id, data: () => v }; },
      set: v => records.put(pre + id, v),
      delete: () => records.del(pre + id),
    }),
  };
}

// Crash recovery slots: the app writes its unsaved work here every few seconds. Nothing is written when the browser has no IndexedDB.
const recovery = {
  get: async k => (hasRecords() ? records.get('recovery:' + k) : null),
  put: async (k, v) => { if (hasRecords()) await records.put('recovery:' + k, v); },
  del: async k => { if (hasRecords()) await records.del('recovery:' + k); },
};

// Restart the app (used after Import everything so every module reads the restored data).
const reload = () => location.reload();

// The claude.ai artifact runtime: use('db' | 'user' | 'downloads' | 'sample'). Resolves to null when there is no runtime.
// Without the runtime, 'downloads' is served by the web adapter: a real Save dialog where the browser has one, a download otherwise.
const webDownloads = { save: async o => { try { await files.save(o.filename, new Blob([o.data])); } catch (e) { if (e && e.name === 'AbortError') { const d = new Error('declined'); d.code = 'declined'; throw d; } throw e; } } };
const use = n => window.claude ? claude.use(n).catch(() => null) : Promise.resolve(n === 'downloads' ? webDownloads : null);

// Clipboard (text and images).
const clipboard = {
  available: () => !!navigator.clipboard,
  writeText: t => navigator.clipboard.writeText(t),
  readText: () => navigator.clipboard.readText(),
  read: () => navigator.clipboard.read(),
  write: items => navigator.clipboard.write(items),
};

export {kv,use,clipboard,reload,collection,recovery};
