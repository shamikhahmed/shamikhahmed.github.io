const CACHE = 'capricorn-v5';
const ASSETS = [
  './',
  './index.html',
  './vaultcap.html',
  './pulsecap.html',
  './prismcap.html',
  './steadycap.html',
  './ledgercap.html',
  './deeponycap.html',
  './product.html',
  './about.html',
  './sovereignty.html',
  './solutions.html',
  './app.html',
  './css/capricorn.css',
  './js/products-data.js',
  './js/product-media.js',
  './js/product-page.js',
  './js/capricorn.js',
  './assets/logo.svg',
  './assets/screenshots/vaultcap.png',
  './assets/screenshots/vaultcap-2.png',
  './assets/screenshots/pulsecap.png',
  './assets/screenshots/pulsecap-2.png',
  './assets/screenshots/prismcap.png',
  './assets/screenshots/prismcap-2.png',
  './assets/screenshots/steadycap.png',
  './assets/screenshots/steadycap-2.png',
  './assets/screenshots/ledgercap.png',
  './assets/screenshots/ledgercap-2.png',
  './assets/screenshots/deeponycap.png',
  './assets/screenshots/deeponycap-2.png',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => cached)
    )
  );
});
