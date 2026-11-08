// My Small Town — service worker.
// Pre-caches the app so it opens offline once installed. Pages are
// network-first (so updates show up right away when online); other app files,
// Google Fonts and the Supabase library are served from cache and refreshed
// behind. Data from the Supabase API is never cached.
// Bump CACHE when the file list changes.

const CACHE = 'mst-v17';
const APP_FILES = [
  'index.html',
  'signin.html',
  'share.html',
  'town.html',
  'recap.html',
  'stats.html',
  'groups.html',
  'new-group.html',
  'who.html',
  'settings.html',
  'css/styles.css',
  'js/app.js',
  'js/avatars.js',
  'js/surprises.js',
  'js/api.js',
  'js/config.js',
  'js/town.js',
  'js/townview.js',
  'js/ui.js',
  'js/util.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png'
];
const CACHEABLE_HOSTS = [self.location.host, 'fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

// Cloudflare Pages redirects /town.html to /town and /index.html to /. A
// response that went through a redirect can't answer a page load, so keep a
// clean copy of it instead.
async function clean(res) {
  if (!res.redirected) return res;
  return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
}

// The one cache address for a page, however it was reached: /, /town, /town.html?x=1.
function pageKey(address) {
  const url = new URL(address);
  const last = url.pathname.split('/').pop();
  if (!last) url.pathname += 'index.html';
  else if (!last.includes('.')) url.pathname += '.html';
  return url.origin + url.pathname;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(APP_FILES.map(async (file) => {
    const res = await fetch(file, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Could not cache ${file}`);
    await cache.put(file, await clean(res));
  }))));
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
        .then(clean)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(pageKey(req.url), copy));
          }
          return res;
        })
        .catch(() => caches.match(pageKey(req.url)).then((hit) => hit || caches.match('index.html')))
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
