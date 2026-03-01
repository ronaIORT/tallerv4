# Referencia Técnica Rápida - Taller de Costura PWA

## Índice

1. [Sistema de Monedas](#sistema-de-monedas)
2. [API de Base de Datos](#api-de-base-de-datos)
3. [Funciones Principales](#funciones-principales)
4. [Componentes UI](#componentes-ui)
5. [Utilidades](#utilidades)
6. [Solución de Problemas](#solución-de-problemas)

---

## Sistema de Monedas

### ⚠️ IMPORTANTE: Centavos vs Bolivianos

El proyecto utiliza un **sistema dual de monedas**:

| Campo                 | Unidad         | Ejemplo         |
| --------------------- | -------------- | --------------- |
| `precioUnitario`      | **Centavos**   | `5` = 0.05 Bs   |
| `precioVentaUnitario` | **Bolivianos** | `15.00` = 15 Bs |

### Funciones de Conversión

```javascript
import {
  centavosABolivianos,
  formatBs,
  formatCentavos,
} from "./administrar-tareas/utils.js";

// Convertir centavos a Bolivianos
centavosABolivianos(50); // 0.5

// Formatear como Bolivianos
formatBs(50); // "0.50Bs"

// Formatear como centavos
formatCentavos(50); // "50¢"
```

### Ejemplo de Uso

```javascript
// Crear prenda con tareas en CENTAVOS
await db.prendas.add({
  nombre: "Pantalón",
  tareas: [
    { nombre: "over aleta simple", precioUnitario: 5 },     // 0.05 Bs
    { nombre: "baston", precioUnitario: 15 },               // 0.15 Bs
    { nombre: "armado de relojero", precioUnitario: 30 }    // 0.30 Bs
  ]
});

// Crear corte con precio de venta en BOLIVIANOS
await db.cortes.add({
  nombrePrenda: "Pantalón",
  cantidadPrendas: 100,
  precioVentaUnitario: 15.00,  // 15 Bolivianos por unidad
  tareas: [...]
});
```

### Cálculo de Ganancias

```javascript
function calcularGananciaCorte(corte) {
  // Ingreso total en Bolivianos
  const totalVentaBs = corte.cantidadPrendas * corte.precioVentaUnitario;

  // Mano de obra en centavos → convertir a Bs
  const totalManoObraCentavos = corte.tareas.reduce((sum, tarea) => {
    const cantidadAsignada = tarea.asignaciones.reduce(
      (t, a) => t + a.cantidad,
      0,
    );
    return sum + tarea.precioUnitario * cantidadAsignada;
  }, 0);

  const totalManoObraBs = totalManoObraCentavos / 100;

  return totalVentaBs - totalManoObraBs;
}
```

---

## API de Base de Datos

### Versión Actual: 4

```javascript
db.version(4).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
  pagos: "++id, trabajadorId, fecha, corteId", // corteId indexado
});
```

### Inicialización

```javascript
import { db } from "./db.js";

// La instancia db está lista para usar
// Dexie maneja la conexión automáticamente
```

### Operaciones CRUD Básicas

#### Crear (Create)

```javascript
// Agregar una prenda con tareas en CENTAVOS
const id = await db.prendas.add({
  nombre: "Camisa",
  tareas: [
    { nombre: "cortar", precioUnitario: 10 },    // 0.10 Bs
    { nombre: "coser", precioUnitario: 25 }      // 0.25 Bs
  ]
});

// Agregar múltiples registros
await db.prendas.bulkAdd([
  { nombre: "Pantalón", tareas: [...] },
  { nombre: "Falda", tareas: [...] }
]);
```

#### Leer (Read)

```javascript
// Obtener todos los registros
const prendas = await db.prendas.toArray();

// Obtener por ID
const prenda = await db.prendas.get(1);

// Obtener por índice único
const prenda = await db.prendas.where("nombre").equals("Pantalón").first();

// Filtrar con condiciones
const cortesActivos = await db.cortes
  .where("estado")
  .equals("activo")
  .toArray();

// Ordenar
const cortesOrdenados = await db.cortes
  .orderBy("fechaCreacion")
  .reverse()
  .toArray();

// Contar
const total = await db.trabajadores.count();
```

#### Actualizar (Update)

```javascript
// Actualizar por ID
await db.cortes.update(1, {
  estado: "terminado",
  fechaFinalizacion: new Date(),
});

// Actualizar con modificación
const corte = await db.cortes.get(1);
corte.tareas[0].asignaciones.push({
  trabajadorId: 2,
  trabajadorNombre: "María",
  cantidad: 50,
});
await db.cortes.put(corte);
```

#### Eliminar (Delete)

```javascript
// Eliminar por ID
await db.prendas.delete(1);

// Eliminar múltiples
await db.trabajadores.where("nombre").equals("Juan").delete();

// Eliminar cortes con pagos relacionados
async function eliminarCorteCompleto(corteId) {
  await db.pagos.where("corteId").equals(corteId).delete();
  await db.cortes.delete(corteId);
}

// Limpiar tabla completa
await db.pagos.clear();
```

### Transacciones

```javascript
await db.transaction('rw', [db.cortes, db.pagos], async () => {
  const corte = await db.cortes.get(corteId);
  // ... operaciones
  await db.pagos.add({ ... });
  await db.cortes.update(corteId, { ... });
});
```

---

## Funciones Principales

### app.js - Enrutador

| Función                       | Descripción                                                         |
| ----------------------------- | ------------------------------------------------------------------- |
| `cargarVista(ruta)`           | Carga la vista correspondiente al hash                              |
| `cargarEstadisticas()`        | Actualiza métricas del dashboard                                    |
| `cargarCortesRecientes()`     | Renderiza lista de cortes                                           |
| `filtrarCortes(termino)`      | Filtra cortes por texto                                             |
| `aplicarFiltro(tipo)`         | Aplica filtro por estado ('all', 'activo', 'terminado', 'reciente') |
| `calcularProgresoReal(corte)` | Calcula progreso real basado en unidades                            |
| `confirmarEliminarCorte(id)`  | Muestra modal de confirmación para eliminar                         |
| `eliminarCorte(id)`           | Elimina corte y pagos relacionados                                  |
| `confirmarSalida()`           | Muestra modal de confirmación para salir                            |
| `mostrarMensaje(texto)`       | Muestra toast temporal                                              |

### db.js - Base de Datos

| Función/Evento                | Descripción              |
| ----------------------------- | ------------------------ |
| `db.on('populate')`           | Semilla inicial de datos |
| `db.version(n).stores({...})` | Define schema de tablas  |

### Vistas

| Archivo                       | Función Exportada             | Descripción                   |
| ----------------------------- | ----------------------------- | ----------------------------- |
| `nuevo-corte.js`              | `renderNuevoCorte()`          | Formulario de nuevo corte     |
| `gestion-trabajadores.js`     | `renderGestionTrabajadores()` | CRUD trabajadores             |
| `gestion-prendas.js`          | `renderGestionPrendas()`      | CRUD prendas                  |
| `gestion-prendas.js`          | `renderVerPrenda(id)`         | Ver detalle prenda            |
| `gestion-prendas.js`          | `renderEditarPrenda(id)`      | Editar prenda                 |
| `gestion-cortes` (en app.js)  | `renderGestionCortes()`       | Gestión de cortes con filtros |
| `historial-pagos.js`          | `renderHistorialPagos()`      | Lista de pagos                |
| `administrar-tareas/index.js` | `renderAdministrarTareas(id)` | Vista con tabs                |

### Administrar Tareas (Tabs)

| Archivo             | Función                       | Descripción            |
| ------------------- | ----------------------------- | ---------------------- |
| `tab-resumen.js`    | `cargarPestanaResumen(id)`    | Info general del corte |
| `tab-corte.js`      | `cargarPestanaCorte(id)`      | Editar datos del corte |
| `tab-trabajador.js` | `cargarPestanaTrabajador(id)` | Vista por trabajador   |
| `tab-editar.js`     | `cargarPestanaEditar(id)`     | Modificar tareas       |
| `tab-asignar.js`    | `cargarPestanaAsignar(id)`    | Asignar tareas         |
| `utils.js`          | Varias                        | Funciones auxiliares   |

### utils.js - Funciones de Utilidad

| Función                          | Descripción                              |
| -------------------------------- | ---------------------------------------- |
| `centavosABolivianos(centavos)`  | Convierte centavos a Bolivianos          |
| `formatBs(centavos)`             | Formatea centavos como "X.XXBs"          |
| `formatCentavos(centavos)`       | Formatea como "X¢"                       |
| `calcularManoObraTotal(corte)`   | Calcula mano de obra total (centavos)    |
| `calcularManoObraReal(corte)`    | Calcula mano de obra asignada (centavos) |
| `calcularCostoPorPrenda(tareas)` | Suma precios de tareas (centavos)        |
| `formatDate(date)`               | Formatea fecha a DD/MM/YYYY              |
| `mostrarMensaje(texto)`          | Muestra toast temporal                   |
| `cambiarPestana(nombre)`         | Cambia a pestaña específica              |

---

## Componentes UI

### Estructura HTML Base

```html
<div class="mobile-container">
  <div class="header">
    <button class="back-btn" onclick="location.hash='#dashboard'">←</button>
    <h1 class="small-title">Título</h1>
    <button class="header-btn logout-btn" onclick="confirmarSalida()">
      🚪
    </button>
  </div>

  <div class="content">
    <!-- Contenido específico -->
  </div>
</div>
```

### Clases CSS Comunes

| Clase                 | Uso                             |
| --------------------- | ------------------------------- |
| `.mobile-container`   | Contenedor principal responsive |
| `.header`             | Barra superior con título       |
| `.back-btn`           | Botón de retroceso              |
| `.small-title`        | Título de página                |
| `.action-btn`         | Botón de acción                 |
| `.action-btn.primary` | Botón principal (destacado)     |
| `.action-btn.danger`  | Botón de acción peligrosa       |
| `.stat-card`          | Tarjeta de estadística          |
| `.corte-card`         | Tarjeta de corte en lista       |
| `.progreso-bar`       | Barra de progreso visual        |
| `.progreso-fill`      | Relleno de barra de progreso    |
| `.tab-menu`           | Contenedor de pestañas          |
| `.tab-item`           | Botón de pestaña                |
| `.tab-item.active`    | Pestaña activa                  |
| `.tab-content`        | Contenido de pestaña            |
| `.search-input`       | Campo de búsqueda               |
| `.filter-btn`         | Botón de filtro                 |
| `.filter-btn.active`  | Filtro activo                   |
| `.toast-message`      | Mensaje temporal                |
| `.empty-state`        | Estado vacío                    |
| `.error-state`        | Estado de error                 |
| `.loading-item`       | Estado de carga                 |

### Modales

```html
<div class="modal-overlay" id="mi-modal">
  <div class="modal-content confirm-modal">
    <div class="modal-icon">🗑️</div>
    <h3 class="modal-title">Título Modal</h3>
    <p class="modal-text">Descripción del modal.</p>
    <div class="modal-actions">
      <button class="action-btn" onclick="cerrarModal()">Cancelar</button>
      <button class="action-btn primary" onclick="confirmar()">
        Confirmar
      </button>
    </div>
  </div>
</div>
```

### Tarjeta de Corte con Progreso

```html
<div class="corte-card" data-id="1">
  <div class="corte-card-header">
    <h3 class="corte-nombre">Pantalones Primavera</h3>
    <span class="corte-estado estado-activo">Activo</span>
  </div>

  <div class="corte-card-body">
    <div class="corte-progreso">
      <div class="progreso-header">
        <span class="progreso-label">Progreso</span>
        <span class="progreso-text">75%</span>
      </div>
      <div class="progreso-bar">
        <div class="progreso-fill" style="width: 75%"></div>
      </div>
    </div>

    <div class="corte-detalles">
      <div class="detalle-item">
        <span class="detalle-icon">📦</span>
        <span class="detalle-value">100 und</span>
      </div>
      <div class="detalle-item">
        <span class="detalle-icon">📅</span>
        <span class="detalle-value">23/02/2026</span>
      </div>
    </div>
  </div>

  <div class="corte-card-actions">
    <button class="action-btn small primary">⚙️ Administrar</button>
    <button class="action-btn small danger">🗑️ Eliminar</button>
  </div>
</div>
```

---

## Utilidades

### Formateo de Fecha

```javascript
function formatDate(date) {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}
// Resultado: "23/02/2026"
```

### Cálculo de Progreso Real

```javascript
function calcularProgresoReal(corte) {
  // Total de unidades esperadas = cantidadPrendas × número de tareas
  const totalTareas = corte.tareas.length;
  const totalUnidadesEsperadas = corte.cantidadPrendas * totalTareas;

  // Total de unidades asignadas
  const unidadesAsignadas = corte.tareas.reduce((total, tarea) => {
    const cantidadTarea = tarea.asignaciones.reduce(
      (sum, a) => sum + a.cantidad,
      0,
    );
    return total + cantidadTarea;
  }, 0);

  const progreso =
    totalUnidadesEsperadas > 0
      ? Math.round((unidadesAsignadas / totalUnidadesEsperadas) * 100)
      : 0;

  return {
    progreso: Math.min(progreso, 100),
    unidadesAsignadas,
    totalUnidades: totalUnidadesEsperadas,
  };
}
```

### Cálculo de Ganancias

```javascript
function calcularGananciaCorte(corte) {
  // Ingreso total en Bolivianos
  const totalVentaBs = corte.cantidadPrendas * corte.precioVentaUnitario;

  // Mano de obra en centavos (convertir a Bs)
  const totalManoObraCentavos = corte.tareas.reduce((sum, tarea) => {
    const cantidadAsignada = tarea.asignaciones.reduce(
      (t, a) => t + a.cantidad,
      0,
    );
    return sum + tarea.precioUnitario * cantidadAsignada;
  }, 0);

  const totalManoObraBs = totalManoObraCentavos / 100;

  return totalVentaBs - totalManoObraBs;
}
```

---

## Solución de Problemas

### La base de datos no carga

1. Verificar que Dexie esté cargado desde CDN
2. Comprobar que el navegador soporte IndexedDB
3. Revisar consola por errores de versión

```javascript
// Resetear base de datos (desarrollo)
await db.delete();
await db.open();
```

### El Service Worker no se actualiza

1. En desarrollo, el SW puede estar habilitado para pruebas offline
2. En producción, forzar actualización con `registration.update()`
3. Limpiar cache del navegador

### Los módulos no cargan

1. Verificar que se use `type="module"` en script tags
2. Comprobar rutas relativas correctas
3. Revisar errores CORS en consola

### PWA no instala

1. Verificar manifest.json válido
2. Comprobar HTTPS requerido
3. Revisar que los iconos existan

### IndexedDB lento con muchos datos

1. Usar índices correctamente
2. Implementar paginación
3. Usar `bulkAdd` en lugar de múltiples `add`

```javascript
// Paginación
const pagina = await db.cortes
  .orderBy("fechaCreacion")
  .reverse()
  .offset(0)
  .limit(20)
  .toArray();
```

### Errores con precios/monedas

1. Verificar que `precioUnitario` esté en **centavos** (enteros)
2. Verificar que `precioVentaUnitario` esté en **Bolivianos** (decimales)
3. Al mostrar precios de tareas, dividir entre 100
4. Usar las funciones de `utils.js` para conversión

```javascript
// ❌ Incorrecto - mezclar unidades
const total = tarea.precioUnitario * cantidad; // Resultado en centavos
console.log(total + " Bs"); // Error: muestra centavos como Bolivianos

// ✅ Correcto - convertir antes de mostrar
const totalCentavos = tarea.precioUnitario * cantidad;
console.log(formatBs(totalCentavos)); // "X.XXBs"
```

---

## Debugging

### Ver contenido de la DB

```javascript
// En consola del navegador
const db = new Dexie("TallerCosturaDB");
await db.open();
console.log("Prendas:", await db.prendas.toArray());
console.log("Cortes:", await db.cortes.toArray());
console.log("Trabajadores:", await db.trabajadores.toArray());
console.log("Pagos:", await db.pagos.toArray());
```

### Ver Service Worker

```javascript
navigator.serviceWorker.getRegistrations().then((regs) => {
  console.log("SW registrados:", regs);
});
```

### Ver estado de PWA

```javascript
// Ver si es instalable
window.addEventListener("beforeinstallprompt", (e) => {
  console.log("PWA instalable");
});
```

### Probar conversión de monedas

```javascript
// En consola, después de cargar la app
const { formatBs, centavosABolivianos } = window;

// Probar conversión
console.log(formatBs(50)); // "0.50Bs"
console.log(formatBs(100)); // "1.00Bs"
console.log(centavosABolivianos(5)); // 0.05
```
