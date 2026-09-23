/*
 * Service worker — always serve the latest deployment.
 *
 * The page registers this file as /sw.js?v=<buildId>. A new deployment has a
 * new build id, so the browser installs a fresh worker (and a fresh cache) and
 * the old cache is deleted on activate.
 *
 * Strategies:
 *   HTML navigations        network-first  (cache only as an offline fallback)
 *   Next.js RSC payloads     network-only   (must match the current build)
 *   /_next/static/*          cache-first    (content-hashed, immutable)
 *   other same-origin GETs   stale-while-revalidate (images, icons, manifest)
 *   cross-origin             untouched      (fonts etc. use normal HTTP caching)
 */

const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE_PREFIX = 'boda-madhukar-portfolio-';
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const OFFLINE_URL = '/';
const PRECACHE = ['/', '/madhukar.png', '/icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // cache: 'reload' bypasses the HTTP cache so we precache the new build.
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .catch(() => {
        /* precache is best-effort; never block installation on it */
      })
  );
  // Normally the page asks before activating (see SKIP_WAITING below), so an
  // open tab is never switched to new code mid-session. A registration without
  // a version comes from the old cache-first page code, which has no prompt:
  // take over right away so those visitors stop getting stale pages.
  if (VERSION === 'dev') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      // Also clears the v1 cache left by the previous cache-first worker.
      await caches.delete('boda-madhukar-portfolio-v1');
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isRscRequest(request, url) {
  return request.headers.get('RSC') === '1' || url.searchParams.has('_rsc');
}

async function putInCache(request, response) {
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(event) {
  try {
    const preloaded = await event.preloadResponse;
    const response = preloaded || (await fetch(event.request));
    return await putInCache(event.request, response);
  } catch {
    const cached = (await caches.match(event.request)) || (await caches.match(OFFLINE_URL));
    return cached || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  return putInCache(request, await fetch(request));
}

async function staleWhileRevalidate(event) {
  const cached = await caches.match(event.request);
  const refresh = fetch(event.request)
    .then((response) => putInCache(event.request, response))
    .catch(() => cached);
  if (cached) {
    event.waitUntil(refresh);
    return cached;
  }
  return refresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isRscRequest(request, url)) return; // network-only, browser default

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(event));
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/')) return;

  event.respondWith(staleWhileRevalidate(event));
});
