# Arquitectura del Proyecto - Taller de Costura PWA

## Vision General

SPA sin framework. JavaScript vanilla con modulos ES6. Persistencia 100% client-side via IndexedDB. No hay bundler, no hay npm, no hay node_modules. Todo se sirve como archivos estaticos.

---

## Diagrama de Arquitectura

```
+-----------------------------------------------------------------+
|                          NAVEGADOR                               |
+-----------------------------------------------------------------+
|                                                                   |
|  +--------------+    +--------------+    +--------------+        |
|  |  index.html  |--->|   app.js     |--->|    Views     |        |
|  |  (Entry)     |    |  (Router)    |    |  (render*)   |        |
|  +--------------+    +------+-------+    +------+-------+        |
|                             |                   |                 |
|                             |                   |                 |
|                             v                   v                 |
|                      +--------------+    +--------------+        |
|                      |    db.js     |<---|  Templates   |        |
|                      |   (Dexie)    |    |   (HTML)     |        |
|                      +------+-------+    +--------------+        |
|                             |                                     |
|                             v                                     |
|  +-----------------------------------------------------------+   |
|  |                    IndexedDB (v4)                          |   |
|  |  +---------+ +-----------+ +---------+ +---------+       |   |
|  |  | prendas | |trabajadore| | cortes  | |  pagos  |       |   |
|  |  +---------+ +-----------+ +---------+ +---------+       |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  +--------------+    +--------------+                            |
|  |Service Worker|    |   manifest   |                            |
|  | (Cache-First)|    |    .json     |                            |
|  +--------------+    +--------------+                            |
+-----------------------------------------------------------------+
```

---

## Sistema Dual de Monedas

### Diagrama

```
+-------------------------------------------------------------+
|                    SISTEMA DE MONEDAS                        |
+-------------------------------------------------------------+
|                                                              |
|  +---------------------+    +---------------------+         |
|  |   precioUnitario    |    | precioVentaUnitario |         |
|  |     (CENTAVOS)      |    |    (BOLIVIANOS)     |         |
|  +---------------------+    +---------------------+         |
|  | Tipo: Integer       |    | Tipo: Decimal       |         |
|  | Uso: Tareas/Pagos   |    | Uso: Venta corte   |         |
|  | Ej: 5 = 0.05 Bs    |    | Ej: 15.00 Bs       |         |
|  +----------+----------+    +----------+----------+         |
|             |                          |                     |
|             |    +--------------+      |                     |
|             +--->|  Conversion  |<-----+                     |
|                  |  centavos/100 |                            |
|                  +--------------+                             |
|                                                              |
|  monto (pagos) = CENTAVOS (Integer)                        |
|  Ej: 2550 = 25.50 Bs                                       |
+-------------------------------------------------------------+
```

### Razon del diseno

- **Centavos para tareas**: Evita errores de punto flotante en calculos frecuentes. En movil es mas facil ingresar enteros.
- **Bolivianos para ventas**: Mas intuitivo para el usuario al ingresar precios de venta.
- **Centavos para pagos**: Consistencia con el sistema de tareas.

### Funciones de Conversion (utils.js)

```javascript
export function centavosABolivianos(centavos) { return centavos / 100; }
export function formatBs(centavos) { return `${(centavos / 100).toFixed(2)}Bs`; }
export function formatCentavos(centavos) { return `${centavos}`; }
```

Tambien duplicadas en `shared.js`.

---

## Flujo de Navegacion

