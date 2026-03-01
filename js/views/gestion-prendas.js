// gestion-prendas.js - Gestión de prendas con modales consistentes
import { db } from "../db.js";

export function renderGestionPrendas() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="mobile-container gestion-prendas">
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

      <!-- Botones flotantes para prendas -->
      <div id="floating-actions-prenda" class="floating-action-btns" style="display: none;">
        <button class="btn-view-floating" onclick="verPrendaSeleccionada()">
          👁️ Ver
        </button>
        <button class="btn-edit-floating" onclick="editarPrendaSeleccionada()">
          ✏️ Editar
        </button>
        <button class="btn-create-floating" onclick="crearPrendaDesdeSeleccionada()">
          ➕ Crear
        </button>
        <button class="btn-danger-floating" onclick="eliminarPrendaSeleccionada()">
          🗑️ Eliminar
        </button>
      </div>
    </div>
  `;

  // Cargar prendas existentes
  cargarPrendas();

  // Eventos
  document
    .getElementById("btn-crear-prenda")
    .addEventListener("click", crearPrenda);
  document.getElementById("nueva-prenda").addEventListener("keypress", (e) => {
    if (e.key === "Enter") crearPrenda();
  });
}

// Cargar prendas existentes
async function cargarPrendas() {
  try {
    const lista = document.getElementById("lista-prendas");
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
    lista.innerHTML = prendas
      .map(
        (prenda) => `
      <div class="prenda-card selectable-row" data-id="${prenda.id}" data-nombre="${prenda.nombre}">
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
            <span class="summary-value">${(prenda.tareas.reduce((sum, tarea) => sum + tarea.precioUnitario, 0) / 100).toFixed(2)}Bs</span>
          </div>
        </div>
      </div>
    `,
      )
      .join("");

    // Inicializar eventos de selección
    inicializarEventosSeleccionPrendas();
  } catch (error) {
    console.error("Error al cargar prendas:", error);
    document.getElementById("lista-prendas").innerHTML = `
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
  let prendaNombreSeleccionada = null;

  document.querySelectorAll(".prenda-card.selectable-row").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Evitar que se active si se hace clic en un enlace o botón dentro
      if (e.target.tagName === "BUTTON" || e.target.tagName === "A") {
        return;
      }

      // Quitar selección de todas las filas
      document.querySelectorAll(".selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });

      // Agregar selección a la tarjeta clickeada
      card.classList.add("selected");

      // Guardar datos de la prenda seleccionada
      prendaIdSeleccionada = parseInt(card.dataset.id);
      prendaNombreSeleccionada = card.dataset.nombre;
      prendaSeleccionada = true;

      // Mostrar botones flotantes
      const floatingActions = document.getElementById(
        "floating-actions-prenda",
      );
      floatingActions.style.display = "flex";

      e.stopPropagation();
    });
  });

  // Cerrar botones flotantes al hacer clic fuera
  document.addEventListener("click", (e) => {
    const floatingActions = document.getElementById("floating-actions-prenda");
    const isClickInsideList = e.target.closest(".prendas-list");
    const isClickInsideFloating = e.target.closest("#floating-actions-prenda");

    if (!isClickInsideList && !isClickInsideFloating && floatingActions) {
      floatingActions.style.display = "none";
      document.querySelectorAll(".selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });
      prendaSeleccionada = null;
      prendaIdSeleccionada = null;
      prendaNombreSeleccionada = null;
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

  window.eliminarPrendaSeleccionada = function () {
    if (prendaIdSeleccionada !== null && prendaNombreSeleccionada !== null) {
      mostrarModalEliminarPrenda(
        prendaIdSeleccionada,
        prendaNombreSeleccionada,
      );
      // Ocultar botones flotantes
      document.getElementById("floating-actions-prenda").style.display = "none";
      document.querySelectorAll(".selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });
    }
  };

  window.crearPrendaDesdeSeleccionada = function () {
    if (prendaIdSeleccionada !== null && prendaNombreSeleccionada !== null) {
      mostrarModalCrearPrendaDesdeExistente(
        prendaIdSeleccionada,
        prendaNombreSeleccionada,
      );
      // Ocultar botones flotantes
      document.getElementById("floating-actions-prenda").style.display = "none";
      document.querySelectorAll(".selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });
    }
  };
}

// Crear nueva prenda
async function crearPrenda() {
  const input = document.getElementById("nueva-prenda");
  const nombre = input.value.trim();
  const errorEl = document.getElementById("error-nueva-prenda");

  errorEl.textContent = "";
  input.classList.remove("error");

  if (!nombre) {
    errorEl.textContent = "El nombre no puede estar vacío";
    input.classList.add("error");
    return;
  }

  if (nombre.length < 3) {
    errorEl.textContent = "El nombre debe tener al menos 3 caracteres";
    input.classList.add("error");
    return;
  }

  try {
    // Verificar si ya existe una prenda con ese nombre
    const prendaExistente = await db.prendas
      .where("nombre")
      .equalsIgnoreCase(nombre)
      .first();

    if (prendaExistente) {
      errorEl.textContent = "Ya existe una prenda con este nombre";
      input.classList.add("error");
      return;
    }

    // Crear nueva prenda con tareas vacías
    const nuevaPrenda = {
      nombre: nombre,
      tareas: [],
    };

    await db.prendas.add(nuevaPrenda);

    // Feedback visual
    input.value = "";
    mostrarMensaje("✅ Prenda creada correctamente");

    // Recargar lista
    cargarPrendas();
  } catch (error) {
    console.error("Error al crear prenda:", error);
    errorEl.textContent = "Error al guardar. Intente nuevamente.";
    input.classList.add("error");
  }
}

// ==================== PANTALLA VER PRENDA ====================

// Ver detalles de una prenda
export async function renderVerPrenda(id) {
  try {
    const prenda = await db.prendas.get(id);
    if (!prenda) {
      window.location.hash = "#gestion-prendas";
      return;
    }

    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="mobile-container gestion-prendas">
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
                  <th>¢/uni</th>
                </tr>
              </thead>
              <tbody>
                ${
                  prenda.tareas.length === 0
                    ? `<tr>
                    <td colspan="2" class="no-data">
                      <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <p>No hay tareas definidas</p>
                      </div>
                    </td>
                  </tr>`
                    : prenda.tareas
                        .map(
                          (tarea, index) => `
                    <tr>
                      <td class="task-name">${tarea.nombre}</td>
                      <td class="task-price money">${tarea.precioUnitario}</td>
                    </tr>
                  `,
                        )
                        .join("")
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
            <span class="money positive">${(prenda.tareas.reduce((sum, tarea) => sum + tarea.precioUnitario, 0) / 100).toFixed(2)}Bs</span>
          </div>
        </div>

        <div class="actions-section">
          <button onclick="window.location.hash = '#editar-prenda/${id}'" class="btn-primary">Editar Prenda</button>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error al ver detalles de prenda:", error);
    mostrarMensaje("❌ Error al cargar detalles de la prenda.");
    window.location.hash = "#gestion-prendas";
  }
}

// ==================== PANTALLA EDITAR PRENDA ====================

// Editar una prenda existente
export async function renderEditarPrenda(id) {
  try {
    const prenda = await db.prendas.get(id);
    if (!prenda) {
      window.location.hash = "#gestion-prendas";
      return;
    }

    const app = document.getElementById("app");
    app.innerHTML = `
      <div class="mobile-container gestion-prendas">
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
                ${
                  prenda.tareas.length === 0
                    ? `<tr>
                    <td colspan="2" class="no-data">
                      <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <p>No hay tareas definidas</p>
                      </div>
                    </td>
                  </tr>`
                    : prenda.tareas
                        .map(
                          (tarea, index) => `
                    <tr class="selectable-row" data-index="${index}" data-nombre="${tarea.nombre}" data-precio="${tarea.precioUnitario}">
                      <td class="task-name">${tarea.nombre}</td>
                      <td class="task-price-cell">
                        <input type="number" class="task-price-edit form-control"
                               value="${tarea.precioUnitario}"
                               step="1" min="0" data-index="${index}">
                      </td>
                    </tr>
                  `,
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>

          <!-- Botones flotantes para tareas -->
          <div id="floating-actions-tarea" class="floating-action-btns" style="display: none;">
            <button class="btn-edit-floating" onclick="editarTareaSeleccionadaPrenda()">
              ✏️ Editar
            </button>
            <button class="btn-add-floating" onclick="agregarTareaDebajoSeleccionada()">
              ➕ Agregar
            </button>
            <button class="btn-danger-floating" onclick="eliminarTareaSeleccionada()">
              🗑️ Eliminar
            </button>
          </div>

          <div class="form-card">
            <h3 class="section-subtitle">Agregar Nueva Tarea</h3>
            <div class="form-group">
              <label for="nueva-tarea">Nombre de la tarea</label>
              <input type="text" id="nueva-tarea" class="form-control" placeholder="Ej: Cierre especial">
            </div>
            <div class="form-group">
              <label for="precio-nueva-tarea">Precio (¢)</label>
              <input type="number" id="precio-nueva-tarea" class="form-control"
                     step="1" min="0" placeholder="Ej: 5, 10">
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
            <span id="costo-total" class="money positive">${(prenda.tareas.reduce((sum, tarea) => sum + tarea.precioUnitario, 0) / 100).toFixed(2)}Bs</span>
          </div>
        </div>
      </div>
    `;

    // Eventos para edición
    document
      .getElementById("btn-agregar-tarea")
      .addEventListener("click", () => agregarTarea(id));

    // Guardar automáticamente cuando se cambia el nombre
    document
      .getElementById("nombre-editable")
      .addEventListener("blur", () => guardarNombrePrenda(id));

    // Guardar automáticamente cuando se cambian precios
    document.querySelectorAll(".task-price-edit").forEach((input) => {
      input.addEventListener("blur", () =>
        guardarPrecioTarea(id, input.dataset.index, input.value),
      );
      input.addEventListener("input", recalcularTotalesEdicion);
    });

    // Inicializar eventos de selección para tareas
    inicializarEventosSeleccionTareas(id, prenda);
  } catch (error) {
    console.error("Error al editar prenda:", error);
    mostrarMensaje("❌ Error al cargar la edición de la prenda.");
    window.location.hash = "#gestion-prendas";
  }
}

// ==================== EVENTOS DE SELECCIÓN DE TAREAS ====================

// Inicializar eventos de selección de tareas en la edición de prenda
function inicializarEventosSeleccionTareas(prendaId, prenda) {
  let tareaSeleccionada = null;
  let tareaIndexSeleccionada = null;

  document
    .querySelectorAll("#tareas-lista-edit .selectable-row")
    .forEach((row) => {
      row.addEventListener("click", (e) => {
        // Evitar que se active si se hace clic en un input dentro de la fila
        if (e.target.tagName === "INPUT") {
          return;
        }

        // Quitar selección de todas las filas
        document.querySelectorAll(".selectable-row").forEach((r) => {
          r.classList.remove("selected");
        });

        // Agregar selección a la fila clickeada
        row.classList.add("selected");

        // Guardar datos de la tarea seleccionada
        tareaIndexSeleccionada = parseInt(row.dataset.index);
        tareaSeleccionada = {
          nombre: row.dataset.nombre,
          precio: parseInt(row.dataset.precio),
        };

        // Mostrar botones flotantes
        const floatingActions = document.getElementById(
          "floating-actions-tarea",
        );
        floatingActions.style.display = "flex";

        e.stopPropagation();
      });
    });

  // Cerrar botones flotantes al hacer clic fuera
  document.addEventListener("click", (e) => {
    const floatingActions = document.getElementById("floating-actions-tarea");
    const isClickInsideTable = e.target.closest(".table-container");
    const isClickInsideFloating = e.target.closest("#floating-actions-tarea");

    if (!isClickInsideTable && !isClickInsideFloating && floatingActions) {
      floatingActions.style.display = "none";
      document.querySelectorAll(".selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });
      tareaSeleccionada = null;
      tareaIndexSeleccionada = null;
    }
  });

  // Exponer función para eliminar tarea seleccionada
  window.eliminarTareaSeleccionada = function () {
    if (tareaSeleccionada !== null && tareaIndexSeleccionada !== null) {
      mostrarModalEliminarTareaPrenda(
        prendaId,
        tareaIndexSeleccionada,
        tareaSeleccionada.nombre,
      );
      // Ocultar botones flotantes después de abrir modal
      document.getElementById("floating-actions-tarea").style.display = "none";
      document.querySelectorAll(".selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });
    }
  };

  // Exponer función para editar tarea seleccionada
  window.editarTareaSeleccionadaPrenda = function () {
    if (tareaSeleccionada !== null && tareaIndexSeleccionada !== null) {
      mostrarModalEditarTareaPrenda(
        prendaId,
        tareaIndexSeleccionada,
        tareaSeleccionada.nombre,
        tareaSeleccionada.precio,
      );
      // Ocultar botones flotantes después de abrir modal
      document.getElementById("floating-actions-tarea").style.display = "none";
      document.querySelectorAll(".selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });
    }
  };

  // Exponer función para agregar tarea debajo de la seleccionada
  window.agregarTareaDebajoSeleccionada = function () {
    if (tareaIndexSeleccionada !== null) {
      mostrarModalAgregarTareaDebajoPrenda(
        prendaId,
        tareaIndexSeleccionada + 1,
      );
      // Ocultar botones flotantes después de abrir modal
      document.getElementById("floating-actions-tarea").style.display = "none";
      document.querySelectorAll(".selectable-row").forEach((r) => {
        r.classList.remove("selected");
      });
    }
  };
}

// ==================== FUNCIONES AUXILIARES EDICIÓN ====================

// Agregar nueva tarea a una prenda
async function agregarTarea(prendaId) {
  const nombreInput = document.getElementById("nueva-tarea");
  const precioInput = document.getElementById("precio-nueva-tarea");
  const nombre = nombreInput.value.trim();
  const precio = parseFloat(precioInput.value);

  if (!nombre) {
    mostrarMensaje("❌ El nombre de la tarea no puede estar vacío");
    nombreInput.classList.add("error");
    return;
  }

  if (isNaN(precio) || precio < 0) {
    mostrarMensaje("❌ El precio debe ser un número válido");
    precioInput.classList.add("error");
    return;
  }

  try {
    const prenda = await db.prendas.get(prendaId);
    if (!prenda) return;

    // Verificar si ya existe una tarea con ese nombre
    const tareaExistente = prenda.tareas.find(
      (t) => t.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    if (tareaExistente) {
      mostrarMensaje("❌ Ya existe una tarea con este nombre");
      nombreInput.classList.add("error");
      return;
    }

    // Agregar nueva tarea
    prenda.tareas.push({
      nombre: nombre,
      precioUnitario: precio,
    });

    // Actualizar en la base de datos
    await db.prendas.update(prendaId, { tareas: prenda.tareas });

    // Limpiar campos
    nombreInput.value = "";
    precioInput.value = "";
    nombreInput.classList.remove("error");
    precioInput.classList.remove("error");

    // Recargar edición
    await renderEditarPrenda(prendaId);
    mostrarMensaje("✅ Tarea agregada correctamente");
  } catch (error) {
    console.error("Error al agregar tarea:", error);
    mostrarMensaje("❌ Error al agregar tarea. Intente nuevamente.");
  }
}

// Guardar nombre de prenda cuando se edita
async function guardarNombrePrenda(prendaId) {
  const nombreInput = document.getElementById("nombre-editable");
  const nuevoNombre = nombreInput.value.trim();
  const errorEl = document.getElementById("error-nombre-edit");

  errorEl.textContent = "";
  nombreInput.classList.remove("error");

  if (!nuevoNombre) {
    errorEl.textContent = "El nombre no puede estar vacío";
    nombreInput.classList.add("error");
    return;
  }

  if (nuevoNombre.length < 3) {
    errorEl.textContent = "El nombre debe tener al menos 3 caracteres";
    nombreInput.classList.add("error");
    return;
  }

  try {
    // Verificar si ya existe una prenda con el nuevo nombre
    const prendaExistente = await db.prendas
      .where("nombre")
      .equalsIgnoreCase(nuevoNombre)
      .first();

    if (prendaExistente && prendaExistente.id !== prendaId) {
      errorEl.textContent = "Ya existe una prenda con este nombre";
      nombreInput.classList.add("error");
      return;
    }

    // Actualizar nombre
    await db.prendas.update(prendaId, {
      nombre: nuevoNombre,
    });

    // Actualizar título en la pantalla
    document.querySelector(".small-title").textContent =
      `Editar ${nuevoNombre}`;
    mostrarMensaje("✅ Nombre actualizado");
  } catch (error) {
    console.error("Error al guardar nombre:", error);
    mostrarMensaje("❌ Error al guardar nombre. Intente nuevamente.");
  }
}

// Guardar precio de tarea cuando se edita
async function guardarPrecioTarea(prendaId, tareaIndex, nuevoPrecio) {
  try {
    const precio = parseFloat(nuevoPrecio);
    if (isNaN(precio) || precio < 0) {
      mostrarMensaje("❌ El precio debe ser un número válido");
      return;
    }

    const prenda = await db.prendas.get(prendaId);
    if (!prenda || !prenda.tareas[tareaIndex]) return;

    prenda.tareas[tareaIndex].precioUnitario = precio;

    // Actualizar en la base de datos
    await db.prendas.update(prendaId, { tareas: prenda.tareas });

    // Actualizar totales
    recalcularTotalesEdicion();
    mostrarMensaje("✅ Precio actualizado");
  } catch (error) {
    console.error("Error al guardar precio de tarea:", error);
    mostrarMensaje("❌ Error al guardar precio. Intente nuevamente.");
  }
}

// Recalcular totales en tiempo real durante edición
function recalcularTotalesEdicion() {
  const inputs = document.querySelectorAll(".task-price-edit");
  let total = 0;

  inputs.forEach((input) => {
    const precio = parseFloat(input.value) || 0;
    total += precio;
  });

  const totalElement = document.getElementById("total-tareas");
  const costoElement = document.getElementById("costo-total");

  if (totalElement) totalElement.textContent = inputs.length;
  if (costoElement) {
    costoElement.textContent = `${(total / 100).toFixed(2)}Bs`;
    costoElement.className = `money ${total > 0 ? "positive" : ""}`;
  }
}

// ==================== MODALES ====================

// Modal: Eliminar Prenda
function mostrarModalEliminarPrenda(prendaId, prendaNombre) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>⚠️ Confirmar Eliminación</h3>
      </div>
      <div class="modal-body">
        <p>¿Está seguro de eliminar la prenda <strong>"${prendaNombre}"</strong>?</p>
        <p class="modal-info-text">⚠️ Esta acción no se puede deshacer.</p>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel-eliminar-prenda">Cancelar</button>
        <button class="btn-danger" id="modal-confirm-eliminar-prenda">Eliminar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  document
    .getElementById("modal-cancel-eliminar-prenda")
    .addEventListener("click", () => {
      overlay.remove();
      document.body.style.overflow = "auto";
    });

  document
    .getElementById("modal-confirm-eliminar-prenda")
    .addEventListener("click", async () => {
      try {
        await db.prendas.delete(prendaId);
        overlay.remove();
        document.body.style.overflow = "auto";
        mostrarMensaje("✅ Prenda eliminada correctamente");
        cargarPrendas();
      } catch (error) {
        console.error("Error al eliminar prenda:", error);
        mostrarMensaje("❌ Error al eliminar prenda");
      }
    });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "auto";
    }
  });
}

// Modal: Eliminar Tarea de Prenda
function mostrarModalEliminarTareaPrenda(prendaId, tareaIndex, tareaNombre) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>⚠️ Confirmar Eliminación</h3>
      </div>
      <div class="modal-body">
        <p>¿Está seguro de eliminar la tarea <strong>"${tareaNombre}"</strong>?</p>
        <p class="modal-info-text">⚠️ Esta acción no se puede deshacer.</p>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel-eliminar-tarea">Cancelar</button>
        <button class="btn-danger" id="modal-confirm-eliminar-tarea">Eliminar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  document
    .getElementById("modal-cancel-eliminar-tarea")
    .addEventListener("click", () => {
      overlay.remove();
      document.body.style.overflow = "auto";
    });

  document
    .getElementById("modal-confirm-eliminar-tarea")
    .addEventListener("click", async () => {
      try {
        const prenda = await db.prendas.get(prendaId);
        if (!prenda) return;

        // Remover tarea por índice
        prenda.tareas.splice(tareaIndex, 1);

        // Actualizar en la base de datos
        await db.prendas.update(prendaId, { tareas: prenda.tareas });

        overlay.remove();
        document.body.style.overflow = "auto";

        await renderEditarPrenda(prendaId);
        mostrarMensaje("✅ Tarea eliminada correctamente");
      } catch (error) {
        console.error("Error al eliminar tarea:", error);
        mostrarMensaje("❌ Error al eliminar tarea. Intente nuevamente.");
      }
    });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "auto";
    }
  });
}

// Modal: Editar Tarea de Prenda
function mostrarModalEditarTareaPrenda(
  prendaId,
  tareaIndex,
  nombreActual,
  precioActual,
) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>✏️ Editar Tarea</h3>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="edit-tarea-nombre">Nombre</label>
          <input type="text" id="edit-tarea-nombre" class="form-control" value="${nombreActual}">
        </div>
        <div class="form-group">
          <label for="edit-tarea-precio">Precio (¢)</label>
          <input type="number" id="edit-tarea-precio" class="form-control" value="${precioActual}" step="1" min="0" placeholder="Ej: 5, 10">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel-edit-tarea">Cancelar</button>
        <button class="btn-primary" id="modal-save-edit-tarea">Guardar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    document.getElementById("edit-tarea-nombre").focus();
  }, 100);

  document
    .getElementById("modal-cancel-edit-tarea")
    .addEventListener("click", () => {
      overlay.remove();
      document.body.style.overflow = "auto";
    });

  document
    .getElementById("modal-save-edit-tarea")
    .addEventListener("click", async () => {
      const nuevoNombre = document
        .getElementById("edit-tarea-nombre")
        .value.trim();
      const nuevoPrecio = parseFloat(
        document.getElementById("edit-tarea-precio").value,
      );

      if (!nuevoNombre || isNaN(nuevoPrecio) || nuevoPrecio < 0) {
        mostrarMensaje("❌ Datos inválidos");
        return;
      }

      try {
        const prenda = await db.prendas.get(prendaId);
        if (!prenda) return;

        prenda.tareas[tareaIndex].nombre = nuevoNombre;
        prenda.tareas[tareaIndex].precioUnitario = nuevoPrecio;

        await db.prendas.update(prendaId, { tareas: prenda.tareas });

        overlay.remove();
        document.body.style.overflow = "auto";

        await renderEditarPrenda(prendaId);
        mostrarMensaje("✅ Tarea actualizada");
      } catch (error) {
        console.error("Error al editar tarea:", error);
        mostrarMensaje("❌ Error al editar tarea");
      }
    });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "auto";
    }
  });
}

