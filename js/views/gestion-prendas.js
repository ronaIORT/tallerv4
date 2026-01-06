// gestion-prendas.js - Versión tema oscuro compacto
import { db } from '../db.js';

export function renderGestionPrendas() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="mobile-container">
      <div class="header">
        <button class="back-btn" onclick="window.location.hash = '#dashboard'">←</button>
        <h1 class="small-title">Gestión de Prendas</h1>
      </div>
      
      <div class="form-section">
        <div class="form-card">
          <h2 class="section-title">Crear Nueva Prenda</h2>
          <div class="form-group">
            <label for="nueva-prenda">Nombre de la Prenda</label>
            <input type="text" id="nueva-prenda" class="form-control" placeholder="Ej: Pantalón Ajustado">
            <small id="error-nueva-prenda" class="error-message"></small>
          </div>
          <button id="btn-crear-prenda" class="btn-primary">Crear Prenda</button>
        </div>
      </div>
      
      <div class="prendas-section">
        <div class="section-header">
          <h2 class="section-title">Prendas Registradas</h2>
          <button class="refresh-btn" onclick="cargarPrendas()">↻</button>
        </div>
        <div id="lista-prendas" class="prendas-list">
          <div class="loading-item">
            <div class="loading-line"></div>
            <div class="loading-line short"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Cargar prendas existentes
  cargarPrendas();

  // Eventos
  document.getElementById('btn-crear-prenda').addEventListener('click', crearPrenda);
  document.getElementById('nueva-prenda').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') crearPrenda();
  });
}

