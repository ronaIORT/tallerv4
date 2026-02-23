// tab-editar.js - Pestaña para editar tareas del corte
import { db } from '../../db.js';
import { mostrarMensaje, calcularCostoPorPrenda } from './utils.js';

export async function cargarPestanaEditar(corteId) {
  const content = document.getElementById('tab-content');

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) {
      content.innerHTML = '<p class="error">Corte no encontrado</p>';
      return;
    }

    const filas = corte.tareas.map((tarea, index) => {
      const tieneAsig = tarea.asignaciones && tarea.asignaciones.length > 0;
      return `<tr class="tarea-row clickable" 
                  data-index="${index}" 
                  data-nombre="${tarea.nombre}"
                  data-precio="${tarea.precioUnitario}"
                  data-tiene-asig="${tieneAsig}">
        <td>${tarea.nombre}</td>
        <td>$${tarea.precioUnitario.toFixed(2)}</td>
        <td>${tieneAsig ? '<span class="assigned-yes">Sí</span>' : '<span class="assigned-no">No</span>'}</td>
      </tr>`;
    }).join('');

    const costoPorPrenda = calcularCostoPorPrenda(corte.tareas);

    content.innerHTML = `
      <div class="editar-corte-section">
        <h2>Editar Tareas</h2>
        <div class="table-container">
          <table class="editar-table">
            <thead><tr><th>Tarea</th><th>Precio</th><th>Asig.</th></tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        
        <div class="add-task-section">
          <h3>Agregar Nueva Tarea</h3>
          <div class="add-task-form">
            <input type="text" id="nueva-tarea-nombre" class="form-control" placeholder="Nombre">
            <input type="number" id="nueva-tarea-precio" class="form-control" placeholder="Precio" step="0.01" min="0">
            <button id="btn-agregar-tarea" class="btn-primary">+ Agregar</button>
          </div>
        </div>
        
        <div class="costo-prenda-section">
          <div class="costo-prenda-row">
            <span>💰 Costo por Prenda:</span>
            <span class="costo-prenda-value">$${costoPorPrenda.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <!-- Botones flotantes para editar/eliminar/agregar -->
      <div id="floating-edit-btns" class="floating-action-btns" style="display: none;">
        <button class="btn-edit-floating" id="btn-editar-tarea" onclick="mostrarModalEditarTarea()">
          ✏️ Editar
        </button>
        <button class="btn-danger-floating" id="btn-eliminar-tarea" onclick="mostrarModalEliminarTarea()">
          🗑️ Eliminar
        </button>
        <button class="btn-add-floating" onclick="mostrarModalAgregarTareaDebajo()">
          ➕ Agregar
        </button>
      </div>
    `;

    // Inicializar eventos
    inicializarEventosEditar(corteId, corte);

  } catch (error) {
    content.innerHTML = '<p class="error">Error</p>';
  }
}