```
                    +-------------+
                    |  Dashboard  |
                    |  #dashboard |
                    +------+------+
                           |
       +-------------------+-------------------+--------------+
       |                   |                   |              |
       v                   v                   v              v
+---------------+  +---------------+  +---------------+  +---------------+
|  Nuevo Corte  |  |   Trabajadores|  |    Prendas    |  |    Cortes     |
|  #nuevo-corte |  | #gestion-...  |  | #gestion-...  |  |#gestion-cortes|
+-------+-------+  +---------------+  +-------+-------+  +-------+-------+
        |                                     |                    |
        |                                     v                    |
        |                           +-----------------+           |
        |                           |   Ver Prenda    |           |
        |                           | #ver-prenda/:id |           |
        |                           +-----------------+           |
        |                           +-----------------+           |
        |                           |  Editar Prenda  |           |
        |                           |#editar-prenda/:id|          |
        |                           +-----------------+           |
        |                                                         |
        v                                                         |
+-------------------+                                             |
| Administrar Tareas|<--------------------------------------------+
| #administrar-...  |
|     /:corteId     |
+---------+---------+
          |
    +-----+-----+---------+---------+---------+
    |           |         |         |         |
    v           v         v         v         v
+-------+ +-------+ +-------+ +-------+ +-------+
| Info  | | Corte | |Trabaj.| |Editar | |Asignar|
| (Tab) | | (Tab) | | (Tab) | | (Tab) | | (Tab) |
+-------+ +-------+ +-------+ +-------+ +-------+
                                    |
                                    v
                              +----------+
                              | Historial|
                              | Pagos    |
                              |#historial|
                              +----------+
```

---

## Capas de la Aplicacion

### 1. Capa de Presentacion (UI/CSS)

```
css/
  |- style.css        # Solo imports
  |- variables.css    # Colores, espaciados, fuentes (Tema Oscuro)
  |- base.css         # Reset, tipografia
  |- components.css   # Botones, cards, inputs
  |- layout.css       # Grid, contenedores
  |- modals.css       # Modales
  |- responsive.css   # Media queries
  |- views/
       |- administrar-tareas/  (index, tab-*, shared, responsive)
       |- dashboard.css
       |- gestion-cortes.css
       |- gestion-prendas.css
       |- gestion-trabajadores.css
       |- historial-pagos.css
       |- nuevo-corte.css
```

### 2. Capa de Logica (JS)

```
js/
  |- app.js           # Router + Dashboard + funciones globales
  |- db.js            # Dexie config + seed data
  |- views/
       |- nuevo-corte.js          (1045 lineas)
       |- gestion-prendas.js      (3 exports)
       |- gestion-trabajadores.js
       |- gestion-cortes.js
       |- historial-pagos.js
       |- ganancias.js            (EN CONSTRUCCION - placeholder)
       |- shared.js               (utilidades compartidas)
       |- administrar-tareas/
            |- index.js           (coordinador + swipe)
            |- tab-resumen.js     (info + PDF export)
            |- tab-corte.js       (vista general tabla)
            |- tab-trabajador.js (resumen por trabajador + pagar)
            |- tab-editar.js     (CRUD tareas)
            |- tab-asignar.js    (asignar por talla)
            |- utils.js          (moneda, calculos, modales)
```

### 3. Capa de Datos (IndexedDB)

```
TallerCosturaDB (v4)
  |- prendas       # Catalogo con tareas template (centavos)
  |- trabajadores  # Personal del taller
  |- cortes        # Ordenes de produccion (documento embebido)
  |- pagos         # Historial de pagos (centavos)
```

---

## Patrones de Diseno

### 1. Router Pattern (hash-based)

```javascript
// app.js
function cargarVista(ruta) {
  if (ruta === "#dashboard") { /* inline */ return; }
  if (ruta === "#gestion-cortes") { renderGestionCortes(); return; }

  // Rutas dinamicas
  if (ruta.startsWith("#administrar-tareas/")) {
    const id = parseInt(ruta.split("/")[1]);
    renderAdministrarTareas(id);
    return;
  }

  // Estaticas
  switch (ruta) { case "#nuevo-corte": renderNuevoCorte(); break; }
}

window.addEventListener("hashchange", () => cargarVista(location.hash));
```

### 2. Template Method (cada vista sigue el mismo patron)

```javascript
export function renderVista(id) {
  const app = document.getElementById('app');
  app.innerHTML = `...template...`;  // 1. Render HTML
  cargarDatos(id);                    // 2. Cargar datos
  configurarEventos();                // 3. Event listeners
}
```

