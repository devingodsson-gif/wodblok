// @ts-check
// Web adapter: IndexedDB for small records, OPFS for large files, real Save where the browser has it, download elsewhere.
// No work on import; every function opens what it needs when called. Errors are not swallowed.
/** @typedef {import('./types.d.ts').Records} Records */
const WEB_DB = 'wodblok', WEB_STORE = 'records';
let webDbp = null;
const webOpen = () => webDbp || (webDbp = new Promise((res, rej) => {
  const r = indexedDB.open(WEB_DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(WEB_STORE);
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
}));
const webTx = async (mode, fn) => { const db = await webOpen(); return new Promise((res, rej) => { const t = db.transaction(WEB_STORE, mode), q = fn(t.objectStore(WEB_STORE)); t.oncomplete = () => res(q.result); t.onerror = () => rej(t.error); }); };
/** @type {Records} */
const records = {
  get: async k => { const v = await webTx('readonly', s => s.get(k)); return v === undefined ? null : v; },
  put: async (k, v) => { await webTx('readwrite', s => s.put(v, k)); },
  del: async k => { await webTx('readwrite', s => s.delete(k)); },
  list: async () => /** @type {string[]} */ (await webTx('readonly', s => s.getAllKeys())),
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
