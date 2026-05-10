// gestion-cortes.js - Gestión de cortes con tabs Cortes | Prendas
import { db } from '../db.js';

// ===========================================================================
// 📊 CALCULAR PROGRESO REAL DE UN CORTE
// ===========================================================================
function calcularProgresoReal(corte) {
  // Total de unidades a procesar = cantidadPrendas × número de tareas
  const totalTareas = corte.tareas.length;
  const totalUnidadesEsperadas = corte.cantidadPrendas * totalTareas;
  
  // Total de unidades asignadas = suma de todas las cantidades en asignaciones
  const unidadesAsignadas = corte.tareas.reduce((total, tarea) => {
    const cantidadTarea = tarea.asignaciones.reduce((sum, a) => sum + a.cantidad, 0);
    return total + cantidadTarea;
  }, 0);
  
  // Calcular porcentaje
  const progreso = totalUnidadesEsperadas > 0 
    ? Math.round((unidadesAsignadas / totalUnidadesEsperadas) * 100) 
    : 0;
  
  return {
    progreso: Math.min(progreso, 100), // Cap al 100%
    unidadesAsignadas,
    totalUnidades: totalUnidadesEsperadas
  };
}

// ===========================================================================
// Formatear fecha a DD/MM/YYYY
// ===========================================================================
function formatDate(date) {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

// ===========================================================================
// Mostrar mensaje temporal
// ===========================================================================
function mostrarMensaje(mensaje) {
  const app = document.getElementById("app");
  const mensajeEl = document.createElement("div");
  mensajeEl.className = "toast-message";
  mensajeEl.innerHTML = mensaje;
  app.appendChild(mensajeEl);

  setTimeout(() => {
    mensajeEl.remove();
  }, 2000);
}

// ===========================================================================
// 🗑️ FUNCIONES DE ELIMINACIÓN DE CORTES
// ===========================================================================
async function confirmarEliminarCorte(corteId, nombreCorte) {
  // Obtener información del corte para advertencias
  const corte = await db.cortes.get(corteId);
  const tieneAsignaciones = corte.tareas.some(t => t.asignaciones && t.asignaciones.length > 0);
  const tienePagos = await db.pagos.where('corteId').equals(corteId).count();
  
  // Crear modal de confirmación
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modal-eliminar-corte';
  
  let advertenciaHTML = '';
  if (tieneAsignaciones || tienePagos > 0) {
    advertenciaHTML = `
      <div class="modal-warning">
        <span class="warning-icon">⚠️</span>
        <div class="warning-text">
          ${tieneAsignaciones ? '<p>• Este corte tiene tareas asignadas a trabajadores.</p>' : ''}
          ${tienePagos > 0 ? `<p>• Este corte tiene ${tienePagos} pago(s) registrado(s).</p>` : ''}
          <p class="warning-note">Todos los datos relacionados serán eliminados.</p>
        </div>
      </div>
    `;
  }
  
  modal.innerHTML = `
    <div class="modal-content confirm-modal delete-modal">
      <div class="modal-icon danger">🗑️</div>
      <h3 class="modal-title">¿Eliminar corte?</h3>
      <p class="modal-text">Se eliminará "<strong>${nombreCorte}</strong>" permanentemente.</p>
      ${advertenciaHTML}
      <div class="modal-actions">
        <button class="action-btn" onclick="window.cerrarModalEliminar()">Cancelar</button>
        <button class="action-btn danger" onclick="window.eliminarCorte(${corteId})">
          <span>🗑️</span> Eliminar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Cerrar modal al hacer clic fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      window.cerrarModalEliminar();
    }
  });
}

function cerrarModalEliminar() {
  const modal = document.getElementById('modal-eliminar-corte');
  if (modal) {
    modal.remove();
  }
}

async function eliminarCorte(corteId) {
  try {
    cerrarModalEliminar();
    
    // Mostrar mensaje de carga
    mostrarMensaje('⏳ Eliminando corte...');
    
    // Eliminar pagos relacionados al corte
    const pagosEliminados = await db.pagos.where('corteId').equals(corteId).delete();
    console.log(`Pagos eliminados: ${pagosEliminados}`);
    
    // Eliminar el corte
    await db.cortes.delete(corteId);
    
    // Mostrar mensaje de éxito
    mostrarMensaje('✅ Corte eliminado correctamente');
    
    // Recargar lista de cortes y estadísticas
    // Nota: cargarEstadisticas no está disponible aquí, se maneja desde el dashboard
    // Recargar lista de cortes en la vista actual
    if (typeof cargarCortesGestion === 'function') {
      setTimeout(() => cargarCortesGestion(), 500);
    }
    
  } catch (error) {
    console.error('Error al eliminar corte:', error);
    mostrarMensaje('❌ Error al eliminar el corte');
  }
}

// ===========================================================================
// 📋 FUNCIÓN PARA RENDERIZAR VISTA DE GESTIÓN DE CORTES (con tabs)
// ===========================================================================
export function renderGestionCortes() {
  const app = document.getElementById("app");

  tabPrendasInicializado = false;

  app.innerHTML = `
    <div class="mobile-container">
      <div class="tab-menu">
        <div class="tab-container">
          <button class="tab-item active" data-tab="cortes">
            <span>Cortes</span>
          </button>
          <button class="tab-item" data-tab="prendas">
            <span>Prendas</span>
          </button>
        </div>
      </div>

      <!-- Tab: Cortes -->
      <div id="tab-cortes-content" class="tab-content">
        <div class="dashboard-content">
          <div class="search-filters-section">
            <div class="search-container">
              <input type="text" class="search-input" id="search-cortes"
                placeholder="🔍 Buscar por nombre, fecha o cantidad...">
              <button class="search-clear" onclick="limpiarBusquedaCortes()" title="Limpiar búsqueda">✕</button>
            </div>
            <div class="filter-buttons" id="filtros-cortes">
              <button class="filter-btn active" data-filter="all">Todos</button>
              <button class="filter-btn" data-filter="activo">Activos</button>
              <button class="filter-btn" data-filter="terminado">Terminados</button>
              <button class="filter-btn" data-filter="reciente">Última semana</button>
            </div>
          </div>

          <div id="lista-cortes">
            <div class="loading-item">
              <div class="loading-line"></div>
              <div class="loading-line short"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Prendas (hidden) -->
      <div id="tab-prendas-content" class="tab-content" style="display:none">
        <div class="dashboard-content gestion-prendas">
          <div class="form-section">
            <div class="form-card">
              <h2 class="section-title">Crear Nueva Prenda</h2>
              <div class="form-group">
                <label for="nueva-prenda">Nombre de la Prenda</label>
                <input type="text" id="nueva-prenda" class="form-control" placeholder="Ej: Pantalón Ajustado">
                <small id="error-nueva-prenda" class="error-message"></small>
              </div>
              <div class="btn-group">
                <button id="btn-crear-prenda" class="btn-primary">Crear Prenda</button>
                <button id="btn-importar-prenda" class="btn-secondary">📥 Importar</button>
              </div>
              <input type="file" id="input-importar-prenda" accept=".xlsx,.xls,.csv" style="display: none;">
            </div>
          </div>

          <div class="prendas-section">
            <div class="section-header">
              <h2 class="section-title">Prendas Registradas</h2>
              <button class="refresh-btn" onclick="cargarPrendasTab()">↻</button>
            </div>
            <div id="lista-prendas" class="prendas-list">
              <div class="loading-item">
                <div class="loading-line"></div>
                <div class="loading-line short"></div>
              </div>
            </div>
          </div>

          <div id="floating-actions-prenda" class="floating-action-btns" style="display: none;">
            <button class="btn-view-floating" onclick="verPrendaSeleccionada()">👁️ Ver</button>
            <button class="btn-edit-floating" onclick="editarPrendaSeleccionada()">✏️ Editar</button>
            <button class="btn-create-floating" onclick="crearPrendaDesdeSeleccionada()">➕ Crear</button>
            <button class="btn-danger-floating" onclick="eliminarPrendaSeleccionada()">🗑️ Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  inicializarTabsCortesPrendas();
  cargarCortesGestion();
  setTimeout(() => inicializarBusquedaCortes(), 100);
}

// ===========================================================================
// 🔄 NAVEGACIÓN POR TABS (Cortes | Prendas) + SWIPE
// ===========================================================================
const ORDEN_TABS_CORTES = ['cortes', 'prendas'];

function inicializarTabsCortesPrendas() {
  document.querySelectorAll('#app .tab-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      activarTabCortesPrendas(tab);
    });
  });

  const tabContainer = document.querySelector('#app .mobile-container');
  if (!tabContainer) return;

  let startX = 0;
  let startY = 0;
  const threshold = 50;

  tabContainer.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  tabContainer.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
      const currentTabBtn = document.querySelector('#app .tab-item.active');
      if (!currentTabBtn) return;

      const currentTab = currentTabBtn.dataset.tab;
      const currentIndex = ORDEN_TABS_CORTES.indexOf(currentTab);

      let newIndex;
      if (diffX < 0) {
        newIndex = currentIndex + 1;
      } else {
        newIndex = currentIndex - 1;
      }

      if (newIndex >= 0 && newIndex < ORDEN_TABS_CORTES.length) {
        const nextTab = ORDEN_TABS_CORTES[newIndex];
        activarTabCortesPrendas(nextTab);
      }
    }
  }, { passive: true });
}

