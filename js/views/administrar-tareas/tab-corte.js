// tab-corte.js - Pestaña de vista general del corte
import { db } from '../../db.js';
import { mostrarMensaje, mostrarModalFinalizarCorte } from './utils.js';

export async function cargarPestanaCorte(corteId) {
  const content = document.getElementById('tab-content');

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) {
      content.innerHTML = '<p class="error">Corte no encontrado</p>';
      return;
    }

    const trabajadores = await db.trabajadores.toArray();
    const trabajadoresMap = new Map(trabajadores.map(t => [t.id, t.nombre]));

    let totalManoObra = 0;
    let totalTareasAsignadas = 0;

    const filasTareas = corte.tareas.map(tarea => {
      const totalTarea = tarea.precioUnitario * tarea.unidadesTotales;
      totalManoObra += totalTarea;

      const trabajadoresAsignados = [];
      const totalesTrabajadores = [];
      let tieneAsignaciones = false;

      tarea.asignaciones.forEach(asignacion => {
        const nombreTrabajador = trabajadoresMap.get(asignacion.trabajadorId) || 'Desconocido';
        const totalTrabajador = asignacion.cantidad * tarea.precioUnitario;
        const talla = asignacion.talla || 'N/A';

        trabajadoresAsignados.push(`${nombreTrabajador} (${talla})`);
        totalesTrabajadores.push(`$${totalTrabajador.toFixed(2)}`);
        tieneAsignaciones = true;
      });

      if (tieneAsignaciones) totalTareasAsignadas++;

      const displayTrabajadores = tieneAsignaciones
        ? trabajadoresAsignados.join('<br>')
        : '<span class="no-asignado">No asignado</span>';

      const displayTotales = tieneAsignaciones
        ? totalesTrabajadores.join('<br>')
        : '$0.00';

      return `
        <tr>
          <td class="task-name">${tarea.nombre}<br><span class="task-price-small">($${tarea.precioUnitario.toFixed(2)}/unidad)</span></td>
          <td class="task-total">${displayTotales}</td>
          <td class="task-workers">${displayTrabajadores}</td>
        </tr>
      `;
    }).join('');

    const porcentajeCompletado = corte.tareas.length > 0
      ? Math.round((totalTareasAsignadas / corte.tareas.length) * 100)
      : 0;

    const tallasHTML = corte.tallas && corte.tallas.length > 0 
      ? `<div class="tallas-resumen">
          <h4>Tallas del corte:</h4>
          <div class="tallas-grid">
            ${corte.tallas.map(t => `<span class="talla-item-info">${t.talla}: ${t.cantidad}</span>`).join('')}
          </div>
        </div>` 
      : '';

    content.innerHTML = `
      <div class="tasks-section">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${porcentajeCompletado}%"></div>
        </div>
        <p class="progress-text">${porcentajeCompletado}% completado</p>
        
        ${tallasHTML}
        
        <div class="table-container">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Total</th>
                <th>Trabajadores</th>
              </tr>
            </thead>
            <tbody>${filasTareas}</tbody>
          </table>
        </div>
        
        ${corte.estado === 'activo' ? `
          <div class="actions-section">        
            <button class="btn-primary" onclick="cambiarPestana('asignar')">Asignar Tareas</button>
            <button class="btn-secondary" onclick="mostrarModalFinalizarCorte(${corteId}, '${corte.nombreCorte || corte.nombrePrendaOriginal || corte.nombrePrenda}')">Finalizar Corte</button>
          </div>
        ` : `
          <div class="completed-section">
            <span class="badge badge-terminado">CORTE FINALIZADO</span>
          </div>
        `}
      </div>
    `;

  } catch (error) {
    console.error("Error:", error);
    content.innerHTML = '<p class="error">Error al cargar</p>';
  }
}