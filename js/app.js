// app.js - Enrutador con soporte para rutas dinámicas (VERSIÓN TEMA OSCURO COMPACTO)
import { db } from "./db.js";
import { renderNuevoCorte } from "./views/nuevo-corte.js";
import { renderGestionTrabajadores } from "./views/gestion-trabajadores.js";
import {
  renderGestionPrendas,
  renderVerPrenda,
  renderEditarPrenda,
} from "./views/gestion-prendas.js";
import { renderAdministrarTareas } from "./views/administrar-tareas/index.js";
import { renderHistorialPagos } from "./views/historial-pagos.js";

// ===========================================================================
// 🔧 SERVICE WORKER - MODO DESARROLLO
// ===========================================================================
// El Service Worker ahora está habilitado también en desarrollo para pruebas offline
// Si necesitas deshabilitarlo temporalmente, cambia esta variable a true:
const DISABLE_SW_IN_DEV = false;

if (
  DISABLE_SW_IN_DEV &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.port === "5500" ||
    window.location.port === "8080" ||
    window.location.port === "3000")
) {
  console.log("🔧 MODO DESARROLLO: Service Worker deshabilitado manualmente");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log("✅ Service Worker deshabilitado para desarrollo");
      });
    });

    const originalRegister = navigator.serviceWorker.register;
    navigator.serviceWorker.register = function () {
      console.warn("⚠️ Service Worker bloqueado en modo desarrollo");
      return Promise.reject(
        new Error("Modo desarrollo activo - Service Worker deshabilitado"),
      );
    };
  }
} else {
  console.log("🔧 Service Worker habilitado para pruebas offline");
}

// ===========================================================================

