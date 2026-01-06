// administrar-tareas.js
import { db } from '../db.js';
// ----------------------------------------------------------------------
export function renderAdministrarTareas(corteId) {
  // Usar el nombre personalizado si existe, sino el original  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="mobile-container">
      <div class="header">
        <button onclick="location.hash='#dashboard'" class="back-btn">←</button>        
        <h1 class="small-title">Administración de Tareas</h1>
        
      </div>
      
      <div class="tab-menu">
        <div class="tab-container">
          <button class="tab-item active" data-tab="resumen">
            <span>Info</span>
            <span></span>
          </button>
          <button class="tab-item" data-tab="corte">
            <span>Corte</span>
          </button>
          <button class="tab-item" data-tab="trabajador">
            <span>Trabajador</span>
          </button>
          <button class="tab-item" data-tab="editar">
            <span>Editar</span>
          </button>
          <button class="tab-item" data-tab="asignar">
            <span>Asignar</span>
          </button>
        </div>
      </div>
      
      <div id="tab-content" class="tab-content">
        <h2 class="section-title">Cargando información del corte...</h2>
      </div>
    </div>
  `;

  // Inicializar pestañas
  inicializarPestanas(corteId);

  // Cargar información básica del corte
  cargarInfoBasicaCorte(corteId);
}
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// Cargar información básica del corte (encabezado)
async function cargarInfoBasicaCorte(corteId) {
  const content = document.getElementById('tab-content');

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) {
      content.innerHTML = '<p class="error">Corte no encontrado</p>';
      return;
    }
    // Usar el nombre personalizado si existe, sino el original
    const nombreCorte = corte.nombreCorte || corte.nombrePrendaOriginal || corte.nombrePrenda;

    // Calcular totales
    const totalVenta = corte.cantidadPrendas * corte.precioVentaUnitario;
    const totalManoObraEstimada = calcularManoObraTotal(corte);
    const totalManoObraReal = calcularManoObraReal(corte);
    const gananciaEstimada = totalVenta - totalManoObraEstimada;
    const gananciaReal = totalVenta - totalManoObraReal;
    const ventaPorUnidad = corte.precioVentaUnitario;
    const manoObraPorPrendaReal = corte.cantidadPrendas > 0
      ? totalManoObraReal / corte.cantidadPrendas
      : 0;
    const manoObraPorPrendaEstimada = corte.cantidadPrendas > 0
      ? totalManoObraEstimada / corte.cantidadPrendas
      : 0;

    // Mostrar información básica del corte
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
      </div>
      
      <div class="summary-card">
        <div class="summary-row">
          <span>Total Venta:</span>
          <span>$${totalVenta.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Mano de Obra Estimada (100%):</span>
          <span>$${totalManoObraEstimada.toFixed(2)}</span>
        </div>
        <div class="summary-row highlight">
          <span>Mano de Obra REAL (hasta ahora):</span>
          <span class="real-value">$${totalManoObraReal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Venta por Unidad:</span>
          <span>$${ventaPorUnidad.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Mano de Obra por Prenda (estimado):</span>
          <span>$${manoObraPorPrendaEstimada.toFixed(2)}</span>
        </div>
        <div class="summary-row highlight">
          <span>Mano de Obra por Prenda (REAL):</span>
          <span class="real-value">$${manoObraPorPrendaReal.toFixed(2)}</span>
        </div>
        <div class="summary-row ganancia">
          <span>Ganancia Estimada (100%):</span>
          <span>$${gananciaEstimada.toFixed(2)}</span>
        </div>
        <div class="summary-row ganancia highlight">
          <span>Ganancia REAL (hasta ahora):</span>
          <span class="real-value">$${gananciaReal.toFixed(2)}</span>
        </div>
      </div>
      
      <p class="instructions">Selecciona una pestaña para ver los detalles</p>
    `;
  } catch (error) {
    console.error("Error al cargar corte:", error);
    content.innerHTML = '<p class="error">Error al cargar los datos del corte</p>';
  }
}
// ----------------------------------------------------------------------
// Inicializar pestañas con manejo de contenido
function inicializarPestanas(corteId) {
  document.querySelectorAll('.tab-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.tab-item').forEach(b =>
        b.classList.remove('active'));
      btn.classList.add('active');

      const tab = btn.dataset.tab;
      const content = document.getElementById('tab-content');

      switch (tab) {
        case 'resumen':
          content.innerHTML = '<h2 class="section-title">Cargando información del corte...</h2>';
          await cargarInfoBasicaCorte(corteId);
          break;

        case 'corte':
          content.innerHTML = '<h2 class="section-title">Cargando tareas...</h2>';
          await cargarPestanaCorte(corteId);
          break;

        case 'trabajador':
          content.innerHTML = '<h2 class="section-title">Cargando resumen...</h2>';
          await cargarPestanaTrabajador(corteId);
          break;

        case 'editar':
          content.innerHTML = '<h2 class="section-title">Cargando edición...</h2>';
          await cargarPestanaEditar(corteId);
          break;

        case 'asignar':
          content.innerHTML = '<h2 class="section-title">Cargando formulario...</h2>';
          await cargarPestanaAsignar(corteId);
          break;
      }
    });
  });
}

// ----------------------------------------------------------------------
// ----------------------------PESTANA CORTE  ---------------------------
// ----------------------------------------------------------------------

