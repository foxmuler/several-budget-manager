const CACHE_NAME = 'several-budget-pwa-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-router-dom@^7.9.5',
  'https://aistudiocdn.com/localforage@^1.10.0',
  'https://aistudiocdn.com/recharts@^3.4.1',
  'https://aistudiocdn.com/@google/genai@^1.29.0',
  'https://cdn-icons-png.flaticon.com/512/781/781760.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Non-GET requests are not cached
  if (event.request.method !== 'GET') {
      return;
  }
  
  event.respondWith(
    // Try the cache
    caches.match(event.request)
      .then((response) => {
        // Fallback to network
        return response || fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response;
            }
            // Clone the response, since it can be consumed only once
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Cache the new response
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
