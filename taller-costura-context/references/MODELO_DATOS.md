# Modelo de Datos - Taller de Costura PWA

## Vision General

IndexedDB via Dexie.js v4.0.8. Modelo optimizado para consultas rapidas y funcionamiento offline. Las relaciones se manejan manualmente (no hay foreign keys automaticas).

---

## Sistema Dual de Monedas (CRITICO)

| Campo | Unidad | Tipo | Ejemplo |
|---|---|---|---|
| `precioUnitario` | **Centavos** | Integer | `5` = 0.05 Bs |
| `precioVentaUnitario` | **Bolivianos** | Decimal | `15.00` = 15 Bs |
| `monto` (pagos) | **Centavos** | Integer | `2550` = 25.50 Bs |

Razon: Centavos evita errores de punto flotante. Bolivianos es mas intuitivo para el usuario al ingresar precio de venta.

Conversion siempre con funciones de `utils.js`:
```javascript
import { formatBs, centavosABolivianos, formatCentavos } from './administrar-tareas/utils.js';
```

---

## Diagrama Entidad-Relacion

```
+-----------------+       +-----------------+
|     PRENDA      |       |   TRABAJADOR    |
+-----------------+       +-----------------+
| id (PK, auto)   |       | id (PK, auto)   |
| nombre (UNIQUE) |       | nombre (UNIQUE) |
| tareas[]        |       +--------+--------+
+--------+--------+                |
         |                         |
         | hereda tareas           | trabaja en
         |                         |
         v                         v
+-----------------------------------------------+
|                   CORTE                        |
+-----------------------------------------------+
| id (PK, auto)                                 |
| estado (INDEX: "activo" | "terminado")        |
| fechaCreacion (INDEX)                         |
| fechaFinalizacion                              |
| nombreCorte                                   |
| nombrePrendaOriginal                           |
| cantidadPrendas                               |
| precioVentaUnitario (BOLIVIANOS)              |
| prendaId (FK manual)                          |
| tallas: [{ talla, cantidad }]                |
| tareas[]:                                     |
|   |- id, nombre                               |
|   |- precioUnitario (CENTAVOS)               |
|   |- unidadesTotales                          |
|   |- asignaciones[]:                          |
|        |- trabajadorId (FK)                    |
|        |- cantidad                             |
|        |- talla                                |
|        |- fecha                                |
+-----------------------+------------------------+
                        |
                        | genera
                        v
             +-----------------+
             |      PAGO       |
             +-----------------+
             | id (PK, auto)   |
             | trabajadorId(FK)|
             | fecha (INDEX)   |
             | monto (CENTAVOS)|
             | corteId (INDEX) |
             | notas           |
             +-----------------+
```

---

## Definicion de Tablas

### Version de DB: 4

```javascript
db.version(4).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
  pagos: "++id, trabajadorId, fecha, corteId",
});
```

### Historial de Versiones

| Version | Cambios |
|---|---|
| v1 | Tablas iniciales: prendas, trabajadores, cortes |
| v2 | Agrega tabla pagos |
| v3 | Preparacion para fechaFinalizacion |
| v4 | Agrega indice corteId en pagos |

---

## Tabla: prendas

Catalogo de tipos de prendas. Sirve como template para crear cortes.

```javascript
// Schema
prendas: "++id, &nombre"

// Documento
{
  id: Number,           // Auto-incrementado
  nombre: String,       // Unico (indexed)
  tareas: [{
    nombre: String,
    precioUnitario: Number  // CENTAVOS (ej: 5 = 0.05 Bs)
  }]
}
```

### Seed Data

Se ejecuta automaticamente en DB vacia via `db.on("populate")`:
- **Pantalon**: 30 tareas, precios de 5-35 centavos
- **Short**: 31 tareas, precios de 5-35 centavos
- **Falda**: 29 tareas, precios de 5-35 centavos

### Ejemplo

