// The app's own files (2.98.1, docs/asset-split-plan.md). Built-in content (mockup photos first; textures, fonts, shapes and templates next) is referred to by a
// string the build made (tools/assets.js): in the single-file app a data: address, the file itself; in the hosted app a relative address next to the page,
// "assets/<kind>/<name>.<hash>.<ext>", a file fetched only when it is needed and then kept by the browser (and the service worker, for offline use).
// This is the only place that turns a reference into something the app can use, and it only ever reaches the app's own host: anything else is refused.
//   assetUrl(ref)      an address to give an <img>, an Image, a CSS url() or a FontFace (the browser loads it when it needs it); '' for anything else
//   assetBytes(ref)    a promise of the file's bytes (Uint8Array), for code that reads a file (an export, opentype.js, a zip)
//   assetText(ref)     a promise of the file as text (JSON data)
//   assetPreload(list) data the app needs from its first moment (2.98.4: shapes, templates), each the data itself or its file's reference: null when there is
//                      nothing to fetch (the single file: start-up stays synchronous), else a promise that resolves once every file is here and parsed
//   assetData(v)       that data, read synchronously after the preload (v itself when it was never a reference)
// Rules: no work on import; callers keep their own try/catch (a missing file rejects, with the reference in the message).
const AS_OWN = /^assets\/[a-z0-9-]+\/[a-z0-9-]+\.[0-9a-f]{10}\.[a-z0-9]+$/, AS_DATA = /^data:[\w.+\/-]+;base64,/;
const isAsset = ref => typeof ref === 'string' && (AS_DATA.test(ref) || AS_OWN.test(ref));
const assetUrl = ref => (isAsset(ref) ? ref : '');
const asGot = new Map();   // reference -> promise of its bytes, so a file is fetched once
function assetBytes(ref) {
  if (!isAsset(ref)) return Promise.reject(new Error('Not one of the app\'s own files.'));
  if (!asGot.has(ref)) asGot.set(ref, (async () => {
    if (AS_DATA.test(ref)) { const b = atob(ref.slice(ref.indexOf(',') + 1)), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
    const r = await fetch(ref, { credentials: 'same-origin' });
    if (!r.ok) throw new Error('Could not load ' + ref + ' (' + r.status + ').');
    return new Uint8Array(await r.arrayBuffer());
  })().catch(e => { asGot.delete(ref); throw e; }));
  return asGot.get(ref);
}
const assetText = async ref => new TextDecoder().decode(await assetBytes(ref));
const asData = new Map();   // reference -> its parsed JSON, once preloaded
const asIsRef = v => typeof v === 'string' && AS_OWN.test(v);
function assetPreload(list) {
  const refs = list.filter(v => asIsRef(v) && !asData.has(v));
  if (!refs.length) return null;
  return Promise.all(refs.map(r => assetText(r).then(t => { asData.set(r, JSON.parse(t)); })));
}
function assetData(v) {
  if (!asIsRef(v)) return v;
  if (!asData.has(v)) throw new Error('Not loaded yet: ' + v);
  return asData.get(v);
}
export {assetBytes,assetData,assetPreload,assetText,assetUrl,isAsset};