// Inicializar eventos de la pestaña editar
function inicializarEventosEditar(corteId, corte) {
  const floatingBtns = document.getElementById('floating-edit-btns');
  const btnEliminar = document.getElementById('btn-eliminar-tarea');
  
  // Usar variable global para la tarea seleccionada
  window._tareaSeleccionadaEditar = null;

  // Evento: Clic en fila de tarea
  document.querySelectorAll('.tarea-row.clickable').forEach(row => {
    row.addEventListener('click', function() {
      // Quitar selección anterior
      document.querySelectorAll('.tarea-row.clickable').forEach(r => r.classList.remove('selected'));
      // Seleccionar esta fila
      this.classList.add('selected');
      
      // Guardar datos de la tarea seleccionada
      const tieneAsig = this.dataset.tieneAsig === 'true';
      window._tareaSeleccionadaEditar = {
        index: parseInt(this.dataset.index),
        nombre: this.dataset.nombre,
        precio: parseFloat(this.dataset.precio),
        tieneAsignaciones: tieneAsig
      };
      
      // Mostrar/ocultar botón eliminar según si tiene asignaciones
      if (tieneAsig) {
        btnEliminar.style.display = 'none';
      } else {
        btnEliminar.style.display = 'flex';
      }
      
      // Mostrar botones flotantes
      floatingBtns.style.display = 'flex';
    });
  });

  // Cerrar botones flotantes al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.tarea-row.clickable') && !e.target.closest('#floating-edit-btns')) {
      floatingBtns.style.display = 'none';
      document.querySelectorAll('.tarea-row.clickable').forEach(r => r.classList.remove('selected'));
      window._tareaSeleccionadaEditar = null;
    }
  });

  // Función global para mostrar modal de edición
  window.mostrarModalEditarTarea = function() {
    if (!window._tareaSeleccionadaEditar) return;
    
    const tarea = window._tareaSeleccionadaEditar;
    
    mostrarModalEditar(
      tarea.nombre,
      tarea.precio,
      async (nuevoNombre, nuevoPrecio) => {
        await editarTarea(corteId, tarea.index, nuevoNombre, nuevoPrecio);
        floatingBtns.style.display = 'none';
        window._tareaSeleccionadaEditar = null;
      }
    );
  };

  // Función global para mostrar modal de eliminación
  window.mostrarModalEliminarTarea = function() {
    if (!window._tareaSeleccionadaEditar) return;
    
    const tarea = window._tareaSeleccionadaEditar;
    
    mostrarModalConfirmacion(
      '⚠️ Confirmar Eliminación',
      `¿Eliminar la tarea <strong>"${tarea.nombre}"</strong>?`,
      async () => {
        await eliminarTarea(corteId, tarea.index);
        floatingBtns.style.display = 'none';
        window._tareaSeleccionadaEditar = null;
      }
    );
  };

  // Función global para mostrar modal de agregar tarea debajo
  window.mostrarModalAgregarTareaDebajo = function() {
    if (!window._tareaSeleccionadaEditar) return;
    
    const tareaSeleccionada = window._tareaSeleccionadaEditar;
    
    mostrarModalAgregarTarea(
      tareaSeleccionada.index,
      async (nombre, precio) => {
        await agregarTareaDebajo(corteId, tareaSeleccionada.index + 1, nombre, precio, corte.cantidadPrendas);
        floatingBtns.style.display = 'none';
        window._tareaSeleccionadaEditar = null;
      }
    );
  };

  // Evento: Agregar nueva tarea
  document.getElementById('btn-agregar-tarea').addEventListener('click', async () => {
    const nombre = document.getElementById('nueva-tarea-nombre').value.trim();
    const precio = parseFloat(document.getElementById('nueva-tarea-precio').value);

    if (!nombre || isNaN(precio) || precio < 0) {
      mostrarMensaje('❌ Datos inválidos');
      return;
    }

    try {
      const corteDB = await db.cortes.get(corteId);
      corteDB.tareas.push({
        id: Date.now(),
        nombre,
        precioUnitario: precio,
        unidadesTotales: corteDB.cantidadPrendas,
        asignaciones: []
      });
      await db.cortes.put(corteDB);
      mostrarMensaje('✅ Tarea agregada');
      await cargarPestanaEditar(corteId);
    } catch (e) {
      mostrarMensaje('❌ Error al agregar');
    }
  });
}

// Editar tarea
async function editarTarea(corteId, tareaIndex, nuevoNombre, nuevoPrecio) {
  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) return;

    corte.tareas[tareaIndex].nombre = nuevoNombre;
    corte.tareas[tareaIndex].precioUnitario = nuevoPrecio;

    await db.cortes.put(corte);
    mostrarMensaje('✅ Tarea actualizada');
    
    // Recargar la pestaña
    await cargarPestanaEditar(corteId);

  } catch (error) {
    console.error('Error al editar:', error);
    mostrarMensaje('❌ Error al editar tarea');
  }
}

// Eliminar tarea
async function eliminarTarea(corteId, tareaIndex) {
  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) return;

    // Eliminar la tarea del array
    corte.tareas.splice(tareaIndex, 1);

    await db.cortes.put(corte);
    mostrarMensaje('✅ Tarea eliminada');
    
    // Recargar la pestaña
    await cargarPestanaEditar(corteId);

  } catch (error) {
    console.error('Error al eliminar:', error);
    mostrarMensaje('❌ Error al eliminar tarea');
  }
}

