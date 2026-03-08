// ===========================================================================
// Service Worker - Taller de Costura PWA
// Versión: 4.0 (Soporte completo offline incluyendo Dexie.js)
// ===========================================================================

const CACHE_NAME = "taller-costura-v5";

// 🔹 Archivos locales a cachear
const localUrlsToCache = [
  // HTML y manifest
  "./",
  "./index.html",
  "./manifest.json",

  // Iconos
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png",

  // CSS principal
  "./css/style.css",
  "./css/base.css",
  "./css/components.css",
  "./css/layout.css",
  "./css/modals.css",
  "./css/responsive.css",
  "./css/variables.css",

  // CSS de vistas
  "./css/views/administrar-tareas.css",
  "./css/views/dashboard.css",
  "./css/views/gestion-prendas.css",
  "./css/views/gestion-trabajadores.css",
  "./css/views/historial-pagos.css",
  "./css/views/nuevo-corte.css",

  // JavaScript principal
  "./js/app.js",
  "./js/db.js",

  // JavaScript de vistas
  "./js/views/gestion-prendas.js",
  "./js/views/gestion-trabajadores.js",
  "./js/views/historial-pagos.js",
  "./js/views/nuevo-corte.js",

  // JavaScript de administrar-tareas (módulos)
  "./js/views/administrar-tareas/index.js",
  "./js/views/administrar-tareas/tab-asignar.js",
  "./js/views/administrar-tareas/tab-corte.js",
  "./js/views/administrar-tareas/tab-editar.js",
  "./js/views/administrar-tareas/tab-resumen.js",
  "./js/views/administrar-tareas/tab-trabajador.js",
  "./js/views/administrar-tareas/utils.js",
];

// 🔹 Recursos externos a cachear (CDN)
const externalUrlsToCache = ["https://unpkg.com/dexie@4.0.8/dist/dexie.js"];

// ===========================================================================
// INSTALACIÓN - Cachear todos los recursos
// ===========================================================================
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker: Instalando versión", CACHE_NAME);

  event.waitUntil(
    Promise.all([
      // Cachear archivos locales
      caches.open(CACHE_NAME).then((cache) => {
        console.log("📦 Cacheando archivos locales...");
        return cache.addAll(localUrlsToCache);
      }),
      // Cachear archivos externos (CDN)
      caches.open(CACHE_NAME).then((cache) => {
        console.log("🌐 Cacheando archivos externos...");
        return Promise.all(
          externalUrlsToCache.map((url) =>
            fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
                console.warn("⚠️ No se pudo cachear:", url);
              })
              .catch((err) => {
                console.warn("⚠️ Error cacheando externo:", url, err);
              }),
          ),
        );
      }),
    ])
      .then(() => {
        console.log("✅ Service Worker: Instalación completada");
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error("❌ Error en instalación:", err);
      }),
  );
});

// ===========================================================================
// ACTIVACIÓN - Limpiar caches antiguos
// ===========================================================================
self.addEventListener("activate", (event) => {
  console.log("🔄 Service Worker: Activando versión", CACHE_NAME);

  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log("🗑️ Eliminando cache antiguo:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        ),
      )
      .then(() => {
        console.log("✅ Service Worker: Activado y controlando");
        return self.clients.claim();
      }),
  );
});

// ===========================================================================
// FETCH - Estrategia Cache-First con fallback
// ===========================================================================
self.addEventListener("fetch", (event) => {
  // Solo manejar solicitudes GET
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  // Estrategia para recursos externos (CDN) - Cache First
  if (externalUrlsToCache.includes(event.request.url)) {
    event.respondWith(
      caches
        .match(event.request.url)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log(
              "📦 Sirviendo desde cache (externo):",
              event.request.url,
            );
            return cachedResponse;
          }
          // Si no está en cache, hacer fetch y cachear
          return fetch(event.request).then((response) => {
            if (response.ok) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request.url, responseToCache);
              });
            }
            return response;
          });
        })
        .catch(() => {
          console.error(
            "❌ Error al obtener recurso externo:",
            event.request.url,
          );
          return new Response("/* Dexie offline fallback */", {
            status: 200,
            headers: { "Content-Type": "application/javascript" },
          });
        }),
    );
    return;
  }

  // Ignorar otras solicitudes externas no listadas
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Estrategia Cache-First para recursos locales
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si está en cache, devolverlo
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no está en cache, hacer fetch a la red
      return fetch(event.request)
        .then((networkResponse) => {
          // Verificar respuesta válida
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Cachear la respuesta para futuras solicitudes
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.warn("⚠️ Fetch falló, modo offline:", event.request.url);

          // Fallback para páginas HTML
          if (
            event.request.destination === "document" ||
            event.request.headers.get("Accept")?.includes("text/html")
          ) {
            return caches.match("./index.html");
          }

          // Fallback para JavaScript
          if (event.request.destination === "script") {
            return new Response('console.log("Offline: JS no disponible");', {
              status: 200,
              headers: { "Content-Type": "application/javascript" },
            });
          }

          // Fallback para CSS
          if (event.request.destination === "style") {
            return new Response("/* Offline: CSS no disponible */", {
              status: 200,
              headers: { "Content-Type": "text/css" },
            });
          }

          // Respuesta genérica para otros recursos
          return new Response("Recurso no disponible offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
    }),
  );
});

// ===========================================================================
// MENSAJES - Comunicación con la aplicación
// ===========================================================================
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("⏭️ Saltando espera y activando nuevo Service Worker");
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log("🚀 Service Worker cargado:", CACHE_NAME);
