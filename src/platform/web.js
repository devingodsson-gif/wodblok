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
const canOpen = () => typeof /** @type {any} */ (window).showOpenFilePicker === 'function';
const picker = (name, type) => (type ? [{ accept: { [type]: ['.' + name.split('.').pop()] } }] : undefined);
// Write a file: into the file the person already chose (opts.handle), else through the Save dialog where the browser has one,
// else as a download. Returns how it went and the file handle (when there is one) so the next write can go to the same file.
const write = async (name, data, opts = {}) => {
  const h0 = /** @type {any} */ (opts.handle);
  if (h0) {
    try {
      if (h0.queryPermission && (await h0.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await h0.requestPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('no permission');
      const w = await h0.createWritable(); await w.write(data); await w.close(); return { how: 'saved', handle: h0 };
    } catch (e) { if (e && e.name === 'AbortError') throw e; }   // the file moved or access was refused: fall through and ask again
  }
  if (canSave()) {
    try { const h = await /** @type {any} */ (window).showSaveFilePicker({ suggestedName: name, types: picker(name, opts.type) }); const w = await h.createWritable(); await w.write(data); await w.close(); return { how: 'saved', handle: h }; }
    catch (e) { if (e && e.name === 'AbortError') throw e; }
  }
  const a = document.createElement('a'), u = URL.createObjectURL(data); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 4000); return { how: 'downloaded', handle: null };
};
const FOLDER_KEY = 'folder:projects';
const files = {
  /** Opens the Save dialog now and returns the file to write later (so a long export can ask first, while the click still counts). null when the browser has no Save dialog; throws AbortError when the person cancels. */
  pick: async (name, type) => { if (!canSave()) return null; try { return await /** @type {any} */ (window).showSaveFilePicker({ suggestedName: name, types: picker(name, type) }); } catch (e) { if (e && e.name === 'AbortError') throw e; return null; } },
  canSave,
  canOpen,
  write,
  save: async (name, data, opts = {}) => (await write(name, data, opts)).how,
  /** The Open dialog, keeping the file's handle so Save can write back to it. Resolves null when the person cancels. */
  open: async () => {
    try {
      const [h] = await /** @type {any} */ (window).showOpenFilePicker({ multiple: false, types: [{ description: 'WODBLOK projects', accept: { 'application/zip': ['.wodblok'] } }] });
      return { file: await h.getFile(), handle: h };
    } catch (e) { if (e && e.name === 'AbortError') return null; throw e; }
  },
  /** A folder of projects (Chrome, Edge). pickFolder asks once and remembers the handle, so the next launch can list it again (the browser may ask for permission). */
  canPickFolder: () => typeof /** @type {any} */ (window).showDirectoryPicker === 'function',
  pickFolder: async () => {
    try { const h = await /** @type {any} */ (window).showDirectoryPicker({ mode: 'readwrite', id: 'wodblok-projects' }); try { await records.put(FOLDER_KEY, h); } catch (e2) { /* it just will not be remembered for next time */ } return h; }
    catch (e) { if (e && e.name === 'AbortError') return null; throw e; }
  },
  savedFolder: async () => (await records.get(FOLDER_KEY)) || null,
  forgetFolder: async () => { await records.del(FOLDER_KEY); },
  /** true when the folder can be read now; asks the person when the browser needs a click first (call from a click). */
  folderAccess: async h => { try { return (await h.queryPermission({ mode: 'read' })) === 'granted' || (await h.requestPermission({ mode: 'read' })) === 'granted'; } catch (e) { return false; } },
  /** true when files can be written into the folder; asks the person when the browser needs a click first (call from a click). */
  folderWritable: async h => { try { return (await h.queryPermission({ mode: 'readwrite' })) === 'granted' || (await h.requestPermission({ mode: 'readwrite' })) === 'granted'; } catch (e) { return false; } },
  /** Writes a new file into the folder. It never replaces a file that is already there: the name becomes name-2.wodblok, name-3.wodblok, and so on. */
  saveToFolder: async (h, name, data) => {
    const m = /^(.*?)(\.wodblok)$/i.exec(name) || [name, name, '']; let n = name, i = 1;
    for (;;) {
      try { await h.getFileHandle(n); } catch (e) { if (e && e.name === 'NotFoundError') break; throw e; }
      if (++i > 999) throw new Error('Too many files with that name.');
      n = m[1] + '-' + i + m[2];
    }
    const fh = await h.getFileHandle(n, { create: true }), w = await fh.createWritable(); await w.write(data); await w.close();
    return { name: n, handle: fh };
  },
  /** The project files directly inside the folder (.wodblok), newest name last. */
  listFolder: async h => { const out = []; for await (const [n, fh] of /** @type {any} */ (h).entries()) if (fh.kind === 'file' && /\.wodblok$/i.test(n)) out.push({ name: n, handle: fh }); return out.sort((a, b) => a.name.localeCompare(b.name)); },
  /** Files the system opens this app with (the installed app as the .wodblok opener). Calls cb(file, handle) for each. */
  onLaunch: cb => {
    const q = /** @type {any} */ (window).launchQueue;
    if (q && q.setConsumer) q.setConsumer(async p => { for (const h of p.files || []) { try { cb(await h.getFile(), h); } catch (e) { /* unreadable: ignore */ } } });
  },
};
// The installed / offline web app: a service worker keeps the app on the device. A new version waits until the next launch
// (or until the user presses the update dot); nothing here ever reloads the page by itself.
const isWebApp = () => 'serviceWorker' in navigator && /^https?:$/.test(location.protocol);
let swReg = null;
const offline = {
  available: isWebApp,
  /** Registers the worker and calls onWaiting() when a newer version is installed and waiting. */
  register: async onWaiting => {
    swReg = await navigator.serviceWorker.register('sw.js');
    const check = () => { if (swReg.waiting && navigator.serviceWorker.controller) onWaiting(); };
    check();
    swReg.addEventListener('updatefound', () => { const w = swReg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') check(); }); });
  },
  /** Lets the waiting version take over; resolves when it has. The caller reloads. */
  apply: () => /** @type {Promise<void>} */ (new Promise(res => {
    if (!swReg || !swReg.waiting) return res(undefined);
    navigator.serviceWorker.addEventListener('controllerchange', () => res(undefined), { once: true });
    swReg.waiting.postMessage('apply');
  })),
};
// Browser storage: ask the browser to keep the data (it may otherwise clear it when space is short), and report how much is used.
const storage = {
  available: () => !!(navigator.storage && navigator.storage.estimate),
  persist: async () => (navigator.storage && navigator.storage.persist ? navigator.storage.persist() : false),
  persisted: async () => (navigator.storage && navigator.storage.persisted ? navigator.storage.persisted() : false),
  estimate: async () => { const e = await navigator.storage.estimate(); return { used: e.usage || 0, quota: e.quota || 0 }; },
};
export {records,blobs,files,offline,storage};
