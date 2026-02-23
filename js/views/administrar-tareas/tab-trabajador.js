// tab-trabajador.js - Pestaña de resumen por trabajador
import { db } from '../../db.js';
import { formatDate } from './utils.js';

// Función para mostrar mensajes toast temporales
function mostrarToast(mensaje, duracion = 2000) {
  // Verificar si ya existe un toast y eliminarlo
  const toastExistente = document.querySelector('.toast-message');
  if (toastExistente) {
    toastExistente.remove();
  }

  // Crear elemento toast
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = mensaje;
  
  // Estilos inline para el toast
  toast.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(40, 40, 40, 0.95);
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: toastFadeIn 0.3s ease;
    max-width: 90%;
    text-align: center;
  `;

  // Agregar keyframes para animación
  if (!document.querySelector('#toast-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'toast-styles';
    styleSheet.textContent = `
      @keyframes toastFadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes toastFadeOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      }
    `;
    document.head.appendChild(styleSheet);
  }

  document.body.appendChild(toast);

  // Programar eliminación
  setTimeout(() => {
    toast.style.animation = 'toastFadeOut 0.3s ease forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, duracion);
}

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
            <div class="worker-actions-btns">
              <button class="btn-copy" onclick="copiarTrabajador(${corteId}, ${trabajadorId})">
                📋 Copiar
              </button>
              <button class="btn-share" onclick="compartirTrabajador(${corteId}, ${trabajadorId})">
                📤 Compartir
              </button>
            </div>
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

    // Exponer funciones globalmente
    window.compartirTrabajador = async (cId, trabId) => {
      await compartirConWebShare(cId, trabId);
    };
    
    window.copiarTrabajador = async (cId, trabId) => {
      await copiarAlPortapapeles(cId, trabId);
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

// Función auxiliar para generar el texto del resumen
async function generarTextoResumen(corteId, trabajadorId) {
  const corte = await db.cortes.get(corteId);
  const trabajador = await db.trabajadores.get(trabajadorId);
  
  if (!corte || !trabajador) {
    return null;
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
  const texto = `
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

  return {
    texto,
    nombreTrabajador
  };
}

// Función para copiar al portapapeles
async function copiarAlPortapapeles(corteId, trabajadorId) {
  try {
    const resultado = await generarTextoResumen(corteId, trabajadorId);
    
    if (!resultado) {
      mostrarToast('❌ Error al generar texto');
      return;
    }

    const { texto } = resultado;

    // Intentar copiar con navigator.clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texto);
      mostrarToast("✅ Texto copiado al portapapeles");
    } else {
      // Fallback para navegadores antiguos
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const exito = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (exito) {
        mostrarToast("✅ Texto copiado al portapapeles");
      } else {
        mostrarToast("❌ Error al copiar");
      }
    }
  } catch (error) {
    console.error('Error al copiar:', error);
    mostrarToast("❌ Error al copiar");
  }
}

// Función para compartir con Web Share API
async function compartirConWebShare(corteId, trabajadorId) {
  try {
    const resultado = await generarTextoResumen(corteId, trabajadorId);
    
    if (!resultado) {
      mostrarToast('❌ Error al generar texto');
      return;
    }

    const { texto, nombreTrabajador } = resultado;

    // Verificar si Web Share API está disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Resumen de trabajo - " + nombreTrabajador,
          text: texto
        });
        mostrarToast("✅ Compartido");
      } catch (shareError) {
        // Si el usuario cancela (AbortError), no mostrar mensaje
        if (shareError.name !== 'AbortError') {
          mostrarToast("❌ Error al compartir");
        }
      }
    } else {
      // Si no hay Web Share API, copiar al portapapeles como fallback
      mostrarToast("⚠️ Compartir no disponible, copiando...");
      await copiarAlPortapapeles(corteId, trabajadorId);
    }
  } catch (error) {
    console.error('Error al compartir:', error);
    mostrarToast('❌ Error al compartir');
  }
}