// Modal: Agregar Tarea Debajo de la Seleccionada
function mostrarModalAgregarTareaDebajoPrenda(prendaId, posicion) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>➕ Agregar Nueva Tarea</h3>
      </div>
      <div class="modal-body">
        <p class="modal-info-text">Se agregará la nueva tarea en la posición ${posicion + 1}</p>
        <div class="form-group">
          <label for="add-tarea-nombre">Nombre de la tarea</label>
          <input type="text" id="add-tarea-nombre" class="form-control" placeholder="Ej: Costura especial">
        </div>
        <div class="form-group">
          <label for="add-tarea-precio">Precio (¢)</label>
          <input type="number" id="add-tarea-precio" class="form-control" placeholder="Ej: 5, 10" step="1" min="0">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel-add-tarea">Cancelar</button>
        <button class="btn-primary" id="modal-add-tarea">Agregar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  setTimeout(() => {
    document.getElementById("add-tarea-nombre").focus();
  }, 100);

  document
    .getElementById("modal-cancel-add-tarea")
    .addEventListener("click", () => {
      overlay.remove();
      document.body.style.overflow = "auto";
    });

  document
    .getElementById("modal-add-tarea")
    .addEventListener("click", async () => {
      const nombre = document.getElementById("add-tarea-nombre").value.trim();
      const precio = parseFloat(
        document.getElementById("add-tarea-precio").value,
      );

      if (!nombre || isNaN(precio) || precio < 0) {
        mostrarMensaje("❌ Datos inválidos");
        return;
      }

      try {
        const prenda = await db.prendas.get(prendaId);
        if (!prenda) return;

        // Insertar en la posición específica
        prenda.tareas.splice(posicion, 0, {
          nombre: nombre,
          precioUnitario: precio,
        });

        await db.prendas.update(prendaId, { tareas: prenda.tareas });

        overlay.remove();
        document.body.style.overflow = "auto";

        await renderEditarPrenda(prendaId);
        mostrarMensaje("✅ Tarea agregada correctamente");
      } catch (error) {
        console.error("Error al agregar tarea:", error);
        mostrarMensaje("❌ Error al agregar tarea");
      }
    });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "auto";
    }
  });
}

