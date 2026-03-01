---
name: taller-costura-context
description: Proporciona contexto completo del proyecto PWA Taller de Costura para que agentes de IA entiendan la arquitectura, modelo de datos, convenciones y flujos de trabajo. Activar cuando se trabaje en cualquier funcionalidad del proyecto tallerv4.
license: MIT
compatibility: Proyecto JavaScript ES6+ con Dexie.js para IndexedDB. Requiere navegador con soporte PWA.
metadata:
  version: "2.0.0"
  author: "Equipo Taller de Costura"
  project: "tallerv4"
  repository: "https://github.com/ronaIORT/tallerv4.git"
allowed-tools: read_file write_to_file execute_command
---

# Taller de Costura PWA - Contexto del Proyecto

## Descripción General

**Taller de Costura** es una Progressive Web App (PWA) diseñada para gestionar un taller de confección de prendas. Permite administrar cortes de producción, asignar tareas a trabajadores, calcular pagos y llevar un historial de operaciones.

### Características Principales

- **Gestión de Cortes**: Crear y administrar órdenes de producción
- **Asignación de Tareas**: Distribuir trabajo entre los trabajadores
- **Cálculo de Pagos**: Automatizar el cálculo de mano de obra
- **Modo Offline**: Funciona sin conexión a internet
- **Diseño Mobile-First**: Optimizado para dispositivos móviles
- **Tema Oscuro**: Interfaz con tema oscuro compacto

---

## Stack Tecnológico

| Tecnología      | Uso                              |
| --------------- | -------------------------------- |
| HTML5           | Estructura semántica             |
| CSS3            | Estilos con arquitectura modular |
| JavaScript ES6+ | Lógica de aplicación (módulos)   |
| Dexie.js v4.0.8 | Wrapper de IndexedDB             |
| Service Worker  | Cache y funcionalidad offline    |
| PWA Manifest    | Instalación como app nativa      |

---

## ⚠️ Sistema de Monedas (IMPORTANTE)

### Precios en Centavos vs Bolivianos

El proyecto utiliza un **sistema dual de monedas**:

| Campo                 | Unidad         | Descripción                                    |
| --------------------- | -------------- | ---------------------------------------------- |
| `precioUnitario`      | **Centavos**   | Precio de tareas (enteros, ej: 5 = 0.05 Bs)    |
| `precioVentaUnitario` | **Bolivianos** | Precio de venta del corte (decimal, ej: 15.00) |

### Conversión

```javascript
// De centavos a Bolivianos
function centavosABolivianos(centavos) {
  return centavos / 100;
}

// Formatear como Bolivianos
function formatBs(centavos) {
  return `${(centavos / 100).toFixed(2)}Bs`;
}

// Ejemplo: 50 centavos = 0.50 Bs
formatBs(50); // "0.50Bs"
```

### Ejemplo de Datos

```javascript
// Prenda con tareas en centavos
{
  nombre: "Pantalón",
  tareas: [
    { nombre: "over aleta simple", precioUnitario: 5 },    // 0.05 Bs
    { nombre: "baston", precioUnitario: 15 },              // 0.15 Bs
    { nombre: "armado de relojero completo", precioUnitario: 30 } // 0.30 Bs
  ]
}

// Corte con precio de venta en Bolivianos
{
  cantidadPrendas: 100,
  precioVentaUnitario: 15.00,  // 15 Bolivianos por unidad
  tareas: [...] // precios en centavos
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

  // Convertir centavos a Bolivianos
  const totalManoObraBs = totalManoObraCentavos / 100;

  return totalVentaBs - totalManoObraBs;
}
```

---

## Arquitectura de la Aplicación

### Patrón de Diseño

La aplicación sigue una arquitectura **SPA (Single Page Application)** con enrutamiento basado en hash (`#ruta`).

