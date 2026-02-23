# Convenciones de Código - Taller de Costura PWA

## Filosofía General

Este proyecto sigue principios de **código limpio** y **simplicidad**, priorizando la legibilidad sobre la abstracción. Al ser un proyecto sin framework, las convenciones son aún más importantes para mantener la consistencia.

---

## JavaScript

### Formato General

```javascript
// ✅ Correcto
const miVariable = "valor";
function miFuncion(parametro) {
  return parametro;
}

// ❌ Evitar
var miVariable = "valor"; // Usar const/let
function miFuncion(parametro) {
  return parametro;
} // Sin punto y coma inconsistente
```

### Declaración de Variables

```javascript
// ✅ Preferir const para valores que no cambian
const API_URL = "https://api.example.com";
const configuracion = { tema: "oscuro" };

// ✅ Usar let solo cuando el valor cambia
let contador = 0;
contador++;

// ❌ Evitar var
var nombre = "Juan"; // Obsoleto
```

### Funciones

```javascript
// ✅ Funciones con nombre descriptivo (verbos)
function cargarDatos() {}
function validarFormulario() {}
function calcularTotal() {}

// ✅ Arrow functions para callbacks cortos
const numeros = [1, 2, 3];
const dobles = numeros.map((n) => n * 2);

// ✅ Async/await para operaciones asíncronas
async function obtenerDatos() {
  try {
    const datos = await db.prendas.toArray();
    return datos;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// ❌ Evitar callbacks anidados (callback hell)
function obtenerDatos(cb) {
  db.prendas.toArray().then((datos) => {
    procesar(datos, (resultado) => {
      guardar(resultado, () => {
        // ...
      });
    });
  });
}
```

### Módulos ES6

```javascript
// ✅ Importaciones nombradas
import { db } from "./db.js";
import { renderVista } from "./views/vista.js";

// ✅ Exportaciones nombradas al final
function helper1() {}
function helper2() {}
export { helper1, helper2 };

// ✅ Exportación por defecto para función principal
export function renderMiVista() {}
```

### Manejo de Errores

```javascript
// ✅ Siempre usar try/catch en operaciones de DB
async function guardarDatos(datos) {
  try {
    await db.cortes.add(datos);
    mostrarMensaje("✅ Guardado correctamente");
  } catch (error) {
    console.error("Error al guardar:", error);
    mostrarMensaje("❌ Error al guardar");
  }
}

// ✅ Validar entrada antes de procesar
function procesarCorte(corte) {
  if (!corte) {
    throw new Error("Corte no proporcionado");
  }
  if (!corte.nombrePrenda) {
    throw new Error("Nombre de prenda requerido");
  }
  // ... procesar
}
```

### Nomenclatura

| Tipo       | Convención                   | Ejemplo                            |
| ---------- | ---------------------------- | ---------------------------------- |
| Variables  | camelCase                    | `corteActivo`, `listaTrabajadores` |
| Constantes | UPPER_SNAKE_CASE o camelCase | `API_URL`, `maxItems`              |
| Funciones  | camelCase (verbos)           | `cargarDatos`, `validarFormulario` |
| Clases     | PascalCase                   | `GestorDatos` (no usadas aún)      |
| Archivos   | kebab-case                   | `nuevo-corte.js`                   |
| IDs DOM    | kebab-case                   | `#lista-cortes`                    |
| Clases CSS | kebab-case                   | `.corte-card`                      |

---

## HTML

### Estructura

```html
<!-- ✅ Estructura semántica -->
<div class="mobile-container">
  <header class="header">
    <button class="back-btn">←</button>
    <h1 class="small-title">Título</h1>
  </header>

  <main class="content">
    <!-- Contenido principal -->
  </main>
</div>

<!-- ❌ Evitar divs sin semántica -->
<div>
  <div>
    <div>Contenido</div>
  </div>
</div>
```

### Atributos

```html
<!-- ✅ Orden consistente de atributos -->
<button
  id="btn-guardar"
  class="action-btn primary"
  type="button"
  onclick="guardar()"
>
  Guardar
</button>

<!-- ✅ Data attributes para datos personalizados -->
<div class="corte-card" data-id="123" data-estado="activo">
  <!-- ... -->
</div>
```

### Templates en JavaScript

```javascript
// ✅ Template literals para HTML
app.innerHTML = `
  <div class="container">
    <h1>${titulo}</h1>
    <p>${descripcion}</p>
  </div>
`;

// ✅ Para templates largos, usar array join o funciones
function renderLista(items) {
  const itemsHTML = items
    .map(
      (item) => `
    <li class="item" data-id="${item.id}">
      ${item.nombre}
    </li>
  `,
    )
    .join("");

  return `<ul class="lista">${itemsHTML}</ul>`;
}
```

---

## CSS

### Arquitectura de Archivos

```
css/
├── style.css        # Solo imports, sin reglas directas
├── variables.css    # Variables CSS globales
├── base.css         # Reset y estilos base
├── components.css   # Componentes reutilizables
├── layout.css       # Estructura de página
├── modals.css       # Modales
├── responsive.css   # Media queries
└── views/           # Estilos específicos por vista
```

### Variables CSS

