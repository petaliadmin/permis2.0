/* PERMIS2.0 service worker — dependency-free.
 * - Precaches the app shell.
 * - Network-first for navigations (fresh HTML, offline fallback).
 * - Stale-while-revalidate for static assets.
 * - Never caches API calls or non-GET requests.
 */
const VERSION = 'v2';
const SHELL_CACHE = `permis2-shell-${VERSION}`;
const RUNTIME_CACHE = `permis2-runtime-${VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin requests; let the browser handle cross-origin (API).
  if (url.origin !== self.location.origin) return;
  if (url.port === '3001') return;

  // Navigations: network-first with offline fallback to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  // Must always resolve to a Response — returning undefined throws
  // "Failed to convert value to 'Response'".
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(
          () =>
            cached ||
            new Response('', { status: 504, statusText: 'Offline' })
        );
      return cached || network;
    })
  );
});
