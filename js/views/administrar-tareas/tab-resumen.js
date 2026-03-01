// tab-resumen.js - Pestaña de información/resumen del corte
import { db } from '../../db.js';
import { calcularManoObraTotal, calcularManoObraReal, calcularCostoPorPrenda, formatDate, mostrarModalFinalizarCorte, formatBs, centavosABolivianos, formatCentavos } from './utils.js';

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
      
      <div class="actions-section" style="margin-top: 20px;">
        <button class="btn-primary" onclick="exportarCortePDF(${corteId})">📄 Exportar PDF</button>
        ${corte.estado === 'activo' ? `
          <button class="btn-secondary" onclick="mostrarModalFinalizarCorte(${corteId}, '${nombreCorte}')">Finalizar Corte</button>
        ` : ''}
      </div>
    `;
  } catch (error) {
    console.error("Error al cargar corte:", error);
    content.innerHTML = '<p class="error">Error al cargar los datos del corte</p>';
  }
}

// ==================== FUNCIÓN EXPORTAR PDF ====================

async function exportarCortePDF(corteId) {
  try {
    // Verificar que jsPDF esté disponible
    if (typeof window.jspdf === 'undefined') {
      alert('Error: No se cargó la librería de PDF');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(); // Orientación vertical (por defecto)

    const corte = await db.cortes.get(corteId);
    if (!corte) {
      alert('Corte no encontrado');
      return;
    }

    const trabajadores = await db.trabajadores.toArray();
    const trabajadoresMap = new Map(trabajadores.map(t => [t.id, t.nombre]));

    const nombreCorte = corte.nombreCorte || corte.nombrePrendaOriginal || corte.nombrePrenda;
    const fechaCreacion = formatDate(corte.fechaCreacion);
    const fechaFin = corte.fechaFinalizacion ? formatDate(corte.fechaFinalizacion) : 'En progreso';

    // Crear mapa de tallas del corte con sus cantidades totales
    const tallasCorteMap = new Map();
    if (corte.tallas) {
      corte.tallas.forEach(t => {
        tallasCorteMap.set(t.talla, t.cantidad);
      });
    }

    // ==================== ENCABEZADO ====================
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Corte: ${nombreCorte}`, 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Creación: ${fechaCreacion}`, 14, 30);
    doc.text(`Fecha de Fin: ${fechaFin}`, 14, 36);
    doc.text(`Unidades: ${corte.cantidadPrendas}`, 14, 42);

    // Tallas
    if (corte.tallas && corte.tallas.length > 0) {
      const tallasStr = corte.tallas.map(t => `${t.talla}: ${t.cantidad}`).join('  |  ');
      doc.text(`Tallas: ${tallasStr}`, 14, 48);
    }

    // Estado
    doc.setTextColor(corte.estado === 'activo' ? '#2563eb' : '#16a34a');
    doc.text(`Estado: ${corte.estado === 'activo' ? 'En progreso' : 'Finalizado'}`, 14, 54);
    doc.setTextColor(0, 0, 0);

    // ==================== TABLA DE TAREAS ====================
    const tableData = [];

    corte.tareas.forEach(tarea => {
      // Agrupar asignaciones por trabajador
      const asignacionesPorTrabajador = new Map();
      
      tarea.asignaciones.forEach(asig => {
        const key = asig.trabajadorId;
        if (!asignacionesPorTrabajador.has(key)) {
          asignacionesPorTrabajador.set(key, {
            nombre: trabajadoresMap.get(asig.trabajadorId) || 'Desconocido',
            tallas: [],
            total: 0
          });
        }
        const data = asignacionesPorTrabajador.get(key);
        data.tallas.push({ talla: asig.talla || '-', cantidad: asig.cantidad });
        data.total += asig.cantidad * tarea.precioUnitario;
      });

      if (asignacionesPorTrabajador.size === 0) {
        // Tarea sin asignaciones
        tableData.push([
          tarea.nombre,
          formatCentavos(tarea.precioUnitario),
          '-',
          '-',
          'No asignado'
        ]);
      } else {
        // Tarea con asignaciones - crear fila por cada trabajador
        asignacionesPorTrabajador.forEach((data, trabajadorId) => {
          // Formatear tallas con lógica inteligente
          const tallasStr = formatearTallasPDF(data.tallas, tallasCorteMap);
          const totalBs = (data.total / 100).toFixed(2) + 'Bs';
          
          tableData.push([
            tarea.nombre,
            formatCentavos(tarea.precioUnitario),
            totalBs,
            tallasStr,
            data.nombre
          ]);
        });
      }
    });

    // Generar tabla con autoTable
    doc.autoTable({
      startY: 60,
      head: [['Tarea', 'UNI.', 'Total', 'Tallas', 'Trabajadores']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak' // Permite salto de línea automático
      },
      columnStyles: {
        0: { cellWidth: 45, overflow: 'linebreak' },  // Tarea
        1: { cellWidth: 20, halign: 'center' },       // Precio
        2: { cellWidth: 22, halign: 'right' },        // Total
        3: { cellWidth: 45, overflow: 'linebreak' },  // Tallas
        4: { cellWidth: 40, overflow: 'linebreak' }   // Trabajadores
      }
    });

    // ==================== RESUMEN ====================
    const finalY = doc.lastAutoTable.finalY + 10;

    const totalVentaBs = corte.cantidadPrendas * corte.precioVentaUnitario;
    const costoPorPrendaCentavos = calcularCostoPorPrenda(corte.tareas);
    const totalManoObraRealCentavos = calcularManoObraReal(corte);
    
    const costoPorPrendaBs = centavosABolivianos(costoPorPrendaCentavos);
    const totalManoObraRealBs = centavosABolivianos(totalManoObraRealCentavos);
    const gananciaRealBs = totalVentaBs - totalManoObraRealBs;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen', 14, finalY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Costo por Prenda: ${costoPorPrendaBs.toFixed(2)}Bs`, 14, finalY + 8);
    doc.text(`Total Venta: ${totalVentaBs.toFixed(2)}Bs`, 14, finalY + 16);
    doc.text(`Mano de Obra REAL: ${totalManoObraRealBs.toFixed(2)}Bs`, 14, finalY + 24);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Verde
    doc.text(`Ganancia REAL: ${gananciaRealBs.toFixed(2)}Bs`, 14, finalY + 32);
    doc.setTextColor(0, 0, 0);

    // ==================== GUARDAR PDF ====================
    const nombreArchivo = `Corte_${nombreCorte.replace(/\s+/g, '_')}_${fechaCreacion.replace(/\//g, '-')}.pdf`;
    doc.save(nombreArchivo);

  } catch (error) {
    console.error('Error al exportar PDF:', error);
    alert('Error al generar el PDF');
  }
}

