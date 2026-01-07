// gestion-prendas.js - Versión tema oscuro compacto con botones flotantes
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
      
      <!-- Botones flotantes contextuales -->
      <div id="floating-actions-prenda" class="floating-actions" style="display: none;">
        <button id="btn-floating-ver-prenda" class="floating-btn floating-btn-view" onclick="verPrendaSeleccionada()">
          👁️
        </button>
        <button id="btn-floating-editar-prenda" class="floating-btn floating-btn-edit" onclick="editarPrendaSeleccionada()">
          ✏️
        </button>
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
      <div class="prenda-card selectable-row" data-id="${prenda.id}">
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
      </div>
    `).join('');

    // Inicializar eventos de selección
    inicializarEventosSeleccionPrendas();
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

// Inicializar eventos de selección de prendas
function inicializarEventosSeleccionPrendas() {
  let prendaSeleccionada = null;
  let prendaIdSeleccionada = null;

  document.querySelectorAll('.prenda-card.selectable-row').forEach(card => {
    card.addEventListener('click', (e) => {
      // Evitar que se active si se hace clic en un enlace o botón dentro
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
        return;
      }

      // Quitar selección de todas las filas
      document.querySelectorAll('.selectable-row').forEach(r => {
        r.classList.remove('selected');
      });

      // Agregar selección a la tarjeta clickeada
      card.classList.add('selected');

      // Guardar datos de la prenda seleccionada
      prendaIdSeleccionada = parseInt(card.dataset.id);
      prendaSeleccionada = true;

      // Mostrar botones flotantes
      const floatingActions = document.getElementById('floating-actions-prenda');
      floatingActions.style.display = 'flex';

      e.stopPropagation();
    });
  });

  // Cerrar botones flotantes al hacer clic fuera
  document.addEventListener('click', (e) => {
    const floatingActions = document.getElementById('floating-actions-prenda');
    const isClickInsideList = e.target.closest('.prendas-list');
    const isClickInsideFloating = e.target.closest('#floating-actions-prenda');

    if (!isClickInsideList && !isClickInsideFloating && floatingActions) {
      floatingActions.style.display = 'none';
      document.querySelectorAll('.selectable-row').forEach(r => {
        r.classList.remove('selected');
      });
      prendaSeleccionada = null;
      prendaIdSeleccionada = null;
    }
  });

  // Exponer funciones para los botones flotantes
  window.verPrendaSeleccionada = function () {
    if (prendaIdSeleccionada !== null) {
      window.location.hash = `#ver-prenda/${prendaIdSeleccionada}`;
    }
  };

  window.editarPrendaSeleccionada = function () {
    if (prendaIdSeleccionada !== null) {
      window.location.hash = `#editar-prenda/${prendaIdSeleccionada}`;
    }
  };
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

// ==================== PANTALLA VER PRENDA ====================

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
                  <th>Uni</th>
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

// ==================== PANTALLA EDITAR PRENDA ====================
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
                  <th>Uni</th>
                </tr>
              </thead>
              <tbody id="tareas-lista-edit">
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
                    <tr class="selectable-row" data-index="${index}">
                      <td class="task-name">${tarea.nombre}</td>
                      <td class="task-price-cell">
                        <input type="number" class="task-price-edit form-control" 
                               value="${tarea.precioUnitario.toFixed(2)}" 
                               step="0.01" min="0" data-index="${index}">
                      </td>
                    </tr>
                  `).join('')
      }
              </tbody>
            </table>
          </div>
          
          <!-- Botones flotantes para tareas -->
          <div id="floating-actions-tarea" class="floating-actions" style="display: none;">
            <button id="btn-floating-eliminar-tarea" class="floating-btn floating-btn-delete" onclick="eliminarTareaSeleccionada()">
              🗑️
            </button>
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
        
        <!-- NUEVO BOTÓN PARA CREAR COPIA DE PRENDA -->
        <div class="actions-section">
          <button id="btn-crear-copia-prenda" class="btn-secondary" style="margin-top: 1rem;">
            📋 Crear nueva prenda a partir de esta prenda
          </button>
        </div>
      </div>
    `;

    // Eventos para edición
    document.getElementById('btn-agregar-tarea').addEventListener('click', () => agregarTarea(id));

    // NUEVO: Evento para el botón de crear copia
    document.getElementById('btn-crear-copia-prenda').addEventListener('click', () => {
      mostrarModalCrearCopiaPrenda(id, prenda);
    });

    // Guardar automáticamente cuando se cambia el nombre
    document.getElementById('nombre-editable').addEventListener('blur', () => guardarNombrePrenda(id));

    // Guardar automáticamente cuando se cambian precios
    document.querySelectorAll('.task-price-edit').forEach(input => {
      input.addEventListener('blur', () => guardarPrecioTarea(id, input.dataset.index, input.value));
      input.addEventListener('input', recalcularTotalesEdicion);
    });

    // Inicializar eventos de selección para tareas
    inicializarEventosSeleccionTareas(id, prenda);

  } catch (error) {
    console.error("Error al editar prenda:", error);
    mostrarMensaje('❌ Error al cargar la edición de la prenda.');
    window.location.hash = '#gestion-prendas';
  }
}