// Función para mostrar modal de edición
function mostrarModalEditar(nombreActual, precioActual, onSave) {
  // Crear overlay del modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>✏️ Editar Tarea</h3>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="edit-nombre">Nombre</label>
          <input type="text" id="edit-nombre" class="form-control" value="${nombreActual}">
        </div>
        <div class="form-group">
          <label for="edit-precio">Precio Unitario</label>
          <input type="number" id="edit-precio" class="form-control" value="${precioActual.toFixed(2)}" step="0.01" min="0">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel">Cancelar</button>
        <button class="btn-primary" id="modal-save">Guardar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Focus en el input de nombre
  setTimeout(() => {
    document.getElementById('edit-nombre').focus();
  }, 100);

  // Eventos
  document.getElementById('modal-cancel').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = 'auto';
  });

  document.getElementById('modal-save').addEventListener('click', () => {
    const nuevoNombre = document.getElementById('edit-nombre').value.trim();
    const nuevoPrecio = parseFloat(document.getElementById('edit-precio').value);

    if (!nuevoNombre || isNaN(nuevoPrecio) || nuevoPrecio < 0) {
      mostrarMensaje('❌ Datos inválidos');
      return;
    }

    overlay.remove();
    document.body.style.overflow = 'auto';
    if (onSave) onSave(nuevoNombre, nuevoPrecio);
  });

  // Cerrar al hacer clic fuera
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = 'auto';
    }
  });
}

// Función para mostrar modal de agregar tarea
function mostrarModalAgregarTarea(indexDespues, onSave) {
  // Crear overlay del modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>➕ Agregar Nueva Tarea</h3>
      </div>
      <div class="modal-body">
        <p class="modal-info-text">Se agregará la nueva tarea en la posición ${indexDespues + 1}</p>
        <div class="form-group">
          <label for="add-nombre">Nombre de la tarea</label>
          <input type="text" id="add-nombre" class="form-control" placeholder="Ej: Costura especial">
        </div>
        <div class="form-group">
          <label for="add-precio">Precio Unitario</label>
          <input type="number" id="add-precio" class="form-control" placeholder="0.00" step="0.01" min="0">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel">Cancelar</button>
        <button class="btn-primary" id="modal-add">Agregar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Focus en el input de nombre
  setTimeout(() => {
    document.getElementById('add-nombre').focus();
  }, 100);

  // Eventos
  document.getElementById('modal-cancel').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = 'auto';
  });

  document.getElementById('modal-add').addEventListener('click', () => {
    const nombre = document.getElementById('add-nombre').value.trim();
    const precio = parseFloat(document.getElementById('add-precio').value);

    if (!nombre || isNaN(precio) || precio < 0) {
      mostrarMensaje('❌ Datos inválidos');
      return;
    }

    overlay.remove();
    document.body.style.overflow = 'auto';
    if (onSave) onSave(nombre, precio);
  });

  // Cerrar al hacer clic fuera
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = 'auto';
    }
  });
}

// Agregar tarea en una posición específica
async function agregarTareaDebajo(corteId, posicion, nombre, precio, cantidadPrendas) {
  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) return;

    // Crear nueva tarea
    const nuevaTarea = {
      id: Date.now(),
      nombre,
      precioUnitario: precio,
      unidadesTotales: cantidadPrendas,
      asignaciones: []
    };

    // Insertar en la posición específica
    corte.tareas.splice(posicion, 0, nuevaTarea);

    await db.cortes.put(corte);
    mostrarMensaje('✅ Tarea agregada debajo');
    
    // Recargar la pestaña
    await cargarPestanaEditar(corteId);

  } catch (error) {
    console.error('Error al agregar tarea:', error);
    mostrarMensaje('❌ Error al agregar tarea');
  }
}

// Función para mostrar modal de confirmación
function mostrarModalConfirmacion(titulo, mensaje, onConfirm) {
  // Crear overlay del modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${titulo}</h3>
      </div>
      <div class="modal-body">
        <p>${mensaje}</p>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel">Cancelar</button>
        <button class="btn-danger" id="modal-confirm">Eliminar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  // Eventos
  document.getElementById('modal-cancel').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = 'auto';
  });

  document.getElementById('modal-confirm').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = 'auto';
    if (onConfirm) onConfirm();
  });

  // Cerrar al hacer clic fuera
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = 'auto';
    }
  });
}