```javascript
{
  id: 1,
  nombre: "Pantalon",
  tareas: [
    { nombre: "over aleta simple", precioUnitario: 5 },       // 0.05 Bs
    { nombre: "armado de relojero completo", precioUnitario: 30 }, // 0.30 Bs
    { nombre: "union traseros", precioUnitario: 30 },          // 0.30 Bs
    { nombre: "parchar bolsillo", precioUnitario: 35 },       // 0.35 Bs
    // ... 26 tareas mas
  ]
}
```

---

## Tabla: trabajadores

Personal del taller. Relacion simple.

```javascript
// Schema
trabajadores: "++id, &nombre"

// Documento
{
  id: Number,           // Auto-incrementado
  nombre: String        // Unico (indexed)
}
```

### Ejemplo

```javascript
{ id: 1, nombre: "Maria Garcia" }
```

---

## Tabla: cortes

La entidad mas compleja. Usa un patron de documento embebido: tareas y asignaciones se guardan dentro del corte como arrays anidados.

```javascript
// Schema
cortes: "++id, estado, fechaCreacion"

// Documento
{
  id: Number,
  estado: String,              // "activo" | "terminado" (indexed)
  fechaCreacion: Date,         // (indexed)
  fechaFinalizacion: Date,     // null si activo
  nombreCorte: String,         // Nombre personalizado
  nombrePrendaOriginal: String, // Backup del nombre de la prenda
  cantidadPrendas: Number,    // Total unidades
  precioVentaUnitario: Number, // BOLIVIANOS (decimal)
  prendaId: Number,            // FK manual a prenda
  tallas: [{                   // Array de tallas del corte
    talla: String,             // Ej: "M", "L", "36"
    cantidad: Number           // Unidades de esta talla
  }],
  tareas: [{                   // Tareas heredadas de la prenda
    id: String,                // "task-{timestamp}-{index}"
    nombre: String,
    precioUnitario: Number,    // CENTAVOS (integer)
    unidadesTotales: Number,   // = cantidadPrendas del corte
    asignaciones: [{           // Trabajadores asignados
      trabajadorId: Number,   // FK a trabajadores
      cantidad: Number,        // Unidades asignadas
      talla: String | null,    // Talla especifica o null
      fecha: String            // ISO timestamp
    }]
  }]
}
```

### Ejemplo Completo

```javascript
{
  id: 5,
  estado: "activo",
  fechaCreacion: "2026-02-23T04:30:00.000Z",
  fechaFinalizacion: null,
  nombreCorte: "Pantalones Primavera",
  nombrePrendaOriginal: "Pantalon",
  cantidadPrendas: 100,
  precioVentaUnitario: 15.00,   // 15 Bs
  prendaId: 1,
  tallas: [
    { talla: "S", cantidad: 20 },
    { talla: "M", cantidad: 40 },
    { talla: "L", cantidad: 40 }
  ],
  tareas: [
    {
      id: "task-1700000000000-0",
      nombre: "over aleta simple",
      precioUnitario: 5,  // 0.05 Bs (CENTAVOS)
      unidadesTotales: 100,
      asignaciones: [
        { trabajadorId: 1, cantidad: 30, talla: "S", fecha: "2026-02-23T10:00:00.000Z" },
        { trabajadorId: 2, cantidad: 40, talla: "M", fecha: "2026-02-23T10:05:00.000Z" }
      ]
    },
    {
      id: "task-1700000000000-1",
      nombre: "baston",
      precioUnitario: 15,  // 0.15 Bs (CENTAVOS)
      unidadesTotales: 100,
      asignaciones: []  // Sin asignar
    }
  ]
}
```

### Indices

| Campo | Tipo | Uso |
|---|---|---|
| `id` | Primary Key | Auto-incrementado |
| `estado` | Index | Filtrar activo/terminado |
| `fechaCreacion` | Index | Ordenar por fecha |

---

## Tabla: pagos

Historial de pagos realizados a trabajadores.

