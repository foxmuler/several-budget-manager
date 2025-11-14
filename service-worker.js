const CACHE_NAME = 'several-budget-pwa-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  'https://cdn.tailwindcss.com',
  // CDN dependencies from importmap
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-router-dom@^7.9.5',
  'https://aistudiocdn.com/localforage@^1.10.0',
  'https://aistudiocdn.com/recharts@^3.4.1',
  'https://aistudiocdn.com/@google/genai@^1.29.0',
  // Icon from manifest
  'https://cdn-icons-png.flaticon.com/512/781/781760.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and precaching assets');
        // Use {cache: "reload"} to ensure we get fresh versions from the network,
        // bypassing the browser's HTTP cache.
        const requests = urlsToCache.map(url => new Request(url, {cache: 'reload'}));
        return cache.addAll(requests);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Non-GET requests are not cached and should be handled by the network.
  if (event.request.method !== 'GET') {
      return;
  }
  
  event.respondWith(
    // Implement a cache-first strategy.
    caches.match(event.request)
      .then((response) => {
        // If a response is found in the cache, return it.
        if (response) {
          return response;
        }

        // If the request is not in the cache, fetch it from the network.
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response.
            if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
              return response;
            }
            
            // Clone the response because it's a stream and can only be consumed once.
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Cache the new response for future use.
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
          // Delete any caches that are not in our whitelist.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