// Modal: Crear Prenda desde Existente (duplicar con nuevo nombre)
function mostrarModalCrearPrendaDesdeExistente(prendaIdOriginal, nombreOriginal) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>➕ Crear Nueva Prenda</h3>
      </div>
      <div class="modal-body">
        <p class="modal-info-text">Se creará una copia de <strong>"${nombreOriginal}"</strong> con todas sus tareas.</p>
        <div class="form-group">
          <label for="nuevo-nombre-prenda">Nombre de la nueva prenda</label>
          <input type="text" id="nuevo-nombre-prenda" class="form-control" value="${nombreOriginal} (copia)" placeholder="Ej: Pantalón Especial">
          <small id="error-nuevo-nombre-prenda" class="error-message"></small>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" id="modal-cancel-crear-prenda">Cancelar</button>
        <button class="btn-primary" id="modal-confirm-crear-prenda">Crear</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  // Seleccionar el texto del input para facilitar edición
  setTimeout(() => {
    const input = document.getElementById("nuevo-nombre-prenda");
    input.focus();
    input.select();
  }, 100);

  document
    .getElementById("modal-cancel-crear-prenda")
    .addEventListener("click", () => {
      overlay.remove();
      document.body.style.overflow = "auto";
    });

  document
    .getElementById("modal-confirm-crear-prenda")
    .addEventListener("click", async () => {
      const nuevoNombre = document
        .getElementById("nuevo-nombre-prenda")
        .value.trim();
      const errorEl = document.getElementById("error-nuevo-nombre-prenda");

      errorEl.textContent = "";

      // Validaciones
      if (!nuevoNombre) {
        errorEl.textContent = "El nombre no puede estar vacío";
        return;
      }

      if (nuevoNombre.length < 3) {
        errorEl.textContent = "El nombre debe tener al menos 3 caracteres";
        return;
      }

      try {
        // Verificar si ya existe una prenda con ese nombre
        const prendaExistente = await db.prendas
          .where("nombre")
          .equalsIgnoreCase(nuevoNombre)
          .first();

        if (prendaExistente) {
          errorEl.textContent = "Ya existe una prenda con este nombre";
          return;
        }

        // Obtener prenda original
        const prendaOriginal = await db.prendas.get(prendaIdOriginal);
        if (!prendaOriginal) {
          errorEl.textContent = "No se encontró la prenda original";
          return;
        }

        // Crear nueva prenda copiando las tareas
        const nuevaPrenda = {
          nombre: nuevoNombre,
          tareas: JSON.parse(JSON.stringify(prendaOriginal.tareas)), // Copia profunda de tareas
        };

        await db.prendas.add(nuevaPrenda);

        overlay.remove();
        document.body.style.overflow = "auto";

        mostrarMensaje("✅ Prenda creada correctamente");
        cargarPrendas();
      } catch (error) {
        console.error("Error al crear prenda:", error);
        errorEl.textContent = "Error al crear la prenda. Intente nuevamente.";
      }
    });

  // Permitir crear con Enter
  document
    .getElementById("nuevo-nombre-prenda")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        document.getElementById("modal-confirm-crear-prenda").click();
      }
    });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "auto";
    }
  });
}

// ==================== FUNCIONES GENERALES ====================

// Mostrar mensaje temporal
function mostrarMensaje(mensaje) {
  const app = document.getElementById("app");
  const mensajeEl = document.createElement("div");
  mensajeEl.className = "toast-message";
  mensajeEl.innerHTML = mensaje;
  app.appendChild(mensajeEl);

  setTimeout(() => {
    mensajeEl.remove();
  }, 2000);
}
