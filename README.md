# Taller de Costura - PWA

Aplicación web progresiva (PWA) para la gestión integral de talleres de costura. Permite administrar prendas, trabajadores, órdenes de producción (cortes), asignación de tareas y control de pagos.

## Características

- **Gestión de prendas**: Catálogo de tipos de prendas con sus tareas y precios
- **Gestión de trabajadores**: Registro del personal del taller
- **Órdenes de producción (Cortes)**: Crear y administrar cortes con seguimiento de progreso
- **Asignación de tareas**: Asignar tareas específicas a trabajadores con cantidades
- **Historial de pagos**: Registro de pagos realizados a trabajadores
- **Importar/Exportar datos**: Soporte para Excel, CSV y PDF
- **Modo offline**: Funciona sin conexión a internet
- **Instalable**: Se puede instalar como aplicación nativa en dispositivos móviles y escritorio

## Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Frontend | HTML5, CSS3 (Tema oscuro, Mobile-first) |
| JavaScript | Vanilla ES6 Modules |
| Base de datos | IndexedDB via Dexie.js |
| PWA | Service Worker, Web App Manifest |
| Importación | SheetJS (xlsx) |
| Exportación PDF | jsPDF + jsPDF-AutoTable |

## Instalación y Uso

### Requisitos
- Navegador moderno con soporte para ES6 Modules e IndexedDB
- Servidor web local (no funciona abriendo el archivo directamente)

### Ejecución local

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd tallerv4
```

2. Inicia un servidor local. Puedes usar:
   - **VS Code Live Server**: Clic derecho en `index.html` → "Open with Live Server"
   - **Python**: `python -m http.server 8080`
   - **Node.js**: `npx serve`

3. Abre `http://localhost:8080` en tu navegador

### Instalación como PWA

1. Abre la aplicación en Chrome, Edge o navegador compatible
2. En la barra de direcciones aparecerá el icono de instalación
3. Clic en "Instalar" para agregar a tu dispositivo

## Estructura del Proyecto

```
tallerv4/
├── index.html              # Punto de entrada
├── manifest.json           # Configuración PWA
├── service-worker.js       # Cache y funcionamiento offline
├── css/
│   ├── style.css           # Import principal
│   ├── variables.css       # Variables CSS (tema oscuro)
│   ├── base.css            # Reset y estilos base
│   ├── components.css      # Componentes reutilizables
│   ├── layout.css          # Estructura de página
│   ├── modals.css          # Ventanas modales
│   ├── responsive.css      # Media queries
│   └── views/              # Estilos específicos por vista
├── js/
│   ├── app.js              # Router principal y dashboard
│   ├── db.js               # Configuración IndexedDB
│   └── views/
│       ├── nuevo-corte.js
│       ├── gestion-prendas.js
│       ├── gestion-trabajadores.js
│       ├── historial-pagos.js
│       └── administrar-tareas/
│           ├── index.js
│           ├── tab-resumen.js
│           ├── tab-corte.js
│           ├── tab-trabajador.js
│           ├── tab-editar.js
│           ├── tab-asignar.js
│           └── utils.js
├── icons/                  # Iconos PWA
└── taller-costura-context/ # Documentación técnica
```

## Sistema de Monedas

El proyecto utiliza un **sistema dual de monedas** para evitar errores de punto flotante:

| Campo | Unidad | Tipo | Ejemplo |
|-------|--------|------|---------|
| `precioUnitario` | **Centavos** | Integer | `5` = 0.05 Bs |
| `precioVentaUnitario` | **Bolivianos** | Decimal | `15.00` = 15 Bs |

### Reglas

- **Tareas**: Precios en centavos (enteros) para cálculos precisos
- **Ventas**: Precios en bolivianos para facilidad de uso

### Conversión

```javascript
import { formatBs, centavosABolivianos } from "./administrar-tareas/utils.js";

// Convertir centavos a bolivianos
const precio = centavosABolivianos(50); // 0.5

// Formatear para mostrar
const texto = formatBs(50); // "0.50Bs"
```

## Base de Datos

IndexedDB con Dexie.js, versión 4:

| Tabla | Descripción |
|-------|-------------|
| `prendas` | Catálogo de prendas y sus tareas |
| `trabajadores` | Personal del taller |
| `cortes` | Órdenes de producción |
| `pagos` | Historial de pagos |

## Funcionalidades PWA

- **Service Worker**: Cachea recursos estáticos para funcionamiento offline
- **Web App Manifest**: Permite instalación en dispositivos
- **Responsive Design**: Optimizado para móviles y escritorio
- **Tema Oscuro**: Interfaz oscura por defecto

## Documentación Técnica

La documentación detallada se encuentra en `taller-costura-context/`:

- `REFERENCE.md` - Referencia técnica rápida
- `references/ARQUITECTURA.md` - Arquitectura del sistema
- `references/MODELO_DATOS.md` - Modelo de datos y consultas
- `references/CONVENCIONES.md` - Convenciones de código

## Licencia

MIT
