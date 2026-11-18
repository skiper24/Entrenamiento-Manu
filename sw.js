// Versión de caché distinta a la app anterior. Solo almacena los archivos estáticos;
// los datos del usuario viven en localStorage y nunca se borran aquí.
const CACHE = 'manuel-gym-static-v2-20261118-b';
const ASSETS = ['./', './index.html', './app.css', './app.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Limpieza solo de cachés que pertenecen a esta app. No afecta el historial.
    await Promise.all(keys.filter(key => (key.startsWith('manuel-gym-')) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(req);
      if (response.ok && response.type === 'basic') cache.put(req, response.clone()).catch(() => {});
      return response;
    } catch {
      const cached = await cache.match(req, {ignoreSearch: true});
      if (cached) return cached;
      if (req.mode === 'navigate') return await cache.match('./index.html') || Response.error();
      return Response.error();
    }
  })());
});
