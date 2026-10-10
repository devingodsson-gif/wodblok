// A stand-in for the browser's folder picker, so the Projects folder can be tested without a real dialog.
// files: [{ name, path }] (real files on disk). The picker returns a folder handle that lists them.
const fs = require('fs');

async function installFolder(page, files, folderName = 'My patterns') {
  const data = files.map(f => ({ name: f.name, b64: fs.readFileSync(f.path).toString('base64') }));
  await page.evaluate(({ data, folderName }) => {
    window.showDirectoryPicker = async () => ({
      kind: 'directory', name: folderName,
      queryPermission: async () => 'granted', requestPermission: async () => 'granted',
      async *entries() {
        for (const f of data) {
          yield [f.name, { kind: 'file', name: f.name, getFile: async () => new File([Uint8Array.from(atob(f.b64), c => c.charCodeAt(0))], f.name, { lastModified: 1760000000000 }) }];
        }
      },
    });
  }, { data, folderName });
}
module.exports = { installFolder };
