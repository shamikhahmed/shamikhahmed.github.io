const CACHE = 'prismcap-v450';
const ASSETS = [
  './css/capricorn-core.css',
  './',
  './index.html',
  './landing.html',
  './presentation.html',
  './pitch.html',
  './manifest.json',
  './js/games/example-game.js',
  './js/dialogs.js',
  './js/app.js',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/identity.css',
  './public/favicon.svg',
  './public/mark.svg',
  './public/icon-maskable-192.png',
  './public/icon-maskable-512.png',
  './apple-touch-icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './privacy.html',
  './changelog.html',
  './assets/qr-prismcap.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          if (res.ok && event.request.url.startsWith(self.location.origin)) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
