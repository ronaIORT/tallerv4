# Arquitectura del Proyecto - Taller de Costura PWA

## Visión General

El proyecto implementa una arquitectura **SPA (Single Page Application)** sin framework, utilizando JavaScript vanilla con módulos ES6. La persistencia de datos se maneja completamente del lado del cliente mediante IndexedDB.

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVEGADOR                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  index.html  │───▶│   app.js     │───▶│    Views     │      │
│  │  (Punto de   │    │  (Router)    │    │  (Vistas)    │      │
│  │   entrada)   │    └──────┬───────┘    └──────┬───────┘      │
│  └──────────────┘           │                   │               │
│                             │                   │               │
│                             ▼                   ▼               │
│                      ┌──────────────┐    ┌──────────────┐      │
│                      │    db.js     │◀───│  Templates   │      │
│                      │   (Dexie)    │    │   (HTML)     │      │
│                      └──────┬───────┘    └──────────────┘      │
│                             │                                   │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    IndexedDB                              │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │   │
│  │  │ prendas │ │trabajad.│ │ cortes  │ │  pagos  │       │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐                          │
│  │Service Worker│    │   manifest   │                          │
│  │   (Cache)    │    │    .json     │                          │
│  └──────────────┘    └──────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sistema de Monedas

### Arquitectura de Precios

El proyecto implementa un **sistema dual de monedas** para optimizar precisión y usabilidad:

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE MONEDAS                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │   precioUnitario    │    │ precioVentaUnitario │        │
│  │     (CENTAVOS)      │    │    (BOLIVIANOS)     │        │
│  ├─────────────────────┤    ├─────────────────────┤        │
│  │ • Tipo: Integer     │    │ • Tipo: Decimal     │        │
│  │ • Uso: Tareas       │    │ • Uso: Venta        │        │
│  │ • Sin decimales     │    │ • Input directo     │        │
│  │ • Ej: 5 = 0.05 Bs   │    │ • Ej: 15.00 Bs      │        │
│  └──────────┬──────────┘    └──────────┬──────────┘        │
│             │                          │                    │
│             │    ┌──────────────┐      │                    │
│             └───▶│  Conversión  │◀─────┘                    │
│                  │  centavos/100 │                           │
│                  └──────────────┘                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Funciones de Conversión (utils.js)

```javascript
// Conversión de centavos a Bolivianos
export function centavosABolivianos(centavos) {
  return centavos / 100;
}

// Formateo para mostrar
export function formatBs(centavos) {
  return `${(centavos / 100).toFixed(2)}Bs`;
}
```

---

## Flujo de Navegación

```
                    ┌─────────────┐
                    │  Dashboard  │
                    │  #dashboard │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┬──────────────┐
        │                  │                  │              │
        ▼                  ▼                  ▼              ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Nuevo Corte  │  │   Trabajadores│  │    Prendas    │  │    Cortes     │
│  #nuevo-corte │  │ #gestion-...  │  │ #gestion-...  │  │#gestion-cortes│
└───────────────┘  └───────────────┘  └───────┬───────┘  └───────────────┘
        │                                      │                 │
        │                                      ▼                 │
        │                            ┌─────────────────┐        │
        │                            │   Ver Prenda    │        │
        │                            │ #ver-prenda/:id │        │
        │                            └─────────────────┘        │
        │                                                       │
        ▼                                                       │
┌───────────────────┐                                           │
│ Administrar Tareas│◀──────────────────────────────────────────┘
│ #administrar-...  │
│     /:corteId     │
└─────────┬─────────┘
          │
    ┌─────┴─────┬─────────┬─────────┬─────────┐
    │           │         │         │         │
    ▼           ▼         ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│ Info  │ │ Corte │ │Trabaj.│ │Editar │ │Asignar│
│ (Tab) │ │ (Tab) │ │ (Tab) │ │ (Tab) │ │ (Tab) │
└───────┘ └───────┘ └───────┘ └───────┘ └───────┘
```

---

## Capas de la Aplicación

### 1. Capa de Presentación (UI)

**Responsabilidad**: Renderizar interfaces y capturar interacciones del usuario.

```
css/
├── style.css        # Importa todos los demás
├── base.css         # Reset, tipografía base
├── variables.css    # Colores, espaciados, fuentes (Tema Oscuro)
├── components.css   # Botones, cards, inputs
├── layout.css       # Grid, contenedores
├── modals.css       # Ventanas modales
├── responsive.css   # Media queries
└── views/           # Estilos específicos por vista
    ├── dashboard.css
    ├── nuevo-corte.css
    ├── gestion-prendas.css
    ├── gestion-trabajadores.css
    └── administrar-tareas.css
```