// Función para cargar una vista
async function cargarVista(ruta) {
  const app = document.getElementById("app");

  // Rutas estáticas
  if (ruta === "#dashboard") {
    app.innerHTML = `
            <div class="mobile-container">
                <div class="header">
                    <h1 class="header-title">🏠 Dashboard Taller</h1>
                    <button class="header-btn logout-btn" onclick="confirmarSalida()" title="Salir de la aplicación">
                        <span class="btn-icon">🚪</span>
                    </button>
                </div>

                <div class="dashboard-content">
                    <!-- Métricas principales -->
                    <div class="stats-grid" id="estadisticas">
                        <div class="stat-card stat-activos">
                            <div class="stat-icon">📊</div>
                            <div class="stat-content">
                                <div class="stat-value">-</div>
                                <div class="stat-label">Cortes Activos</div>
                            </div>
                        </div>
                        <div class="stat-card stat-ganancias">
                            <div class="stat-icon">💰</div>
                            <div class="stat-content">
                                <div class="stat-value">Bs -</div>
                                <div class="stat-label">Ganancias</div>
                            </div>
                        </div>
                        <div class="stat-card stat-trabajadores">
                            <div class="stat-icon">👷</div>
                            <div class="stat-content">
                                <div class="stat-value">-</div>
                                <div class="stat-label">Trabajadores</div>
                            </div>
                        </div>
                        <div class="stat-card stat-por-pagar">
                            <div class="stat-icon">💳</div>
                            <div class="stat-content">
                                <div class="stat-value">Bs -</div>
                                <div class="stat-label">Por Pagar</div>
                            </div>
                        </div>
                    </div>

                    <!-- Acciones rápidas -->
                    <div class="quick-actions-section">
                        <h2 class="section-label">⚡ Acciones Rápidas</h2>
                        <div class="quick-actions">
                            <button class="action-btn primary" onclick="window.location.hash='#nuevo-corte'">
                                <span class="action-icon">✂️</span>
                                <span class="action-text">Nuevo Corte</span>
                            </button>
                            <button class="action-btn" onclick="window.location.hash='#gestion-trabajadores'">
                                <span class="action-icon">👷</span>
                                <span class="action-text">Trabajadores</span>
                            </button>
                            <button class="action-btn" onclick="window.location.hash='#gestion-prendas'">
                                <span class="action-icon">👕</span>
                                <span class="action-text">Prendas</span>
                            </button>
                            <button class="action-btn" onclick="window.location.hash='#historial-pagos'">
                                <span class="action-icon">💳</span>
                                <span class="action-text">Pagos</span>
                            </button>
                            <button class="action-btn" onclick="window.location.hash='#gestion-cortes'">
                                <span class="action-icon">📋</span>
                                <span class="action-text">Cortes</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Cargar estadísticas reales
    await cargarEstadisticas();
    return;
  }

  // Nueva vista de gestión de cortes
  if (ruta === "#gestion-cortes") {
    renderGestionCortes();
    return;
  }

  // Rutas dinámicas (administrar-tareas/ID)
  if (ruta.startsWith("#administrar-tareas/")) {
    const partes = ruta.split("/");
    const corteId = parseInt(partes[1]);
    if (!isNaN(corteId)) {
      renderAdministrarTareas(corteId);
      return;
    }
  }

  // Rutas dinámicas (ver-prenda/ID)
  if (ruta.startsWith("#ver-prenda/")) {
    const partes = ruta.split("/");
    const prendaId = parseInt(partes[1]);
    if (!isNaN(prendaId)) {
      renderVerPrenda(prendaId);
      return;
    }
  }

  // Rutas dinámicas (editar-prenda/ID)
  if (ruta.startsWith("#editar-prenda/")) {
    const partes = ruta.split("/");
    const prendaId = parseInt(partes[1]);
    if (!isNaN(prendaId)) {
      renderEditarPrenda(prendaId);
      return;
    }
  }

  // Otras rutas
  switch (ruta) {
    case "#nuevo-corte":
      renderNuevoCorte();
      break;

    case "#gestion-trabajadores":
      renderGestionTrabajadores();
      break;

    case "#gestion-prendas":
      renderGestionPrendas();
      break;

    case "#historial-pagos":
      renderHistorialPagos();
      break;

    default:
      app.innerHTML = `
                <div class="mobile-container">
                    <div class="header">
                        <button class="back-btn" onclick="window.location.hash='#dashboard'">←</button>
                        <h1 class="small-title">Error 404</h1>
                    </div>
                    <div class="error-container">
                        <div class="error-icon">❌</div>
                        <h3>Página no encontrada</h3>
                        <p>La ruta solicitada no existe</p>
                        <button class="action-btn primary" onclick="window.location.hash='#dashboard'">
                            Volver al Dashboard
                        </button>
                    </div>
                </div>
            `;
  }
}

// Cargar estadísticas desde la DB
// Cargar estadísticas desde la DB
async function cargarEstadisticas() {
  try {
    const cortesActivos = await db.cortes
      .where("estado")
      .equals("activo")
      .count();

    // Obtener todos los cortes terminados
    const cortesTerminados = await db.cortes
      .where("estado")
      .equals("terminado")
      .toArray();

    // Calcular ganancias REALES totales (solo cortes terminados)
    // Los precios de tareas están en centavos, precioVentaUnitario está en Bolivianos
    const gananciasRealesTotales = cortesTerminados.reduce((total, corte) => {
      const totalVentaBs = corte.cantidadPrendas * corte.precioVentaUnitario;

      // Calcular mano de obra REAL del corte (solo lo asignado) - en centavos
      const totalManoObraCentavos = corte.tareas.reduce((sum, tarea) => {
        const cantidadAsignada = tarea.asignaciones.reduce((t, asignacion) => {
          return t + asignacion.cantidad;
        }, 0);
        return sum + tarea.precioUnitario * cantidadAsignada;
      }, 0);
      
      // Convertir centavos a Bolivianos
      const totalManoObraBs = totalManoObraCentavos / 100;

      return total + (totalVentaBs - totalManoObraBs);
    }, 0);

    // Calcular cantidad de trabajadores
    const trabajadoresCount = await db.trabajadores.count();

    // Calcular monto por pagar (coincide con historial-pagos.js)
    const todosLosCortes = await db.cortes.toArray();

    const totalGanadoCentavos = todosLosCortes.reduce((total, corte) => {
      return total + corte.tareas.reduce((sumTarea, tarea) => {
        return sumTarea + tarea.asignaciones.reduce((sumAsig, asig) => {
          return sumAsig + (asig.cantidad * tarea.precioUnitario);
        }, 0);
      }, 0);
    }, 0);

    const pagosRealizados = await db.pagos.toArray();
    const totalPagadoCentavos = pagosRealizados.reduce((sum, pago) => sum + pago.monto, 0);

    const totalPorPagarCentavos = Math.max(0, totalGanadoCentavos - totalPagadoCentavos);
    const totalPorPagarBs = totalPorPagarCentavos / 100;

    // Actualizar tarjetas de estadísticas
    const statsContainer = document.getElementById("estadisticas");
    if (statsContainer) {
      statsContainer.innerHTML = `
                <div class="stat-card stat-activos">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-value">${cortesActivos}</div>
                        <div class="stat-label">Cortes Activos</div>
                    </div>
                </div>
                <div class="stat-card stat-ganancias">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-value">Bs ${gananciasRealesTotales.toFixed(0)}</div>
                        <div class="stat-label">Ganancias</div>
                    </div>
                </div>
                <div class="stat-card stat-trabajadores">
                    <div class="stat-icon">👷</div>
                    <div class="stat-content">
                        <div class="stat-value">${trabajadoresCount}</div>
                        <div class="stat-label">Trabajadores</div>
                    </div>
                </div>
                <div class="stat-card stat-por-pagar">
                    <div class="stat-icon">💳</div>
                    <div class="stat-content">
                        <div class="stat-value">Bs ${totalPorPagarBs.toFixed(2)}</div>
                        <div class="stat-label">Por Pagar</div>
                    </div>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
    const statsContainer = document.getElementById("estadisticas");
    if (statsContainer) {
      statsContainer.innerHTML = `
                <div class="stat-card error">
                    <div class="stat-icon">⚠️</div>
                    <div class="stat-content">
                        <div class="stat-value">Error</div>
                        <div class="stat-label">Cargar de nuevo</div>
                    </div>
                </div>
            `;
    }
  }
}