```css
/* ✅ Definir en variables.css */
:root {
  /* Colores */
  --color-primary: #4a5568;
  --color-secondary: #718096;
  --color-success: #48bb78;
  --color-danger: #f56565;
  --color-background: #1a202c;
  --color-surface: #2d3748;
  --color-text: #e2e8f0;

  /* Espaciado */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Tipografía */
  --font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;

  /* Bordes */
  --border-radius: 8px;
  --border-color: #4a5568;
}

/* ✅ Usar variables */
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
}
```

### Nomenclatura de Clases

```css
/* ✅ BEM-like: bloque__elemento--modificador */
.corte-card {
}
.corte-card__header {
}
.corte-card__title {
}
.corte-card--active {
}

/* ✅ Clases utilitarias para estados */
.is-active {
}
.is-loading {
}
.is-hidden {
}
.has-error {
}

/* ❌ Evitar IDs para estilos */
#mi-elemento {
} /* Muy específico, difícil de sobrescribir */
```

### Mobile-First

```css
/* ✅ Estilos base para móvil */
.container {
  padding: var(--spacing-md);
}

/* ✅ Media queries para pantallas más grandes */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-xl);
    max-width: 600px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 800px;
  }
}
```

### Organización de Reglas

```css
/* ✅ Orden lógico de propiedades */
.elemento {
  /* 1. Posicionamiento */
  position: relative;
  top: 0;
  z-index: 1;

  /* 2. Modelo de caja */
  display: flex;
  width: 100%;
  padding: var(--spacing-md);
  margin: 0;

  /* 3. Tipografía */
  font-size: var(--font-size-md);
  text-align: center;

  /* 4. Visual */
  background-color: var(--color-surface);
  border-radius: var(--border-radius);

  /* 5. Animaciones */
  transition: background-color 0.2s ease;
}
```

---

## Estructura de Archivos

### Nombres de Archivos

```
✅ Correcto:
- nuevo-corte.js
- gestion-prendas.js
- tab-resumen.js
- administrar-tareas.css

❌ Evitar:
- nuevoCorte.js
- GestionPrendas.js
- tab_resumen.js
```

### Organización de Directorios

```
tallerv4/
├── index.html              # Punto de entrada
├── manifest.json           # PWA manifest
├── service-worker.js       # Service Worker
├── css/                    # Estilos
│   ├── style.css
│   └── views/
├── js/                     # JavaScript
│   ├── app.js
│   ├── db.js
│   └── views/
│       └── administrar-tareas/
├── icons/                  # Iconos PWA
└── taller-costura-context/ # Skill de contexto
```

---

## Comentarios

### Cuándo Comentar

```javascript
// ✅ Comentar "por qué", no "qué"
// Usar setTimeout para esperar a que el DOM se actualice
setTimeout(() => inicializarEventos(), 100);

// ✅ Documentar funciones públicas
/**
 * Calcula el total a pagar a cada trabajador en un corte
 * @param {number} corteId - ID del corte
 * @returns {Object} Objeto con totales por trabajador
 */
async function calcularTotalPagar(corteId) {
  // ...
}

// ❌ Evitar comentarios obvios
// Incrementa el contador
contador++;
```

### TODOs y FIXMEs

```javascript
// TODO: Implementar paginación para listas largas
// FIXME: El cálculo no considera tareas sin asignar
// HACK: Solución temporal mientras se implementa el sistema de cache
```

---

## Control de Versiones

### Mensajes de Commit

```
✅ Formato:
tipo(alcance): descripción

Tipos:
- feat: Nueva funcionalidad
- fix: Corrección de bug
- docs: Documentación
- style: Formato (no afecta lógica)
- refactor: Refactorización
- test: Tests
- chore: Tareas de mantenimiento

Ejemplos:
feat(cortes): agregar función de duplicar corte
fix(db): corregir error al guardar tareas vacías
docs(skill): actualizar documentación de arquitectura
style(css): mejorar espaciado en tarjetas
refactor(app): simplificar lógica del router
```

---

## Mejores Prácticas

### Rendimiento

```javascript
// ✅ Usar fragmentos para múltiples inserciones
const fragment = document.createDocumentFragment();
items.forEach((item) => {
  const li = document.createElement("li");
  li.textContent = item.nombre;
  fragment.appendChild(li);
});
lista.appendChild(fragment);

// ✅ Debounce para eventos frecuentes
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

searchInput.addEventListener(
  "input",
  debounce((e) => buscar(e.target.value), 300),
);
```

### Accesibilidad

```html
<!-- ✅ Labels asociados a inputs -->
<label for="nombre">Nombre:</label>
<input type="text" id="nombre" name="nombre" />

<!-- ✅ Botones con texto descriptivo -->
<button aria-label="Cerrar modal" class="close-btn">×</button>

<!-- ✅ Estructura de encabezados jerárquica -->
<h1>Título Principal</h1>
<h2>Sección</h2>
<h3>Subsección</h3>
```

### Seguridad

```javascript
// ✅ Sanitizar entrada de usuario
function sanitizar(texto) {
  const elemento = document.createElement("div");
  elemento.textContent = texto;
  return elemento.innerHTML;
}

// ✅ Nunca evaluar código dinámico
eval(usuarioInput); // ❌ PELIGROSO
```
