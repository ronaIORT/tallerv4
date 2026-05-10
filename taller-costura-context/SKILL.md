---
name: taller-costura-context
description: Contexto completo del proyecto PWA Taller de Costura. Activar cuando se trabaje en cualquier funcionalidad del proyecto tallerv4.
license: MIT
compatibility: JavaScript ES6+ con Dexie.js para IndexedDB. Navegador con soporte PWA.
metadata:
  version: "3.0.0"
  project: "tallerv4"
  sw_version: "8.2"
  db_version: 4
---

# Taller de Costura PWA - Contexto del Proyecto

## Resumen Ejecutivo

**Taller de Costura** es una PWA offline-first para gestionar un taller de confeccion de prendas. Administra cortes de produccion, asigna tareas a trabajadores por talla, calcula pagos y genera reportes PDF. Sin framework, sin bundler, sin npm.

## Stack

| Tecnologia | Uso | Version |
|---|---|---|
| JavaScript | Modulos ES6, vanilla | - |
| Dexie.js | Wrapper IndexedDB | 4.0.8 (CDN) |
| SheetJS | Importar Excel/CSV | 0.20.1 (CDN) |
| jsPDF + AutoTable | Exportar PDF | 2.5.1 (CDN) |
| Service Worker | Cache offline | Cache-First |
| PWA Manifest | Instalacion como app | - |

No hay bundler, no hay npm, no hay node_modules. Todo se sirve como archivos estaticos.

## Sistema Dual de Monedas (CRITICO)

Este es el error mas comun al modificar el proyecto. Leelo completo en `references/MODELO_DATOS.md`.

| Campo | Unidad | Tipo | Ejemplo |
|---|---|---|---|
| `precioUnitario` (tareas) | **Centavos** | Integer | `5` = 0.05 Bs |
| `precioVentaUnitario` (venta) | **Bolivianos** | Decimal | `15.00` = 15 Bs |
| `monto` (pagos) | Centavos | Integer | `2550` = 25.50 Bs |

Conversion: `bolivianos = centavos / 100`. Funciones en `js/views/administrar-tareas/utils.js`:
- `formatBs(centavos)` -> "0.50Bs"
- `centavosABolivianos(centavos)` -> 0.5
- `formatCentavos(centavos)` -> "50¢"

Tambien duplicadas en `js/views/shared.js` (formatBs, centavosABolivianos).

## Arquitectura

SPA con router hash-based. Ver `references/ARQUITECTURA.md` para diagramas completos.

```
index.html
  |-> js/db.js          (Dexie, schema v4, seed data)
  |-> js/app.js         (Router + Dashboard)
  |-> js/views/         (Vistas, cada una render* exportada)
  |     |- nuevo-corte.js
  |     |- gestion-prendas.js  (3 exports: render, ver, editar)
  |     |- gestion-trabajadores.js
  |     |- gestion-cortes.js
  |     |- historial-pagos.js
  |     |- ganancias.js       (EN CONSTRUCCION)
  |     |- shared.js          (utilidades compartidas)
  |     |- administrar-tareas/
  |           |- index.js     (coordinador de tabs + swipe)
  |           |- tab-resumen.js   (info + exportar PDF)
  |           |- tab-corte.js     (vista general)
  |           |- tab-trabajador.js (resumen por trabajador + pagar)
  |           |- tab-editar.js    (modificar tareas)
  |           |- tab-asignar.js   (asignar tareas por talla)
  |           |- utils.js        (formato moneda, calculos)
```

Cada vista: `app.innerHTML = '<template>';` + carga datos + eventos. No hay virtual DOM ni reactividad.

## Rutas

| Hash | Vista | Descripcion |
|---|---|---|
| `#dashboard` | Inline en app.js | Estadisticas + navegacion |
| `#nuevo-corte` | renderNuevoCorte() | Crear corte con tallas |
| `#gestion-prendas` | renderGestionPrendas() | CRUD prendas |
| `#gestion-trabajadores` | renderGestionTrabajadores() | CRUD trabajadores |
| `#gestion-cortes` | renderGestionCortes() | Lista cortes con filtros |
| `#historial-pagos` | renderHistorialPagos() | Registro de pagos |
| `#ganancias` | renderGanancias() | EN CONSTRUCCION |
| `#administrar-tareas/:id` | renderAdministrarTareas(id) | 5 tabs |
| `#ver-prenda/:id` | renderVerPrenda(id) | Detalle prenda |
| `#editar-prenda/:id` | renderEditarPrenda(id) | Editar prenda |

## Modelo de Datos (IndexedDB v4)

Ver `references/MODELO_DATOS.md` para schema completo y ejemplos.

```js
db.version(4).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
  pagos: "++id, trabajadorId, fecha, corteId",
});
```

### Entidades clave

**Corte** (la mas compleja - documento embebido):
```js
{
  id, estado, fechaCreacion, fechaFinalizacion,
  nombreCorte, nombrePrendaOriginal,
  cantidadPrendas, precioVentaUnitario,  // EN BOLIVIANOS
  prendaId,
  tallas: [{ talla: "M", cantidad: 50 }],  // Array de tallas
  tareas: [{
    id: "task-...", nombre,
    precioUnitario,  // EN CENTAVOS
    unidadesTotales,
    asignaciones: [{
      trabajadorId, cantidad, talla, fecha
    }]
  }]
}
```

**Prenda** (template para cortes):
```js
{
  id, nombre,  // Unique
  tareas: [{ nombre, precioUnitario }]  // EN CENTAVOS
}
```

**Pago**:
```js
{
  id, trabajadorId, fecha, corteId,
  monto,  // EN CENTAVOS (entero)
  notas
}
```

## Funciones Globales (window.*)

El codigo usa `window.funcion = funcion` para exponer handlers a onclick inline en templates HTML. Las mas importantes:

- `window.confirmarSalida`, `window.salirAplicacion` - en app.js
- `window.exportarCortePDF` - en tab-resumen.js
- `window.mostrarModalFinalizarCorte` - en utils.js
- `window.eliminarTallaNueva` - en nuevo-corte.js
- `window.corteIdActual` - en tab-asignar.js

## Convenciones

Ver `references/CONVENCIONES.md` para guia completa.

- Modulos ES6: `import`/`export`
- Funciones vista: prefijo `render` (ej: `renderNuevoCorte()`)
- Archivos: kebab-case; funciones: camelCase
- Tema: oscuro, mobile-first
- No agregar comentarios salvo que se pida
- Service Worker habilitado tambien en desarrollo

## Version Actual

- App: v8.1 (badge en dashboard)
- Service Worker cache: `taller-costura-8.2`
- DB schema: v4
- Puerto Live Server: 5501

## Vista en Construccion

`#ganancias` (ganancias.js) muestra solo un placeholder "en construccion". Las estadisticas de ganancias se calculan inline en `cargarEstadisticas()` de app.js para el dashboard.

## Dependencias CDN

```html
<script src="https://unpkg.com/dexie@4.0.8/dist/dexie.js"></script>
<script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
```

## Recursos Adicionales

- `references/ARQUITECTURA.md` - Diagramas y flujos detallados
- `references/MODELO_DATOS.md` - Schema completo, relaciones, consultas
- `references/CONVENCIONES.md` - Guia de estilo y mejores practicas
- `REFERENCE.md` - Referencia tecnica rapida (API, componentes, debugging)