// Función auxiliar para formatear tallas en el PDF
// - Si talla completa (asignado = total): mostrar solo talla (ej: "S")
// - Si talla incompleta: mostrar talla(asignado/total) (ej: "M(40/70)")
function formatearTallasPDF(tallasAsignadas, tallasCorteMap) {
  if (!tallasAsignadas || tallasAsignadas.length === 0) {
    return '-';
  }

  // Ordenar tallas según orden común
  const ordenTallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  tallasAsignadas.sort((a, b) => {
    const idxA = ordenTallas.indexOf(a.talla.toUpperCase());
    const idxB = ordenTallas.indexOf(b.talla.toUpperCase());
    if (idxA === -1 && idxB === -1) return a.talla.localeCompare(b.talla);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  return tallasAsignadas.map(t => {
    const tallaUpper = t.talla.toUpperCase();
    const cantidadTotal = tallasCorteMap.get(tallaUpper) || tallasCorteMap.get(t.talla);
    
    // Si no hay información del corte o la cantidad asignada es igual al total
    if (!cantidadTotal || t.cantidad >= cantidadTotal) {
      // Talla completa: mostrar solo la talla
      return t.talla;
    } else {
      // Talla incompleta: mostrar talla(asignado/total)
      return `${t.talla}(${t.cantidad}/${cantidadTotal})`;
    }
  }).join(', ');
}

// Exponer función globalmente
window.exportarCortePDF = exportarCortePDF;
