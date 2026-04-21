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
import { renderGestionCortes } from "./views/gestion-cortes.js";
import { renderGanancias } from "./views/ganancias.js";

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
                    <h1 class="header-title">🏠 Dashboard Taller <span class="version-badge" id="app-version">v8.1</span></h1>
                    <button class="header-btn logout-btn" onclick="confirmarSalida()" title="Salir de la aplicación">
                        <span class="btn-icon">🚪</span>
                    </button>
                </div>

                <div class="dashboard-content">
                    <!-- Métricas principales -->
                    <div class="stats-grid" id="estadisticas">
                        <div class="stat-card stat-cortes" onclick="window.location.hash='#gestion-cortes'">
                            <div class="stat-icon">📋</div>
                            <div class="stat-content">
                                <div class="stat-value">-</div>
                                <div class="stat-label">CORTES</div>
                            </div>
                        </div>
                        <div class="stat-card stat-ganancias" onclick="window.location.hash='#ganancias'">
                            <div class="stat-icon">💰</div>
                            <div class="stat-content">
                                <div class="stat-value">Bs -</div>
                                <div class="stat-label">GANANCIAS</div>
                            </div>
                        </div>
                        <div class="stat-card stat-trabajadores" onclick="window.location.hash='#gestion-trabajadores'">
                            <div class="stat-icon">👷</div>
                            <div class="stat-content">
                                <div class="stat-value">-</div>
                                <div class="stat-label">TRABAJADORES</div>
                            </div>
                        </div>
                        <div class="stat-card stat-por-pagar" onclick="window.location.hash='#historial-pagos'">
                            <div class="stat-icon">💳</div>
                            <div class="stat-content">
                                <div class="stat-value">Bs -</div>
                                <div class="stat-label">POR PAGAR</div>
                            </div>
                        </div>
                        <div class="stat-card stat-nuevo-corte" onclick="window.location.hash='#nuevo-corte'">
                            <div class="stat-icon">✂️</div>
                            <div class="stat-content">
                                <div class="stat-value">+</div>
                                <div class="stat-label">NUEVO CORTE</div>
                            </div>
                        </div>
                        <div class="stat-card stat-prendas" onclick="window.location.hash='#gestion-prendas'">
                            <div class="stat-icon">👕</div>
                            <div class="stat-content">
                                <div class="stat-value">-</div>
                                <div class="stat-label">PRENDAS</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Cargar estadísticas reales
    await cargarEstadisticas();
    actualizarVersionBadge();
    return;
  }

  // Nueva vista de gestión de cortes
  if (ruta === "#gestion-cortes") {
    renderGestionCortes();
    return;
  }

  // Vista de ganancias
  if (ruta === "#ganancias") {
    renderGanancias();
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

    // Calcular cantidad de prendas
    const prendasCount = await db.prendas.count();

    // Calcular monto por pagar (coincide con historial-pagos.js)
    const todosLosCortes = await db.cortes.toArray();

    const totalGanadoCentavos = todosLosCortes.reduce((total, corte) => {
      return (
        total +
        corte.tareas.reduce((sumTarea, tarea) => {
          return (
            sumTarea +
            tarea.asignaciones.reduce((sumAsig, asig) => {
              return sumAsig + asig.cantidad * tarea.precioUnitario;
            }, 0)
          );
        }, 0)
      );
    }, 0);

    const pagosRealizados = await db.pagos.toArray();
    const totalPagadoCentavos = pagosRealizados.reduce(
      (sum, pago) => sum + pago.monto,
      0,
    );

    const totalPorPagarCentavos = Math.max(
      0,
      totalGanadoCentavos - totalPagadoCentavos,
    );
    const totalPorPagarBs = totalPorPagarCentavos / 100;

    // Actualizar tarjetas de estadísticas
    const statsContainer = document.getElementById("estadisticas");
    if (statsContainer) {
      statsContainer.innerHTML = `
                <div class="stat-card stat-cortes" onclick="window.location.hash='#gestion-cortes'">
                    <div class="stat-icon">📋</div>
                    <div class="stat-content">
                        <div class="stat-value">(${cortesActivos} activo)</div>
                        <div class="stat-label">CORTES</div>
                    </div>
                </div>
                <div class="stat-card stat-ganancias" onclick="window.location.hash='#ganancias'">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-value">Bs ${gananciasRealesTotales.toFixed(0)}</div>
                        <div class="stat-label">GANANCIAS</div>
                    </div>
                </div>
                <div class="stat-card stat-trabajadores" onclick="window.location.hash='#gestion-trabajadores'">
                    <div class="stat-icon">👷</div>
                    <div class="stat-content">
                        <div class="stat-value">${trabajadoresCount}</div>
                        <div class="stat-label">TRABAJADORES</div>
                    </div>
                </div>
                <div class="stat-card stat-por-pagar" onclick="window.location.hash='#historial-pagos'">
                    <div class="stat-icon">💳</div>
                    <div class="stat-content">
                        <div class="stat-value">Bs ${totalPorPagarBs.toFixed(2)}</div>
                        <div class="stat-label">POR PAGAR</div>
                    </div>
                </div>
                <div class="stat-card stat-nuevo-corte" onclick="window.location.hash='#nuevo-corte'">
                    <div class="stat-icon">✂️</div>
                    <div class="stat-content">
                        <div class="stat-value">+</div>
                        <div class="stat-label">NUEVO CORTE</div>
                    </div>
                </div>
                <div class="stat-card stat-prendas" onclick="window.location.hash='#gestion-prendas'">
                    <div class="stat-icon">👕</div>
                    <div class="stat-content">
                        <div class="stat-value">${prendasCount}</div>
                        <div class="stat-label">PRENDAS</div>
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

// ===========================================================================
// 📊 CALCULAR PROGRESO REAL DE UN CORTE
// ===========================================================================

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
  actualizarVersionBadge();
});

async function actualizarVersionBadge() {
  const versionBadge = document.getElementById("app-version");
  if (!versionBadge) return;

  try {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const mc = new MessageChannel();
      mc.port1.onmessage = (e) => {
        if (e.data && e.data.version) {
          const version = e.data.version.replace("taller-costura-", "v");
          versionBadge.textContent = version;
        }
      };
      navigator.serviceWorker.controller.postMessage({ type: "GET_VERSION" }, [
        mc.port2,
      ]);
    }
  } catch (error) {
    console.log("No se pudo obtener versión del SW");
  }
}

// Exponer funciones globales para botones

window.mostrarMensaje = mostrarMensaje;

// ===========================================================================
// 🔧 NUEVAS FUNCIONES GLOBALES A EXPONER
// ===========================================================================

// ===========================================================================
// 🚪 FUNCIÓN DE SALIDA DE LA APLICACIÓN
// ===========================================================================
function confirmarSalida() {
  // Crear modal de confirmación
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
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
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      cerrarModalSalida();
    }
  });
}

function cerrarModalSalida() {
  const modal = document.querySelector(".modal-overlay");
  if (modal) {
    modal.remove();
  }
}

function salirAplicacion() {
  cerrarModalSalida();

  // Mostrar mensaje de despedida
  mostrarMensaje("👋 ¡Hasta pronto!");

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

// ===========================================================================
// 📋 FUNCIÓN PARA RENDERIZAR VISTA DE GESTIÓN DE CORTES
// ===========================================================================