// Cargar cortes recientes en el dashboard
async function cargarCortesRecientes() {
  const listaCortes = document.getElementById("lista-cortes");
  if (!listaCortes) return;

  try {
    // Mostrar estado de carga
    listaCortes.innerHTML = `
            <div class="loading-item">
                <div class="loading-line"></div>
                <div class="loading-line short"></div>
            </div>
        `;

    // Obtener todos los cortes ordenados por fecha (más reciente primero)
    const cortes = await db.cortes
      .orderBy("fechaCreacion")
      .reverse()
      .limit(10)
      .toArray();

    await renderizarCortes(cortes);
  } catch (error) {
    console.error("Error al cargar cortes recientes:", error);
    listaCortes.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p class="error-text">Error al cargar cortes</p>
                <button class="action-btn" onclick="cargarCortesRecientes()">
                    Reintentar
                </button>
            </div>
        `;
  }
}

// ===========================================================================
// 🔍 NUEVO CÓDIGO A AÑADIR AQUÍ (después de cargarCortesRecientes)
// ===========================================================================

// Función para inicializar la búsqueda en el dashboard
function inicializarBusqueda() {
  const searchInput = document.querySelector(".search-input");
  const filterButtons = document.querySelectorAll(".filter-btn");

  // Configurar búsqueda por texto
  if (searchInput) {
    searchInput.addEventListener("input", async (e) => {
      const term = e.target.value.toLowerCase();
      await filtrarCortes(term);
    });

    // Limpiar búsqueda con botón (opcional)
    const clearBtn = document.querySelector(".search-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        filtrarCortes("");
      });
    }
  }

  // Configurar filtros por botones
  if (filterButtons.length > 0) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        // Quitar active de todos
        filterButtons.forEach((b) => b.classList.remove("active"));
        // Añadir active al clickeado
        btn.classList.add("active");

        const filterType = btn.dataset.filter;
        await aplicarFiltro(filterType);
      });
    });
  }
}

// Filtrar cortes por texto de búsqueda
async function filtrarCortes(termino) {
  try {
    // Obtener todos los cortes ordenados por fecha
    const cortes = await db.cortes
      .orderBy("fechaCreacion")
      .reverse()
      .limit(50) // Aumentar límite para búsqueda
      .toArray();

    // Aplicar filtro de texto
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

    // Renderizar resultados filtrados
    await renderizarCortes(filtrados);
  } catch (error) {
    console.error("Error al filtrar cortes:", error);
    mostrarMensaje("❌ Error al buscar cortes");
  }
}

// Aplicar filtro por tipo (activo, terminado, etc.)
async function aplicarFiltro(tipo) {
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
        // Últimos 7 días
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 7);

        cortes = await db.cortes
          .filter((corte) => new Date(corte.fechaCreacion) > fechaLimite)
          .reverse()
          .sortBy("fechaCreacion");
        break;

      default: // 'all' o cualquier otro
        cortes = await db.cortes
          .orderBy("fechaCreacion")
          .reverse()
          .limit(50)
          .toArray();
    }

    await renderizarCortes(cortes);
  } catch (error) {
    console.error("Error al aplicar filtro:", error);
    mostrarMensaje("❌ Error al filtrar cortes");
  }
}

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

// Renderizar cortes en la lista (versión minimalista)
async function renderizarCortes(cortes) {
  const listaCortes = document.getElementById("lista-cortes");
  if (!listaCortes) return;

  if (cortes.length === 0) {
    listaCortes.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p class="empty-text">No se encontraron cortes</p>
                <button class="action-btn" onclick="limpiarBusqueda()">
                    Limpiar búsqueda
                </button>
            </div>
        `;
    return;
  }

  // Renderizar cada corte con diseño minimalista
  const cortesHTML = cortes
    .map((corte) => {
      // Nombre del corte
      const nombreMostrar =
        corte.nombreCorte || corte.nombrePrendaOriginal || corte.nombrePrenda;
      
      // Estado
      const estadoClass =
        corte.estado === "activo" ? "estado-activo" : "estado-terminado";
      const estadoText = corte.estado === "activo" ? "Activo" : "Terminado";
      
      // Calcular progreso real
      const { progreso } = calcularProgresoReal(corte);
      
      // Cantidad total
      const cantidadTotal = corte.cantidadPrendas;
      
      // Fechas
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
                    <button class="action-btn small danger" onclick="confirmarEliminarCorte(${corte.id}, '${nombreMostrar}')">
                        <span>🗑️</span> Eliminar
                    </button>
                </div>
            </div>
        `;
    })
    .join("");

  listaCortes.innerHTML = cortesHTML;
}

// Limpiar búsqueda y filtros
function limpiarBusqueda() {
  const searchInput = document.querySelector(".search-input");
  const filterButtons = document.querySelectorAll(".filter-btn");

  if (searchInput) searchInput.value = "";
  filterButtons.forEach((btn) => {
    if (btn.dataset.filter === "all") {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  cargarCortesRecientes(); // Volver a cargar lista completa
}

// ===========================================================================
// Formatear fecha a DD/MM/YYYY
function formatDate(date) {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

// Mostrar mensaje temporal
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

// Escuchar cambios en el hash (URL)
window.addEventListener("hashchange", () => {
  cargarVista(location.hash);
});

// Cargar la vista inicial
document.addEventListener("DOMContentLoaded", () => {
  cargarVista(location.hash || "#dashboard");
});

// Exponer funciones globales para botones
window.cargarCortesRecientes = cargarCortesRecientes;
window.mostrarMensaje = mostrarMensaje;

// ===========================================================================
// 🔧 NUEVAS FUNCIONES GLOBALES A EXPONER
// ===========================================================================
window.limpiarBusqueda = limpiarBusqueda;
window.aplicarFiltro = aplicarFiltro;

// Inicializar búsqueda cuando se carga el dashboard
window.inicializarBusquedaDashboard = function () {
  // Pequeño delay para asegurar que el DOM está listo
  setTimeout(() => {
    inicializarBusqueda();
  }, 100);
};

// ===========================================================================
// 🚪 FUNCIÓN DE SALIDA DE LA APLICACIÓN
// ===========================================================================
function confirmarSalida() {
  // Crear modal de confirmación
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content confirm-modal">
      <div class="modal-icon">🚪</div>
      <h3 class="modal-title">¿Salir de la aplicación?</h3>
      <p class="modal-text">Se cerrará la sesión actual.</p>
      <div class="modal-actions">
        <button class="action-btn" onclick="cerrarModalSalida()">Cancelar</button>
        <button class="action-btn primary danger" onclick="salirAplicacion()">Salir</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Cerrar modal al hacer clic fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      cerrarModalSalida();
    }
  });
}

function cerrarModalSalida() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

function salirAplicacion() {
  cerrarModalSalida();
  
  // Mostrar mensaje de despedida
  mostrarMensaje('👋 ¡Hasta pronto!');
  
  // Cerrar la pestaña/ventana si es posible
  setTimeout(() => {
    // Intentar cerrar la ventana
    if (window.close) {
      window.close();
    }
    // Si no se puede cerrar (común en navegadores modernos), redirigir a una página en blanco
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #1a1a2e; color: #eee; font-family: system-ui;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">👋</div>
        <h2 style="margin-bottom: 0.5rem;">¡Gracias por usar Taller!</h2>
        <p style="color: #888;">Puedes cerrar esta pestaña.</p>
      </div>
    `;
  }, 500);
}