function activarTabCortesPrendas(tab) {
  document.querySelectorAll('#app .tab-item').forEach(b => b.classList.remove('active'));
  const targetBtn = document.querySelector(`#app .tab-item[data-tab="${tab}"]`);
  if (targetBtn) targetBtn.classList.add('active');

  const cortesEl = document.getElementById('tab-cortes-content');
  const prendasEl = document.getElementById('tab-prendas-content');

  if (tab === 'cortes') {
    if (cortesEl) cortesEl.style.display = '';
    if (prendasEl) prendasEl.style.display = 'none';
  } else if (tab === 'prendas') {
    if (cortesEl) cortesEl.style.display = 'none';
    if (prendasEl) {
      prendasEl.style.display = '';
      inicializarTabPrendas();
    }
  }
}

// ===========================================================================
// 👕 TAB PRENDAS - Inicializar y cargar
// ===========================================================================
let tabPrendasInicializado = false;

function inicializarTabPrendas() {
  if (tabPrendasInicializado) {
    cargarPrendasTab();
    return;
  }
  tabPrendasInicializado = true;

  const btnCrear = document.getElementById('btn-crear-prenda');
  const inputPrenda = document.getElementById('nueva-prenda');
  const btnImportar = document.getElementById('btn-importar-prenda');
  const inputImportar = document.getElementById('input-importar-prenda');

  if (btnCrear) {
    btnCrear.addEventListener('click', () => {
      crearPrendaTab();
    });
  }

  if (inputPrenda) {
    inputPrenda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') crearPrendaTab();
    });
  }

  if (btnImportar && inputImportar) {
    btnImportar.addEventListener('click', () => {
      inputImportar.click();
    });
  }

  if (inputImportar) {
    inputImportar.addEventListener('change', async (e) => {
      if (typeof window.manejarArchivoImportacion === 'function') {
        await window.manejarArchivoImportacion(e);
        setTimeout(() => cargarPrendasTab(), 500);
      }
    });
  }

  cargarPrendasTab();
}

