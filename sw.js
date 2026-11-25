// Offline-Unterstützung: Seite zuerst frisch aus dem Netz (damit Updates sofort ankommen),
// ohne Netz aus dem Zwischenspeicher. Bei jeder Änderung VERSION hochzählen.
const VERSION = 'v30';
const CACHE = 'toms-form-' + VERSION;
const SHELL = ['./', './index.html', './sync.js', './nutrition.js', './training.js', './manifest.webmanifest', './icons/apple-touch-icon.png', './icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return; // Dienst-Anfragen (Sync, Suche) nie zwischenspeichern
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
