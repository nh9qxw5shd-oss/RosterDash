// Minimal offline cache for the mobile companion.
const CACHE = 'lbb-mobile-v1';
const ASSETS = [
  './lbb_mobile.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Network-first for Supabase calls; cache-first for local assets.
  if (req.url.includes('supabase') || req.url.includes('/rest/v1/') || req.url.includes('/auth/v1/')) {
    return; // let it hit network
  }
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((cache) => cache.put(req, copy));
      return resp;
    }).catch(() => cached))
  );
});