async function crearPrendaTab() {
  const input = document.getElementById("nueva-prenda");
  const nombre = input.value.trim();
  const errorEl = document.getElementById("error-nueva-prenda");

  errorEl.textContent = "";
  input.classList.remove("error");

  if (!nombre) {
    errorEl.textContent = "El nombre no puede estar vacío";
    input.classList.add("error");
    return;
  }

  if (nombre.length < 3) {
    errorEl.textContent = "El nombre debe tener al menos 3 caracteres";
    input.classList.add("error");
    return;
  }

  try {
    const prendaExistente = await db.prendas
      .where("nombre")
      .equalsIgnoreCase(nombre)
      .first();

    if (prendaExistente) {
      errorEl.textContent = "Ya existe una prenda con este nombre";
      input.classList.add("error");
      return;
    }

    const nuevaPrenda = { nombre: nombre, tareas: [] };
    await db.prendas.add(nuevaPrenda);
    input.value = "";
    mostrarMensaje("✅ Prenda creada correctamente");
    cargarPrendasTab();
  } catch (error) {
    console.error("Error al crear prenda:", error);
    errorEl.textContent = "Error al guardar. Intente nuevamente.";
    input.classList.add("error");
  }
}

async function cargarPrendasTab() {
  const lista = document.getElementById('lista-prendas');
  if (!lista) return;

  lista.innerHTML = `<div class="loading-item"><div class="loading-line"></div><div class="loading-line short"></div></div>`;

  try {
    const prendas = await db.prendas.toArray();

    if (prendas.length === 0) {
      lista.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👕</div>
          <p class="empty-text">No hay prendas registradas</p>
          <p class="empty-subtext">Crea la primera prenda usando el formulario</p>
        </div>
      `;
      document.getElementById('floating-actions-prenda').style.display = 'none';
      return;
    }

    lista.innerHTML = prendas
      .map(
        (prenda) => `
      <div class="prenda-card selectable-row" data-id="${prenda.id}" data-nombre="${prenda.nombre}">
        <div class="prenda-card-main">
          <div class="prenda-info">
            <h3 class="prenda-name">${prenda.nombre}</h3>
            <div class="prenda-meta">
              <span class="prenda-id">ID: ${prenda.id}</span>
              <span class="prenda-tareas">${prenda.tareas.length} tareas</span>
            </div>
          </div>
          <div class="prenda-summary">
            <span class="summary-label">Costo Total</span>
            <span class="summary-value">${(prenda.tareas.reduce((sum, tarea) => sum + tarea.precioUnitario, 0) / 100).toFixed(2)}Bs</span>
          </div>
        </div>
      </div>
    `,
      )
      .join("");

    inicializarEventosSeleccionPrendasTab();
  } catch (error) {
    console.error("Error al cargar prendas:", error);
    lista.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-text">Error al cargar prendas</p>
        <button class="action-btn" onclick="cargarPrendasTab()">Reintentar</button>
      </div>
    `;
  }
}

function inicializarEventosSeleccionPrendasTab() {
  let prendaIdSeleccionada = null;
  let prendaNombreSeleccionada = null;

  document.querySelectorAll("#tab-prendas-content .prenda-card.selectable-row").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON" || e.target.tagName === "A") return;

      document.querySelectorAll("#tab-prendas-content .selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });

      card.classList.add("selected");
      prendaIdSeleccionada = parseInt(card.dataset.id);
      prendaNombreSeleccionada = card.dataset.nombre;

      const floatingActions = document.getElementById("floating-actions-prenda");
      floatingActions.style.display = "flex";

      e.stopPropagation();
    });
  });

  document.addEventListener("click", function cerrarFloatingPrendas(e) {
    const floatingActions = document.getElementById("floating-actions-prenda");
    if (!floatingActions) return;
    const isClickInsideList = e.target.closest("#tab-prendas-content .prendas-list");
    const isClickInsideFloating = e.target.closest("#floating-actions-prenda");

    if (!isClickInsideList && !isClickInsideFloating && floatingActions) {
      floatingActions.style.display = "none";
      document.querySelectorAll("#tab-prendas-content .selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });
      prendaIdSeleccionada = null;
      prendaNombreSeleccionada = null;
    }
  });

  window.verPrendaSeleccionada = function () {
    if (prendaIdSeleccionada !== null) {
      window.location.hash = `#ver-prenda/${prendaIdSeleccionada}`;
    }
  };

  window.editarPrendaSeleccionada = function () {
    if (prendaIdSeleccionada !== null) {
      window.location.hash = `#editar-prenda/${prendaIdSeleccionada}`;
    }
  };

  window.eliminarPrendaSeleccionada = function () {
    if (prendaIdSeleccionada !== null && prendaNombreSeleccionada !== null) {
      if (typeof window.mostrarModalEliminarPrenda === 'function') {
        window.mostrarModalEliminarPrenda(prendaIdSeleccionada, prendaNombreSeleccionada);
      }
      document.getElementById("floating-actions-prenda").style.display = "none";
      document.querySelectorAll("#tab-prendas-content .selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });
    }
  };

  window.crearPrendaDesdeSeleccionada = function () {
    if (prendaIdSeleccionada !== null && prendaNombreSeleccionada !== null) {
      if (typeof window.mostrarModalCrearPrendaDesdeExistente === 'function') {
        window.mostrarModalCrearPrendaDesdeExistente(prendaIdSeleccionada, prendaNombreSeleccionada);
      }
      document.getElementById("floating-actions-prenda").style.display = "none";
      document.querySelectorAll("#tab-prendas-content .selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });
    }
  };
}

window.cargarPrendasTab = cargarPrendasTab;

// ===========================================================================
// Cargar cortes en la vista de gestión
// ===========================================================================
async function cargarCortesGestion() {
  const listaCortes = document.getElementById("lista-cortes");
  if (!listaCortes) return;

  try {
    listaCortes.innerHTML = `
      <div class="loading-item">
        <div class="loading-line"></div>
        <div class="loading-line short"></div>
      </div>
    `;

    const cortes = await db.cortes
      .orderBy("fechaCreacion")
      .reverse()
      .limit(50)
      .toArray();

    await renderizarCortesGestion(cortes);
  } catch (error) {
    console.error("Error al cargar cortes:", error);
    listaCortes.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-text">Error al cargar cortes</p>
        <button class="action-btn" onclick="cargarCortesGestion()">
          Reintentar
        </button>
      </div>
    `;
  }
}

// ===========================================================================
// Inicializar búsqueda en vista de cortes
// ===========================================================================
function inicializarBusquedaCortes() {
  const searchInput = document.getElementById("search-cortes");
  const filterButtons = document.querySelectorAll("#filtros-cortes .filter-btn");

  if (searchInput) {
    searchInput.addEventListener("input", async (e) => {
      const term = e.target.value.toLowerCase();
      await filtrarCortesGestion(term);
    });
  }

  if (filterButtons.length > 0) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const filterType = btn.dataset.filter;
        await aplicarFiltroGestion(filterType);
      });
    });
  }
}

// ===========================================================================
// Filtrar cortes por texto
// ===========================================================================
async function filtrarCortesGestion(termino) {
  try {
    const cortes = await db.cortes
      .orderBy("fechaCreacion")
      .reverse()
      .limit(50)
      .toArray();

    const filtrados = cortes.filter((corte) => {
      const nombre = (
        corte.nombreCorte ||
        corte.nombrePrendaOriginal ||
        corte.nombrePrenda ||
        ""
      ).toLowerCase();
      const fecha = formatDate(corte.fechaCreacion).toLowerCase();

      return (
        nombre.includes(termino) ||
        fecha.includes(termino) ||
        corte.cantidadPrendas.toString().includes(termino)
      );
    });

    await renderizarCortesGestion(filtrados);
  } catch (error) {
    console.error("Error al filtrar cortes:", error);
    mostrarMensaje("❌ Error al buscar cortes");
  }
}

// ===========================================================================
// Aplicar filtro en vista de gestión
// ===========================================================================
async function aplicarFiltroGestion(tipo) {
  try {
    let cortes;

    switch (tipo) {
      case "activo":
        cortes = await db.cortes
          .where("estado")
          .equals("activo")
          .reverse()
          .sortBy("fechaCreacion");
        break;

      case "terminado":
        cortes = await db.cortes
          .where("estado")
          .equals("terminado")
          .reverse()
          .sortBy("fechaCreacion");
        break;

      case "reciente":
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 7);

        cortes = await db.cortes
          .filter((corte) => new Date(corte.fechaCreacion) > fechaLimite)
          .reverse()
          .sortBy("fechaCreacion");
        break;

      default:
        cortes = await db.cortes
          .orderBy("fechaCreacion")
          .reverse()
          .limit(50)
          .toArray();
    }

    await renderizarCortesGestion(cortes);
  } catch (error) {
    console.error("Error al aplicar filtro:", error);
    mostrarMensaje("❌ Error al filtrar cortes");
  }
}

// ===========================================================================
// Renderizar cortes en vista de gestión
// ===========================================================================
async function renderizarCortesGestion(cortes) {
  const listaCortes = document.getElementById("lista-cortes");
  if (!listaCortes) return;

  if (cortes.length === 0) {
    listaCortes.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-text">No se encontraron cortes</p>
        <button class="action-btn primary" onclick="window.location.hash='#nuevo-corte'">
          ✂️ Crear Nuevo Corte
        </button>
      </div>
    `;
    return;
  }

  const cortesHTML = cortes
    .map((corte) => {
      const nombreMostrar =
        corte.nombreCorte || corte.nombrePrendaOriginal || corte.nombrePrenda;
      
      const estadoClass =
        corte.estado === "activo" ? "estado-activo" : "estado-terminado";
      const estadoText = corte.estado === "activo" ? "Activo" : "Terminado";
      
      const { progreso } = calcularProgresoReal(corte);
      const cantidadTotal = corte.cantidadPrendas;
      const fechaInicio = formatDate(corte.fechaCreacion);
      const fechaFin = corte.fechaFinalizacion 
        ? formatDate(corte.fechaFinalizacion) 
        : null;

      return `
        <div class="corte-card" data-id="${corte.id}">
          <div class="corte-card-header">
            <h3 class="corte-nombre">${nombreMostrar}</h3>
            <span class="corte-estado ${estadoClass}">${estadoText}</span>
          </div>
          
          <div class="corte-card-body">
            <div class="corte-progreso">
              <div class="progreso-header">
                <span class="progreso-label">Progreso</span>
                <span class="progreso-text">${progreso}%</span>
              </div>
              <div class="progreso-bar">
                <div class="progreso-fill" style="width: ${progreso}%"></div>
              </div>
            </div>
            
            <div class="corte-detalles">
              <div class="detalle-item">
                <span class="detalle-icon">📦</span>
                <span class="detalle-label">Cantidad:</span>
                <span class="detalle-value">${cantidadTotal} und</span>
              </div>
              <div class="detalle-item">
                <span class="detalle-icon">📅</span>
                <span class="detalle-label">Inicio:</span>
                <span class="detalle-value">${fechaInicio}</span>
              </div>
              ${fechaFin ? `
              <div class="detalle-item">
                <span class="detalle-icon">✅</span>
                <span class="detalle-label">Finalizado:</span>
                <span class="detalle-value">${fechaFin}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          <div class="corte-card-actions">
            <button class="action-btn small primary" onclick="window.location.hash='#administrar-tareas/${corte.id}'">
              <span>⚙️</span> Administrar
            </button>
            <button class="action-btn small danger" onclick="confirmarEliminarCorteGestion(${corte.id}, '${nombreMostrar}')">
              <span>🗑️</span> Eliminar
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  listaCortes.innerHTML = cortesHTML;
}

// ===========================================================================
// Limpiar búsqueda en vista de gestión
// ===========================================================================
function limpiarBusquedaCortes() {
  const searchInput = document.getElementById("search-cortes");
  const filterButtons = document.querySelectorAll("#filtros-cortes .filter-btn");

  if (searchInput) searchInput.value = "";
  filterButtons.forEach((btn) => {
    if (btn.dataset.filter === "all") {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  cargarCortesGestion();
}

// ===========================================================================
// Confirmar eliminación desde vista de gestión
// ===========================================================================
async function confirmarEliminarCorteGestion(corteId, nombreCorte) {
  await confirmarEliminarCorte(corteId, nombreCorte);
  // Recargar la lista después de eliminar
  setTimeout(() => cargarCortesGestion(), 500);
}

// ===========================================================================
// Exponer funciones globalmente para onclick handlers
// ===========================================================================
window.limpiarBusquedaCortes = limpiarBusquedaCortes;
window.cargarCortesGestion = cargarCortesGestion;
window.confirmarEliminarCorteGestion = confirmarEliminarCorteGestion;
window.confirmarEliminarCorte = confirmarEliminarCorte;
window.cerrarModalEliminar = cerrarModalEliminar;
window.eliminarCorte = eliminarCorte;