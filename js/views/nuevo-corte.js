// nuevo-corte.js - Versión con nombre personalizado del corte y gestión de tallas
import { db } from '../db.js';

// Array local para almacenar las tallas
let tallas = [];

export function renderNuevoCorte() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="mobile-container nuevo-corte-view">
      <div class="header">
        <button onclick="location.hash='#dashboard'" class="back-btn">←</button>
        <h1 class="small-title">Nuevo Corte</h1>
      </div>
      
      <div class="form-section">
        <div class="form-card">
          <div class="form-group">
            <label for="nombre-corte">Nombre del Corte</label>
            <input type="text" id="nombre-corte" class="form-control" 
                   placeholder="Ej: pantalon negro 300" 
                   value="Nuevo corte">
            <small id="error-nombre-corte" class="error-message"></small>
          </div>
          
          <div class="form-group">
            <label for="prenda">Tipo de Prenda</label>
            <select id="prenda" class="form-control">
              <option value="">Seleccionar...</option>
            </select>
            <small id="error-prenda" class="error-message"></small>
          </div>
          
          <div class="form-row">
            <div class="form-group-half">
              <label for="cantidad">Cantidad Total</label>
              <input type="number" id="cantidad" class="form-control" min="0" value="0" readonly>
              <small class="info-message">Se calcula desde las tallas</small>
            </div>
            <div class="form-group-half">
              <label for="precio-venta">$ Venta/unidad</label>
              <input type="number" id="precio-venta" class="form-control" min="0" step="0.01" value="10.00">
              <small id="error-precio" class="error-message"></small>
            </div>
          </div>
        </div>
        
        <!-- Sección de Tallas -->
        <div class="form-card tallas-card">
          <h3 class="card-subtitle">📏 Tallas del Corte</h3>
          <div class="tallas-input-row">
            <div class="form-group-half">
              <label for="talla-input">Talla</label>
              <input type="text" id="talla-input" class="form-control" placeholder="Ej: M, L, XL, 36">
            </div>
            <div class="form-group-half">
              <label for="talla-cantidad">Cantidad</label>
              <input type="number" id="talla-cantidad" class="form-control" min="1" placeholder="0">
            </div>
          </div>
          <button id="btn-agregar-talla" class="btn-add-talla">+ Agregar Talla</button>
          
          <!-- Lista de tallas registradas -->
          <div id="tallas-lista" class="tallas-lista"></div>
          
          <!-- Total de tallas -->
          <div class="tallas-total">
            <span>Total unidades:</span>
            <span id="total-tallas" class="total-valor">0</span>
          </div>
        </div>
      </div>
      
      <div class="tasks-section">
        <div class="section-header">
          <h2 class="section-title">Tareas de Producción</h2>
        </div>
        <div class="table-container">
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>$ Uni</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody id="tareas-lista">
              <tr>
                <td colspan="3" class="no-data">
                  <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>Selecciona una prenda primero</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Botones flotantes para tareas -->
        <div id="floating-actions-tareas-nuevo-corte" class="floating-action-btns" style="display: none;">
          <button class="btn-edit-floating" onclick="mostrarModalEditarTareaNuevoCorte()">
            ✏️ Editar
          </button>
          <button class="btn-danger-floating" onclick="mostrarModalEliminarTareaNuevoCorte()">
            🗑️ Eliminar
          </button>
          <button class="btn-add-floating" onclick="mostrarModalAgregarTareaNuevoCorte()">
            ➕ Agregar
          </button>
        </div>
      </div>
      
      <div class="summary-card">
        <h2 class="section-title">Resumen de Costos</h2>
        <div class="summary-row">
          <span>Costo por Prenda:</span>
          <span id="costo-por-prenda" class="money">$0.00</span>
        </div>
        <div class="summary-row">
          <span>Total Venta:</span>
          <span id="total-venta" class="money">$0.00</span>
        </div>
        <div class="summary-row">
          <span>Mano de Obra:</span>
          <span id="total-mano-obra" class="money">$0.00</span>
        </div>
        <div class="summary-row ganancia">
          <span>Ganancia Estimada:</span>
          <span id="ganancia-estimada" class="money positive">$0.00</span>
        </div>
      </div>
      
      <div class="actions-section">
        <button id="btn-guardar" class="btn-primary">Guardar Corte</button>
        <button onclick="location.hash='#dashboard'" class="btn-secondary">Cancelar</button>
      </div>
    </div>
  `;

  // Reiniciar array de tallas
  tallas = [];

  // Cargar prendas en el selector
  cargarPrendas();

  // Eventos para recalcular TODO cuando cambian los inputs clave
  document.getElementById('nombre-corte').addEventListener('input', validarNombreCorte);
  document.getElementById('prenda').addEventListener('change', cargarTareas);
  document.getElementById('precio-venta').addEventListener('input', recalcularTotales);

  // Validación en tiempo real
  document.getElementById('precio-venta').addEventListener('blur', validarPrecio);
  document.getElementById('nombre-corte').addEventListener('blur', validarNombreCorte);

  // Eventos para tallas
  document.getElementById('btn-agregar-talla').addEventListener('click', agregarTalla);
  document.getElementById('talla-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarTalla();
  });
  document.getElementById('talla-cantidad').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') agregarTalla();
  });

  document.getElementById('btn-guardar').addEventListener('click', guardarCorte);
}

// Agregar una talla al registro
function agregarTalla() {
  const tallaInput = document.getElementById('talla-input');
  const cantidadInput = document.getElementById('talla-cantidad');
  
  const talla = tallaInput.value.trim().toUpperCase();
  const cantidad = parseInt(cantidadInput.value);

  // Validaciones
  if (!talla) {
    mostrarMensaje('❌ Ingresa una talla');
    tallaInput.focus();
    return;
  }

  if (!cantidad || cantidad < 1) {
    mostrarMensaje('❌ Ingresa una cantidad válida');
    cantidadInput.focus();
    return;
  }

  // Verificar si la talla ya existe
  const existeIndex = tallas.findIndex(t => t.talla === talla);
  if (existeIndex !== -1) {
    // Sumar a la existente
    tallas[existeIndex].cantidad += cantidad;
    mostrarMensaje(`✅ Actualizado: ${talla} ahora tiene ${tallas[existeIndex].cantidad} unidades`);
  } else {
    // Agregar nueva
    tallas.push({ talla, cantidad });
    mostrarMensaje(`✅ Talla ${talla} agregada`);
  }

  // Limpiar inputs
  tallaInput.value = '';
  cantidadInput.value = '';
  tallaInput.focus();

  // Actualizar vista
  renderizarTallas();
  actualizarCantidadTotal();
}

// Eliminar una talla del registro
function eliminarTalla(index) {
  const tallaEliminada = tallas[index].talla;
  tallas.splice(index, 1);
  mostrarMensaje(`🗑️ Talla ${tallaEliminada} eliminada`);
  renderizarTallas();
  actualizarCantidadTotal();
}

// Renderizar la lista de tallas
function renderizarTallas() {
  const container = document.getElementById('tallas-lista');
  
  if (tallas.length === 0) {
    container.innerHTML = `
      <div class="tallas-empty">
        <p>No hay tallas registradas</p>
      </div>
    `;
    return;
  }

  container.innerHTML = tallas.map((t, index) => `
    <div class="talla-item">
      <span class="talla-nombre">${t.talla}</span>
      <span class="talla-cantidad">${t.cantidad} unid.</span>
      <button class="btn-eliminar-talla" onclick="window.eliminarTallaNueva(${index})" title="Eliminar">×</button>
    </div>
  `).join('');
}

// Actualizar el campo de cantidad total
function actualizarCantidadTotal() {
  const total = tallas.reduce((sum, t) => sum + t.cantidad, 0);
  document.getElementById('cantidad').value = total;
  document.getElementById('total-tallas').textContent = total;
  recalcularTotales();
}

// Exponer función globalmente para los botones de eliminar
window.eliminarTallaNueva = eliminarTalla;

// Cargar prendas en el selector
async function cargarPrendas() {
  const prendas = await db.prendas.toArray();
  const select = document.getElementById('prenda');

  // Limpiar opciones excepto la primera
  select.innerHTML = '<option value="">Seleccionar...</option>';

  if (prendas.length === 0) {
    select.innerHTML += '<option value="" disabled>No hay prendas registradas</option>';
    return;
  }

  prendas.forEach(prenda => {
    const option = document.createElement('option');
    option.value = prenda.id;
    option.textContent = prenda.nombre;
    select.appendChild(option);
  });
}

// Cargar tareas según la prenda seleccionada
async function cargarTareas() {
  const prendaId = document.getElementById('prenda').value;
  const errorPrenda = document.getElementById('error-prenda');

  if (!prendaId) {
    errorPrenda.textContent = 'Selecciona una prenda';
    document.getElementById('tareas-lista').innerHTML = `
      <tr>
        <td colspan="3" class="no-data">
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <p>Selecciona una prenda primero</p>
          </div>
        </td>
      </tr>
    `;
    recalcularTotales();
    return;
  }

  errorPrenda.textContent = '';

  const prenda = await db.prendas.get(parseInt(prendaId));
  const tbody = document.getElementById('tareas-lista');
  tbody.innerHTML = '';

  // Si no hay tareas, mostrar mensaje
  if (!prenda.tareas || prenda.tareas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="no-data">
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <p>Esta prenda no tiene tareas definidas</p>
          </div>
        </td>
      </tr>
    `;
    recalcularTotales();
    return;
  }

  // Generar filas de tareas con clase clickable
  prenda.tareas.forEach((tarea, index) => {
    const row = document.createElement('tr');
    row.className = 'tarea-row-clickable';
    row.dataset.index = index;
    row.dataset.nombre = tarea.nombre;
    row.dataset.precio = tarea.precioUnitario;
    row.innerHTML = `
      <td class="task-name">${tarea.nombre}</td>
      <td class="task-price-cell">
        <input type="number" class="task-price form-control" 
               value="${tarea.precioUnitario.toFixed(2)}" 
               step="0.01" min="0" 
               data-index="${index}"
               data-original="${tarea.precioUnitario}">
      </td>
      <td class="task-total money">$0.00</td>
    `;
    tbody.appendChild(row);
  });

  // Recalcular inmediatamente después de cargar tareas
  recalcularTotales();

  // Añadir eventos a los inputs de precios
  document.querySelectorAll('.task-price').forEach(input => {
    input.addEventListener('input', recalcularTotales);
    input.addEventListener('blur', validarPrecioTarea);
  });

  // Inicializar eventos de selección de tareas
  inicializarEventosSeleccionTareasNuevoCorte(prenda);
}

