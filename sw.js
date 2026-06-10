const CACHE = 'capricorn-v8';

function shots(slug) {
  return Array.from({ length: 8 }, (_, i) =>
    i === 0 ? `./assets/screenshots/${slug}.png` : `./assets/screenshots/${slug}-${i + 1}.png`
  );
}

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
  ...shots('vaultcap'),
  ...shots('pulsecap'),
  ...shots('prismcap'),
  ...shots('steadycap'),
  ...shots('ledgercap'),
  ...shots('deeponycap'),
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-1024.png',
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
