// Service Worker для максимального кэширования
const CACHE_NAME = 'paradise-shop-v1';
const STATIC_CACHE = 'paradise-static-v1';
const API_CACHE = 'paradise-api-v1';

// Статичные ресурсы для кэширования
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Активация и очистка старых кэшей
self.addEventListener('activate', (event) => {
  console.log('SW: Activating');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  console.log('SW: Fetching', request.url);

  // Кэширование API запросов
  if (request.url.includes('/api/')) {
    event.respondWith(
      caches.open(API_CACHE)
        .then((cache) => {
          return cache.match(request)
            .then((response) => {
              // Возвращаем из кэша если есть
              if (response) {
                console.log('SW: API cache hit', request.url);
                return response;
              }

              // Иначе делаем запрос и кэшируем результат
              return fetch(request)
                .then((response) => {
                  if (response.status === 200) {
                    console.log('SW: Caching API response', request.url);
                    const responseClone = response.clone();
                    cache.put(request, responseClone);
                  }
                  return response;
                })
                .catch(() => {
                  // При ошибке сети пытаемся вернуть устаревшие данные
                  console.log('SW: Network failed, trying stale cache', request.url);
                  return cache.match(request);
                });
            });
        })
    );
  }
  // Кэширование статичных ресурсов
  else {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            console.log('SW: Static cache hit', request.url);
            return response;
          }

          return fetch(request)
            .then((response) => {
              // Кэшируем только успешные ответы
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            });
        })
    );
  }
});