// Validar nombre del corte
function validarNombreCorte() {
  const input = document.getElementById('nombre-corte');
  const error = document.getElementById('error-nombre-corte');
  const nombre = input.value.trim();

  if (!nombre) {
    error.textContent = 'El nombre del corte no puede estar vacío';
    input.classList.add('error');
    return false;
  }

  if (nombre.length < 3) {
    error.textContent = 'El nombre debe tener al menos 3 caracteres';
    input.classList.add('error');
    return false;
  }

  if (nombre.length > 50) {
    error.textContent = 'El nombre es demasiado largo (máximo 50 caracteres)';
    input.classList.add('error');
    return false;
  }

  // Validar caracteres especiales (opcional)
  if (!/^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/.test(nombre)) {
    error.textContent = 'Usa solo letras, números, espacios y guiones';
    input.classList.add('error');
    return false;
  }

  error.textContent = '';
  input.classList.remove('error');
  return true;
}

// Validar precio de venta
function validarPrecio() {
  const input = document.getElementById('precio-venta');
  const error = document.getElementById('error-precio');
  const precio = parseFloat(input.value);

  if (!precio || precio <= 0) {
    error.textContent = 'El precio debe ser mayor a 0';
    input.classList.add('error');
    return false;
  }

  error.textContent = '';
  input.classList.remove('error');
  return true;
}