// ==================== MODAL CREAR COPIA DE PRENDA ====================
// Mostrar modal para crear copia de prenda
function mostrarModalCrearCopiaPrenda(prendaIdOriginal, prendaOriginal) {
  const modalHTML = `
    <div class="modal-overlay" onclick="cerrarModalCrearCopia(event)">
      <div class="modal-container">
        <h3 class="modal-title">📋 Crear nueva prenda</h3>
        <p class="modal-message">
          Se creará una nueva prenda copiando todas las tareas y precios de <strong>"${prendaOriginal.nombre}"</strong>.
        </p>
        
        <div class="form-group">
          <label for="nombre-nueva-prenda">Nombre de la nueva prenda</label>
          <input type="text" id="nombre-nueva-prenda" class="form-control" 
                 placeholder="Ej: ${prendaOriginal.nombre} (Copia)" 
                 value="${prendaOriginal.nombre} (Copia)">
          <small id="error-nombre-copia" class="error-message"></small>
        </div>
        
        <div class="modal-info">
          <p><strong>📊 Información de la copia:</strong></p>
          <ul class="modal-info-list">
            <li>• Se copiarán ${prendaOriginal.tareas.length} tareas</li>
            <li>• Se mantendrán todos los precios unitarios</li>
            <li>• La prenda original se conservará sin cambios</li>
          </ul>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" onclick="cerrarModalCrearCopia()">Cancelar</button>
          <button class="btn-primary" onclick="confirmarCrearCopiaPrenda(${prendaIdOriginal})">Guardar</button>
        </div>
      </div>
    </div>
  `;

  mostrarModal(modalHTML);

  // Enfocar el input del nombre
  setTimeout(() => {
    const input = document.getElementById('nombre-nueva-prenda');
    if (input) {
      input.focus();
      input.select();
    }
  }, 100);
}
// Cerrar modal de crear copia
function cerrarModalCrearCopia(event) {
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

// Confirmar creación de copia de prenda
window.confirmarCrearCopiaPrenda = async function (prendaIdOriginal) {
  try {
    const input = document.getElementById('nombre-nueva-prenda');
    const errorEl = document.getElementById('error-nombre-copia');
    const nombreNuevaPrenda = input.value.trim();

    errorEl.textContent = '';
    input.classList.remove('error');

    // Validaciones
    if (!nombreNuevaPrenda) {
      errorEl.textContent = 'El nombre no puede estar vacío';
      input.classList.add('error');
      return;
    }

    if (nombreNuevaPrenda.length < 3) {
      errorEl.textContent = 'El nombre debe tener al menos 3 caracteres';
      input.classList.add('error');
      return;
    }

    // Obtener prenda original
    const prendaOriginal = await db.prendas.get(prendaIdOriginal);
    if (!prendaOriginal) {
      mostrarMensaje('❌ No se encontró la prenda original');
      cerrarModalCrearCopia();
      return;
    }

    // Verificar si ya existe una prenda con el nuevo nombre
    const prendaExistente = await db.prendas
      .where('nombre')
      .equalsIgnoreCase(nombreNuevaPrenda)
      .first();

    if (prendaExistente) {
      errorEl.textContent = 'Ya existe una prenda con este nombre';
      input.classList.add('error');
      return;
    }

    // Crear copia profunda de las tareas
    const tareasCopia = JSON.parse(JSON.stringify(prendaOriginal.tareas));

    // Crear nueva prenda con las tareas copiadas
    const nuevaPrenda = {
      nombre: nombreNuevaPrenda,
      tareas: tareasCopia
    };

    // Guardar en la base de datos
    await db.prendas.add(nuevaPrenda);

    // Cerrar modal
    cerrarModalCrearCopia();

    // Mostrar mensaje de éxito
    mostrarMensaje(`✅ Prenda "${nombreNuevaPrenda}" creada correctamente`);

    // Redirigir a gestión de prendas después de un breve delay
    setTimeout(() => {
      window.location.hash = '#gestion-prendas';
    }, 500);

  } catch (error) {
    console.error("Error al crear copia de prenda:", error);
    const errorEl = document.getElementById('error-nombre-copia');
    if (errorEl) {
      errorEl.textContent = 'Error al crear la prenda. Intente nuevamente.';
    }
    mostrarMensaje('❌ Error al crear la prenda copia');
  }
};

// ==================== FUNCIONES GENERALES (Actualizar) ====================

// Inicializar eventos de selección de tareas en la edición de prenda
function inicializarEventosSeleccionTareas(prendaId, prenda) {
  let tareaSeleccionada = null;
  let tareaIndexSeleccionada = null;

  document.querySelectorAll('#tareas-lista-edit .selectable-row').forEach(row => {
    row.addEventListener('click', (e) => {
      // Evitar que se active si se hace clic en un input dentro de la fila
      if (e.target.tagName === 'INPUT') {
        return;
      }

      // Quitar selección de todas las filas
      document.querySelectorAll('.selectable-row').forEach(r => {
        r.classList.remove('selected');
      });

      // Agregar selección a la fila clickeada
      row.classList.add('selected');

      // Guardar datos de la tarea seleccionada
      tareaIndexSeleccionada = parseInt(row.dataset.index);
      tareaSeleccionada = prenda.tareas[tareaIndexSeleccionada];

      // Mostrar botones flotantes
      const floatingActions = document.getElementById('floating-actions-tarea');
      floatingActions.style.display = 'flex';

      e.stopPropagation();
    });
  });

  // Cerrar botones flotantes al hacer clic fuera
  document.addEventListener('click', (e) => {
    const floatingActions = document.getElementById('floating-actions-tarea');
    const isClickInsideTable = e.target.closest('.table-container');
    const isClickInsideFloating = e.target.closest('#floating-actions-tarea');

    if (!isClickInsideTable && !isClickInsideFloating && floatingActions) {
      floatingActions.style.display = 'none';
      document.querySelectorAll('.selectable-row').forEach(r => {
        r.classList.remove('selected');
      });
      tareaSeleccionada = null;
      tareaIndexSeleccionada = null;
    }
  });

  // Exponer función para eliminar tarea seleccionada
  window.eliminarTareaSeleccionada = function () {
    if (tareaSeleccionada !== null && tareaIndexSeleccionada !== null) {
      mostrarModalEliminarTareaPrenda(prendaId, prenda, tareaIndexSeleccionada);
      // Ocultar botones flotantes después de abrir modal
      document.getElementById('floating-actions-tarea').style.display = 'none';
      document.querySelectorAll('.selectable-row').forEach(r => {
        r.classList.remove('selected');
      });
    }
  };
}

// ==================== FUNCIONES AUXILIARES EDICIÓN ====================

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
    await renderEditarPrenda(prendaId);
    mostrarMensaje('✅ Tarea agregada correctamente');
  } catch (error) {
    console.error("Error al agregar tarea:", error);
    mostrarMensaje('❌ Error al agregar tarea. Intente nuevamente.');
  }
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

    // Actualizar título en la pantalla
    document.querySelector('.small-title').textContent = `Editar ${nuevoNombre}`;
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

    // Actualizar totales
    recalcularTotalesEdicion();
    mostrarMensaje('✅ Precio actualizado');
  } catch (error) {
    console.error("Error al guardar precio de tarea:", error);
    mostrarMensaje('❌ Error al guardar precio. Intente nuevamente.');
  }
}