```javascript
// Schema
pagos: "++id, trabajadorId, fecha, corteId"

// Documento
{
  id: Number,              // Auto-incrementado
  trabajadorId: Number,    // FK a trabajador (indexed)
  fecha: Date,             // Fecha del pago (indexed)
  monto: Number,           // CENTAVOS (integer)
  corteId: Number,         // FK al corte (indexed)
  notas: String            // Opcional
}
```

### Ejemplo

```javascript
{
  id: 1,
  trabajadorId: 1,
  fecha: "2026-02-23T04:30:00.000Z",
  monto: 2550,  // 25.50 Bs (CENTAVOS)
  corteId: 5,
  notas: "Pago parcial por pantalones"
}
```

### Indices

| Campo | Tipo | Uso |
|---|---|---|
| `id` | Primary Key | Auto-incrementado |
| `trabajadorId` | Index | Filtrar por trabajador |
| `fecha` | Index | Ordenar/filtrar por fecha |
| `corteId` | Index | Filtrar por corte (para eliminar) |

---

## Relaciones

### Prenda -> Corte (1:N)

Una prenda puede ser base de multiples cortes. La relacion se mantiene mediante `prendaId` en el corte. Las tareas se copian (heredan) al crear el corte, no se referencian.

```javascript
const cortesDePrenda = await db.cortes
  .filter(c => c.prendaId === prendaId)
  .toArray();
```

### Trabajador -> Asignaciones (1:N, embebidas)

Un trabajador puede tener asignaciones en multiples cortes. Las asignaciones estan embebidas en el documento del corte.

```javascript
const cortes = await db.cortes.toArray();
const asignaciones = cortes.flatMap(corte =>
  corte.tareas.flatMap(tarea =>
    tarea.asignaciones
      .filter(a => a.trabajadorId === trabajadorId)
      .map(a => ({
        corteId: corte.id,
        tarea: tarea.nombre,
        cantidad: a.cantidad,
        talla: a.talla,
        precioUnitario: tarea.precioUnitario,  // CENTAVOS
        total: a.cantidad * tarea.precioUnitario  // CENTAVOS
      }))
  )
);
```

### Corte -> Pago (1:N)

```javascript
const pagosCorte = await db.pagos.where("corteId").equals(corteId).toArray();
```

---

## Consultas Comunes

### Cortes activos

```javascript
const activos = await db.cortes.where("estado").equals("activo").toArray();
```

### Cortes ordenados por fecha

```javascript
const ordenados = await db.cortes.orderBy("fechaCreacion").reverse().toArray();
```

### Buscar prenda por nombre

```javascript
const prenda = await db.prendas.where("nombre").equals("Pantalon").first();
```

### Total a pagar por corte (por trabajador, en Bolivianos)

```javascript
function calcularTotalPagar(corte) {
  const totalPorTrabajador = {};
  corte.tareas.forEach(tarea => {
    tarea.asignaciones.forEach(asig => {
      const montoCentavos = asig.cantidad * tarea.precioUnitario;
      const montoBs = montoCentavos / 100;
      if (!totalPorTrabajador[asig.trabajadorId]) {
        totalPorTrabajador[asig.trabajadorId] = { nombre: asig.trabajadorNombre || '', total: 0 };
      }
      totalPorTrabajador[asig.trabajadorId].total += montoBs;
    });
  });
  return totalPorTrabajador;
}
```

### Ganancia neta de un corte

```javascript
function calcularGananciaNeta(corte) {
  const ingresoBs = corte.cantidadPrendas * corte.precioVentaUnitario;
  const costoCentavos = corte.tareas.reduce((total, tarea) => {
    const asignado = tarea.asignaciones.reduce((sum, a) => sum + a.cantidad, 0);
    return total + asignado * tarea.precioUnitario;
  }, 0);
  const costoBs = costoCentavos / 100;
  return { ingresoBs, costoBs, ganancia: ingresoBs - costoBs };
}
```

### Eliminar corte con pagos relacionados

```javascript
async function eliminarCorteCompleto(corteId) {
  await db.transaction('rw', [db.cortes, db.pagos], async () => {
    await db.pagos.where("corteId").equals(corteId).delete();
    await db.cortes.delete(corteId);
  });
}
```

