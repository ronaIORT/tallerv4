# Modelo de Datos - Taller de Costura PWA

## Visión General

La aplicación utiliza **IndexedDB** como sistema de persistencia, accedido a través del wrapper **Dexie.js**. El modelo está optimizado para consultas rápidas y funcionamiento offline.

---

## Diagrama Entidad-Relación

```
┌─────────────────┐       ┌─────────────────┐
│     PRENDA      │       │   TRABAJADOR    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ nombre (UNIQUE) │       │ nombre (UNIQUE) │
│ tareas[]        │       └────────┬────────┘
└────────┬────────┘                │
         │                         │
         │ hereda tareas           │ trabaja en
         │                         │
         ▼                         ▼
┌─────────────────────────────────────────────┐
│                   CORTE                      │
├─────────────────────────────────────────────┤
│ id (PK)                                      │
│ estado (INDEX)                               │
│ fechaCreacion (INDEX)                        │
│ nombreCorte                                  │
│ nombrePrenda                                 │
│ cantidadPrendas                              │
│ precioVentaUnitario                          │
│ prendaId (FK → Prenda)                       │
│ tareas[]                                     │
│   ├── nombre                                 │
│   ├── precioUnitario                         │
│   └── asignaciones[]                         │
│        ├── trabajadorId (FK → Trabajador)    │
│        ├── trabajadorNombre                  │
│        └── cantidad                          │
└────────────────────┬────────────────────────┘
                     │
                     │ genera
                     ▼
          ┌─────────────────┐
          │      PAGO       │
          ├─────────────────┤
          │ id (PK)         │
          │ trabajadorId(FK)│
          │ fecha (INDEX)   │
          │ monto           │
          │ corteId (FK)    │
          └─────────────────┘
```

---

## Definición de Tablas

### Tabla: prendas

Almacena el catálogo de tipos de prendas que se confeccionan en el taller.

```javascript
// Definición en Dexie
prendas: "++id, &nombre"

// Esquema de documento
{
  id: Number,           // Auto-incrementado (primary key)
  nombre: String,       // Nombre único de la prenda (indexed, unique)
  tareas: Array         // Lista de tareas requeridas
}
```

#### Estructura de Tarea

```javascript
{
  nombre: String,           // Nombre descriptivo de la tarea
  precioUnitario: Number    // Precio en dólares (ej: 0.05, 0.30)
}
```

#### Ejemplo de Documento

```javascript
{
  id: 1,
  nombre: "Pantalón",
  tareas: [
    { nombre: "over aleta simple", precioUnitario: 0.05 },
    { nombre: "over aleta doble", precioUnitario: 0.05 },
    { nombre: "over bolsillo", precioUnitario: 0.05 },
    { nombre: "armado de relojero completo", precioUnitario: 0.30 },
    { nombre: "cierre a aleta", precioUnitario: 0.05 },
    { nombre: "baston", precioUnitario: 0.15 },
    // ... más tareas
  ]
}
```

#### Índices

| Campo    | Tipo         | Descripción                |
| -------- | ------------ | -------------------------- |
| `id`     | Primary Key  | Auto-incrementado          |
| `nombre` | Unique Index | Búsqueda rápida por nombre |

---

### Tabla: trabajadores

Almacena la información del personal del taller.

```javascript
// Definición en Dexie
trabajadores: "++id, &nombre"

// Esquema de documento
{
  id: Number,           // Auto-incrementado (primary key)
  nombre: String        // Nombre único del trabajador (indexed, unique)
}
```

#### Ejemplo de Documento

```javascript
{
  id: 1,
  nombre: "María García"
}
```

#### Índices

| Campo    | Tipo         | Descripción                |
| -------- | ------------ | -------------------------- |
| `id`     | Primary Key  | Auto-incrementado          |
| `nombre` | Unique Index | Búsqueda rápida por nombre |

---

### Tabla: cortes

Almacena las órdenes de producción (cortes) con sus tareas y asignaciones.

```javascript
// Definición en Dexie
cortes: "++id, estado, fechaCreacion"

// Esquema de documento
{
  id: Number,                  // Auto-incrementado (primary key)
  estado: String,              // "activo" | "terminado" (indexed)
  fechaCreacion: Date,         // Timestamp de creación (indexed)
  nombreCorte: String,         // Nombre personalizado (opcional)
  nombrePrenda: String,        // Nombre de la prenda base
  nombrePrendaOriginal: String, // Backup del nombre original
  cantidadPrendas: Number,     // Cantidad de unidades
  precioVentaUnitario: Number, // Precio de venta por unidad
  prendaId: Number,            // FK a prenda (no enforced)
  tareas: Array                // Tareas heredadas + asignaciones
}
```

#### Estructura de Tarea en Corte

