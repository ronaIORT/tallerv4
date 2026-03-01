// utils.js - Funciones auxiliares compartidas
import { db } from '../../db.js';

// ==================== FUNCIONES DE FORMATO DE MONEDA ====================

// Convertir centavos a Bolivianos
export function centavosABolivianos(centavos) {
  return centavos / 100;
}

// Formatear centavos como string de Bolivianos
export function formatBs(centavos) {
  return `${(centavos / 100).toFixed(2)}Bs`;
}

// Formatear centavos como string de centavos
export function formatCentavos(centavos) {
  return `${centavos}¢`;
}

// ==================== FUNCIONES DE CÁLCULO ====================

// Calcular mano de obra total del corte (devuelve centavos)
export function calcularManoObraTotal(corte) {
  return corte.tareas.reduce((total, tarea) => {
    return total + (tarea.precioUnitario * tarea.unidadesTotales);
  }, 0);
}

// Calcular costo por prenda (suma de precios unitarios de todas las tareas) - devuelve centavos
export function calcularCostoPorPrenda(tareas) {
  return tareas.reduce((total, tarea) => total + tarea.precioUnitario, 0);
}

// Calcular mano de obra REAL (asignada) - devuelve centavos
export function calcularManoObraReal(corte) {
  let total = 0;
  corte.tareas.forEach(tarea => {
    const asignadas = tarea.asignaciones.reduce((sum, a) => sum + a.cantidad, 0);
    total += tarea.precioUnitario * asignadas;
  });
  return total;
}

// Formatear fecha a DD/MM/YYYY
export function formatDate(date) {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

// Mostrar mensaje temporal
export function mostrarMensaje(mensaje) {
  const app = document.getElementById('app');
  const mensajeEl = document.createElement('div');
  mensajeEl.className = 'toast-message';
  mensajeEl.innerHTML = mensaje;
  app.appendChild(mensajeEl);
  setTimeout(() => mensajeEl.remove(), 2000);
}

// Cambiar a pestaña específica
export function cambiarPestana(nombre) {
  const btn = document.querySelector(`.tab-item[data-tab="${nombre}"]`);
  if (btn) btn.click();
}

// Obtener tallas disponibles para una tarea específica
export function getTallasDisponiblesParaTarea(corte, tarea) {
  if (!corte.tallas || corte.tallas.length === 0) {
    return null;
  }

  const asignadasPorTalla = {};
  
  tarea.asignaciones.forEach(asig => {
    const talla = asig.talla || 'SIN_TALLA';
    if (!asignadasPorTalla[talla]) asignadasPorTalla[talla] = 0;
    asignadasPorTalla[talla] += asig.cantidad;
  });

  return corte.tallas.map(t => ({
    talla: t.talla,
    total: t.cantidad,
    asignado: asignadasPorTalla[t.talla] || 0,
    disponible: t.cantidad - (asignadasPorTalla[t.talla] || 0)
  })).filter(t => t.disponible > 0);
}

// Obtener tareas disponibles
export function getTareasDisponibles(corte) {
  return corte.tareas.filter(tarea => {
    if (!corte.tallas || corte.tallas.length === 0) {
      const asignadas = tarea.asignaciones.reduce((sum, a) => sum + a.cantidad, 0);
      return asignadas < tarea.unidadesTotales;
    }
    const tallasDisponibles = getTallasDisponiblesParaTarea(corte, tarea);
    return tallasDisponibles && tallasDisponibles.length > 0;
  });
}

// Mostrar modal de confirmación para finalizar corte
export function mostrarModalFinalizarCorte(corteId, nombreCorte) {
  const modalExistente = document.querySelector('.modal-overlay');
  if (modalExistente) modalExistente.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.onclick = (e) => {
    if (e.target === overlay) cerrarModalFinalizar();
  };

  overlay.innerHTML = `
    <div class="modal-container">
      <h3 class="modal-title">✅ Finalizar Corte</h3>
      <p class="modal-message">¿Estás seguro de que deseas finalizar el corte <strong>${nombreCorte}</strong>?</p>
      <p class="modal-message" style="font-size: 13px; color: var(--text-secondary);">Una vez finalizado, no se podrán realizar más asignaciones.</p>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="cerrarModalFinalizar()">Cancelar</button>
        <button class="btn-primary" onclick="confirmarFinalizarCorte(${corteId})">Finalizar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

// Cerrar modal de finalizar corte
function cerrarModalFinalizar() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) {
    document.body.style.overflow = 'auto';
    overlay.remove();
  }
}

// Confirmar finalización del corte
async function confirmarFinalizarCorte(corteId) {
  try {
    await db.cortes.update(corteId, { estado: 'terminado' });
    cerrarModalFinalizar();
    mostrarMensaje('✅ Corte finalizado');
    setTimeout(() => location.reload(), 1500);
  } catch (error) {
    console.error('Error al finalizar corte:', error);
    mostrarMensaje('❌ Error al finalizar corte');
  }
}

// Exponer funciones globales
window.cambiarPestana = cambiarPestana;
window.cerrarModal = function(event) {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay && (!event || event.target.classList.contains('modal-overlay'))) {
    document.body.style.overflow = 'auto';
    overlay.remove();
  }
};
window.mostrarModalFinalizarCorte = mostrarModalFinalizarCorte;
window.cerrarModalFinalizar = cerrarModalFinalizar;
window.confirmarFinalizarCorte = confirmarFinalizarCorte;