async function cargarPestanaCorte(corteId) {
  const content = document.getElementById('tab-content');

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) {
      content.innerHTML = '<p class="error">Corte no encontrado</p>';
      return;
    }

    // Obtener todos los trabajadores para las asignaciones
    const trabajadores = await db.trabajadores.toArray();
    const trabajadoresMap = new Map(trabajadores.map(t => [t.id, t.nombre]));

    // Calcular totales generales
    let totalManoObra = 0;
    let totalTareasAsignadas = 0;

    // Generar filas de la tabla
    const filasTareas = corte.tareas.map(tarea => {
      const totalTarea = tarea.precioUnitario * tarea.unidadesTotales;
      totalManoObra += totalTarea;

      // Obtener trabajadores asignados y sus totales
      const trabajadoresAsignados = [];
      const totalesTrabajadores = [];
      let unidadesAsignadas = 0;
      let tieneAsignaciones = false;

      tarea.asignaciones.forEach(asignacion => {
        const nombreTrabajador = trabajadoresMap.get(asignacion.trabajadorId) || 'Desconocido';
        const totalTrabajador = asignacion.cantidad * tarea.precioUnitario;

        trabajadoresAsignados.push(`${nombreTrabajador}`);
        totalesTrabajadores.push(`$${totalTrabajador.toFixed(2)}`);
        unidadesAsignadas += asignacion.cantidad;
        tieneAsignaciones = true;
      });

      if (tieneAsignaciones) {
        totalTareasAsignadas++;
      }

      // Si no hay asignaciones, mostrar "No asignado" y total 0
      const displayTrabajadores = tieneAsignaciones
        ? trabajadoresAsignados.join('<br>')
        : '<span class="no-asignado">No asignado</span>';

      const displayTotales = tieneAsignaciones
        ? totalesTrabajadores.join('<br>')
        : '$0.00';

      // Crear nombre de tarea con precio unitario entre paréntesis
      const nombreTareaCompleto = `${tarea.nombre}<br><span class="task-price-small">($${tarea.precioUnitario.toFixed(2)}/unidad)</span>`;

      return `
        <tr>
          <td class="task-name">${nombreTareaCompleto}</td>
          <td class="task-total">${displayTotales}</td>
          <td class="task-workers">${displayTrabajadores}</td>
        </tr>
      `;
    }).join('');

    // Calcular porcentaje de completado
    const porcentajeCompletado = corte.tareas.length > 0
      ? Math.round((totalTareasAsignadas / corte.tareas.length) * 100)
      : 0;

    // Calcular total por prenda
    const totalPorPrenda = corte.cantidadPrendas > 0
      ? totalManoObra / corte.cantidadPrendas
      : 0;

    // Renderizar tabla completa
    content.innerHTML = `
      <div class="tasks-section">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${porcentajeCompletado}%"></div>
        </div>
        <p class="progress-text">${porcentajeCompletado}% completado (${totalTareasAsignadas}/${corte.tareas.length} tareas asignadas)</p>
        
        <div class="corte-info-header">
          <div class="corte-info-row">
            <span>Cantidad del corte:</span>
            <span>${corte.cantidadPrendas} unidades</span>
          </div>
          <div class="corte-info-row">
            <span>Total mano de obra por prenda:</span>
            <span>$${totalPorPrenda.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="table-container">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Total</th>
                <th>Trabajadores</th>
              </tr>
            </thead>
            <tbody>
              ${filasTareas}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">
                  <div class="table-footer-summary">
                    <div class="footer-row">
                      <span>Total de mano de obra:</span>
                      <span>$${totalManoObra.toFixed(2)}</span>
                    </div>
                    <div class="footer-row">
                      <span>Cantidad del corte:</span>
                      <span>${corte.cantidadPrendas} unidades</span>
                    </div>
                    <div class="footer-row">
                      <span>Promedio por prenda:</span>
                      <span>$${totalPorPrenda.toFixed(2)}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        ${corte.estado === 'activo' ? `
          <div class="actions-section">        
            <button class="btn-primary" onclick="cambiarPestana('asignar')">
              Asignar Nuevas Tareas
            </button>
            <button class="btn-secondary" onclick="finalizarCorte(${corteId})">
              Finalizar Corte
            </button>
          </div>
        ` : `
          <div class="completed-section">
            <span class="badge badge-terminado">CORTE FINALIZADO</span>
            <p>Este corte ya no puede modificarse</p>
          </div>
        `}
      </div>
    `;

    // Agregar evento al botón de finalizar
    window.finalizarCorte = async function (id) {
      if (!confirm('¿Está seguro de finalizar este corte? No podrás asignar más tareas.')) {
        return;
      }

      try {
        await db.cortes.update(id, { estado: 'terminado' });
        mostrarMensaje('✅ Corte finalizado correctamente');
        setTimeout(() => location.reload(), 1500);
      } catch (error) {
        console.error("Error al finalizar corte:", error);
        mostrarMensaje('❌ Error al finalizar el corte');
      }
    };

  } catch (error) {
    console.error("Error al cargar pestaña Corte:", error);
    content.innerHTML = '<p class="error">Error al cargar las tareas del corte</p>';
  }
}