// Validar precio de tarea
function validarPrecioTarea(e) {
  const input = e.target;
  const precio = parseFloat(input.value);

  if (!precio || precio < 0) {
    input.value = input.dataset.original || '0.00';
  }

  recalcularTotales();
}

// Recalcular totales en tiempo real
function recalcularTotales() {
  const cantidad = parseInt(document.getElementById('cantidad').value) || 0;
  const precioVenta = parseFloat(document.getElementById('precio-venta').value) || 0;
  const inputs = document.querySelectorAll('.task-price');
  let totalManoObra = 0;
  let costoPorPrenda = 0;

  // Recalcular cada tarea
  inputs.forEach(input => {
    const precio = parseFloat(input.value) || 0;
    const totalTarea = precio * cantidad;
    totalManoObra += totalTarea;
    costoPorPrenda += precio; // Sumar precio unitario para costo por prenda

    // Actualizar visualmente
    const totalCell = input.closest('tr').querySelector('.task-total');
    totalCell.textContent = `$${totalTarea.toFixed(2)}`;
    totalCell.className = `task-total money ${totalTarea > 0 ? 'positive' : 'negative'}`;
  });

  // Calcular totales generales
  const totalVenta = cantidad * precioVenta;
  const ganancia = totalVenta - totalManoObra;

  // Actualizar resumen
  const costoPorPrendaEl = document.getElementById('costo-por-prenda');
  const totalVentaEl = document.getElementById('total-venta');
  const totalManoObraEl = document.getElementById('total-mano-obra');
  const gananciaEl = document.getElementById('ganancia-estimada');

  costoPorPrendaEl.textContent = `$${costoPorPrenda.toFixed(2)}`;
  totalVentaEl.textContent = `$${totalVenta.toFixed(2)}`;
  totalManoObraEl.textContent = `$${totalManoObra.toFixed(2)}`;
  gananciaEl.textContent = `$${ganancia.toFixed(2)}`;

  // Estilo dinámico para ganancia
  costoPorPrendaEl.className = `money ${costoPorPrenda > 0 ? 'positive' : ''}`;
  totalVentaEl.className = `money ${totalVenta > 0 ? 'positive' : ''}`;
  totalManoObraEl.className = `money ${totalManoObra > 0 ? '' : ''}`;
  gananciaEl.className = `money ${ganancia >= 0 ? 'positive' : 'negative'}`;
}