**Patrones utilizados**:

- Mobile-first responsive design
- CSS Variables para theming (Tema Oscuro)
- BEM-like naming convention
- Modularización por funcionalidad

### 2. Capa de Lógica de Negocio

**Responsabilidad**: Coordinar flujos de datos y aplicar reglas del dominio.

```
js/
├── app.js           # Router principal + lógica dashboard
├── db.js            # Configuración DB + seed data
└── views/
    ├── nuevo-corte.js
    ├── gestion-prendas.js
    ├── gestion-trabajadores.js
    ├── historial-pagos.js
    └── administrar-tareas/
        ├── index.js      # Coordinador de tabs
        ├── tab-resumen.js
        ├── tab-corte.js
        ├── tab-trabajador.js
        ├── tab-editar.js
        ├── tab-asignar.js
        └── utils.js      # Funciones compartidas (conversión monedas)
```

**Patrones utilizados**:

- Module Pattern (ES6 modules)
- Router Pattern (hash-based)
- Template Method (render functions)
- Observer (event listeners)

### 3. Capa de Datos

**Responsabilidad**: Persistir y recuperar datos del navegador.

```
IndexedDB (via Dexie.js)
├── TallerCosturaDB (v4)
│   ├── prendas       # Catálogo de prendas
│   ├── trabajadores  # Personal del taller
│   ├── cortes        # Órdenes de producción
│   └── pagos         # Historial de pagos
```

**Características**:

- Offline-first architecture
- Schema versioning (migraciones)
- Seed data automático
- Índices para consultas eficientes

---

## Patrones de Diseño Implementados

### 1. Router Pattern

El enrutador en `app.js` implementa navegación basada en hash:

```javascript
// Estructura del router
function cargarVista(ruta) {
  // Rutas estáticas
  if (ruta === "#dashboard") { ... }
  if (ruta === "#gestion-cortes") { renderGestionCortes(); return; }

  // Rutas dinámicas con parámetros
  if (ruta.startsWith("#administrar-tareas/")) {
    const id = parseInt(ruta.split("/")[1]);
    renderAdministrarTareas(id);
  }

  // Ruta por defecto (404)
  default: { ... }
}

// Escuchar cambios
window.addEventListener("hashchange", () => cargarVista(location.hash));
```

### 2. Module Pattern

Cada vista es un módulo ES6 independiente:

```javascript
// nuevo-corte.js
import { db } from "../db.js";

export function renderNuevoCorte() {
  // Lógica de la vista
}

// Funciones privadas (no exportadas)
function validarFormulario() { ... }
```

### 3. Template Method

Las funciones de renderizado siguen un patrón consistente:

```javascript
export function renderVista(id) {
  // 1. Obtener contenedor
  const app = document.getElementById("app");

  // 2. Renderizar HTML inicial (template)
  app.innerHTML = `...`;

  // 3. Cargar datos
  const datos = await db.tabla.get(id);

  // 4. Actualizar UI con datos
  actualizarUI(datos);

  // 5. Configurar event listeners
  configurarEventos();
}
```

### 4. Observer Pattern

Los eventos del DOM siguen el patrón Observer:

```javascript
// Suscripción a eventos
document.querySelector(".btn").addEventListener("click", handler);

// Múltiples observadores
document.querySelectorAll(".tab-item").forEach((btn) => {
  btn.addEventListener("click", onTabClick);
});
```

---

## Flujo de Datos

### Creación de un Corte

```
Usuario                    Vista                    DB
   │                        │                       │
   │──Selecciona prenda────▶│                       │
   │                        │───Carga tareas───────▶│
   │                        │◀───Lista tareas───────│
   │                        │                       │
   │──Ingresa cantidad─────▶│                       │
   │──Ingresa precio (Bs)──▶│                       │
   │                        │                       │
   │──Clic "Guardar"───────▶│                       │
   │                        │──Crea objeto corte───▶│
   │                        │  (tareas en centavos) │
   │                        │──Persiste en DB──────▶│
   │                        │◀──Confirmación────────│
   │                        │                       │
   │◀──Mensaje éxito───────│                       │
   │                        │                       │
   │──Redirige a dashboard─▶│                       │
```

