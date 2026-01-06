const CACHE_NAME = 'taller-costura-v2';
const BASE_PATH = '/tallerv4/'; // 🔹 ruta de tu repo en GitHub Pages

const urlsToCache = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'css/style.css',
    BASE_PATH + 'js/db.js',
    BASE_PATH + 'js/app.js',
    BASE_PATH + 'js/views/administrar-tareas.js',
    BASE_PATH + 'js/views/nuevo-corte.js',
    BASE_PATH + 'js/views/gestion-trabajadores.js',
    BASE_PATH + 'js/views/gestion-prendas.js',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'icons/icon-192x192.png',
    BASE_PATH + 'icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
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
                        return caches.delete(cacheName);
                    }
                })
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    // Ignorar solicitudes externas
    if (event.request.url.includes('://') && !event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request).then(fetchResponse => {
                if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') return fetchResponse;
                const responseToCache = fetchResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
                return fetchResponse;
            }).catch(() => {
                // fallback para HTML
                if (event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
                    return caches.match(BASE_PATH + 'index.html');
                }
            }))
    );
});
