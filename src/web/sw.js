// WODBLOK service worker (written into dist/web by tools/build-web.js, which fills in the cache name).
// The app is one HTML page plus icons. Everything is kept on the device so the app opens and works with no network.
// A new version installs in the background and WAITS: it takes over the next time the app is opened, or when the page asks
// for it (the update dot), so it never changes the app under someone who is working.
const CACHE = '@@CACHE@@';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('wodblok-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('message', e => { if (e.data === 'apply') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  // the page itself is always answered from the cache (the installed version); other files come from the cache first, then the network
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r.mode === 'navigate' ? 'index.html' : r, { ignoreSearch: true });
    return hit || fetch(r);
  }));
});
