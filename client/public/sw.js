// Service Worker - Force cache clear and self-destruct
// Version 2 - This immediately clears all caches and unregisters itself

const CLEAR_CACHE_VERSION = 'clear-v2';

self.addEventListener('install', () => {
  console.log('[SW] Installing - will clear cache and unregister');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating - clearing all caches');
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => {
        console.log('[SW] Deleting cache:', name);
        return caches.delete(name);
      }));
    }).then(() => {
      console.log('[SW] All caches cleared, unregistering');
      return self.registration.unregister();
    }).then(() => {
      console.log('[SW] Unregistered successfully');
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach((client) => {
        console.log('[SW] Reloading client:', client.url);
        client.postMessage({ type: 'RELOAD' });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Don't cache anything - just pass through to network
  event.respondWith(fetch(event.request));
});
