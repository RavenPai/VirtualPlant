self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('vp-beta-1').then((cache) => cache.addAll(['/'])))
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  )
})
