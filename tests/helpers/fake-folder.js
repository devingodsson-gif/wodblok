// A stand-in for the browser's folder picker, so the Projects folder can be tested without a real dialog.
// files: [{ name, path }] (real files on disk) the folder starts with. The picker returns a folder handle that lists its files, can open them,
// and (when writable) can create and write new ones. window.__folder.files holds the current contents (name -> byte length) and
// window.__folder.perms the permission modes that were asked for.
const fs = require('fs');

async function installFolder(page, files, { folderName = 'My patterns', writable = true } = {}) {
  const data = files.map(f => ({ name: f.name, b64: fs.readFileSync(f.path).toString('base64') }));
  await page.evaluate(({ data, folderName, writable }) => {
    const store = new Map(data.map(f => [f.name, Uint8Array.from(atob(f.b64), c => c.charCodeAt(0))]));
    window.__folder = { files: {}, perms: [], sync() { this.files = Object.fromEntries([...store].map(([k, v]) => [k, v.length])); } };
    window.__folder.sync();
    const fileHandle = name => ({
      kind: 'file', name,
      getFile: async () => new File([store.get(name)], name, { lastModified: 1760000000000 }),
      queryPermission: async () => 'granted', requestPermission: async () => 'granted',
      createWritable: async () => ({
        write: async d => { store.set(name, new Uint8Array(await new Blob([d]).arrayBuffer())); },
        close: async () => { window.__folder.sync(); },
      }),
    });
    const dir = {
      kind: 'directory', name: folderName,
      queryPermission: async ({ mode } = {}) => (mode === 'readwrite' && !writable ? 'prompt' : 'granted'),
      requestPermission: async ({ mode } = {}) => { window.__folder.perms.push(mode); return mode === 'readwrite' && !writable ? 'denied' : 'granted'; },
      async *entries() { for (const n of store.keys()) yield [n, fileHandle(n)]; },
      getFileHandle: async (name, o = {}) => {
        if (!store.has(name)) {
          if (!o.create) { const e = new Error('not found'); e.name = 'NotFoundError'; throw e; }
          store.set(name, new Uint8Array(0)); window.__folder.sync();
        }
        return fileHandle(name);
      },
    };
    window.showDirectoryPicker = async () => dir;
  }, { data, folderName, writable });
}
module.exports = { installFolder };
