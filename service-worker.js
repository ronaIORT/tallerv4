// service-worker.js - Versión corregida y optimizada
const CACHE_NAME = 'taller-costura-v2';
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


// Instalación del Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache)
                    .catch(error => {
                        console.warn('Algunos archivos no se pudieron cachear:', error);
                        // Continuar incluso si algunos archivos fallan
                        return cache.addAll(urlsToCache.filter(url =>
                            !url.includes('icons/') // Saltar iconos temporales
                        ));
                    });
            })
            .then(() => self.skipWaiting())
    );
});

// Activación: limpiar cachés antiguos
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('ServiceWorker: Eliminando caché antiguo', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Estrategia de caché para solicitudes
self.addEventListener('fetch', event => {
    // Solo cachear solicitudes GET
    if (event.request.method !== 'GET') return;

    // Ignorar solicitudes a APIs externas y a IndexedDB
    if (event.request.url.includes('chrome-extension://') ||
        event.request.url.includes('indexeddb://') ||
        (event.request.url.includes('://') && !event.request.url.startsWith(self.location.origin))) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si está en caché, devolverlo
                if (response) {
                    return response;
                }

                // Clonar la solicitud para usarla después
                const fetchRequest = event.request.clone();

                // Si no, intentar red
                return fetch(fetchRequest)
                    .then(fetchResponse => {
                        // Verificar si la respuesta es válida para cachear
                        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                            return fetchResponse;
                        }

                        // Clonar la respuesta para guardar en caché
                        const responseToCache = fetchResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(error => {
                                console.warn('ServiceWorker: No se pudo cachear', event.request.url, error);
                            });

                        return fetchResponse;
                    })
                    .catch(() => {
                        // Fallback mejorado para contenido esencial
                        if (event.request.url.includes('.html')) {
                            return caches.match('/index.html');
                        }
                        if (event.request.url.endsWith('/')) {
                            return caches.match('/');
                        }
                        return caches.match('/index.html');
                    });
            })
    );
});