### Historial de pagos de un trabajador

```javascript
const pagos = await db.pagos.where("trabajadorId").equals(trabajadorId).reverse().sortBy("fecha");
```

---

## Migraciones

### v1 -> v2: Tabla pagos

```javascript
db.version(2).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
  pagos: "++id, trabajadorId, fecha",  // Nueva tabla
});
```

### v2 -> v3: Sin cambios en schema

Preparacion para fechaFinalizacion.

### v3 -> v4: Indice corteId en pagos

```javascript
db.version(4).stores({
  // ... sin cambios
  pagos: "++id, trabajadorId, fecha, corteId",  // corteId indexado
});
```

### Agregar tabla nueva (futuro)

```javascript
db.version(5).stores({
  // ... tablas existentes
  configuracion: "id, clave",
});
```

---

## Seed Data

Se ejecuta automaticamente en DB vacia. 3 prendas con ~30 tareas cada una, precios en CENTAVOS.

```javascript
db.on("populate", async () => {
  const prendasBase = [
    {
      nombre: "Pantalon",
      tareas: [
        { nombre: "over aleta simple", precioUnitario: 5 },     // 0.05 Bs
        { nombre: "armado de relojero completo", precioUnitario: 30 }, // 0.30 Bs
        // ... ~30 tareas
      ]
    },
    { nombre: "Short", tareas: [...] },
    { nombre: "Falda", tareas: [...] },
  ];
  await db.prendas.bulkAdd(prendasBase);
});
```

---

## Validaciones

### Integridad Referencial (manual)

IndexedDB no soporta foreign keys. Las validaciones se hacen en codigo:

```javascript
async function crearCorte(datos) {
  const prenda = await db.prendas.get(datos.prendaId);
  if (!prenda) throw new Error("La prenda no existe");

  const corte = {
    ...datos,
    tareas: prenda.tareas.map(t => ({
      ...t,
      id: `task-${Date.now()}-${prenda.tareas.indexOf(t)}`,
      unidadesTotales: datos.cantidadPrendas,
      asignaciones: []
    })),
  };

  return await db.cortes.add(corte);
}
```

### Validacion de datos

```javascript
function validarCorte(corte) {
  const errores = [];
  if (!corte.nombrePrenda) errores.push("Nombre de prenda requerido");
  if (corte.cantidadPrendas <= 0) errores.push("Cantidad debe ser > 0");
  if (corte.precioVentaUnitario <= 0) errores.push("Precio de venta debe ser > 0");
  if (!["activo", "terminado"].includes(corte.estado)) errores.push("Estado invalido");

  corte.tareas?.forEach((tarea, i) => {
    if (!Number.isInteger(tarea.precioUnitario)) {
      errores.push(`Tarea ${i + 1}: precioUnitario debe ser entero (centavos)`);
    }
  });

  return errores;
}
```

---

## Backup y Restauracion

### Exportar

```javascript
async function exportarDB() {
  return JSON.stringify({
    version: 4,
    fecha: new Date().toISOString(),
    moneda: { precioUnitario: "centavos", precioVentaUnitario: "bolivianos", monto: "centavos" },
    prendas: await db.prendas.toArray(),
    trabajadores: await db.trabajadores.toArray(),
    cortes: await db.cortes.toArray(),
    pagos: await db.pagos.toArray(),
  }, null, 2);
}
```

### Importar

```javascript
async function importarDB(jsonString) {
  const data = JSON.parse(jsonString);
  await db.transaction('rw', [db.prendas, db.trabajadores, db.cortes, db.pagos], async () => {
    await db.prendas.clear();  await db.prendas.bulkAdd(data.prendas);
    await db.trabajadores.clear();  await db.trabajadores.bulkAdd(data.trabajadores);
    await db.cortes.clear();  await db.cortes.bulkAdd(data.cortes);
    await db.pagos.clear();  await db.pagos.bulkAdd(data.pagos);
  });
}
```