### Asignación de Tareas

```
Usuario                 Tab-Asignar                 DB
   │                        │                       │
   │──Selecciona tarea─────▶│                       │
   │                        │──Lista trabajadores──▶│
   │                        │◀──Lista───────────────│
   │                        │                       │
   │──Selecciona trabajador─▶│                      │
   │──Ingresa cantidad─────▶│                       │
   │                        │                       │
   │──Clic "Asignar"───────▶│                       │
   │                        │──Lee corte───────────▶│
   │                        │◀──Objeto corte────────│
   │                        │                       │
   │                        │──Actualiza tareas────▶│
   │                        │──Guarda corte────────▶│
   │                        │◀──Confirmación────────│
   │                        │                       │
   │◀──Actualiza UI────────│                       │
   │  (monto en centavos    │                       │
   │   mostrar en Bs)       │                       │
```

---

## Sistema de Pestañas

La vista `administrar-tareas` implementa un sistema de pestañas modular:

```javascript
// index.js - Coordinador
export function renderAdministrarTareas(corteId) {
  // Renderizar estructura con tabs
  app.innerHTML = `
    <div class="tab-menu">
      <button class="tab-item active" data-tab="resumen">Info</button>
      <button class="tab-item" data-tab="corte">Corte</button>
      ...
    </div>
    <div id="tab-content"></div>
  `;

  // Cargar tab por defecto
  cargarPestanaResumen(corteId);

  // Configurar navegación
  inicializarPestanas(corteId);
}

function inicializarPestanas(corteId) {
  document.querySelectorAll(".tab-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Actualizar UI
      document
        .querySelectorAll(".tab-item")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Cargar contenido
      const tab = btn.dataset.tab;
      switch (tab) {
        case "resumen":
          cargarPestanaResumen(corteId);
          break;
        case "corte":
          cargarPestanaCorte(corteId);
          break;
        // ...
      }
    });
  });
}
```

---

## PWA Features

### Service Worker

```javascript
// service-worker.js
const CACHE_NAME = "taller-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/db.js",
];

// Instalación
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

// Intercepción de requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
```

### Manifest

```json
{
  "name": "Taller de Costura",
  "short_name": "Taller",
  "start_url": "./index.html",
  "display": "standalone",
  "theme_color": "#4a5568",
  "icons": [...]
}
```

---

## Consideraciones de Rendimiento

### Optimizaciones Implementadas

1. **Lazy Loading de Vistas**: Solo se carga el JS de la vista actual
2. **CSS Modular**: Solo se importan los estilos necesarios
3. **IndexedDB**: Acceso asíncrono no bloqueante
4. **Service Worker**: Cache de recursos estáticos
5. **Debounce en Búsqueda**: Evita consultas excesivas
6. **Precios en Centavos**: Operaciones con enteros son más rápidas

### Métricas Objetivo

| Métrica             | Objetivo | Actual |
| ------------------- | -------- | ------ |
| First Paint         | < 1s     | ~0.5s  |
| Time to Interactive | < 3s     | ~2s    |
| Lighthouse Score    | > 90     | ~85    |

---

## Extensibilidad

### Agregar Nueva Vista

1. Crear archivo en `js/views/mi-vista.js`
2. Exportar función `renderMiVista()`
3. Importar en `app.js`
4. Agregar caso en el router
5. Crear estilos en `css/views/mi-vista.css`

### Agregar Nueva Tabla DB

1. Incrementar versión en `db.js`
2. Agregar definición en `.stores()`
3. Opcional: Agregar seed data en `populate`

### Agregar Nueva Pestaña

1. Crear archivo `tab-mi-tab.js` en `administrar-tareas/`
2. Exportar función `cargarPestanaMiTab(corteId)`
3. Importar en `index.js`
4. Agregar botón en template
5. Agregar caso en switch de navegación

---

## Tema Oscuro

La aplicación implementa un tema oscuro compacto:

```css
/* variables.css */
:root {
  --color-background: #1a202c;
  --color-surface: #2d3748;
  --color-primary: #4a5568;
  --color-text: #e2e8f0;
  --color-text-secondary: #a0aec0;
}
```

### Características del Tema

- Fondo oscuro (#1a202c)
- Superficies ligeramente más claras (#2d3748)
- Texto claro con buen contraste
- Acentos de color para acciones importantes
- Modales con overlay oscuro
