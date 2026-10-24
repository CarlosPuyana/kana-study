const CACHE='manga-h2a-offline-v1';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{if(new URL(event.request.url).origin===self.location.origin)event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))??fetch(event.request)));});
