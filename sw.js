// Never Arrives — service worker
// Caches the app shell so the app opens instantly and still works offline.
// Bump CACHE_NAME whenever index.html/manifest/icons change, so old caches get cleared.
const CACHE_NAME = 'never-arrives-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './favicon-32.png',
  './favicon-16.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Cache-first for the app shell (fast repeat loads + offline support).
// Falls back to network for anything not in the shell (e.g. product photos from
// Pixabay, Google Fonts) — those aren't cached here since the catalog is large
// and photo URLs are third-party, but the core app itself always opens offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        // If a navigation request fails offline and isn't cached, fall back to the shell.
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
