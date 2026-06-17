const CACHE = 'capricorn-v24';

function deviceShots(slug) {
  return [`./assets/screenshots/${slug}-ipad.png`, `./assets/screenshots/${slug}-mac.png`];
}

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
  './scentcap.html',
  './auracap.html',
  './product.html',
  './about.html',
  './sovereignty.html',
  './solutions.html',
  './app.html',
  './css/capricorn.css',
  './css/capricorn-core.css',
  './css/home.css',
  './js/products-data.js',
  './js/product-media.js',
  './js/product-page.js',
  './js/capricorn.js',
  './js/capricorn-motion.js',
  './js/capricorn-hero.js',
  './js/home-experience.js',
  './js/vendor/gsap.min.js',
  './js/vendor/ScrollTrigger.min.js',
  './js/vendor/lenis.min.js',
  './js/vendor/three.module.min.js',
  './js/vendor/three.core.min.js',
  './assets/logo.svg',
  ...shots('vaultcap'),
  ...shots('pulsecap'),
  ...shots('prismcap'),
  ...shots('steadycap'),
  ...shots('ledgercap'),
  ...shots('deeponycap'),
  ...shots('scentcap'),
  ...shots('auracap'),
  ...deviceShots('vaultcap'),
  ...deviceShots('pulsecap'),
  ...deviceShots('prismcap'),
  ...deviceShots('steadycap'),
  ...deviceShots('ledgercap'),
  ...deviceShots('deeponycap'),
  ...deviceShots('scentcap'),
  ...deviceShots('auracap'),
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-1024.png',
  './js/capricorn-scene.js',
  './js/capricorn-premium-nav.js',
  './js/capricorn-cinematic.js',
  './js/capricorn-deck.js',
  './js/capricorn-deck-pro.js',
  './js/capricorn-pitch.js',
  './privacy.html',
  './changelog.html',
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
