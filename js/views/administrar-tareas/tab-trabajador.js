// tab-trabajador.js - Pestaña de resumen por trabajador
import { db } from '../../db.js';
import { formatDate } from './utils.js';

export async function cargarPestanaTrabajador(corteId) {
  const content = document.getElementById('tab-content');

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) {
      content.innerHTML = '<p class="error">Corte no encontrado</p>';
      return;
    }

    const trabajadores = await db.trabajadores.toArray();
    const trabajadoresMap = new Map(trabajadores.map(t => [t.id, t.nombre]));

    // Agrupar asignaciones por trabajador
    const asignacionesPorTrabajador = new Map();

    corte.tareas.forEach(tarea => {
      tarea.asignaciones.forEach(asignacion => {
        if (!asignacionesPorTrabajador.has(asignacion.trabajadorId)) {
          asignacionesPorTrabajador.set(asignacion.trabajadorId, []);
        }
        asignacionesPorTrabajador.get(asignacion.trabajadorId).push({
          tareaId: tarea.id,
          tareaNombre: tarea.nombre,
          talla: asignacion.talla || '-',
          cantidad: asignacion.cantidad,
          precioUnitario: tarea.precioUnitario,
          total: asignacion.cantidad * tarea.precioUnitario,
          fecha: asignacion.fecha
        });
      });
    });

    if (asignacionesPorTrabajador.size === 0) {
      content.innerHTML = `
        <div class="no-data-section">
          <p class="no-data-message">No hay tareas asignadas</p>
          <button class="btn-primary" onclick="cambiarPestana('asignar')">Asignar Tareas</button>
        </div>
      `;
      return;
    }

    let totalGeneral = 0;

    const trabajadoresHTML = Array.from(asignacionesPorTrabajador.entries()).map(([trabajadorId, asignaciones]) => {
      const nombre = trabajadoresMap.get(trabajadorId) || `ID ${trabajadorId}`;
      let totalTrabajador = 0;

      // Agrupar por tarea para mostrar tallas juntas
      const tareasAgrupadas = new Map();
      asignaciones.forEach(a => {
        if (!tareasAgrupadas.has(a.tareaId)) {
          tareasAgrupadas.set(a.tareaId, {
            tareaNombre: a.tareaNombre,
            precioUnitario: a.precioUnitario,
            tallas: [],
            subtotal: 0
          });
        }
        const tareaGrupo = tareasAgrupadas.get(a.tareaId);
        tareaGrupo.tallas.push({ talla: a.talla, cantidad: a.cantidad });
        tareaGrupo.subtotal += a.total;
        totalTrabajador += a.total;
      });

      totalGeneral += totalTrabajador;

      // Generar filas de tabla con nuevo formato
      const filas = Array.from(tareasAgrupadas.values()).map(tarea => {
        const tallasStr = formatearTallas(tarea.tallas);
        return `<tr>
          <td class="task-name-cell">${tarea.tareaNombre}</td>
          <td class="tallas-cell">${tallasStr}</td>
          <td class="total-cell">$${tarea.subtotal.toFixed(2)}</td>
        </tr>`;
      }).join('');

      return `
        <div class="worker-section">
          <div class="worker-header">
            <h3 class="worker-title">👤 ${nombre}</h3>
            <button class="btn-share" onclick="compartirTrabajador(${corteId}, ${trabajadorId})">
              📤 Compartir
            </button>
          </div>
          <table class="worker-table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Tallas</th>
                <th>Total $</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>Total ${nombre}:</strong></td>
                <td><strong>$${totalTrabajador.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div class="workers-summary">
        <h2>Resumen por Trabajador</h2>
        ${trabajadoresHTML}
        <div class="general-total">
          <span>Total General:</span>
          <span>$${totalGeneral.toFixed(2)}</span>
        </div>
      </div>
    `;

    // Exponer función de compartir globalmente
    window.compartirTrabajador = async (cId, trabId) => {
      await generarTextoCompartir(cId, trabId);
    };

  } catch (error) {
    console.error("Error:", error);
    content.innerHTML = '<p class="error">Error</p>';
  }
}

