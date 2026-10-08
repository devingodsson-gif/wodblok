// The platform seam: everything the app needs from outside itself goes through here, so a desktop or mobile version
// means writing another adapter and nothing else. This is the artifact/browser adapter: it behaves exactly as v100 did.
// Rules: no work on import; no alert/confirm/prompt; callers keep their own try/catch (these do not swallow errors).

// Small key/value settings and records (v100: window.localStorage under the wbNN_ keys).
const kv = {
  get: k => localStorage.getItem(k),
  set: (k, v) => localStorage.setItem(k, v),
  remove: k => localStorage.removeItem(k),
  keys: () => Object.keys(localStorage),
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
