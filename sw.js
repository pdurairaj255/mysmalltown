// My Small Town — service worker.
// Pre-caches the app so it opens offline once installed. Pages are
// network-first (so updates show up right away when online); other app files,
// Google Fonts and the Supabase library are served from cache and refreshed
// behind. Data from the Supabase API is never cached.
// Bump CACHE when the file list changes.

const CACHE = 'mst-v4';
const APP_FILES = [
  './',
  'index.html',
  'signin.html',
  'share.html',
  'town.html',
  'year.html',
  'recap.html',
  'stats.html',
  'groups.html',
  'new-group.html',
  'css/styles.css',
  'js/app.js',
  'js/avatars.js',
  'js/api.js',
  'js/config.js',
  'js/town.js',
  'js/ui.js',
  'js/util.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png'
];
const CACHEABLE_HOSTS = [self.location.host, 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || !CACHEABLE_HOSTS.includes(url.host)) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      // Fetch by URL: a navigation request can't take options. no-cache = always
      // check the server for a newer version.
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
    );
    return;
  }

  // App code: network-first too, so a new version is never mixed with old modules.
  if (url.host === self.location.host) {
    event.respondWith(
      fetch(req, { cache: 'no-cache' }) // always check the server for a newer version
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok || res.type === 'opaque') {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || fresh;
    })
  );
});
