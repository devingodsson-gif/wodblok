// WODBLOK service worker (written into dist/web by tools/build-web.js, which fills in the cache name).
// The app is one HTML page plus icons, and its own files in assets/ (2.98.1). Everything is kept on the device so the app opens and works with no network.
// A new version installs in the background and WAITS: it takes over the next time the app is opened, or when the page asks
// for it (the update dot), so it never changes the app under someone who is working.
const CACHE = '@@CACHE@@';
// 2.98.1: the app's own files in assets/ (built-in pictures, fonts, data; docs/asset-split-plan.md) are fetched only when needed and kept in a cache of their own
// that outlives versions: a file's name holds its content's hash, so a name is never reused for other content and a new version only fetches what changed.
const ASSETS = 'wodblok-assets-1';
// 2.98.5 (the build fills these in): every asset file of this version, and the ones start-up waits for (the shapes and templates). A version stores its start-up
// files as it installs, so applying it with no network still opens; when it takes over it deletes the asset files no longer used, so the cache does not grow.
const KEEP = '@@ASSETS_ALL@@', START = '@@ASSETS_START@@';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon.ico', 'icon-32.png'];
self.addEventListener('install', e => e.waitUntil(Promise.all([caches.open(CACHE).then(c => c.addAll(FILES)), caches.open(ASSETS).then(async c => { for (const f of START) if (!(await c.match(f))) await c.add(f); })])));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('wodblok-') && k !== CACHE && k !== ASSETS).map(k => caches.delete(k))))
    .then(() => caches.open(ASSETS)).then(async c => { const keep = new Set(KEEP.map(f => new URL(f, self.registration.scope).href)); for (const q of await c.keys()) if (!keep.has(q.url)) await c.delete(q); })
    .then(() => self.clients.claim())));
self.addEventListener('message', e => { if (e.data === 'apply') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  if (new URL(r.url).pathname.includes('/assets/')) {
    e.respondWith(caches.open(ASSETS).then(async c => { const hit = await c.match(r); if (hit) return hit; const res = await fetch(r); if (res.ok) c.put(r, res.clone()); return res; }));
    return;
  }
  // the page itself is always answered from the cache (the installed version); other files come from the cache first, then the network
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r.mode === 'navigate' ? 'index.html' : r, { ignoreSearch: true });
    return hit || fetch(r);
  }));
});