```javascript
{
  nombre: String,              // Nombre de la tarea
  precioUnitario: Number,      // Precio unitario heredado
  asignaciones: Array          // Trabajadores asignados
}
```

#### Estructura de Asignación

```javascript
{
  trabajadorId: Number,        // FK a trabajador
  trabajadorNombre: String,    // Cache del nombre
  cantidad: Number             // Cantidad de unidades asignadas
}
```

#### Ejemplo de Documento Completo

```javascript
{
  id: 5,
  estado: "activo",
  fechaCreacion: "2026-02-23T04:30:00.000Z",
  nombreCorte: "Pantalones Primavera",
  nombrePrenda: "Pantalón",
  nombrePrendaOriginal: "Pantalón",
  cantidadPrendas: 100,
  precioVentaUnitario: 15.00,
  prendaId: 1,
  tareas: [
    {
      nombre: "over aleta simple",
      precioUnitario: 0.05,
      asignaciones: [
        { trabajadorId: 1, trabajadorNombre: "María García", cantidad: 50 },
        { trabajadorId: 2, trabajadorNombre: "Juan Pérez", cantidad: 50 }
      ]
    },
    {
      nombre: "baston",
      precioUnitario: 0.15,
      asignaciones: [
        { trabajadorId: 1, trabajadorNombre: "María García", cantidad: 100 }
      ]
    },
    // ... más tareas con o sin asignaciones
  ]
}
```

#### Índices

| Campo           | Tipo        | Descripción                  |
| --------------- | ----------- | ---------------------------- |
| `id`            | Primary Key | Auto-incrementado            |
| `estado`        | Index       | Filtrar por activo/terminado |
| `fechaCreacion` | Index       | Ordenar por fecha            |

---

### Tabla: pagos

Almacena el historial de pagos realizados a trabajadores.

```javascript
// Definición en Dexie
pagos: "++id, trabajadorId, fecha"

// Esquema de documento
{
  id: Number,              // Auto-incrementado (primary key)
  trabajadorId: Number,    // FK a trabajador (indexed)
  fecha: Date,             // Fecha del pago (indexed)
  monto: Number,           // Monto pagado
  corteId: Number,         // FK al corte relacionado
  notas: String            // Notas adicionales (opcional)
}
```

#### Ejemplo de Documento

```javascript
{
  id: 1,
  trabajadorId: 1,
  fecha: "2026-02-23T04:30:00.000Z",
  monto: 25.50,
  corteId: 5,
  notas: "Pago parcial por pantalones"
}
```

#### Índices

| Campo          | Tipo        | Descripción                  |
| -------------- | ----------- | ---------------------------- |
| `id`           | Primary Key | Auto-incrementado            |
| `trabajadorId` | Index       | Filtrar pagos por trabajador |
| `fecha`        | Index       | Ordenar/filtrar por fecha    |

---

## Relaciones

### Prenda → Corte (1:N)

Una prenda puede ser base de múltiples cortes. La relación se mantiene mediante `prendaId` en el corte.

```javascript
// Obtener todos los cortes de una prenda
const cortesDePrenda = await db.cortes
  .where("prendaId")
  .equals(prendaId)
  .toArray();
```

### Trabajador → Asignaciones (1:N)

Un trabajador puede tener múltiples asignaciones en diferentes cortes. La relación está embebida en el documento del corte.

```javascript
// Obtener todas las asignaciones de un trabajador
const cortes = await db.cortes.toArray();
const asignaciones = cortes.flatMap((corte) =>
  corte.tareas.flatMap((tarea) =>
    tarea.asignaciones
      .filter((a) => a.trabajadorId === trabajadorId)
      .map((a) => ({
        corteId: corte.id,
        corteNombre: corte.nombreCorte,
        tarea: tarea.nombre,
        cantidad: a.cantidad,
        precioUnitario: tarea.precioUnitario,
        total: a.cantidad * tarea.precioUnitario,
      })),
  ),
);
```

### Corte → Pago (1:N)

Un corte puede generar múltiples pagos a diferentes trabajadores.

```javascript
// Obtener pagos de un corte
const pagosCorte = await db.pagos.where("corteId").equals(corteId).toArray();
```

---

## Consultas Comunes

### Obtener cortes activos

```javascript
const cortesActivos = await db.cortes
  .where("estado")
  .equals("activo")
  .toArray();
```

### Obtener cortes ordenados por fecha

```javascript
const cortesOrdenados = await db.cortes
  .orderBy("fechaCreacion")
  .reverse()
  .toArray();
```

### Buscar prenda por nombre

```javascript
const prenda = await db.prendas.where("nombre").equals("Pantalón").first();
```

### Calcular total a pagar por corte

