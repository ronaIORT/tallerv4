# Referencia Tecnica Rapida - Taller de Costura PWA

## Indice

1. [Sistema de Monedas](#sistema-de-monedas)
2. [API de Base de Datos](#api-de-base-de-datos)
3. [Funciones Principales](#funciones-principales)
4. [Componentes UI](#componentes-ui)
5. [Utilidades](#utilidades)
6. [Solucion de Problemas](#solucion-de-problemas)

---

## Sistema de Monedas

### CRITICO: Centavos vs Bolivianos

| Campo | Unidad | Tipo | Ejemplo |
|---|---|---|---|
| `precioUnitario` (tareas) | **Centavos** | Integer | `5` = 0.05 Bs |
| `precioVentaUnitario` (venta) | **Bolivianos** | Decimal | `15.00` = 15 Bs |
| `monto` (pagos) | **Centavos** | Integer | `2550` = 25.50 Bs |

### Funciones de Conversion

```javascript
// En js/views/administrar-tareas/utils.js
import { centavosABolivianos, formatBs, formatCentavos } from './utils.js';

centavosABolivianos(50);   // 0.5
formatBs(50);              // "0.50Bs"
formatCentavos(50);        // "50¢"

// Tambien en js/views/shared.js (duplicadas)
import { formatBs, centavosABolivianos } from '../shared.js';
```

### Errores Comunes

```javascript
// INCORRECTO - mezclar unidades
const total = tarea.precioUnitario * cantidad;
console.log(total + " Bs"); // Muestra centavos como Bolivianos

// CORRECTO - convertir antes de mostrar
const totalCentavos = tarea.precioUnitario * cantidad;
console.log(formatBs(totalCentavos)); // "X.XXBs"

// INCORRECTO - usar decimal para precioUnitario
{ precioUnitario: 0.05 } // NO

// CORRECTO - usar entero (centavos)
{ precioUnitario: 5 } // SI, 5 centavos = 0.05 Bs
```

### Calculo de Ganancias

```javascript
// Ingreso total en Bolivianos
const totalVentaBs = corte.cantidadPrendas * corte.precioVentaUnitario;

// Mano de obra REAL (solo asignado) en centavos
const totalManoObraCentavos = corte.tareas.reduce((sum, tarea) => {
  const cantidadAsignada = tarea.asignaciones.reduce((t, a) => t + a.cantidad, 0);
  return sum + tarea.precioUnitario * cantidadAsignada;
}, 0);

// Convertir centavos a Bolivianos
const totalManoObraBs = totalManoObraCentavos / 100;
const ganancia = totalVentaBs - totalManoObraBs;
```

---

## API de Base de Datos

### Version Actual: 4

```javascript
import { db } from './db.js';

db.version(4).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
  pagos: "++id, trabajadorId, fecha, corteId",
});
```

### Operaciones CRUD

```javascript
// CREAR
const id = await db.cortes.add({ nombreCorte: "...", estado: "activo", ... });
await db.prendas.bulkAdd([...]);

// LEER
const corte = await db.cortes.get(id);
const activos = await db.cortes.where("estado").equals("activo").toArray();
const ordenados = await db.cortes.orderBy("fechaCreacion").reverse().toArray();
const total = await db.trabajadores.count();

// ACTUALIZAR
await db.cortes.update(id, { estado: "terminado" });
// Para documentos embebidos (tareas/asignaciones), leer + modificar + put:
const corte = await db.cortes.get(id);
corte.tareas[0].asignaciones.push({ trabajadorId: 2, cantidad: 50, talla: "M" });
await db.cortes.put(corte);

// ELIMINAR
await db.cortes.delete(id);
await db.pagos.where("corteId").equals(corteId).delete();

// TRANSACCION
await db.transaction('rw', [db.cortes, db.pagos], async () => {
  await db.pagos.where("corteId").equals(corteId).delete();
  await db.cortes.delete(corteId);
});
```

---

## Funciones Principales

### app.js - Enrutador + Dashboard

| Funcion | Descripcion |
|---|---|
| `cargarVista(ruta)` | Carga vista segun hash |
| `cargarEstadisticas()` | Actualiza metricas del dashboard |
| `confirmarSalida()` | Modal de salida |
| `mostrarMensaje(texto)` | Toast temporal |

### Vistas (funciones exportadas)

| Archivo | Export | Descripcion |
|---|---|---|
| `nuevo-corte.js` | `renderNuevoCorte()` | Crear corte con tallas |
| `gestion-prendas.js` | `renderGestionPrendas()`, `renderVerPrenda(id)`, `renderEditarPrenda(id)` | CRUD prendas |
| `gestion-trabajadores.js` | `renderGestionTrabajadores()` | CRUD trabajadores |
| `gestion-cortes.js` | `renderGestionCortes()` | Lista con filtros |
| `historial-pagos.js` | `renderHistorialPagos()` | Registro pagos |
| `ganancias.js` | `renderGanancias()` | EN CONSTRUCCION |
| `administrar-tareas/index.js` | `renderAdministrarTareas(id)` | Coordinador tabs |

### Administrar Tareas (Tabs)

| Archivo | Funcion | Descripcion |
|---|---|---|
| `tab-resumen.js` | `cargarPestanaResumen(id)` | Info + exportar PDF |
| `tab-corte.js` | `cargarPestanaCorte(id)` | Vista general con tabla |
| `tab-trabajador.js` | `cargarPestanaTrabajador(id)` | Resumen por trabajador + pagar |
| `tab-editar.js` | `cargarPestanaEditar(id)` | Modificar/agregar/eliminar tareas |
| `tab-asignar.js` | `cargarPestanaAsignar(id)` | Asignar tareas por talla |
| `utils.js` | Varias | Conversion moneda, calculos, modales |

### utils.js - Funciones de Utilidad

| Funcion | Retorna | Descripcion |
|---|---|---|
| `centavosABolivianos(c)` | Number | `c / 100` |
| `formatBs(c)` | String | `"X.XXBs"` |
| `formatCentavos(c)` | String | `"X¢"` |
| `calcularManoObraTotal(corte)` | Number (centavos) | Suma precioUnitario * unidadesTotales |
| `calcularManoObraReal(corte)` | Number (centavos) | Suma solo asignado |
| `calcularCostoPorPrenda(tareas)` | Number (centavos) | Suma precios unitarios |
| `formatDate(date)` | String | `"DD/MM/YYYY"` |
| `mostrarMensaje(texto)` | void | Toast 2s |
| `cambiarPestana(nombre)` | void | Click en tab button |
| `getTallasDisponiblesParaTarea(corte, tarea)` | Array | Tallas con disponibilidad |
| `getTareasDisponibles(corte)` | Array | Tareas con cupo libre |

### shared.js - Utilidades compartidas

| Funcion | Descripcion |
|---|---|
| `formatDate(date)` | `"DD/MM/YYYY"` |
| `mostrarMensaje(msg)` | Toast temporal |
| `renderHeader(title, backRoute)` | HTML del header |
| `renderEmptyState(icon, text)` | HTML estado vacio |
| `renderLoadingState()` | HTML carga |
| `crearModalConfirmacion(opts)` | Modal reutilizable |
| `formatBs(centavos)` | Duplicada de utils.js |
| `centavosABolivianos(c)` | Duplicada de utils.js |

---

## Componentes UI

### Estructura HTML Base

```html
<div class="mobile-container">
  <div class="header">
    <button class="back-btn" onclick="location.hash='#dashboard'">←</button>
    <h1 class="small-title">Titulo</h1>
  </div>
  <div class="content"><!-- contenido --></div>
</div>
```

### Clases CSS Comunes

| Clase | Uso |
|---|---|
| `.mobile-container` | Contenedor principal responsive |
| `.header` / `.back-btn` / `.small-title` | Barra superior |
| `.action-btn` / `.action-btn.primary` / `.action-btn.danger` | Botones |
| `.stat-card` | Tarjeta de estadistica |
| `.corte-card` | Tarjeta de corte en lista |
| `.progreso-bar` / `.progreso-fill` | Barra de progreso |
| `.tab-menu` / `.tab-item.active` / `.tab-content` | Pestañas |
| `.search-input` / `.filter-btn.active` | Busqueda y filtros |
| `.toast-message` | Mensaje temporal |
| `.empty-state` / `.error-state` | Estados vacio/error |
| `.modal-overlay` / `.modal-content` | Modales |
| `.badge-activo` / `.badge-terminado` | Badges de estado |
| `.btn-primary` / `.btn-secondary` / `.btn-danger` | Botones de accion |
| `.floating-action-btns` | Botones flotantes (editar/eliminar) |

### CSS por Vista

```
css/views/
  |- administrar-tareas/   (index, tab-resumen, tab-corte, tab-trabajador,
  |                          tab-editar, tab-asignar, shared, responsive)
  |- dashboard.css
  |- gestion-cortes.css
  |- gestion-prendas.css
  |- gestion-trabajadores.css
  |- historial-pagos.css
  |- nuevo-corte.css
```

---

## Utilidades

### Navegacion por Swipe

La vista `administrar-tareas` soporta navegacion por swipe entre tabs (izq/der) con umbral de 50px. Implementado en `index.js`.

### Exportacion PDF

En `tab-resumen.js`, usa jsPDF + AutoTable. Genera PDF con:
- Encabezado (nombre, fechas, estado, tallas)
- Tabla de tareas con asignaciones por trabajador/talla
- Resumen financiero

### Asignacion por Tallas

Los cortes tienen un array `tallas: [{ talla: "M", cantidad: 50 }]`. Al asignar tareas, se puede asignar por talla con disponibilidad calculada. Si el corte no tiene tallas, se usa cantidad global.

---

## Solucion de Problemas

### DB no carga

```javascript
// Resetear DB (desarrollo)
await db.delete();
await db.open();
```

### Service Worker no actualiza

- SW activo en desarrollo para pruebas offline
- Cambiar `CACHE_NAME` en `service-worker.js` para forzar update
- `DISABLE_SW_IN_DEV = true` en app.js para deshabilitar

### Modulos no cargan

- Verificar `type="module"` en script tags
- Requiere servidor HTTP (no file://)
- Puertos: Live Server 5501, o `python -m http.server 8080`

### Errores con monedas

1. `precioUnitario` en **centavos** (enteros)
2. `precioVentaUnitario` en **Bolivianos** (decimales)
3. `monto` en pagos en **centavos** (enteros)
4. Siempre usar `formatBs()` o `/ 100` para mostrar

### Debugging rapido

```javascript
// En consola del navegador
const db = new Dexie("TallerCosturaDB");
await db.open();
console.log("Prendas:", await db.prendas.toArray());
console.log("Cortes:", await db.cortes.toArray());
console.log("Trabajadores:", await db.trabajadores.toArray());
console.log("Pagos:", await db.pagos.toArray());
```