// Exponer funciones de salida globalmente
window.confirmarSalida = confirmarSalida;
window.cerrarModalSalida = cerrarModalSalida;
window.salirAplicacion = salirAplicacion;

// ===========================================================================
// 🗑️ FUNCIONES PARA ELIMINAR CORTE
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
        <button class="action-btn" onclick="cerrarModalEliminar()">Cancelar</button>
        <button class="action-btn danger" onclick="eliminarCorte(${corteId})">
          <span>🗑️</span> Eliminar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Cerrar modal al hacer clic fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      cerrarModalEliminar();
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
    await cargarCortesRecientes();
    await cargarEstadisticas();
    
  } catch (error) {
    console.error('Error al eliminar corte:', error);
    mostrarMensaje('❌ Error al eliminar el corte');
  }
}

// Exponer funciones de eliminación globalmente
window.confirmarEliminarCorte = confirmarEliminarCorte;
window.cerrarModalEliminar = cerrarModalEliminar;
window.eliminarCorte = eliminarCorte;

// ===========================================================================
// 📋 FUNCIÓN PARA RENDERIZAR VISTA DE GESTIÓN DE CORTES
// ===========================================================================
function renderGestionCortes() {
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

// Cargar cortes en la vista de gestión
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

// Inicializar búsqueda en vista de cortes
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

// Filtrar cortes por texto
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

// Aplicar filtro en vista de gestión
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

// Renderizar cortes en vista de gestión
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

// Limpiar búsqueda en vista de gestión
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

// Confirmar eliminación desde vista de gestión
async function confirmarEliminarCorteGestion(corteId, nombreCorte) {
  await confirmarEliminarCorte(corteId, nombreCorte);
  // Recargar la lista después de eliminar
  setTimeout(() => cargarCortesGestion(), 500);
}

// Exponer funciones de gestión de cortes globalmente
window.renderGestionCortes = renderGestionCortes;
window.cargarCortesGestion = cargarCortesGestion;
window.limpiarBusquedaCortes = limpiarBusquedaCortes;
window.confirmarEliminarCorteGestion = confirmarEliminarCorteGestion;
