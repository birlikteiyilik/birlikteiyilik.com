const CACHE_NAME = 'bia-yoklama-shell-v1';
const APP_SHELL = [
  '/yoklama',
  '/css/yoklama.css?v=2',
  '/js/yoklama.js?v=4',
  '/images/favicon-square.png',
  '/images/yoklama-icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('bia-yoklama-shell-') && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  const url = new URL(request.url);
  const isAppShell = url.pathname === '/yoklama' || url.pathname === '/yoklama/' ||
    url.pathname === '/css/yoklama.css' || url.pathname === '/js/yoklama.js' ||
    url.pathname === '/images/favicon-square.png' || url.pathname === '/images/yoklama-icon-512.png';
  if (!isAppShell) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const app = await caches.match('/yoklama');
        if (app) return app;
      }
      return new Response('Çevrimdışıyken bu içerik açılamıyor.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
