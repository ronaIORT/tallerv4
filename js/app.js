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
import { renderPerfil } from "./views/perfil.js";
import { renderDashboard } from "./views/dashboard.js";

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
    renderDashboard();
    actualizarVersionBadge();
    actualizarNav(ruta);
    return;
  }

  if (ruta === "#perfil") {
    window.location.hash = "#gestion-trabajadores";
    return;
  }

  // Nueva vista de gestión de cortes
  if (ruta === "#gestion-cortes") {
    renderGestionCortes();
    actualizarNav(ruta);
    return;
  }

  if (ruta === "#ganancias") {
    renderGanancias();
    actualizarNav(ruta);
    return;
  }

  // Rutas dinámicas (administrar-tareas/ID)
  if (ruta.startsWith("#administrar-tareas/")) {
    const partes = ruta.split("/");
    const corteId = parseInt(partes[1]);
    if (!isNaN(corteId)) {
      renderAdministrarTareas(corteId);
      actualizarNav(ruta);
      return;
    }
  }

  if (ruta.startsWith("#ver-prenda/")) {
    const partes = ruta.split("/");
    const prendaId = parseInt(partes[1]);
    if (!isNaN(prendaId)) {
      renderVerPrenda(prendaId);
      actualizarNav(ruta);
      return;
    }
  }

  if (ruta.startsWith("#editar-prenda/")) {
    const partes = ruta.split("/");
    const prendaId = parseInt(partes[1]);
    if (!isNaN(prendaId)) {
      renderEditarPrenda(prendaId);
      actualizarNav(ruta);
      return;
    }
  }

  // Otras rutas
  switch (ruta) {
    case "#nuevo-corte":
      renderNuevoCorte();
      actualizarNav(ruta);
      break;

    case "#gestion-trabajadores":
      renderGestionTrabajadores();
      actualizarNav(ruta);
      break;

    case "#gestion-prendas":
      renderGestionPrendas();
      actualizarNav(ruta);
      break;

    case "#historial-pagos":
      renderHistorialPagos();
      actualizarNav(ruta);
      break;

    default:
      actualizarNav(ruta);
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

// ===========================================================================
// 🧭 GESTION DE BARRA DE NAVEGACION INFERIOR
// ===========================================================================

const RUTA_A_NAV = {
  "#dashboard": "#dashboard",
  "#gestion-cortes": "#gestion-cortes",
  "#nuevo-corte": "#nuevo-corte",
  "#historial-pagos": "#historial-pagos",
  "#perfil": "#gestion-trabajadores",
  "#gestion-trabajadores": "#gestion-trabajadores",
};

function actualizarNav(ruta) {
  const bottomNav = document.getElementById("bottom-nav");
  if (!bottomNav) return;

  const esSubVista =
    ruta.startsWith("#administrar-tareas/") ||
    ruta.startsWith("#ver-prenda/") ||
    ruta.startsWith("#editar-prenda/");

  if (esSubVista) {
    bottomNav.classList.add("hidden");
  } else {
    bottomNav.classList.remove("hidden");
  }

  const navRoute = RUTA_A_NAV[ruta] || null;
  bottomNav.querySelectorAll(".nav-item").forEach((item) => {
    if (navRoute && item.dataset.route === navRoute) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

function inicializarBottomNav() {
  const bottomNav = document.getElementById("bottom-nav");
  if (!bottomNav) return;

  bottomNav.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const route = item.dataset.route;
      if (route) {
        window.location.hash = route;
      }
    });
  });
}

// Escuchar cambios en el hash (URL)
window.addEventListener("hashchange", () => {
  cargarVista(location.hash);
});

// Cargar la vista inicial
document.addEventListener("DOMContentLoaded", () => {
  inicializarBottomNav();
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
