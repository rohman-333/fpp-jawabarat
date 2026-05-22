self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          notificationId: data.notificationId || null,
          url: data.href || data.url || '/notifications'
        }
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title || 'WIBAWA NUSANTARA', options)
      );
    } catch (err) {
      console.error('Error parsing push data', err);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const targetUrl = (event.notification.data && event.notification.data.url) || '/notifications';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// CACHE VERSION — increment this on every deploy to force old cache purge
const CACHE_NAME = 'wibawa-cache-v10';
const urlsToCache = [
  '/manifest.webmanifest',
  '/icons/icon-192.png'
];

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// On activate: DELETE ALL old caches unconditionally
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Delete every cache that is not the current version
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Purging old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      ).then(() => self.clients.claim());
    })
  );
});

// Fetch strategy: 
// - HTML pages (document requests) and RSC data: NETWORK-ONLY (never cache)
// - Feed paths: NETWORK-ONLY
// - API/auth/_next: bypass entirely
// - Static assets (.js, .css, images): network-first with cache fallback
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass service worker entirely for API, feed, debug feed health, auth, and Next.js internal routes
  if (
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/feed') || 
    url.pathname.startsWith('/debug/feed-health') || 
    url.pathname.startsWith('/auth') || 
    url.pathname.includes('_next')
  ) {
    return;
  }

  // NEVER cache HTML document requests or RSC payload — always go to network
  const isDocumentRequest = event.request.mode === 'navigate' || 
    event.request.headers.get('accept')?.includes('text/html') ||
    event.request.headers.get('RSC') === '1' ||
    url.searchParams.has('_rsc');

  if (isDocumentRequest) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response('Koneksi Anda terputus. Silakan periksa jaringan internet Anda.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
      })
    );
    return;
  }

  // Network-First for static assets only
  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200 && 
            (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || 
             url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png') || 
             url.pathname.endsWith('.webmanifest') || url.pathname.endsWith('.woff2'))) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(function() {
        return caches.match(event.request).then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });
      })
  );
});