```javascript
async function calcularTotalPagar(corteId) {
  const corte = await db.cortes.get(corteId);

  const totalPorTrabajador = {};

  corte.tareas.forEach((tarea) => {
    tarea.asignaciones.forEach((asig) => {
      const monto = asig.cantidad * tarea.precioUnitario;
      if (!totalPorTrabajador[asig.trabajadorId]) {
        totalPorTrabajador[asig.trabajadorId] = {
          nombre: asig.trabajadorNombre,
          total: 0,
        };
      }
      totalPorTrabajador[asig.trabajadorId].total += monto;
    });
  });

  return totalPorTrabajador;
}
```

### Calcular ganancia neta de un corte

```javascript
function calcularGananciaNeta(corte) {
  // Ingreso total
  const ingresoTotal = corte.cantidadPrendas * corte.precioVentaUnitario;

  // Costo de mano de obra
  const costoManoObra = corte.tareas.reduce((total, tarea) => {
    const asignado = tarea.asignaciones.reduce((sum, a) => sum + a.cantidad, 0);
    return total + asignado * tarea.precioUnitario;
  }, 0);

  return {
    ingresoTotal,
    costoManoObra,
    gananciaNeta: ingresoTotal - costoManoObra,
  };
}
```

### Obtener historial de pagos de un trabajador

```javascript
async function historialPagosTrabajador(trabajadorId) {
  const pagos = await db.pagos
    .where("trabajadorId")
    .equals(trabajadorId)
    .reverse()
    .sortBy("fecha");

  return pagos;
}
```

---

## Migraciones

### Versión 1 → Versión 2

Se agregó la tabla `pagos`:

```javascript
// db.js
db.version(1).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
});

db.version(2).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
  pagos: "++id, trabajadorId, fecha", // Nueva tabla
});
```

### Agregar una Nueva Tabla (Futuro)

```javascript
// Incrementar versión y agregar tabla
db.version(3).stores({
  // ... tablas existentes
  configuracion: "id, clave", // Nueva tabla para settings
});
```

---

## Seed Data

La base de datos se pobla automáticamente al crearla:

```javascript
db.on("populate", async () => {
  const prendasBase = [
    {
      nombre: "Pantalón",
      tareas: [
        { nombre: "over aleta simple", precioUnitario: 0.05 },
        { nombre: "over aleta doble", precioUnitario: 0.05 },
        // ... más tareas
      ],
    },
    {
      nombre: "Short",
      tareas: [
        /* ... */
      ],
    },
    {
      nombre: "Falda",
      tareas: [
        /* ... */
      ],
    },
  ];

  await db.prendas.bulkAdd(prendasBase);
});
```

---

## Validaciones

### Integridad Referencial (Manual)

IndexedDB no soporta foreign keys automáticas, por lo que las validaciones deben hacerse en código:

```javascript
// Antes de crear un corte, verificar que la prenda existe
async function crearCorte(datos) {
  const prenda = await db.prendas.get(datos.prendaId);
  if (!prenda) {
    throw new Error("La prenda no existe");
  }

  // Crear corte con tareas heredadas
  const corte = {
    ...datos,
    tareas: prenda.tareas.map((t) => ({
      ...t,
      asignaciones: [],
    })),
  };

  return await db.cortes.add(corte);
}
```

### Validación de Datos

```javascript
function validarCorte(corte) {
  const errores = [];

  if (!corte.nombrePrenda) {
    errores.push("El nombre de prenda es requerido");
  }

  if (corte.cantidadPrendas <= 0) {
    errores.push("La cantidad debe ser mayor a 0");
  }

  if (corte.precioVentaUnitario <= 0) {
    errores.push("El precio de venta debe ser mayor a 0");
  }

  if (!["activo", "terminado"].includes(corte.estado)) {
    errores.push("Estado inválido");
  }

  return errores;
}
```

---

## Backup y Restauración

### Exportar Base de Datos

```javascript
async function exportarDB() {
  const data = {
    version: 2,
    fecha: new Date().toISOString(),
    prendas: await db.prendas.toArray(),
    trabajadores: await db.trabajadores.toArray(),
    cortes: await db.cortes.toArray(),
    pagos: await db.pagos.toArray(),
  };

  return JSON.stringify(data, null, 2);
}
```

### Importar Base de Datos

```javascript
async function importarDB(jsonString) {
  const data = JSON.parse(jsonString);

  await db.transaction(
    "rw",
    [db.prendas, db.trabajadores, db.cortes, db.pagos],
    async () => {
      await db.prendas.clear();
      await db.trabajadores.clear();
      await db.cortes.clear();
      await db.pagos.clear();

      await db.prendas.bulkAdd(data.prendas);
      await db.trabajadores.bulkAdd(data.trabajadores);
      await db.cortes.bulkAdd(data.cortes);
      await db.pagos.bulkAdd(data.pagos);
    },
  );
}
```
