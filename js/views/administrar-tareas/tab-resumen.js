// tab-resumen.js - Pestaña de información/resumen del corte
import { db } from '../../db.js';
import { calcularManoObraTotal, calcularManoObraReal, calcularCostoPorPrenda, formatDate, mostrarModalFinalizarCorte } from './utils.js';

export async function cargarPestanaResumen(corteId) {
  const content = document.getElementById('tab-content');

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) {
      content.innerHTML = '<p class="error">Corte no encontrado</p>';
      return;
    }

    const nombreCorte = corte.nombreCorte || corte.nombrePrendaOriginal || corte.nombrePrenda;
    const totalVenta = corte.cantidadPrendas * corte.precioVentaUnitario;
    const costoPorPrenda = calcularCostoPorPrenda(corte.tareas);
    const totalManoObraEstimada = calcularManoObraTotal(corte);
    const totalManoObraReal = calcularManoObraReal(corte);
    const gananciaEstimada = totalVenta - totalManoObraEstimada;
    const gananciaReal = totalVenta - totalManoObraReal;

    const tallasHTML = corte.tallas && corte.tallas.length > 0 
      ? `<div class="tallas-info">
          <span class="tallas-label">Tallas:</span>
          ${corte.tallas.map(t => `<span class="talla-badge">${t.talla}: ${t.cantidad}</span>`).join('')}
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
        ${tallasHTML}
      </div>
      
      <div class="summary-card">
        <div class="summary-row">
          <span>Costo por Prenda:</span>
          <span>$${costoPorPrenda.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Total Venta:</span>
          <span>$${totalVenta.toFixed(2)}</span>
        </div>
        <div class="summary-row highlight">
          <span>Mano de Obra REAL:</span>
          <span class="real-value">$${totalManoObraReal.toFixed(2)}</span>
        </div>
        <div class="summary-row ganancia">
          <span>Ganancia REAL:</span>
          <span class="real-value">$${gananciaReal.toFixed(2)}</span>
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