// Guardar el corte en la base de datos
async function guardarCorte() {
  // Validaciones
  if (!validarNombreCorte() || !validarPrecio()) {
    mostrarMensaje('❌ Corrige los errores en el formulario');
    return;
  }

  const prendaId = document.getElementById('prenda').value;
  if (!prendaId) {
    document.getElementById('error-prenda').textContent = 'Selecciona una prenda';
    mostrarMensaje('❌ Debes seleccionar un tipo de prenda');
    return;
  }

  // Validar que haya tallas registradas
  if (tallas.length === 0) {
    mostrarMensaje('❌ Debes agregar al menos una talla');
    return;
  }

  const nombreCorte = document.getElementById('nombre-corte').value.trim();
  const cantidad = parseInt(document.getElementById('cantidad').value);
  const precioVenta = parseFloat(document.getElementById('precio-venta').value);

  // Verificar que hay tareas
  const inputs = document.querySelectorAll('.task-price');
  if (inputs.length === 0) {
    mostrarMensaje('❌ Esta prenda no tiene tareas definidas');
    return;
  }

  // Validar precios de tareas
  let tareasInvalidas = false;
  inputs.forEach(input => {
    const precio = parseFloat(input.value);
    if (precio < 0) {
      input.classList.add('error');
      tareasInvalidas = true;
    }
  });

  if (tareasInvalidas) {
    mostrarMensaje('❌ Algunas tareas tienen precios inválidos');
    return;
  }

  try {
    const prenda = await db.prendas.get(parseInt(prendaId));
    const tareas = [];

    // Recoger datos de las tareas desde tareasTemporales (que incluye las agregadas/editadas)
    inputs.forEach(input => {
      const index = parseInt(input.dataset.index);
      const precio = parseFloat(input.value) || 0;

      tareas.push({
        id: `task-${Date.now()}-${index}`,
        nombre: tareasTemporales[index].nombre,
        precioUnitario: precio,
        unidadesTotales: cantidad,
        asignaciones: []
      });
    });

    // Crear el corte
    const nuevoCorte = {
      nombreCorte: nombreCorte,
      prendaId: parseInt(prendaId),
      nombrePrendaOriginal: prenda.nombre,
      cantidadPrendas: cantidad,
      precioVentaUnitario: precioVenta,
      tallas: [...tallas], // Guardar array de tallas
      estado: 'activo',
      fechaCreacion: new Date(),
      tareas: tareas
    };

    // Guardar en IndexedDB
    await db.cortes.add(nuevoCorte);

    // Feedback visual exitoso
    const btn = document.getElementById('btn-guardar');
    btn.textContent = "✓ Guardado";
    btn.classList.add('success');
    btn.disabled = true;

    mostrarMensaje('✅ Corte creado exitosamente');

    setTimeout(() => {
      location.hash = '#dashboard';
    }, 1500);

  } catch (error) {
    console.error("Error al guardar corte:", error);
    mostrarMensaje(`❌ Error: ${error.message || 'No se pudo guardar el corte'}`);
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

// ==================== SELECCIÓN DE TAREAS Y BOTONES FLOTANTES ====================

// Variable para almacenar las tareas temporales del corte
let tareasTemporales = [];

// Inicializar eventos de selección de tareas
function inicializarEventosSeleccionTareasNuevoCorte(prenda) {
  const floatingBtns = document.getElementById('floating-actions-tareas-nuevo-corte');
  
  // Copiar tareas de la prenda a tareas temporales
  tareasTemporales = [...prenda.tareas];
  
  // Variable para la tarea seleccionada
  window._tareaSeleccionadaNuevoCorte = null;

  // Evento: Clic en fila de tarea
  document.querySelectorAll('.tarea-row-clickable').forEach(row => {
    row.addEventListener('click', function(e) {
      // Evitar que se active si se hace clic en un input
      if (e.target.tagName === 'INPUT') return;
      
      // Quitar selección anterior
      document.querySelectorAll('.tarea-row-clickable').forEach(r => r.classList.remove('selected'));
      // Seleccionar esta fila
      this.classList.add('selected');
      
      // Guardar datos de la tarea seleccionada
      const index = parseInt(this.dataset.index);
      window._tareaSeleccionadaNuevoCorte = {
        index: index,
        nombre: this.dataset.nombre,
        precio: parseFloat(this.dataset.precio)
      };
      
      // Mostrar botones flotantes
      floatingBtns.style.display = 'flex';
    });
  });

  // Cerrar botones flotantes al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.tarea-row-clickable') && !e.target.closest('#floating-actions-tareas-nuevo-corte')) {
      floatingBtns.style.display = 'none';
      document.querySelectorAll('.tarea-row-clickable').forEach(r => r.classList.remove('selected'));
      window._tareaSeleccionadaNuevoCorte = null;
    }
  });
}