// Cargar prendas existentes
async function cargarPrendas() {
  try {
    const lista = document.getElementById('lista-prendas');
    const prendas = await db.prendas.toArray();

    if (prendas.length === 0) {
      lista.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👕</div>
          <p class="empty-text">No hay prendas registradas</p>
          <p class="empty-subtext">Crea la primera prenda usando el formulario</p>
        </div>
      `;
      return;
    }

    // Renderizar lista de prendas
    lista.innerHTML = prendas.map(prenda => `
      <div class="prenda-card" data-id="${prenda.id}">
        <div class="prenda-card-main">
          <div class="prenda-info">
            <h3 class="prenda-name">${prenda.nombre}</h3>
            <div class="prenda-meta">
              <span class="prenda-id">ID: ${prenda.id}</span>
              <span class="prenda-tareas">${prenda.tareas.length} tareas</span>
            </div>
          </div>
          <div class="prenda-summary">
            <span class="summary-label">Costo Total</span>
            <span class="summary-value">$${prenda.tareas.reduce((sum, tarea) => sum + tarea.precioUnitario, 0).toFixed(2)}</span>
          </div>
        </div>
        <div class="prenda-actions">
          <button class="action-btn primary" onclick="window.location.hash = '#ver-prenda/${prenda.id}'">
            <span class="action-icon">👁️</span>
            <span class="action-text">Ver</span>
          </button>
          <button class="action-btn" onclick="window.location.hash = '#editar-prenda/${prenda.id}'; event.stopPropagation();">
            <span class="action-icon">✏️</span>
            <span class="action-text">Editar</span>
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error("Error al cargar prendas:", error);
    document.getElementById('lista-prendas').innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-text">Error al cargar prendas</p>
        <button class="action-btn" onclick="cargarPrendas()">Reintentar</button>
      </div>
    `;
  }
}

// Crear nueva prenda
async function crearPrenda() {
  const input = document.getElementById('nueva-prenda');
  const nombre = input.value.trim();
  const errorEl = document.getElementById('error-nueva-prenda');

  errorEl.textContent = '';
  input.classList.remove('error');

  if (!nombre) {
    errorEl.textContent = 'El nombre no puede estar vacío';
    input.classList.add('error');
    return;
  }

  if (nombre.length < 3) {
    errorEl.textContent = 'El nombre debe tener al menos 3 caracteres';
    input.classList.add('error');
    return;
  }

  try {
    // Verificar si ya existe una prenda con ese nombre
    const prendaExistente = await db.prendas
      .where('nombre')
      .equalsIgnoreCase(nombre)
      .first();

    if (prendaExistente) {
      errorEl.textContent = 'Ya existe una prenda con este nombre';
      input.classList.add('error');
      return;
    }

    // Crear nueva prenda con tareas vacías
    const nuevaPrenda = {
      nombre: nombre,
      tareas: []
    };

    await db.prendas.add(nuevaPrenda);

    // Feedback visual
    input.value = '';
    mostrarMensaje('✅ Prenda creada correctamente');

    // Recargar lista
    cargarPrendas();
  } catch (error) {
    console.error("Error al crear prenda:", error);
    errorEl.textContent = 'Error al guardar. Intente nuevamente.';
    input.classList.add('error');
  }
}

// Ver detalles de una prenda
export async function renderVerPrenda(id) {
  try {
    const prenda = await db.prendas.get(id);
    if (!prenda) {
      window.location.hash = '#gestion-prendas';
      return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="mobile-container">
        <div class="header">
          <button class="back-btn" onclick="window.location.hash = '#gestion-prendas'">←</button>
          <h1 class="small-title">${prenda.nombre}</h1>
        </div>
        
        <div class="tasks-section">
          <div class="section-header">
            <h2 class="section-title">Tareas de Producción</h2>
            <span class="badge">${prenda.tareas.length} tareas</span>
          </div>
          <div class="table-container">
            <table class="tasks-table">
              <thead>
                <tr>
                  <th>Tarea</th>
                  <th>Precio Unitario</th>
                </tr>
              </thead>
              <tbody>
                ${prenda.tareas.length === 0
        ? `<tr>
                    <td colspan="2" class="no-data">
                      <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <p>No hay tareas definidas</p>
                      </div>
                    </td>
                  </tr>`
        : prenda.tareas.map((tarea, index) => `
                    <tr>
                      <td class="task-name">${tarea.nombre}</td>
                      <td class="task-price money">$${tarea.precioUnitario.toFixed(2)}</td>
                    </tr>
                  `).join('')
      }
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="summary-card">
          <h2 class="section-title">Resumen</h2>
          <div class="summary-row">
            <span>Total Tareas:</span>
            <span>${prenda.tareas.length}</span>
          </div>
          <div class="summary-row">
            <span>Costo Total:</span>
            <span class="money positive">$${prenda.tareas.reduce((sum, tarea) => sum + tarea.precioUnitario, 0).toFixed(2)}</span>
          </div>
        </div>
        
        <div class="actions-section">
          <button onclick="window.location.hash = '#editar-prenda/${id}'" class="btn-primary">Editar Prenda</button>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error al ver detalles de prenda:", error);
    mostrarMensaje('❌ Error al cargar detalles de la prenda.');
    window.location.hash = '#gestion-prendas';
  }
}

// Editar una prenda existente
export async function renderEditarPrenda(id) {
  try {
    const prenda = await db.prendas.get(id);
    if (!prenda) {
      window.location.hash = '#gestion-prendas';
      return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="mobile-container">
        <div class="header">
          <button class="back-btn" onclick="window.location.hash = '#gestion-prendas'">←</button>
          <h1 class="small-title">Editar ${prenda.nombre}</h1>
        </div>
        
        <div class="form-section">
          <div class="form-card">
            <h2 class="section-title">Nombre de la Prenda</h2>
            <div class="form-group">
              <input type="text" id="nombre-editable" class="form-control" value="${prenda.nombre}">
              <small id="error-nombre-edit" class="error-message"></small>
            </div>
          </div>
        </div>
        
        <div class="tasks-section">
          <div class="section-header">
            <h2 class="section-title">Tareas de Producción</h2>
            <span class="badge">${prenda.tareas.length} tareas</span>
          </div>
          
          <div class="table-container">
            <table class="tasks-table">
              <thead>
                <tr>
                  <th>Tarea</th>
                  <th>Precio Unitario</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="tareas-lista-edit">
                ${prenda.tareas.length === 0
        ? `<tr>
                    <td colspan="3" class="no-data">
                      <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <p>No hay tareas definidas</p>
                      </div>
                    </td>
                  </tr>`
        : prenda.tareas.map((tarea, index) => `
                    <tr data-index="${index}">
                      <td class="task-name">${tarea.nombre}</td>
                      <td class="task-price-cell">
                        <input type="number" class="task-price-edit form-control" 
                               value="${tarea.precioUnitario.toFixed(2)}" 
                               step="0.01" min="0" data-index="${index}">
                      </td>
                      <td class="task-actions">
                        <button class="action-btn delete small" onclick="eliminarTareaPrenda(${id}, ${index})">
                          <span class="action-icon">🗑️</span>
                        </button>
                      </td>
                    </tr>
                  `).join('')
      }
              </tbody>
            </table>
          </div>
          
          <div class="form-card">
            <h3 class="section-subtitle">Agregar Nueva Tarea</h3>
            <div class="form-group">
              <label for="nueva-tarea">Nombre de la tarea</label>
              <input type="text" id="nueva-tarea" class="form-control" placeholder="Ej: Cierre especial">
            </div>
            <div class="form-group">
              <label for="precio-nueva-tarea">Precio por unidad ($)</label>
              <input type="number" id="precio-nueva-tarea" class="form-control" 
                     step="0.01" min="0" placeholder="0.00">
            </div>
            <button id="btn-agregar-tarea" class="btn-primary">Agregar Tarea</button>
          </div>
        </div>
        
        <div class="summary-card">
          <h2 class="section-title">Resumen</h2>
          <div class="summary-row">
            <span>Total Tareas:</span>
            <span id="total-tareas">${prenda.tareas.length}</span>
          </div>
          <div class="summary-row">
            <span>Costo Total:</span>
            <span id="costo-total" class="money positive">$${prenda.tareas.reduce((sum, tarea) => sum + tarea.precioUnitario, 0).toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;

    // Eventos para edición
    document.getElementById('btn-agregar-tarea').addEventListener('click', () => agregarTarea(id));

    // Guardar automáticamente cuando se cambia el nombre
    document.getElementById('nombre-editable').addEventListener('blur', () => guardarNombrePrenda(id));

    // Guardar automáticamente cuando se cambian precios
    document.querySelectorAll('.task-price-edit').forEach(input => {
      input.addEventListener('blur', () => guardarPrecioTarea(id, input.dataset.index, input.value));
      input.addEventListener('input', recalcularTotalesEdicion);
    });
  } catch (error) {
    console.error("Error al editar prenda:", error);
    mostrarMensaje('❌ Error al cargar la edición de la prenda.');
    window.location.hash = '#gestion-prendas';
  }
}

// Agregar nueva tarea a una prenda
async function agregarTarea(prendaId) {
  const nombreInput = document.getElementById('nueva-tarea');
  const precioInput = document.getElementById('precio-nueva-tarea');
  const nombre = nombreInput.value.trim();
  const precio = parseFloat(precioInput.value);

  if (!nombre) {
    mostrarMensaje('❌ El nombre de la tarea no puede estar vacío');
    nombreInput.classList.add('error');
    return;
  }

  if (isNaN(precio) || precio < 0) {
    mostrarMensaje('❌ El precio debe ser un número válido');
    precioInput.classList.add('error');
    return;
  }

  try {
    const prenda = await db.prendas.get(prendaId);
    if (!prenda) return;

    // Verificar si ya existe una tarea con ese nombre
    const tareaExistente = prenda.tareas.find(t => t.nombre.toLowerCase() === nombre.toLowerCase());
    if (tareaExistente) {
      mostrarMensaje('❌ Ya existe una tarea con este nombre');
      nombreInput.classList.add('error');
      return;
    }

    // Agregar nueva tarea
    prenda.tareas.push({
      nombre: nombre,
      precioUnitario: precio
    });

    // Actualizar en la base de datos
    await db.prendas.update(prendaId, { tareas: prenda.tareas });

    // Limpiar campos
    nombreInput.value = '';
    precioInput.value = '';
    nombreInput.classList.remove('error');
    precioInput.classList.remove('error');

    // Recargar edición
    // window.location.hash = `#editar-prenda/${prendaId}`;
    actualizarTablaTareas(prendaId, prenda.tareas);
    mostrarMensaje('✅ Tarea agregada correctamente');
  } catch (error) {
    console.error("Error al agregar tarea:", error);
    mostrarMensaje('❌ Error al agregar tarea. Intente nuevamente.');
  }
}

// Actualizar tabla de tareas dinámicamente sin recargar
function actualizarTablaTareas(prendaId, tareas) {
  const tbody = document.getElementById('tareas-lista-edit');
  const totalTareasElement = document.getElementById('total-tareas');
  const costoTotalElement = document.getElementById('costo-total');

  if (tareas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="no-data">
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>No hay tareas definidas</p>
          </div>
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = tareas.map((tarea, index) => `
      <tr data-index="${index}">
        <td class="task-name">${tarea.nombre}</td>
        <td class="task-price-cell">
          <input type="number" class="task-price-edit form-control" 
                 value="${tarea.precioUnitario.toFixed(2)}" 
                 step="0.01" min="0" data-index="${index}">
        </td>
        <td class="task-actions">
          <button class="action-btn delete small" onclick="eliminarTareaPrenda(${prendaId}, ${index})">
            <span class="action-icon">🗑️</span>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Actualizar los totales
  if (totalTareasElement) {
    totalTareasElement.textContent = tareas.length;
  }

  if (costoTotalElement) {
    const costoTotal = tareas.reduce((sum, tarea) => sum + tarea.precioUnitario, 0);
    costoTotalElement.textContent = `$${costoTotal.toFixed(2)}`;
    costoTotalElement.className = `money ${costoTotal > 0 ? 'positive' : ''}`;
  }

  // Reasignar eventos a los inputs de precio
  document.querySelectorAll('.task-price-edit').forEach(input => {
    input.addEventListener('blur', () => guardarPrecioTarea(prendaId, input.dataset.index, input.value));
    input.addEventListener('input', recalcularTotalesEdicion);
  });
}

// Guardar nombre de prenda cuando se edita
async function guardarNombrePrenda(prendaId) {
  const nombreInput = document.getElementById('nombre-editable');
  const nuevoNombre = nombreInput.value.trim();
  const errorEl = document.getElementById('error-nombre-edit');

  errorEl.textContent = '';
  nombreInput.classList.remove('error');

  if (!nuevoNombre) {
    errorEl.textContent = 'El nombre no puede estar vacío';
    nombreInput.classList.add('error');
    return;
  }

  if (nuevoNombre.length < 3) {
    errorEl.textContent = 'El nombre debe tener al menos 3 caracteres';
    nombreInput.classList.add('error');
    return;
  }

  try {
    // Verificar si ya existe una prenda con el nuevo nombre
    const prendaExistente = await db.prendas
      .where('nombre')
      .equalsIgnoreCase(nuevoNombre)
      .first();

    if (prendaExistente && prendaExistente.id !== prendaId) {
      errorEl.textContent = 'Ya existe una prenda con este nombre';
      nombreInput.classList.add('error');
      return;
    }

    // Actualizar nombre
    await db.prendas.update(prendaId, {
      nombre: nuevoNombre
    });

    mostrarMensaje('✅ Nombre actualizado');
  } catch (error) {
    console.error("Error al guardar nombre:", error);
    mostrarMensaje('❌ Error al guardar nombre. Intente nuevamente.');
  }
}

// Guardar precio de tarea cuando se edita
async function guardarPrecioTarea(prendaId, tareaIndex, nuevoPrecio) {
  try {
    const precio = parseFloat(nuevoPrecio);
    if (isNaN(precio) || precio < 0) {
      mostrarMensaje('❌ El precio debe ser un número válido');
      return;
    }

    const prenda = await db.prendas.get(prendaId);
    if (!prenda || !prenda.tareas[tareaIndex]) return;

    prenda.tareas[tareaIndex].precioUnitario = precio;

    // Actualizar en la base de datos
    await db.prendas.update(prendaId, { tareas: prenda.tareas });

    mostrarMensaje('✅ Precio actualizado');
  } catch (error) {
    console.error("Error al guardar precio de tarea:", error);
    mostrarMensaje('❌ Error al guardar precio. Intente nuevamente.');
  }
}

// Eliminar tarea de una prenda
window.eliminarTareaPrenda = async function (prendaId, tareaIndex) {
  const prenda = await db.prendas.get(prendaId);
  if (!prenda) return;

  const tarea = prenda.tareas[tareaIndex];

  const modalHTML = `
    <div class="modal-overlay" onclick="cerrarModal(event)">
      <div class="modal-container">
        <h3 class="modal-title">⚠️ Confirmar Eliminación</h3>
        <p class="modal-message">
          ¿Está seguro de eliminar la tarea <strong>"${tarea.nombre}"</strong>?
        </p>
        <p class="warning-message">
          ⚠️ Esta acción no se puede deshacer.
        </p>
        <div class="modal-actions">
          <button class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
          <button class="btn-danger" onclick="confirmarEliminarTareaPrenda(${prendaId}, ${tareaIndex})">Eliminar</button>
        </div>
      </div>
    </div>
  `;

  mostrarModal(modalHTML);
};

// Confirmar eliminación de tarea
// Confirmar eliminación de tarea (VERSIÓN MEJORADA)
window.confirmarEliminarTareaPrenda = async function (prendaId, tareaIndex) {
  try {
    const prenda = await db.prendas.get(prendaId);
    if (!prenda) return;

    // Remover tarea por índice
    prenda.tareas.splice(tareaIndex, 1);

    // Actualizar en la base de datos
    await db.prendas.update(prendaId, { tareas: prenda.tareas });

    // ✅ EN LUGAR DE RECARGAR, ACTUALIZAMOS LA TABLA DINÁMICAMENTE
    actualizarTablaTareas(prendaId, prenda.tareas);

    // Cerrar modal
    cerrarModal();

    mostrarMensaje('✅ Tarea eliminada correctamente');
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    mostrarMensaje('❌ Error al eliminar tarea. Intente nuevamente.');
  }
};

// Recalcular totales en tiempo real durante edición
function recalcularTotalesEdicion() {
  const inputs = document.querySelectorAll('.task-price-edit');
  let total = 0;

  inputs.forEach(input => {
    const precio = parseFloat(input.value) || 0;
    total += precio;
  });

  const totalElement = document.getElementById('total-tareas');
  const costoElement = document.getElementById('costo-total');

  if (totalElement) totalElement.textContent = inputs.length;
  if (costoElement) {
    costoElement.textContent = `$${total.toFixed(2)}`;
    costoElement.className = `money ${total > 0 ? 'positive' : ''}`;
  }
}

// Mostrar modal
function mostrarModal(contenidoHTML) {
  const modalExistente = document.querySelector('.modal-overlay');
  if (modalExistente) modalExistente.remove();

  const modal = document.createElement('div');
  modal.innerHTML = contenidoHTML;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

// Cerrar modal
function cerrarModal(event) {
  const overlay = document.querySelector('.modal-overlay');
  if (!overlay) return;

  if (event && event.target.classList.contains('modal-overlay')) {
    document.body.style.overflow = 'auto';
    overlay.remove();
  } else if (!event) {
    document.body.style.overflow = 'auto';
    overlay.remove();
  }
}

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

// Exponer funciones globales
window.cargarPrendas = cargarPrendas;
window.cerrarModal = cerrarModal;