const CACHE_NAME = 'finance-plan-cache-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/steep-theme.css?v=2.5',
  '/css/app.css?v=2.5',
  '/js/api.js?v=2.5',
  '/js/auth.js?v=2.5',
  '/js/app.js?v=2.5',
  '/js/dashboard.js?v=2.5',
  '/js/transactions.js?v=2.5',
  '/js/budgets.js?v=2.5',
  '/js/bankParser.js?v=2.5',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-light.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Fazendo pré-cache dos assets essenciais v4');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[SW] Aviso no cache inicial:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar requisições de API para não cachear dados dinâmicos
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Para navegação HTML, usar Network-First garantindo que atualizações sejam imediatas
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
