# Referencia Técnica Rápida - Taller de Costura PWA

## Índice

1. [API de Base de Datos](#api-de-base-de-datos)
2. [Funciones Principales](#funciones-principales)
3. [Componentes UI](#componentes-ui)
4. [Utilidades](#utilidades)
5. [Solución de Problemas](#solución-de-problemas)

---

## API de Base de Datos

### Inicialización

```javascript
import { db } from "./db.js";

// La instancia db está lista para usar
// Dexie maneja la conexión automáticamente
```

### Operaciones CRUD Básicas

#### Crear (Create)

```javascript
// Agregar un registro
const id = await db.prendas.add({
  nombre: "Camisa",
  tareas: [
    { nombre: "cortar", precioUnitario: 0.5 },
    { nombre: "coser", precioUnitario: 1.0 }
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
await db.cortes.update(1, { estado: "terminado" });

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

| Función                   | Descripción                            |
| ------------------------- | -------------------------------------- |
| `cargarVista(ruta)`       | Carga la vista correspondiente al hash |
| `cargarEstadisticas()`    | Actualiza métricas del dashboard       |
| `cargarCortesRecientes()` | Renderiza lista de cortes              |
| `filtrarCortes(termino)`  | Filtra cortes por texto                |
| `aplicarFiltro(tipo)`     | Aplica filtro por estado               |
| `mostrarMensaje(texto)`   | Muestra toast temporal                 |

### db.js - Base de Datos

| Función/Evento                | Descripción              |
| ----------------------------- | ------------------------ |
| `db.on('populate')`           | Semilla inicial de datos |
| `db.version(n).stores({...})` | Define schema de tablas  |

### Vistas

| Archivo                       | Función Exportada             | Descripción               |
| ----------------------------- | ----------------------------- | ------------------------- |
| `nuevo-corte.js`              | `renderNuevoCorte()`          | Formulario de nuevo corte |
| `gestion-trabajadores.js`     | `renderGestionTrabajadores()` | CRUD trabajadores         |
| `gestion-prendas.js`          | `renderGestionPrendas()`      | CRUD prendas              |
| `gestion-prendas.js`          | `renderVerPrenda(id)`         | Ver detalle prenda        |
| `gestion-prendas.js`          | `renderEditarPrenda(id)`      | Editar prenda             |
| `historial-pagos.js`          | `renderHistorialPagos()`      | Lista de pagos            |
| `administrar-tareas/index.js` | `renderAdministrarTareas(id)` | Vista con tabs            |

### Administrar Tareas (Tabs)

| Archivo             | Función                       | Descripción            |
| ------------------- | ----------------------------- | ---------------------- |
| `tab-resumen.js`    | `cargarPestanaResumen(id)`    | Info general del corte |
| `tab-corte.js`      | `cargarPestanaCorte(id)`      | Editar datos del corte |
| `tab-trabajador.js` | `cargarPestanaTrabajador(id)` | Vista por trabajador   |
| `tab-editar.js`     | `cargarPestanaEditar(id)`     | Modificar tareas       |
| `tab-asignar.js`    | `cargarPestanaAsignar(id)`    | Asignar tareas         |
| `utils.js`          | Varias                        | Funciones auxiliares   |

---

## Componentes UI

### Estructura HTML Base

```html
<div class="mobile-container">
  <div class="header">
    <button class="back-btn" onclick="location.hash='#dashboard'">←</button>
    <h1 class="small-title">Título</h1>
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
| `.stat-card`          | Tarjeta de estadística          |
| `.corte-card`         | Tarjeta de corte en lista       |
| `.tab-menu`           | Contenedor de pestañas          |
| `.tab-item`           | Botón de pestaña                |
| `.tab-item.active`    | Pestaña activa                  |
| `.tab-content`        | Contenido de pestaña            |
| `.search-input`       | Campo de búsqueda               |
| `.filter-btn`         | Botón de filtro                 |
| `.toast-message`      | Mensaje temporal                |
| `.empty-state`        | Estado vacío                    |
| `.error-state`        | Estado de error                 |
| `.loading-item`       | Estado de carga                 |

### Modales

```html
<div class="modal-overlay" id="mi-modal">
  <div class="modal">
    <div class="modal-header">
      <h3>Título Modal</h3>
      <button class="modal-close" onclick="cerrarModal()">×</button>
    </div>
    <div class="modal-body">
      <!-- Contenido -->
    </div>
    <div class="modal-footer">
      <button class="action-btn" onclick="cerrarModal()">Cancelar</button>
      <button class="action-btn primary" onclick="confirmar()">
        Confirmar
      </button>
    </div>
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

### Cálculo de Ganancias

```javascript
function calcularGananciaCorte(corte) {
  const totalVenta = corte.cantidadPrendas * corte.precioVentaUnitario;

  const totalManoObra = corte.tareas.reduce((sum, tarea) => {
    const cantidadAsignada = tarea.asignaciones.reduce(
      (t, a) => t + a.cantidad,
      0,
    );
    return sum + tarea.precioUnitario * cantidadAsignada;
  }, 0);

  return totalVenta - totalManoObra;
}
```

### Cálculo de Progreso

```javascript
function calcularProgreso(corte) {
  const tareasAsignadas = corte.tareas.reduce((total, tarea) => {
    return total + (tarea.asignaciones ? tarea.asignaciones.length : 0);
  }, 0);

  const totalTareas = corte.tareas.length;

  return totalTareas > 0
    ? Math.round((tareasAsignadas / totalTareas) * 100)
    : 0;
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

1. En desarrollo, el SW está deshabilitado
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