// ----------------------------------------------------------------------
// -------------------------PESTANA TRABAJADOR------------------------------
// ---------------------------------------------------------------------
// Cargar la pestaña "Trabajador" con resumen por trabajador
async function cargarPestanaTrabajador(corteId) {
  const content = document.getElementById('tab-content');

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) {
      content.innerHTML = '<p class="error">Corte no encontrado</p>';
      return;
    }

    // Obtener todos los trabajadores
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
          tareaNombre: tarea.nombre,
          cantidad: asignacion.cantidad,
          precioUnitario: tarea.precioUnitario,
          total: asignacion.cantidad * tarea.precioUnitario
        });
      });
    });

    // Si no hay asignaciones, mostrar mensaje
    if (asignacionesPorTrabajador.size === 0) {
      content.innerHTML = `
        <div class="no-data-section">
          <p class="no-data-message">No hay tareas asignadas a trabajadores aún</p>
          <button class="btn-primary" onclick="cambiarPestana('asignar')">
            Asignar Primeras Tareas
          </button>
        </div>
      `;
      return;
    }

    // Calcular totales generales
    let totalManoObraGeneral = 0;
    let totalUnidadesGeneral = 0;

    // Generar contenido por trabajador
    const trabajadoresHTML = Array.from(asignacionesPorTrabajador.entries()).map(([trabajadorId, asignaciones]) => {
      const nombreTrabajador = trabajadoresMap.get(trabajadorId) || `Trabajador ${trabajadorId}`;

      // Calcular totales para este trabajador
      let totalTrabajador = 0;
      let unidadesTrabajador = 0;

      const filasTareas = asignaciones.map(asignacion => {
        totalTrabajador += asignacion.total;
        unidadesTrabajador += asignacion.cantidad;
        totalManoObraGeneral += asignacion.total;
        totalUnidadesGeneral += asignacion.cantidad;

        return `
          <tr>
            <td class="task-name">${asignacion.tareaNombre}</td>
            <td class="task-quantity">${asignacion.cantidad}</td>
            <td class="task-total">$${asignacion.total.toFixed(2)}</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="worker-section">
          <h3 class="worker-title">${nombreTrabajador}</h3>
          <div class="table-container">
            <table class="worker-table">
              <thead>
                <tr>
                  <th>Tarea</th>
                  <th>Unidades</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${filasTareas}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total ${nombreTrabajador}:</strong></td>
                  <td><strong>${asignaciones.length} tareas</strong></td>
                  <td><strong>$${totalTrabajador.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;
    }).join('');

    // Renderizar vista completa
    content.innerHTML = `
      <div class="workers-summary">
        <div class="summary-header">
          <h2 class="section-title">Resumen por Trabajador</h2>
          <div class="corte-info">
            <span class="corte-name">${corte.nombrePrenda}</span>
            <span class="corte-units">${corte.cantidadPrendas.toLocaleString()} unidades</span>
          </div>
        </div>
        
        ${trabajadoresHTML}
        
        <div class="general-total">
          <div class="total-row">
            <span>Total Unidades:</span>
            <span>${totalUnidadesGeneral.toLocaleString()}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total Mano de Obra:</span>
            <span>$${totalManoObraGeneral.toFixed(2)}</span>
          </div>
        </div>
        
        ${corte.estado === 'activo' ? `
          <div class="actions-section">
            <button class="btn-primary" onclick="cambiarPestana('asignar')">
              Asignar Mas Tareas
            </button>
          </div>
        ` : ''}
      </div>
    `;

  } catch (error) {
    console.error("Error al cargar pestaña Trabajador:", error);
    content.innerHTML = '<p class="error">Error al cargar el resumen por trabajador</p>';
  }
}

// ----------------------------------------------------------------------
// -----------------------PESTANA EDITAR CORTE------------------------------
// ----------------------------------------------------------------------
// -----------------------PESTANA EDITAR CORTE------------------------------
// ----------------------------------------------------------------------
// Cargar la pestaña "Editar Corte" (versión simplificada)
async function cargarPestanaEditar(corteId) {
  const content = document.getElementById('tab-content');

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) {
      content.innerHTML = '<p class="error">Corte no encontrado</p>';
      return;
    }

    // Generar filas de la tabla
    const filasTareas = corte.tareas.map((tarea, index) => {
      // Verificar si la tarea tiene asignaciones
      const tieneAsignaciones = tarea.asignaciones && tarea.asignaciones.length > 0;

      return `
        <tr class="selectable-row" data-tarea-index="${index}" data-tiene-asignaciones="${tieneAsignaciones ? 'si' : 'no'}">
          <td class="task-name">${tarea.nombre}</td>
          <td class="task-price">$${tarea.precioUnitario.toFixed(2)}</td>
          <td class="task-assigned">
            ${tieneAsignaciones ? '<span class="assigned-yes">Sí</span>' : '<span class="assigned-no">No</span>'}
          </td>
        </tr>
      `;
    }).join('');

    // Renderizar vista completa
    content.innerHTML = `
      <div class="editar-corte-section">
        <h2 class="section-title">Editar Tareas del Corte</h2>
        
        <div class="table-container">
          <table class="editar-table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Uni</th>
                <th>Asignado</th>
              </tr>
            </thead>
            <tbody id="tareas-body">
              ${filasTareas}
            </tbody>
          </table>
        </div>
        
        <!-- Botones flotantes contextuales -->
        <div id="floating-actions" class="floating-actions" style="display: none;">
          <button id="btn-floating-edit" class="floating-btn floating-btn-edit" onclick="editarTareaSeleccionada()">
            ✏️
          </button>
          <button id="btn-floating-delete" class="floating-btn floating-btn-delete" onclick="eliminarTareaSeleccionada()" style="display: none;">
            🗑️
          </button>
        </div>
        
        <div class="add-task-section">
          <h3 class="section-subtitle">Agregar Nueva Tarea</h3>
          
          <div class="add-task-form">
            <div class="form-group">
              <label for="nueva-tarea-nombre">Nombre de la tarea</label>
              <input type="text" id="nueva-tarea-nombre" class="form-control" 
                     placeholder="Ej: Cierre especial">
              <small id="error-nombre" class="error-message"></small>
            </div>
            
            <div class="form-group">
              <label for="nueva-tarea-precio">Precio por unidad ($)</label>
              <input type="number" id="nueva-tarea-precio" class="form-control" 
                     step="0.01" min="0" placeholder="0.00">
              <small id="error-precio" class="error-message"></small>
            </div>
            
            <button id="btn-agregar-tarea" class="btn-primary" disabled>
              + Agregar Tarea
            </button>
          </div>
        </div>
      </div>
    `;

    // Inicializar eventos de la tabla y botones flotantes
    inicializarEventosEditarCorte(corteId, corte);

  } catch (error) {
    console.error("Error al cargar pestaña Editar:", error);
    content.innerHTML = '<p class="error">Error al cargar la edición del corte</p>';
  }
}

// ------------------------------------------------------------------
// Inicializar eventos para la pestaña Editar Corte
function inicializarEventosEditarCorte(corteId, corte) {
  let tareaSeleccionada = null;
  let tareaIndexSeleccionada = null;

  // Eventos para selección de filas
  document.querySelectorAll('.selectable-row').forEach(row => {
    row.addEventListener('click', (e) => {
      // Quitar selección de todas las filas
      document.querySelectorAll('.selectable-row').forEach(r => {
        r.classList.remove('selected');
      });

      // Agregar selección a la fila clickeada
      row.classList.add('selected');

      // Guardar datos de la tarea seleccionada
      tareaIndexSeleccionada = parseInt(row.dataset.tareaIndex);
      tareaSeleccionada = corte.tareas[tareaIndexSeleccionada];

      // Mostrar botones flotantes
      const floatingActions = document.getElementById('floating-actions');
      const btnEdit = document.getElementById('btn-floating-edit');
      const btnDelete = document.getElementById('btn-floating-delete');

      floatingActions.style.display = 'flex';

      // Mostrar solo los botones aplicables
      const tieneAsignaciones = row.dataset.tieneAsignaciones === 'si';
      if (tieneAsignaciones) {
        btnEdit.style.display = 'block';
        btnDelete.style.display = 'none';
      } else {
        btnEdit.style.display = 'block';
        btnDelete.style.display = 'block';
      }

      // Prevenir que el clic se propague a otros elementos
      e.stopPropagation();
    });
  });

  // Cerrar botones flotantes al hacer clic fuera
  document.addEventListener('click', (e) => {
    const floatingActions = document.getElementById('floating-actions');
    const isClickInsideTable = e.target.closest('.table-container');
    const isClickInsideFloating = e.target.closest('#floating-actions');

    if (!isClickInsideTable && !isClickInsideFloating && floatingActions) {
      floatingActions.style.display = 'none';
      document.querySelectorAll('.selectable-row').forEach(r => {
        r.classList.remove('selected');
      });
      tareaSeleccionada = null;
      tareaIndexSeleccionada = null;
    }
  });

  // Eventos para agregar nueva tarea
  const nombreInput = document.getElementById('nueva-tarea-nombre');
  const precioInput = document.getElementById('nueva-tarea-precio');
  const btnAgregar = document.getElementById('btn-agregar-tarea');

  // Validar campos al escribir
  nombreInput.addEventListener('input', () => validarCamposNuevaTarea());
  precioInput.addEventListener('input', () => validarCamposNuevaTarea());

  // Agregar tarea al hacer clic
  btnAgregar.addEventListener('click', () => agregarNuevaTarea(corteId, corte));

  // Exponer funciones globales para los botones flotantes
  window.editarTareaSeleccionada = function () {
    if (tareaSeleccionada !== null && tareaIndexSeleccionada !== null) {
      mostrarModalEditarTarea(corteId, corte, tareaIndexSeleccionada);
      // Ocultar botones flotantes después de abrir modal
      document.getElementById('floating-actions').style.display = 'none';
      document.querySelectorAll('.selectable-row').forEach(r => {
        r.classList.remove('selected');
      });
    }
  };

  window.eliminarTareaSeleccionada = function () {
    if (tareaSeleccionada !== null && tareaIndexSeleccionada !== null) {
      mostrarModalEliminarTarea(corteId, corte, tareaIndexSeleccionada);
      // Ocultar botones flotantes después de abrir modal
      document.getElementById('floating-actions').style.display = 'none';
      document.querySelectorAll('.selectable-row').forEach(r => {
        r.classList.remove('selected');
      });
    }
  };
}

// ==================== MODALES ====================

// Modal: Editar Tarea
function mostrarModalEditarTarea(corteId, corte, tareaIndex) {
  const tarea = corte.tareas[tareaIndex];

  const modalHTML = `
    <div class="modal-overlay" onclick="cerrarModal(event)">
      <div class="modal-container">
        <h3 class="modal-title">Editar Tarea</h3>
        
        <div class="form-group">
          <label>Nombre de la tarea</label>
          <input type="text" class="form-control" id="modal-nombre-tarea" 
                 value="${tarea.nombre}" placeholder="Nombre de la tarea">
          <small class="error-message" id="modal-error-nombre"></small>
        </div>
        
        <div class="form-group">
          <label>Precio por unidad ($)</label>
          <input type="number" class="form-control" id="modal-precio-tarea" 
                 step="0.01" min="0" value="${tarea.precioUnitario}" placeholder="0.00">
          <small class="error-message" id="modal-error-precio"></small>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
          <button class="btn-primary" onclick="guardarTareaEditada(${corteId}, ${tareaIndex})">Guardar</button>
        </div>
      </div>
    </div>
  `;

  mostrarModal(modalHTML);
}

// Modal: Eliminar Tarea
function mostrarModalEliminarTarea(corteId, corte, tareaIndex) {
  const tarea = corte.tareas[tareaIndex];

  const modalHTML = `
    <div class="modal-overlay" onclick="cerrarModal(event)">
      <div class="modal-container">
        <h3 class="modal-title">⚠️ Confirmar Eliminación</h3>
        
        <p class="modal-message">
          ¿Realmente desea eliminar la tarea 
          <strong>"${tarea.nombre}"</strong>?
        </p>
        
        <p class="warning-message">
          ⚠️ Esta acción no se puede deshacer.
        </p>
        
        <div class="modal-actions">
          <button class="btn-secondary" onclick="cerrarModal()">No</button>
          <button class="btn-danger" onclick="eliminarTarea(${corteId}, ${tareaIndex})">Sí, Eliminar</button>
        </div>
      </div>
    </div>
  `;

  mostrarModal(modalHTML);
}

// ==================== FUNCIONES DE MODAL ====================

// Mostrar modal genérico
function mostrarModal(contenidoHTML) {
  // Cerrar modal anterior si existe
  const modalExistente = document.querySelector('.modal-overlay');
  if (modalExistente) modalExistente.remove();

  // Crear y mostrar nuevo modal
  const modal = document.createElement('div');
  modal.innerHTML = contenidoHTML;
  document.body.appendChild(modal);

  // Prevenir scroll del body
  document.body.style.overflow = 'hidden';
}

// Cerrar modal
function cerrarModal(event) {
  const overlay = document.querySelector('.modal-overlay');
  if (!overlay) return;

  // Solo cerrar si se hace clic en el overlay, no en el contenedor
  if (event && event.target.classList.contains('modal-overlay')) {
    document.body.style.overflow = 'auto';
    overlay.remove();
  } else if (!event) {
    // Cerrar sin evento (desde botón)
    document.body.style.overflow = 'auto';
    overlay.remove();
  }
}

// Guardar tarea editada
window.guardarTareaEditada = async function (corteId, tareaIndex) {
  const nombre = document.getElementById('modal-nombre-tarea').value.trim();
  const precio = parseFloat(document.getElementById('modal-precio-tarea').value);

  // Validaciones
  if (!nombre) {
    document.getElementById('modal-error-nombre').textContent = 'El nombre no puede estar vacío';
    return;
  }

  if (isNaN(precio) || precio < 0) {
    document.getElementById('modal-error-precio').textContent = 'Ingrese un precio válido';
    return;
  }

  try {
    // Verificar que el nombre no esté duplicado (en otras tareas del corte)
    const corte = await db.cortes.get(corteId);
    const tareaExistente = corte.tareas.find((t, idx) =>
      idx !== tareaIndex && t.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (tareaExistente) {
      document.getElementById('modal-error-nombre').textContent = 'Ya existe una tarea con este nombre';
      return;
    }

    // Actualizar en la base de datos
    await db.transaction('rw', db.cortes, async () => {
      const corte = await db.cortes.get(corteId);
      corte.tareas[tareaIndex].nombre = nombre;
      corte.tareas[tareaIndex].precioUnitario = precio;
      await db.cortes.put(corte);
    });

    // Cerrar modal y recargar pestaña
    cerrarModal();
    await cargarPestanaEditar(corteId);
    mostrarMensaje('✅ Tarea actualizada correctamente');

  } catch (error) {
    console.error("Error al guardar tarea:", error);
    mostrarMensaje(`❌ Error: ${error.message || 'No se pudo guardar la tarea'}`);
  }
};

// Eliminar tarea
window.eliminarTarea = async function (corteId, tareaIndex) {
  try {
    // Actualizar en la base de datos
    await db.transaction('rw', db.cortes, async () => {
      const corte = await db.cortes.get(corteId);
      corte.tareas.splice(tareaIndex, 1); // Eliminar tarea por índice
      await db.cortes.put(corte);
    });

    // Cerrar modal y recargar pestaña
    cerrarModal();
    await cargarPestanaEditar(corteId);
    mostrarMensaje('✅ Tarea eliminada correctamente');

  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    mostrarMensaje(`❌ Error: ${error.message || 'No se pudo eliminar la tarea'}`);
  }
};
// ----------------------------------------------------------------------
// ------------------------PESTANA ASIGNAR TAREA--------------------------
// ----------------------------------------------------------------------
// Cargar la pestaña "Asignar Tarea"
async function cargarPestanaAsignar(corteId) {
  const content = document.getElementById('tab-content');

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) {
      content.innerHTML = '<p class="error">Corte no encontrado</p>';
      return;
    }

    // Obtener trabajadores y tareas disponibles
    const trabajadores = await db.trabajadores.toArray();
    const tareasDisponibles = getTareasDisponibles(corte);

    // Si no hay tareas disponibles, mostrar mensaje
    if (tareasDisponibles.length === 0 && corte.estado === 'activo') {
      content.innerHTML = `
        <div class="no-data-section">
          <p class="no-data-message">¡Todas las tareas están completas!</p>
          <button class="btn-secondary" onclick="finalizarCorte(${corteId})">
            Finalizar Corte
          </button>
        </div>
      `;
      return;
    }

    // Si el corte está terminado, no permitir asignaciones
    if (corte.estado === 'terminado') {
      content.innerHTML = `
        <div class="completed-section">
          <span class="badge badge-terminado">CORTE FINALIZADO</span>
          <p>No se pueden asignar más tareas a un corte finalizado</p>
        </div>
      `;
      return;
    }

    // Renderizar formulario y historial
    content.innerHTML = `
      <div class="assignment-section">
        <h2 class="section-title">Asignar Tareas</h2>
        
        <div class="assignment-form">
          <div class="form-group">
            <label for="select-trabajador">Trabajador</label>
            <select id="select-trabajador" class="form-control">
              <option value="">Seleccionar trabajador</option>
              ${trabajadores.map(t => `
                <option value="${t.id}">${t.nombre}</option>
              `).join('')}
            </select>
            <small id="error-trabajador" class="error-message"></small>
          </div>
          
          <div class="form-group">
            <label for="select-tarea">Tarea Disponible</label>
            <select id="select-tarea" class="form-control" disabled>
              <option value="">Seleccione un trabajador primero</option>
              ${tareasDisponibles.map((t, index) => `
                <option value="${index}" 
                        data-unidades="${t.unidadesDisponibles}"
                        data-tarea-id="${t.tarea.id}">
                  ${t.tarea.nombre} (${t.unidadesDisponibles} unidades disponibles)
                </option>
              `).join('')}
            </select>
            <small id="error-tarea" class="error-message"></small>
          </div>
          
          <div class="form-group">
            <label for="cantidad-asignar">Cantidad a Asignar</label>
            <input type="number" id="cantidad-asignar" class="form-control" 
                   min="1" placeholder="0" disabled>
            <small id="error-cantidad" class="error-message"></small>
            <small id="info-cantidad" class="info-message">Seleccione una tarea para ver unidades disponibles</small>
          </div>
          
          <button id="btn-asignar" class="btn-primary" disabled>
            Asignar Tarea
          </button>
        </div>
        
        <div class="assignment-history">
          <h3 class="section-subtitle">Historial de Asignaciones</h3>
          <div id="historial-container" class="table-container">
            ${renderHistorialAsignaciones(corte)}
          </div>
        </div>
      </div>
    `;

    // Inicializar eventos del formulario
    inicializarEventosAsignacion(corteId, corte);

  } catch (error) {
    console.error("Error al cargar pestaña Asignar:", error);
    content.innerHTML = '<p class="error">Error al cargar el formulario de asignación</p>';
  }
}

// ------------sus funciones

// Obtener tareas con unidades disponibles
function getTareasDisponibles(corte) {
  return corte.tareas
    .map(tarea => {
      const unidadesAsignadas = tarea.asignaciones.reduce((sum, a) => sum + a.cantidad, 0);
      const unidadesDisponibles = tarea.unidadesTotales - unidadesAsignadas;

      return {
        tarea,
        unidadesDisponibles,
        unidadesAsignadas
      };
    })
    .filter(t => t.unidadesDisponibles > 0);
}


// Renderizar historial de asignaciones
function renderHistorialAsignaciones(corte) {
  if (!corte.tareas || corte.tareas.length === 0) {
    return '<p class="no-data">No hay asignaciones en este corte</p>';
  }

  let historial = [];

  corte.tareas.forEach(tarea => {
    tarea.asignaciones.forEach(asignacion => {
      historial.push({
        tareaNombre: tarea.nombre,
        cantidad: asignacion.cantidad,
        trabajadorId: asignacion.trabajadorId,
        asignacionId: asignacion.id || `${tarea.id}-${asignacion.trabajadorId}-${asignacion.cantidad}`
      });
    });
  });

  if (historial.length === 0) {
    return '<p class="no-data">No hay asignaciones registradas aún</p>';
  }

  return `
    <table class="history-table">
      <thead>
        <tr>
          <th>Tarea</th>
          <th>Cantidad</th>
          <th>Trabajador</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${historial.map(asig => `
          <tr data-asignacion-id="${asig.asignacionId}">
            <td class="task-name">${asig.tareaNombre}</td>
            <td class="task-quantity">${asig.cantidad}</td>
            <td class="worker-name" data-trabajador-id="${asig.trabajadorId}"></td>
            <td class="action-cell">
              <button class="btn-edit" onclick="editarAsignacion('${asig.asignacionId}', ${corte.id})">
                ✏️ Editar
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
// --------------------------

// Inicializar eventos del formulario de asignación
// Inicializar eventos del formulario de asignación (VERSIÓN CORREGIDA)
// Inicializar eventos del formulario de asignación (VERSIÓN CORREGIDA)
async function inicializarEventosAsignacion(corteId, corte) {
  const selectTrabajador = document.getElementById('select-trabajador');
  const selectTarea = document.getElementById('select-tarea');
  const cantidadInput = document.getElementById('cantidad-asignar');
  const btnAsignar = document.getElementById('btn-asignar');

  // Cargar nombres de trabajadores en el historial
  await cargarNombresTrabajadoresEnHistorial();

  // Evento: Seleccionar trabajador
  selectTrabajador.addEventListener('change', function () {
    const trabajadorId = this.value;
    document.getElementById('error-trabajador').textContent = '';

    if (!trabajadorId) {
      selectTarea.disabled = true;
      selectTarea.innerHTML = '<option value="">Seleccione un trabajador primero</option>';
      cantidadInput.disabled = true;
      btnAsignar.disabled = true;
      document.getElementById('info-cantidad').textContent = 'Seleccione un trabajador primero';
      return;
    }

    // Obtener corte actualizado antes de calcular tareas disponibles
    db.cortes.get(corteId).then(corteActual => {
      const tareasDisponibles = getTareasDisponibles(corteActual || corte);

      if (tareasDisponibles.length === 0) {
        selectTarea.disabled = true;
        selectTarea.innerHTML = '<option value="">No hay tareas disponibles</option>';
        cantidadInput.disabled = true;
        btnAsignar.disabled = true;
        document.getElementById('info-cantidad').textContent = 'No quedan tareas por asignar';
        return;
      }

      // Llenar selector de tareas
      selectTarea.disabled = false;
      selectTarea.innerHTML = tareasDisponibles.map((t, index) => `
        <option value="${index}" 
                data-unidades="${t.unidadesDisponibles}"
                data-tarea-id="${t.tarea.id}">
          ${t.tarea.nombre} (${t.unidadesDisponibles} disponibles)
        </option>
      `).join('');

      // ✅ FIX: Seleccionar automáticamente la primera tarea y activar campos
      if (tareasDisponibles.length > 0) {
        // Seleccionar la primera tarea
        selectTarea.selectedIndex = 0;

        // Obtener datos de la primera tarea
        const opcion = selectTarea.options[0];
        const unidadesDisponibles = parseInt(opcion.dataset.unidades) || 0;

        // Habilitar y configurar campo de cantidad
        cantidadInput.disabled = false;
        cantidadInput.max = unidadesDisponibles;
        document.getElementById('info-cantidad').textContent =
          `Máximo ${unidadesDisponibles} unidades disponibles`;

        if (unidadesDisponibles > 0) {
          cantidadInput.value = unidadesDisponibles;
          btnAsignar.disabled = false;
        } else {
          btnAsignar.disabled = true;
        }

        // Limpiar errores
        document.getElementById('error-tarea').textContent = '';
      } else {
        cantidadInput.disabled = true;
        btnAsignar.disabled = true;
        document.getElementById('info-cantidad').textContent = 'Seleccione una tarea para ver unidades disponibles';
      }

    }).catch(error => {
      console.error("Error al cargar tareas disponibles:", error);
    });
  });

  // Evento: Seleccionar tarea (CORREGIDO)
  selectTarea.addEventListener('change', function () {
    const tareaIndex = this.value;
    document.getElementById('error-tarea').textContent = '';

    // Validar que se haya seleccionado una tarea válida
    if (tareaIndex === '' || isNaN(parseInt(tareaIndex))) {
      cantidadInput.disabled = true;
      btnAsignar.disabled = true;
      document.getElementById('info-cantidad').textContent = 'Seleccione una tarea válida';
      return;
    }

    const opcion = this.options[this.selectedIndex];
    const unidadesDisponibles = parseInt(opcion.dataset.unidades) || 0;

    // Habilitar cantidad y setear máximo
    cantidadInput.disabled = false;
    cantidadInput.max = unidadesDisponibles;
    document.getElementById('info-cantidad').textContent =
      `Máximo ${unidadesDisponibles} unidades disponibles`;

    if (unidadesDisponibles > 0) {
      cantidadInput.value = unidadesDisponibles;
      btnAsignar.disabled = false;
    } else {
      btnAsignar.disabled = true;
      cantidadInput.value = '';
    }
  });

  // Evento: Input de cantidad
  cantidadInput.addEventListener('input', function () {
    document.getElementById('error-cantidad').textContent = '';

    const max = parseInt(this.max) || 0;
    const valor = parseInt(this.value) || 0;

    if (valor < 1) {
      document.getElementById('error-cantidad').textContent = 'La cantidad debe ser al menos 1';
      btnAsignar.disabled = true;
    } else if (valor > max) {
      document.getElementById('error-cantidad').textContent = `Máximo ${max} unidades disponibles`;
      btnAsignar.disabled = true;
    } else {
      btnAsignar.disabled = false;
    }
  });

  // Evento: Guardar asignación (CORREGIDO)
  btnAsignar.addEventListener('click', async function () {
    const trabajadorId = parseInt(selectTrabajador.value);
    const tareaIndex = selectTarea.value;
    const cantidad = parseInt(cantidadInput.value);

    // Validaciones
    if (!trabajadorId) {
      document.getElementById('error-trabajador').textContent = 'Seleccione un trabajador';
      return;
    }

    if (tareaIndex === '' || isNaN(parseInt(tareaIndex))) {
      document.getElementById('error-tarea').textContent = 'Seleccione una tarea válida';
      return;
    }

    if (isNaN(cantidad) || cantidad < 1) {
      document.getElementById('error-cantidad').textContent = 'Ingrese una cantidad válida';
      return;
    }

    try {
      // CORRECCIÓN CLAVE: Obtener corte actualizado desde BD
      const corteDB = await db.cortes.get(corteId);
      if (!corteDB) throw new Error('Corte no encontrado en BD');

      // Obtener tareas disponibles con datos frescos
      const tareasDisponibles = getTareasDisponibles(corteDB);
      const tareaSeleccionada = tareasDisponibles[parseInt(tareaIndex)];

      if (!tareaSeleccionada) {
        throw new Error('Tarea no disponible o ya completada');
      }

      if (cantidad > tareaSeleccionada.unidadesDisponibles) {
        throw new Error(`Solo quedan ${tareaSeleccionada.unidadesDisponibles} unidades disponibles`);
      }

      // Crear nueva asignación
      const nuevaAsignacion = {
        trabajadorId: trabajadorId,
        cantidad: cantidad,
        fecha: new Date().toISOString()
      };

      // Actualizar la base de datos
      await db.transaction('rw', db.cortes, async () => {
        const corteDB = await db.cortes.get(corteId);
        const tarea = corteDB.tareas.find(t => t.id === tareaSeleccionada.tarea.id);

        if (!tarea.asignaciones) tarea.asignaciones = [];
        tarea.asignaciones.push(nuevaAsignacion);

        await db.cortes.put(corteDB);
      });

      // CORRECCIÓN CLAVE: Recargar TODO el formulario
      await cargarPestanaAsignar(corteId);
      mostrarMensaje('✅ Tarea asignada correctamente');

    } catch (error) {
      console.error("Error al asignar tarea:", error);
      mostrarMensaje(`❌ Error: ${error.message || 'No se pudo asignar la tarea'}`);
    }
  });
}
// --------------------------

// Cargar nombres de trabajadores en el historial (asincrónico)
async function cargarNombresTrabajadoresEnHistorial() {
  try {
    const trabajadores = await db.trabajadores.toArray();
    const trabajadoresMap = new Map(trabajadores.map(t => [t.id, t.nombre]));

    document.querySelectorAll('.worker-name').forEach(cell => {
      const trabajadorId = parseInt(cell.dataset.trabajadorId);
      cell.textContent = trabajadoresMap.get(trabajadorId) || 'Desconocido';
    });
  } catch (error) {
    console.error("Error al cargar nombres de trabajadores:", error);
  }
}
// --------------------------

// Editar asignación existente
window.editarAsignacion = async function (asignacionId, corteId) {
  if (!confirm('¿Desea editar esta asignación? Podrá modificar la cantidad o eliminarla.')) {
    return;
  }

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) throw new Error('Corte no encontrado');

    // Buscar la asignación en el corte
    let asignacionEncontrada = null;
    let tareaPadre = null;

    for (const tarea of corte.tareas) {
      const asignacion = tarea.asignaciones.find(a => {
        const aId = a.id || `${tarea.id}-${a.trabajadorId}-${a.cantidad}`;
        return aId === asignacionId;
      });

      if (asignacion) {
        asignacionEncontrada = asignacion;
        tareaPadre = tarea;
        break;
      }
    }

    if (!asignacionEncontrada || !tareaPadre) {
      throw new Error('Asignación no encontrada');
    }

    // Calcular unidades disponibles (incluyendo las de esta asignación)
    const unidadesAsignadas = tareaPadre.asignaciones.reduce((sum, a) => sum + a.cantidad, 0);
    const unidadesDisponibles = tareaPadre.unidadesTotales - (unidadesAsignadas - asignacionEncontrada.cantidad);

    // Pedir nueva cantidad
    const nuevaCantidad = prompt(
      `Editar asignación de "${tareaPadre.nombre}"\n` +
      `Cantidad actual: ${asignacionEncontrada.cantidad}\n` +
      `Unidades disponibles: ${unidadesDisponibles}\n` +
      `Ingrese nueva cantidad (0 para eliminar):`,
      asignacionEncontrada.cantidad.toString()
    );

    if (nuevaCantidad === null) return; // Cancelado

    const cantidadNumerica = parseInt(nuevaCantidad);

    if (isNaN(cantidadNumerica) || cantidadNumerica < 0) {
      alert('Cantidad inválida');
      return;
    }

    if (cantidadNumerica > unidadesDisponibles) {
      alert(`Solo hay ${unidadesDisponibles} unidades disponibles`);
      return;
    }

    // Actualizar en la base de datos
    await db.transaction('rw', db.cortes, async () => {
      const corteDB = await db.cortes.get(corteId);
      if (!corteDB) return;

      const tareaDB = corteDB.tareas.find(t => t.id === tareaPadre.id);
      if (!tareaDB) return;

      const index = tareaDB.asignaciones.findIndex(a => {
        const aId = a.id || `${tareaDB.id}-${a.trabajadorId}-${a.cantidad}`;
        return aId === asignacionId;
      });

      if (index === -1) return;

      if (cantidadNumerica === 0) {
        // Eliminar asignación
        tareaDB.asignaciones.splice(index, 1);
      } else {
        // Actualizar cantidad
        tareaDB.asignaciones[index].cantidad = cantidadNumerica;
      }

      await db.cortes.put(corteDB);
    });

    // Recargar la pestaña
    await cargarPestanaAsignar(corteId);
    mostrarMensaje('✅ Asignación actualizada correctamente');

  } catch (error) {
    console.error("Error al editar asignación:", error);
    mostrarMensaje(`❌ Error: ${error.message || 'No se pudo editar la asignación'}`);
  }
};

// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// Calcular mano de obra total del corte
function calcularManoObraTotal(corte) {
  return corte.tareas.reduce((total, tarea) => {
    return total + (tarea.precioUnitario * tarea.unidadesTotales);
  }, 0);
}
// ----------------------------------------------------------------------
// Formatear fecha a DD/MM/YYYY
function formatDate(date) {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}
// ----------------------------------------------------------------------
// Mostrar mensaje temporal
function mostrarMensaje(mensaje) {
  const app = document.getElementById('app');
  const mensajeEl = document.createElement('div');
  mensajeEl.className = 'toast-message';
  mensajeEl.innerHTML = mensaje;
  app.appendChild(mensajeEl);

  setTimeout(() => {
    mensajeEl.remove();
  }, 2000);
}
// ----------------------------------------------------------------------
// Cambiar a pestaña específica programáticamente
function cambiarPestana(nombrePestana) {
  // Buscar el botón de la pestaña
  const botonPestana = document.querySelector(`.tab-item[data-tab="${nombrePestana}"]`);
  if (botonPestana) {
    // Simular clic en el botón
    botonPestana.click();
  }
}
//=========================================================================
// ----------------------------------------------------------------------
// Calcular mano de obra REAL (hasta ahora) - suma de tareas asignadas
function calcularManoObraReal(corte) {
  let totalReal = 0;

  corte.tareas.forEach(tarea => {
    // Sumar solo lo que está asignado (no el total teórico)
    const cantidadAsignada = tarea.asignaciones.reduce((sum, asignacion) => {
      return sum + asignacion.cantidad;
    }, 0);

    totalReal += tarea.precioUnitario * cantidadAsignada;
  });

  return totalReal;
}

// ----------------------------------------------------------------------
// ---------------------------------------------------------------------
// funciones globales
// Exponer funciones para que sean accesibles desde HTML
window.cerrarModal = cerrarModal;
window.guardarTareaEditada = guardarTareaEditada;
window.eliminarTarea = eliminarTarea;
// Exponer función globalmente
window.cambiarPestana = cambiarPestana;