// Función global para mostrar modal de edición
window.mostrarModalEditarTareaNuevoCorte = function() {
  if (!window._tareaSeleccionadaNuevoCorte) return;
  
  const tarea = window._tareaSeleccionadaNuevoCorte;
  
  mostrarModalEditarNuevoCorte(
    tarea.nombre,
    tarea.precio,
    (nuevoNombre, nuevoPrecio) => {
      // Actualizar en el array temporal
      tareasTemporales[tarea.index].nombre = nuevoNombre;
      tareasTemporales[tarea.index].precioUnitario = nuevoPrecio;
      
      // Actualizar visualmente
      actualizarVistaTareas();
      
      // Ocultar botones flotantes
      document.getElementById('floating-actions-tareas-nuevo-corte').style.display = 'none';
      window._tareaSeleccionadaNuevoCorte = null;
    }
  );
};

// Función global para mostrar modal de eliminación
window.mostrarModalEliminarTareaNuevoCorte = function() {
  if (!window._tareaSeleccionadaNuevoCorte) return;
  
  const tarea = window._tareaSeleccionadaNuevoCorte;
  
  mostrarModalConfirmacionNuevoCorte(
    '⚠️ Confirmar Eliminación',
    `¿Eliminar la tarea <strong>"${tarea.nombre}"</strong>?`,
    () => {
      // Eliminar del array temporal
      tareasTemporales.splice(tarea.index, 1);
      
      // Actualizar visualmente
      actualizarVistaTareas();
      
      // Ocultar botones flotantes
      document.getElementById('floating-actions-tareas-nuevo-corte').style.display = 'none';
      window._tareaSeleccionadaNuevoCorte = null;
    }
  );
};

// Función global para mostrar modal de agregar tarea
window.mostrarModalAgregarTareaNuevoCorte = function() {
  if (!window._tareaSeleccionadaNuevoCorte) return;
  
  const tareaSeleccionada = window._tareaSeleccionadaNuevoCorte;
  
  mostrarModalAgregarNuevoCorte(
    tareaSeleccionada.index + 1,
    (nombre, precio) => {
      // Insertar en la posición específica
      tareasTemporales.splice(tareaSeleccionada.index + 1, 0, {
        nombre: nombre,
        precioUnitario: precio
      });
      
      // Actualizar visualmente
      actualizarVistaTareas();
      
      // Ocultar botones flotantes
      document.getElementById('floating-actions-tareas-nuevo-corte').style.display = 'none';
      window._tareaSeleccionadaNuevoCorte = null;
    }
  );
};

