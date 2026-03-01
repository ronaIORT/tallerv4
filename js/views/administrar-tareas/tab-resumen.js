// tab-resumen.js - Pestaña de información/resumen del corte
import { db } from '../../db.js';
import { calcularManoObraTotal, calcularManoObraReal, calcularCostoPorPrenda, formatDate, mostrarModalFinalizarCorte, formatBs, centavosABolivianos } from './utils.js';

export async function cargarPestanaResumen(corteId) {
  const content = document.getElementById('tab-content');

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) {
      content.innerHTML = '<p class="error">Corte no encontrado</p>';
      return;
    }

    const nombreCorte = corte.nombreCorte || corte.nombrePrendaOriginal || corte.nombrePrenda;
    const totalVentaBs = corte.cantidadPrendas * corte.precioVentaUnitario;
    const costoPorPrendaCentavos = calcularCostoPorPrenda(corte.tareas);
    const totalManoObraEstimadaCentavos = calcularManoObraTotal(corte);
    const totalManoObraRealCentavos = calcularManoObraReal(corte);
    
    // Convertir centavos a Bolivianos para mostrar
    const costoPorPrendaBs = centavosABolivianos(costoPorPrendaCentavos);
    const totalManoObraEstimadaBs = centavosABolivianos(totalManoObraEstimadaCentavos);
    const totalManoObraRealBs = centavosABolivianos(totalManoObraRealCentavos);
    const gananciaEstimadaBs = totalVentaBs - totalManoObraEstimadaBs;
    const gananciaRealBs = totalVentaBs - totalManoObraRealBs;

    // Calcular porcentaje completado
    let totalTareasAsignadas = 0;
    corte.tareas.forEach(tarea => {
      const tieneAsignaciones = tarea.asignaciones && tarea.asignaciones.length > 0;
      if (tieneAsignaciones) totalTareasAsignadas++;
    });

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
      <div class="corte-header">
        <h2 class="section-title">Corte: ${nombreCorte}</h2>        
        <div class="corte-meta">
          <span class="badge ${corte.estado === 'activo' ? 'badge-activo' : 'badge-terminado'}">
            ${corte.estado === 'activo' ? 'En progreso' : 'Finalizado'}
          </span>
          <span>${corte.cantidadPrendas} unidades</span>
          <span>Creado: ${formatDate(corte.fechaCreacion)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${porcentajeCompletado}%"></div>
        </div>
        <p class="progress-text">${porcentajeCompletado}% completado</p>
        ${tallasHTML}
      </div>
      
      <div class="summary-card">
        <div class="summary-row">
          <span>Costo por Prenda:</span>
          <span>${costoPorPrendaBs.toFixed(2)}Bs</span>
        </div>
        <div class="summary-row">
          <span>Total Venta:</span>
          <span>${totalVentaBs.toFixed(2)}Bs</span>
        </div>
        <div class="summary-row highlight">
          <span>Mano de Obra REAL:</span>
          <span class="real-value">${totalManoObraRealBs.toFixed(2)}Bs</span>
        </div>
        <div class="summary-row ganancia">
          <span>Ganancia REAL:</span>
          <span class="real-value">${gananciaRealBs.toFixed(2)}Bs</span>
        </div>
      </div>
      
      <p class="instructions">Selecciona una pestaña para ver los detalles</p>
      
      ${corte.estado === 'activo' ? `
        <div class="actions-section" style="margin-top: 20px;">
          <button class="btn-secondary" onclick="mostrarModalFinalizarCorte(${corteId}, '${nombreCorte}')">Finalizar Corte</button>
        </div>
      ` : ''}
    `;
  } catch (error) {
    console.error("Error al cargar corte:", error);
    content.innerHTML = '<p class="error">Error al cargar los datos del corte</p>';
  }
}