```
┌─────────────────────────────────────────────┐
│                 index.html                   │
│  ┌───────────────────────────────────────┐  │
│  │           #app (contenedor)            │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │     Vista cargada dinámicamente  │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Estructura de Directorios

```
tallerv4/
├── index.html              # Punto de entrada HTML
├── manifest.json           # Configuración PWA
├── service-worker.js       # Worker para cache offline
├── css/
│   ├── style.css           # Estilos principales (imports)
│   ├── base.css            # Reset y estilos base
│   ├── components.css      # Componentes reutilizables
│   ├── layout.css          # Estructura y grid
│   ├── modals.css          # Estilos de modales
│   ├── responsive.css      # Media queries
│   ├── variables.css       # Variables CSS
│   └── views/              # Estilos específicos por vista
├── js/
│   ├── app.js              # Enrutador principal
│   ├── db.js               # Configuración Dexie/IndexedDB
│   └── views/              # Vistas de la aplicación
│       ├── nuevo-corte.js
│       ├── gestion-prendas.js
│       ├── gestion-trabajadores.js
│       ├── historial-pagos.js
│       └── administrar-tareas/
│           ├── index.js    # Vista principal con tabs
│           ├── tab-resumen.js
│           ├── tab-corte.js
│           ├── tab-trabajador.js
│           ├── tab-editar.js
│           ├── tab-asignar.js
│           └── utils.js    # Utilidades compartidas
├── icons/                  # Iconos PWA
└── taller-costura-context/ # Esta Skill
```

---

## Sistema de Rutas

El enrutador en `js/app.js` maneja las siguientes rutas:

### Rutas Estáticas

| Ruta                    | Vista                       | Descripción                      |
| ----------------------- | --------------------------- | -------------------------------- |
| `#dashboard`            | Dashboard                   | Panel principal con estadísticas |
| `#nuevo-corte`          | renderNuevoCorte()          | Crear nuevo corte de producción  |
| `#gestion-trabajadores` | renderGestionTrabajadores() | CRUD de trabajadores             |
| `#gestion-prendas`      | renderGestionPrendas()      | CRUD de prendas                  |
| `#gestion-cortes`       | renderGestionCortes()       | Gestión de cortes con filtros    |
| `#historial-pagos`      | renderHistorialPagos()      | Historial de pagos               |

### Rutas Dinámicas

| Patrón                    | Ejemplo                 | Descripción                     |
| ------------------------- | ----------------------- | ------------------------------- |
| `#administrar-tareas/:id` | `#administrar-tareas/5` | Administrar un corte específico |
| `#ver-prenda/:id`         | `#ver-prenda/2`         | Ver detalle de una prenda       |
| `#editar-prenda/:id`      | `#editar-prenda/3`      | Editar una prenda               |

---

## Modelo de Datos (IndexedDB)

### Tablas (Versión 4)

```javascript
db.version(4).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
  pagos: "++id, trabajadorId, fecha, corteId",
});
```

### Estructura de Entidades

#### Prenda

```javascript
{
  id: Number,           // Auto-incrementado
  nombre: String,       // Único (ej: "Pantalón", "Short", "Falda")
  tareas: [             // Array de tareas
    {
      nombre: String,       // Nombre de la tarea
      precioUnitario: Number // Precio en CENTAVOS (ej: 5 = 0.05 Bs)
    }
  ]
}
```

#### Trabajador

```javascript
{
  id: Number,           // Auto-incrementado
  nombre: String        // Único
}
```

#### Corte

```javascript
{
  id: Number,           // Auto-incrementado
  estado: String,       // "activo" | "terminado"
  fechaCreacion: Date,  // Timestamp de creación
  fechaFinalizacion: Date, // Timestamp de finalización (opcional)
  nombreCorte: String,  // Nombre personalizado (opcional)
  nombrePrenda: String, // Nombre de la prenda base
  nombrePrendaOriginal: String, // Backup del nombre original
  cantidadPrendas: Number, // Cantidad de unidades
  precioVentaUnitario: Number, // Precio de venta por unidad en BOLIVIANOS
  prendaId: Number,     // FK a prenda
  tareas: [             // Tareas heredadas de la prenda
    {
      nombre: String,
      precioUnitario: Number,  // En CENTAVOS
      asignaciones: [   // Trabajadores asignados
        {
          trabajadorId: Number,
          trabajadorNombre: String,
          cantidad: Number
        }
      ]
    }
  ]
}
```

#### Pago

```javascript
{
  id: Number,           // Auto-incrementado
  trabajadorId: Number, // FK a trabajador
  fecha: Date,          // Fecha del pago
  monto: Number,        // Monto pagado
  corteId: Number       // FK al corte relacionado
}
```

---

## Convenciones de Código

### JavaScript

