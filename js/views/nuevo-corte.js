// nuevo-corte.js - Versión con nombre personalizado del corte
import { db } from '../db.js';

export function renderNuevoCorte() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="mobile-container">
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
              <label for="cantidad">Cantidad</label>
              <input type="number" id="cantidad" class="form-control" min="1" value="100">
              <small id="error-cantidad" class="error-message"></small>
            </div>
            <div class="form-group-half">
              <label for="precio-venta">$ Venta/unidad</label>
              <input type="number" id="precio-venta" class="form-control" min="0" step="0.01" value="10.00">
              <small id="error-precio" class="error-message"></small>
            </div>
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
      </div>
      
      <div class="summary-card">
        <h2 class="section-title">Resumen de Costos</h2>
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

  // Cargar prendas en el selector
  cargarPrendas();

  // Eventos para recalcular TODO cuando cambian los inputs clave
  document.getElementById('nombre-corte').addEventListener('input', validarNombreCorte);
  document.getElementById('prenda').addEventListener('change', cargarTareas);
  document.getElementById('cantidad').addEventListener('input', recalcularTotales);
  document.getElementById('precio-venta').addEventListener('input', recalcularTotales);

  // Validación en tiempo real
  document.getElementById('cantidad').addEventListener('blur', validarCantidad);
  document.getElementById('precio-venta').addEventListener('blur', validarPrecio);
  document.getElementById('nombre-corte').addEventListener('blur', validarNombreCorte);

  document.getElementById('btn-guardar').addEventListener('click', guardarCorte);
}

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

  // Generar filas de tareas
  prenda.tareas.forEach((tarea, index) => {
    const row = document.createElement('tr');
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

// Validar cantidad
function validarCantidad() {
  const input = document.getElementById('cantidad');
  const error = document.getElementById('error-cantidad');
  const cantidad = parseInt(input.value);

  if (!cantidad || cantidad < 1) {
    error.textContent = 'La cantidad debe ser al menos 1';
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

  // Recalcular cada tarea
  inputs.forEach(input => {
    const precio = parseFloat(input.value) || 0;
    const totalTarea = precio * cantidad;
    totalManoObra += totalTarea;

    // Actualizar visualmente
    const totalCell = input.closest('tr').querySelector('.task-total');
    totalCell.textContent = `$${totalTarea.toFixed(2)}`;
    totalCell.className = `task-total money ${totalTarea > 0 ? 'positive' : 'negative'}`;
  });

  // Calcular totales generales
  const totalVenta = cantidad * precioVenta;
  const ganancia = totalVenta - totalManoObra;

  // Actualizar resumen
  const totalVentaEl = document.getElementById('total-venta');
  const totalManoObraEl = document.getElementById('total-mano-obra');
  const gananciaEl = document.getElementById('ganancia-estimada');

  totalVentaEl.textContent = `$${totalVenta.toFixed(2)}`;
  totalManoObraEl.textContent = `$${totalManoObra.toFixed(2)}`;
  gananciaEl.textContent = `$${ganancia.toFixed(2)}`;

  // Estilo dinámico para ganancia
  totalVentaEl.className = `money ${totalVenta > 0 ? 'positive' : ''}`;
  totalManoObraEl.className = `money ${totalManoObra > 0 ? '' : ''}`;
  gananciaEl.className = `money ${ganancia >= 0 ? 'positive' : 'negative'}`;
}

// Guardar el corte en la base de datos
async function guardarCorte() {
  // Validaciones
  if (!validarNombreCorte() || !validarCantidad() || !validarPrecio()) {
    mostrarMensaje('❌ Corrige los errores en el formulario');
    return;
  }

  const prendaId = document.getElementById('prenda').value;
  if (!prendaId) {
    document.getElementById('error-prenda').textContent = 'Selecciona una prenda';
    mostrarMensaje('❌ Debes seleccionar un tipo de prenda');
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

    // Recoger datos de las tareas
    inputs.forEach(input => {
      const index = input.dataset.index;
      const precio = parseFloat(input.value) || 0;

      tareas.push({
        id: `task-${Date.now()}-${index}`,
        nombre: prenda.tareas[index].nombre,
        precioUnitario: precio,
        unidadesTotales: cantidad,
        asignaciones: []
      });
    });

    // Crear el corte
    const nuevoCorte = {
      nombreCorte: nombreCorte, // NUEVO CAMPO
      prendaId: parseInt(prendaId),
      nombrePrendaOriginal: prenda.nombre, // Para mantener el tipo original
      cantidadPrendas: cantidad,
      precioVentaUnitario: precioVenta,
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