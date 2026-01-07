const CACHE_NAME = 'taller-costura-v3';

// 🔹 RUTAS RELATIVAS (funcionan en local y GitHub Pages)
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/db.js',
    './js/app.js',
    './js/views/administrar-tareas.js',
    './js/views/nuevo-corte.js',
    './js/views/gestion-trabajadores.js',
    './js/views/gestion-prendas.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Cacheando recursos:', urlsToCache);
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('🗑️ Eliminando cache viejo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    // Ignorar solicitudes a CDNs externos
    if (event.request.url.includes('://') && !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si está en cache, devolverlo
                if (response) {
                    return response;
                }

                // Si no está en cache, hacer fetch y cachear
                return fetch(event.request).then(fetchResponse => {
                    // Solo cachear respuestas exitosas y del mismo origen
                    if (!fetchResponse || fetchResponse.status !== 200 ||
                        !fetchResponse.url.startsWith(self.location.origin)) {
                        return fetchResponse;
                    }

                    // Clonar la respuesta para cachear
                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return fetchResponse;
                }).catch(() => {
                    // Fallback para páginas HTML
                    if (event.request.destination === 'document' ||
                        event.request.headers.get('Accept').includes('text/html')) {
                        return caches.match('./index.html');
                    }
                    return new Response('Offline', { status: 503 });
                });
            })
    );
});