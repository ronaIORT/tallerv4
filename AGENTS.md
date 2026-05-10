# AGENTS.md - Taller de Costura PWA

## Desarrollo

- Requiere servidor HTTP (no funciona con file://)
- Puerto Live Server: **5501** (`.vscode/settings.json`)
- Comandos: `python -m http.server 8080`, `npx serve`, o Live Server

## Sin Bundler / Sin npm

No hay `package.json`, no hay `node_modules`, no hay bundler. Todo se sirve como archivos estáticos. Las dependencias se cargan desde CDN en `index.html`:
- Dexie.js 4.0.8, SheetJS 0.20.1, jsPDF 2.5.1 + AutoTable 3.5.31

## Sistema de Monedas (CRÍTICO - error #1)

| Campo | Unidad | Tipo | Ejemplo |
|---|---|---|---|
| `precioUnitario` (tareas) | **Centavos** | Integer | `5` = 0.05 Bs |
| `precioVentaUnitario` (venta) | **Bolivianos** | Decimal | `15.00` = 15 Bs |
| `monto` (pagos) | **Centavos** | Integer | `2550` = 25.50 Bs |

Funciones en `js/views/administrar-tareas/utils.js`: `formatBs()`, `centavosABolivianos()`, `formatCentavos()`.  
También duplicadas en `js/views/shared.js`.  
**Nunca** usar decimales para `precioUnitario` ni centavos para `precioVentaUnitario`.

## Estructura

- Entry: `index.html` → `js/app.js` (router hash-based) → `js/db.js` (Dexie, schema v4)
- Vistas: `js/views/*.js` — cada una exporta `render*()` que hace `app.innerHTML = '...'`
- Vista compleja: `js/views/administrar-tareas/` (5 tabs + utils.js + swipe)

## Funciones Globales (window.*)

Los templates HTML usan `onclick="funcionGlobal()"`. Toda función llamada desde onclick inline debe exponerse con `window.nombreFuncion = nombreFuncion`. Ejemplos: `window.confirmarSalida`, `window.exportarCortePDF`, `window.eliminarTallaNueva`.

## Corte = Documento Embebido

El modelo más complejo. Las tareas y asignaciones se guardan **dentro** del corte como arrays anidados (no hay tabla de tareas separada). Para modificar asignaciones: leer corte → mutar array → `db.cortes.put(corte)`.

Los cortes tienen `tallas: [{ talla, cantidad }]`. Las asignaciones referencian una talla específica. Si el corte no tiene tallas, `talla` es `null`.

## Navegacion

Barra inferior (`index.html` → `<nav class="bottom-nav">`) con 5 iconos SVG inline.  Fuera de `#app` (persistente entre rutas principales). Se oculta (clase `.hidden`) en sub-vistas profundas.

| Icono | Ruta | Vista |
|---|---|---|
| Inicio | `#dashboard` | Dashboard con stats |
| Cortes | `#gestion-cortes` | Lista con filtros |
| Nuevo (+) | `#nuevo-corte` | Crear corte (acentuado) |
| Pagos | `#historial-pagos` | 3 tabs pagos |
| Perfil | `#perfil` | Cards a Trabajadores y Prendas |

Funciones en `js/app.js`: `actualizarNav(ruta)`, `inicializarBottomNav()`.  Mapping en `RUTA_A_NAV`.

## Rutas

| Hash | Vista | Nav |
|---|---|---|
| `#dashboard` | Dashboard (inline en app.js) | Inicio |
| `#nuevo-corte` | Crear corte con tallas | Nuevo |
| `#gestion-cortes` | Lista con filtros | Cortes |
| `#historial-pagos` | Registro pagos | Pagos |
| `#perfil` | Acceso a trabajadores y prendas | Perfil |
| `#gestion-prendas` | CRUD prendas | Perfil |
| `#gestion-trabajadores` | CRUD trabajadores | Perfil |
| `#ganancias` | Placeholder | - |
| `#administrar-tareas/:id` | 5 tabs | **Oculta** (back button) |
| `#ver-prenda/:id` | Detalle prenda | **Oculta** (back button) |
| `#editar-prenda/:id` | Editar prenda | **Oculta** (back button) |

## Administrar Tareas (5 Tabs)

En `js/views/administrar-tareas/`: Info, Corte, Trabajador, Editar, Asignar. Navegación por swipe (umbral 50px, solo horizontal). Tab **Trabajador** incluye pagar.

## IndexedDB Schema v4

```js
db.version(4).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
  pagos: "++id, trabajadorId, fecha, corteId",
});
```

## Service Worker

- Cache: `taller-costura-9.0` — **cambiar `CACHE_NAME` en `service-worker.js`** al modificar archivos
- Activado también en desarrollo (`DISABLE_SW_IN_DEV = false` en app.js)
- Estrategia Cache-First, cachea archivos locales + CDN

## Convenciones

- Módulos ES6: `import`/`export`
- Funciones vista: prefijo `render`
- Nombres: kebab-case (archivos), camelCase (JS)
- No agregar comentarios salvo que se pida
- Tema: oscuro, mobile-first
- Al agregar vista nueva: importar en `app.js`, agregar caso en router, agregar CSS, agregar ruta en `service-worker.js`, agregar a `RUTA_A_NAV` si aplica

## Seed Data

En `db.js` → `db.on("populate")`: 3 prendas (Pantalón, Short, Falda) con ~30 tareas cada una, precios en centavos. Se ejecuta solo en DB vacía.