// Actualizar la vista de tareas basado en tareasTemporales
function actualizarVistaTareas() {
  const tbody = document.getElementById('tareas-lista');
  tbody.innerHTML = '';
  
  if (tareasTemporales.length === 0) {
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
    recalcularTotales();
    return;
  }
  
  tareasTemporales.forEach((tarea, index) => {
    const row = document.createElement('tr');
    row.className = 'tarea-row-clickable';
    row.dataset.index = index;
    row.dataset.nombre = tarea.nombre;
    row.dataset.precio = tarea.precioUnitario;
    row.innerHTML = `
      <td class="task-name">${tarea.nombre}</td>
      <td class="task-price-cell">
        <input type="number" class="task-price form-control" 
               value="${tarea.precioUnitario.toFixed(2)}" 
               step="0.01" min="0" 
               data-index="${index}"
               data-original="${tarea.precioUnitario}">
      </td>
      <td class="task-total money">$0.00</td>
    `;
    tbody.appendChild(row);
  });
  
  // Re-inicializar eventos
  const prendaDummy = { tareas: tareasTemporales };
  inicializarEventosSeleccionTareasNuevoCorte(prendaDummy);
  
  // Añadir eventos a los inputs de precios
  document.querySelectorAll('.task-price').forEach(input => {
    input.addEventListener('input', recalcularTotales);
    input.addEventListener('blur', validarPrecioTarea);
  });
  
  recalcularTotales();
}

// ==================== MODALES ====================

// Modal de edición
function mostrarModalEditarNuevoCorte(nombreActual, precioActual, onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>✏️ Editar Tarea</h3>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="edit-nombre-nuevo">Nombre</label>
          <input type="text" id="edit-nombre-nuevo" class="form-control" value="${nombreActual}">
        </div>
        <div class="form-group">
          <label for="edit-precio-nuevo">Precio Unitario</label>
          <input type="number" id="edit-precio-nuevo" class="form-control" value="${precioActual.toFixed(2)}" step="0.01" min="0">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel-nuevo">Cancelar</button>
        <button class="btn-primary" id="modal-save-nuevo">Guardar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    document.getElementById('edit-nombre-nuevo').focus();
  }, 100);

  document.getElementById('modal-cancel-nuevo').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = 'auto';
  });

  document.getElementById('modal-save-nuevo').addEventListener('click', () => {
    const nuevoNombre = document.getElementById('edit-nombre-nuevo').value.trim();
    const nuevoPrecio = parseFloat(document.getElementById('edit-precio-nuevo').value);

    if (!nuevoNombre || isNaN(nuevoPrecio) || nuevoPrecio < 0) {
      mostrarMensaje('❌ Datos inválidos');
      return;
    }

    overlay.remove();
    document.body.style.overflow = 'auto';
    if (onSave) onSave(nuevoNombre, nuevoPrecio);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = 'auto';
    }
  });
}

// Modal de confirmación
function mostrarModalConfirmacionNuevoCorte(titulo, mensaje, onConfirm) {
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
        <button class="btn-secondary" id="modal-cancel-conf">Cancelar</button>
        <button class="btn-danger" id="modal-confirm-conf">Eliminar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  document.getElementById('modal-cancel-conf').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = 'auto';
  });

  document.getElementById('modal-confirm-conf').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = 'auto';
    if (onConfirm) onConfirm();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = 'auto';
    }
  });
}

// Modal de agregar tarea
function mostrarModalAgregarNuevoCorte(posicion, onSave) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>➕ Agregar Nueva Tarea</h3>
      </div>
      <div class="modal-body">
        <p class="modal-info-text">Se agregará la nueva tarea en la posición ${posicion + 1}</p>
        <div class="form-group">
          <label for="add-nombre-nuevo">Nombre de la tarea</label>
          <input type="text" id="add-nombre-nuevo" class="form-control" placeholder="Ej: Costura especial">
        </div>
        <div class="form-group">
          <label for="add-precio-nuevo">Precio Unitario</label>
          <input type="number" id="add-precio-nuevo" class="form-control" placeholder="0.00" step="0.01" min="0">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel-add">Cancelar</button>
        <button class="btn-primary" id="modal-add-btn">Agregar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  setTimeout(() => {
    document.getElementById('add-nombre-nuevo').focus();
  }, 100);

  document.getElementById('modal-cancel-add').addEventListener('click', () => {
    overlay.remove();
    document.body.style.overflow = 'auto';
  });

  document.getElementById('modal-add-btn').addEventListener('click', () => {
    const nombre = document.getElementById('add-nombre-nuevo').value.trim();
    const precio = parseFloat(document.getElementById('add-precio-nuevo').value);

    if (!nombre || isNaN(precio) || precio < 0) {
      mostrarMensaje('❌ Datos inválidos');
      return;
    }

    overlay.remove();
    document.body.style.overflow = 'auto';
    if (onSave) onSave(nombre, precio);
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = 'auto';
    }
  });
}