### 3. Funciones Globales para onclick inline

Los templates HTML usan `onclick="funcionGlobal()"`, por lo que las funciones deben exponerse:

```javascript
window.miFuncion = miFuncion;
window.confirmarSalida = confirmarSalida;
window.exportarCortePDF = exportarCortePDF;
```

### 4. Tab System con Swipe

```javascript
// administrar-tareas/index.js
const ORDEN_PESTANAS = ['resumen', 'corte', 'trabajador', 'editar', 'asignar'];

// Navegacion por click
document.querySelectorAll('.tab-item').forEach(btn => {
  btn.addEventListener('click', () => { /* cargar tab */ });
});

// Navegacion por swipe (umbral 50px, solo horizontal)
tabContent.addEventListener('touchstart/touchend', /* ... */);
```

---

## Flujo de Datos: Creacion de Corte

```
Usuario                    Vista                    DB
   |                        |                       |
   |--Selecciona prenda---->|                       |
   |                        |---Carga tareas------->|
   |                        |<---Lista tareas-------|
   |                        |                       |
   |--Ingresa tallas------->|                       |
   |--Ingresa precio (Bs)-->|                       |
   |                        |                       |
   |--Clic "Guardar"------->|                       |
   |                        |--Crea objeto corte-->|
   |                        |  (tareas centavos)    |
   |                        |--Persiste en DB----->|
   |                        |<--Confirmacion--------|
   |                        |                       |
   |<--Mensaje exito--------|                       |
   |--Redirige dashboard--->|                       |
```

## Flujo de Datos: Asignacion por Talla

```
Usuario                 Tab-Asignar                 DB
   |                        |                       |
   |--Selecciona tarea----->|                       |
   |--Selecciona trabajador>|                      |
   |                        |---Lista tallas------>|
   |                        |<---Tallas disponibles-|
   |                        |                       |
   |--Ingresa cant/talla-->|                       |
   |--Clic "Asignar"------->|                       |
   |                        |---Lee corte--------->|
   |                        |<---Objeto corte-------|
   |                        |                       |
   |                        |--Actualiza asignac.-->|
   |                        |--Guarda corte------->|
   |                        |<---OK----------------|
   |<--Actualiza UI---------|                       |
   |  (monto en centavos,   |                       |
   |   mostrar en Bs)       |                       |
```

---

## PWA Features

### Service Worker (Cache-First)

- Cache: `taller-costura-8.2`
- Estrategia Cache-First para todos los recursos
- Recursos externos (CDN) cacheados con fallback
- Limpieza de caches antiguos en activate
- Activado tambien en desarrollo

### Manifest

- Display: standalone
- Orientation: portrait
- Theme: #4a5568

---

## Consideraciones de Rendimiento

1. CSS modular (solo imports en style.css)
2. IndexedDB acceso asincrono no bloqueante
3. Service Worker cachea todo para offline
4. Precios en centavos: operaciones con enteros mas rapidas y precisas
5. Templates inline en JS (no hay virtual DOM)
6. Funciones globales para handlers onclick (patron simple)

---

## Extensibilidad

### Agregar Nueva Vista

1. Crear `js/views/mi-vista.js` con `export function renderMiVista()`
2. Importar en `app.js`
3. Agregar caso en `cargarVista()`
4. Crear `css/views/mi-vista.css`
5. Agregar ruta en `service-worker.js`

### Agregar Nueva Tabla DB

1. Incrementar version en `db.js`
2. Agregar definicion en `.stores()`
3. Opcional: seed data en `populate`

### Agregar Nueva Tab en Administrar Tareas

1. Crear `tab-mi-tab.js` con `export async function cargarPestanaMiTab(corteId)`
2. Importar en `index.js`
3. Agregar boton en template
4. Agregar caso en switch
5. Agregar en `ORDEN_PESTANAS`