// Formatear tallas para mostrar
// Ejemplo: "s, m, l, xl(15)" o "s(10), m, l, xl"
function formatearTallas(tallas) {
  // Ordenar tallas alfabéticamente
  const ordenTallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  tallas.sort((a, b) => {
    const idxA = ordenTallas.indexOf(a.talla.toUpperCase());
    const idxB = ordenTallas.indexOf(b.talla.toUpperCase());
    if (idxA === -1 && idxB === -1) return a.talla.localeCompare(b.talla);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  return tallas.map(t => {
    const tallaLower = t.talla.toLowerCase();
    // Mostrar cantidad entre paréntesis
    return `${tallaLower}(${t.cantidad})`;
  }).join(', ');
}

// Generar texto para compartir
async function generarTextoCompartir(corteId, trabajadorId) {
  try {
    const corte = await db.cortes.get(corteId);
    const trabajador = await db.trabajadores.get(trabajadorId);
    
    if (!corte || !trabajador) {
      alert('Error al generar texto');
      return;
    }

    const nombreCorte = corte.nombreCorte || corte.nombrePrendaOriginal || corte.nombrePrenda;
    const nombreTrabajador = trabajador.nombre;

    // Obtener tareas asignadas a este trabajador
    const tareasAsignadas = [];
    let totalTrabajador = 0;

    corte.tareas.forEach(tarea => {
      const asignacionesTrabajador = tarea.asignaciones.filter(a => a.trabajadorId === trabajadorId);
      
      if (asignacionesTrabajador.length > 0) {
        const tallas = asignacionesTrabajador.map(a => ({
          talla: a.talla || '-',
          cantidad: a.cantidad
        }));
        
        const subtotal = asignacionesTrabajador.reduce((sum, a) => sum + (a.cantidad * tarea.precioUnitario), 0);
        totalTrabajador += subtotal;
        
        tareasAsignadas.push({
          nombre: tarea.nombre,
          tallas: tallas,
          subtotal: subtotal
        });
      }
    });

    // Formatear tallas del corte
    const tallasCorteStr = corte.tallas 
      ? corte.tallas.map(t => `${t.talla}(${t.cantidad})`).join(', ')
      : 'N/A';

    // Calcular fechas
    const fechaInicio = formatDate(corte.fechaCreacion);
    const fechaFin = corte.fechaFin ? formatDate(corte.fechaFin) : 'En progreso';

    // Formatear tareas asignadas
    const tareasStr = tareasAsignadas.map(t => {
      const tallasFormateadas = t.tallas.map(talla => 
        `${talla.talla.toLowerCase()}(${talla.cantidad})`
      ).join(', ');
      return `• ${t.nombre}: ${tallasFormateadas}. - $${t.subtotal.toFixed(2)}`;
    }).join('\n');

    // Generar texto final
    const textoCompartir = `
────────────────────
👤 Trabajador: ${nombreTrabajador}
📦 Corte: ${nombreCorte}
📊 Unidades del corte: ${corte.cantidadPrendas}
📊 Tallas: ${tallasCorteStr}
📅 Fecha Inicio: ${fechaInicio}
📅 Fecha Fin: ${fechaFin}

📊 TAREAS ASIGNADAS:
${tareasStr}

💰 TOTAL ${nombreTrabajador}: $${totalTrabajador.toFixed(2)}
────────────────────
📱 Generado desde la App de Gestión de Cortes`.trim();

    // Copiar al portapapeles
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(textoCompartir);
      alert('✅ Texto copiado al portapapeles');
    } else {
      // Fallback para navegadores antiguos
      const textarea = document.createElement('textarea');
      textarea.value = textoCompartir;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('✅ Texto copiado al portapapeles');
    }

  } catch (error) {
    console.error('Error al generar texto:', error);
    alert('❌ Error al generar texto para compartir');
  }
}