- **Módulos ES6**: Usar `import/export` para todas las dependencias
- **Funciones exportadas**: Prefijo `render` para vistas (ej: `renderNuevoCorte`)
- **Async/Await**: Preferir sobre `.then()` para operaciones asíncronas
- **Manejo de errores**: Usar `try/catch` en operaciones de DB

### CSS

- **Arquitectura modular**: Un archivo por categoría
- **Variables CSS**: Definidas en `variables.css`
- **BEM-like**: Clases descriptivas con guiones
- **Mobile-first**: Media queries para desktop

### Nomenclatura

- **Archivos**: kebab-case (ej: `nuevo-corte.js`)
- **Funciones**: camelCase (ej: `cargarEstadisticas`)
- **Constantes**: UPPER_SNAKE_CASE o camelCase
- **IDs DOM**: kebab-case (ej: `#lista-cortes`)

---

## Flujo de Trabajo Principal

### Crear un Nuevo Corte

1. Usuario navega a `#nuevo-corte`
2. Selecciona prenda base (carga tareas automáticamente)
3. Ingresa cantidad y precio de venta (en Bolivianos)
4. Opcionalmente asigna un nombre personalizado
5. Guarda el corte en IndexedDB

### Administrar Tareas de un Corte

1. Desde dashboard o gestión de cortes, clic en "Administrar"
2. Navega a `#administrar-tareas/:id`
3. Pestañas disponibles:
   - **Info**: Resumen del corte
   - **Corte**: Editar datos del corte
   - **Trabajador**: Ver tareas por trabajador
   - **Editar**: Modificar tareas
   - **Asignar**: Distribuir tareas a trabajadores

### Calcular Pagos

1. Al asignar tareas, se calcula automáticamente el pago por trabajador
2. Fórmula: `cantidad × precioUnitario` (resultado en centavos)
3. Para mostrar en Bolivianos: dividir entre 100
4. Los pagos se registran en la tabla `pagos`

---

## Funciones Principales de app.js

| Función                       | Descripción                            |
| ----------------------------- | -------------------------------------- |
| `cargarVista(ruta)`           | Carga la vista correspondiente al hash |
| `cargarEstadisticas()`        | Actualiza métricas del dashboard       |
| `cargarCortesRecientes()`     | Renderiza lista de cortes              |
| `filtrarCortes(termino)`      | Filtra cortes por texto                |
| `aplicarFiltro(tipo)`         | Aplica filtro por estado               |
| `calcularProgresoReal(corte)` | Calcula progreso real del corte        |
| `confirmarEliminarCorte(id)`  | Modal de confirmación para eliminar    |
| `eliminarCorte(id)`           | Elimina corte y pagos relacionados     |
| `confirmarSalida()`           | Modal de confirmación para salir       |
| `mostrarMensaje(texto)`       | Muestra toast temporal                 |

---

## Instrucciones para Nuevas Funcionalidades

Al agregar nuevas características al proyecto:

### 1. Nueva Vista

```javascript
// 1. Crear archivo en js/views/mi-vista.js
export function renderMiVista() {
  const app = document.getElementById('app');
  app.innerHTML = `...`;
}

// 2. Importar en app.js
import { renderMiVista } from './views/mi-vista.js';

// 3. Agregar caso en switch de cargarVista()
case '#mi-vista':
  renderMiVista();
  break;
```

### 2. Nueva Tabla en DB

```javascript
// En db.js, incrementar versión y agregar tabla
db.version(5).stores({
  // ...tablas existentes
  nuevaTabla: "++id, campo1, campo2",
});
```

### 3. Nuevo Estilo de Vista

```css
/* Crear archivo en css/views/mi-vista.css */
/* Importar en style.css si es necesario */
```

---

## Scripts Disponibles

El proyecto no usa bundler ni npm. Para desarrollo:

- **Live Server**: Usar extensión de VS Code (puerto 5500)
- **Producción**: Desplegar archivos estáticos directamente

### Validación de Datos

Ejecutar el script de validación:

```bash
python taller-costura-context/scripts/validar_estructura.py
```

---

## Recursos Adicionales

Para información más detallada, consultar:

- `references/ARQUITECTURA.md` - Diagramas y flujos detallados
- `references/MODELO_DATOS.md` - Schema completo y relaciones
- `references/CONVENCIONES.md` - Guía de estilo completa
- `REFERENCE.md` - Referencia técnica rápida
