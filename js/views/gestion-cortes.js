// gestion-cortes.js - Módulo de gestión de cortes
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
// 📋 FUNCIÓN PARA RENDERIZAR VISTA DE GESTIÓN DE CORTES
// ===========================================================================
export function renderGestionCortes() {
  const app = document.getElementById("app");
  
  app.innerHTML = `
    <div class="mobile-container">
      <div class="header">
        <button class="back-btn" onclick="window.location.hash='#dashboard'">←</button>
        <h1 class="small-title">📋 Gestión de Cortes</h1>
      </div>

      <div class="dashboard-content">
        <!-- Barra de búsqueda y filtros -->
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

        <!-- Lista de cortes -->
        <div id="lista-cortes">
          <div class="loading-item">
            <div class="loading-line"></div>
            <div class="loading-line short"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Cargar cortes
  cargarCortesGestion();
  
  // Inicializar búsqueda y filtros
  setTimeout(() => inicializarBusquedaCortes(), 100);
}

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