const CACHE_NAME = 'finance-plan-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/steep-theme.css',
  '/css/app.css',
  '/js/api.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/dashboard.js',
  '/js/transactions.js',
  '/js/budgets.js',
  '/js/bankParser.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Fazendo pré-cache dos assets essenciais');
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
  // Ignorar requisições de API para não cachear dados dinâmicos em cache estático
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retorna do cache mas busca atualização em background (Stale While Revalidate)
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
