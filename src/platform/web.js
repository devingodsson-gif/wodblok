// @ts-check
// Web adapter: IndexedDB for small records, OPFS for large files, real Save where the browser has it, download elsewhere.
// No work on import; every function opens what it needs when called. Errors are not swallowed.
/** @typedef {import('./types.d.ts').Records} Records */
const DB = 'wodblok', STORE = 'records';
let dbp = null;
const open = () => dbp || (dbp = new Promise((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(STORE);
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
}));
const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction(STORE, mode), q = fn(t.objectStore(STORE)); t.oncomplete = () => res(q.result); t.onerror = () => rej(t.error); }); };
/** @type {Records} */
const records = {
  get: async k => { const v = await tx('readonly', s => s.get(k)); return v === undefined ? null : v; },
  put: async (k, v) => { await tx('readwrite', s => s.put(v, k)); },
  del: async k => { await tx('readwrite', s => s.delete(k)); },
  list: async () => /** @type {string[]} */ (await tx('readonly', s => s.getAllKeys())),
};
const root = () => navigator.storage.getDirectory();
const blobs = {
  put: async (name, data) => { const h = await (await root()).getFileHandle(name, { create: true }), w = await h.createWritable(); await w.write(data); await w.close(); },
  get: async name => { try { return await (await (await root()).getFileHandle(name)).getFile(); } catch (e) { if (e && e.name === 'NotFoundError') return null; throw e; } },
  del: async name => { try { await (await root()).removeEntry(name); } catch (e) { if (!(e && e.name === 'NotFoundError')) throw e; } },
  list: async () => { const out = []; for await (const [n] of /** @type {any} */ (await root()).entries()) out.push(n); return out; },
};
const canSave = () => typeof /** @type {any} */ (window).showSaveFilePicker === 'function';
const files = {
  canSave,
  save: async (name, data, opts = {}) => {
    if (canSave()) {
      try { const h = await /** @type {any} */ (window).showSaveFilePicker({ suggestedName: name, types: opts.type ? [{ accept: { [opts.type]: ['.' + name.split('.').pop()] } }] : undefined }); const w = await h.createWritable(); await w.write(data); await w.close(); return 'saved'; }
      catch (e) { if (e && e.name === 'AbortError') throw e; }
    }
    const a = document.createElement('a'), u = URL.createObjectURL(data); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 4000); return 'downloaded';
  },
};
export {records,blobs,files};