// ==================== MODALES ====================

// Modal: Eliminar Tarea de Prenda
function mostrarModalEliminarTareaPrenda(prendaId, prenda, tareaIndex) {
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
}

// Confirmar eliminación de tarea
window.confirmarEliminarTareaPrenda = async function (prendaId, tareaIndex) {
  try {
    const prenda = await db.prendas.get(prendaId);
    if (!prenda) return;

    // Remover tarea por índice
    prenda.tareas.splice(tareaIndex, 1);

    // Actualizar en la base de datos
    await db.prendas.update(prendaId, { tareas: prenda.tareas });

    // Recargar pantalla de edición
    await renderEditarPrenda(prendaId);
    cerrarModal();
    mostrarMensaje('✅ Tarea eliminada correctamente');

  } catch (error) {
    cerrarModal();
    console.error("Error al eliminar tarea:", error);
    mostrarMensaje('❌ Error al eliminar tarea. Intente nuevamente.');
  }
};

// ==================== FUNCIONES GENERALES ====================

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

// Mostrar modal (actualizada para soportar ambos tipos de modal)
function mostrarModal(contenidoHTML) {
  const modalExistente = document.querySelector('.modal-overlay');
  if (modalExistente) modalExistente.remove();

  const modal = document.createElement('div');
  modal.innerHTML = contenidoHTML;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
}

// cerrar modal genérico
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
window.cerrarModalCrearCopia = cerrarModalCrearCopia;