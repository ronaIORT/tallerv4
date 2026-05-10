# Convenciones de Codigo - Taller de Costura PWA

## Regla Fundamental: Sistema de Monedas

| Campo | Unidad | Tipo | Uso |
|---|---|---|---|
| `precioUnitario` | **Centavos** | Integer | Precio de tareas |
| `precioVentaUnitario` | **Bolivianos** | Decimal | Precio de venta |
| `monto` (pagos) | **Centavos** | Integer | Monto pagado |

### Correcto

```javascript
const tarea = { nombre: "over aleta simple", precioUnitario: 5 }; // 5 centavos = 0.05 Bs
const corte = { cantidadPrendas: 100, precioVentaUnitario: 15.0 }; // 15 Bs
const pago = { monto: 2550 }; // 25.50 Bs

// Siempre usar funciones de conversion
const precioMostrar = formatBs(tarea.precioUnitario); // "0.05Bs"
```

### Incorrecto

```javascript
const tarea = { precioUnitario: 0.05 };  // NO usar decimales para tareas
const corte = { precioVentaUnitario: 1500 }; // NO usar centavos para venta

// NO hacer conversion manual inconsistente
const precio = tarea.precioUnitario / 100 + " Bs"; // Inconsistente
```

### Calculos con Monedas

```javascript
// CORRECTO: calcular en centavos, mostrar en Bs
const totalCentavos = tarea.precioUnitario * cantidad;
return formatBs(totalCentavos);

// CORRECTO: ganancia con conversion apropiada
const ingresoBs = corte.cantidadPrendas * corte.precioVentaUnitario; // Bs
const manoObraCentavos = corte.tareas.reduce((sum, t) => {
  const asignado = t.asignaciones.reduce((s, a) => s + a.cantidad, 0);
  return sum + t.precioUnitario * asignado;  // centavos
}, 0);
const manoObraBs = manoObraCentavos / 100;
return ingresoBs - manoObraBs;

// INCORRECTO: mezclar unidades sin convertir
const ingreso = corte.cantidadPrendas * corte.precioVentaUnitario;
const manoObra = corte.tareas.reduce((sum, t) => sum + t.precioUnitario, 0);
return ingreso - manoObra; // Bs - centavos = incorrecto
```

---

## JavaScript

### Modulos ES6

```javascript
// Importaciones
import { db } from "./db.js";
import { formatBs, centavosABolivianos } from "./administrar-tareas/utils.js";

// Exportaciones nombradas al final
function helper1() {}
function helper2() {}
export { helper1, helper2 };

// Exportacion de funcion principal
export function renderMiVista() {}
```

### Variables y Funciones

```javascript
// Preferir const, usar let solo si cambia
const MAX_ITEMS = 100;
let contador = 0;

// Funciones con nombre descriptivo (verbos)
function cargarDatos() {}
function validarFormulario() {}
function calcularTotal() {}

// Async/await (no .then() anidados)
async function obtenerDatos() {
  try {
    const datos = await db.prendas.toArray();
    return datos;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
```

### Funciones Globales (window.*)

Los templates HTML usan `onclick="funcionGlobal()"`. Las funciones deben exponerse:

```javascript
window.miFuncion = miFuncion;
window.confirmarSalida = confirmarSalida;
```

### Manejo de Errores

```javascript
// Siempre try/catch en operaciones de DB
async function guardarDatos(datos) {
  try {
    await db.cortes.add(datos);
    mostrarMensaje("Guardado correctamente");
  } catch (error) {
    console.error("Error al guardar:", error);
    mostrarMensaje("Error al guardar");
  }
}
```

### Nomenclatura

| Tipo | Convencion | Ejemplo |
|---|---|---|
| Variables | camelCase | `corteActivo`, `listaTrabajadores` |
| Constantes | UPPER_SNAKE_CASE o camelCase | `MAX_ITEMS`, `maxItems` |
| Funciones | camelCase (verbos) | `cargarDatos`, `validarFormulario` |
| Archivos | kebab-case | `nuevo-corte.js` |
| IDs DOM | kebab-case | `#lista-cortes` |
| Clases CSS | kebab-case | `.corte-card` |
| Data attributes | kebab-case | `data-corte-id` |

---

## HTML

### Estructura Base

```html
<div class="mobile-container">
  <div class="header">
    <button class="back-btn" onclick="location.hash='#dashboard'">←</button>
    <h1 class="small-title">Titulo</h1>
  </div>
  <div class="content">
    <!-- contenido -->
  </div>
</div>
```

### Templates en JavaScript

```javascript
app.innerHTML = `
  <div class="container">
    <h1>${titulo}</h1>
    <span class="precio">${formatBs(precio)}</span>
  </div>
`;
```

---

## CSS

### Arquitectura de Archivos

```
css/
  |- style.css        # Solo imports
  |- variables.css    # Variables globales (tema oscuro)
  |- base.css         # Reset, tipografia
  |- components.css   # Botones, cards, inputs
  |- layout.css       # Grid, contenedores
  |- modals.css       # Modales
  |- responsive.css   # Media queries
  |- views/           # Estilos por vista
```

### Variables CSS (Tema Oscuro)

```css
:root {
  --color-background: #1a202c;
  --color-surface: #2d3748;
  --color-primary: #4a5568;
  --color-text: #e2e8f0;
  --color-text-secondary: #a0aec0;
}
```

### Nomenclatura de Clases

```css
/* BEM-like */
.corte-card {}
.corte-card__header {}

/* Estados */
.estado-activo { color: var(--color-success); }
.estado-terminado { color: var(--color-secondary); }

/* Evitar IDs para estilos */
```

### Mobile-First

```css
.container { padding: var(--spacing-md); }
@media (min-width: 768px) { .container { max-width: 600px; } }
```

---

## Estructura de Archivos

### Nombres

```
CORRECTO: nuevo-corte.js, tab-resumen.js, gestion-prendas.css
INCORRECTO: nuevoCorte.js, TabResumen.js, gestion_prendas.js
```

### Directorios

```
tallerv4/
  |- index.html
  |- manifest.json
  |- service-worker.js
  |- css/
  |    |- style.css, variables.css, base.css, components.css, layout.css, modals.css, responsive.css
  |    |- views/
  |- js/
  |    |- app.js, db.js
  |    |- views/
  |         |- *.js
  |         |- administrar-tareas/
  |- icons/
  |- taller-costura-context/
```

---

## Comentarios

- No agregar comentarios salvo que se pida explicitamente
- Si se comenta, documentar "por que", no "que"
- Documentar decisiones de moneda: `// precioUnitario en centavos, convertir a Bs para mostrar`

---

## Control de Versiones

### Mensajes de Commit

```
tipo(alcance): descripcion

Tipos: feat, fix, docs, style, refactor, test, chore

Ejemplos:
feat(cortes): agregar funcion de eliminar corte con pagos
fix(db): corregir precios en centavos para tareas
refactor(app): simplificar logica del router
```

---

## Checklist para Nuevo Codigo

- [ ] `precioUnitario` en **centavos** (enteros)?
- [ ] `precioVentaUnitario` en **Bolivianos** (decimales)?
- [ ] `monto` en pagos en **centavos** (enteros)?
- [ ] Se usan funciones de conversion de `utils.js`?
- [ ] Funciones async tienen try/catch?
- [ ] Nombres siguen convenciones (camelCase, kebab-case)?
- [ ] HTML es semantico?
- [ ] Se usan variables CSS en lugar de valores hardcodeados?
- [ ] Funciona en movil (responsive)?
- [ ] Nuevas rutas agregadas a `service-worker.js`?
