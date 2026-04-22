// tab-asignar.js - Pestaña para asignar tareas a trabajadores (con asignación múltiple por tallas)
import { db } from "../../db.js";
import {
  mostrarMensaje,
  getTallasDisponiblesParaTarea,
  getTareasDisponibles,
  formatCentavos,
} from "./utils.js";

export async function cargarPestanaAsignar(corteId) {
  window.corteIdActual = corteId;
  const content = document.getElementById("tab-content");

  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) {
      content.innerHTML = '<p class="error">Corte no encontrado</p>';
      return;
    }

    if (corte.estado === "terminado") {
      content.innerHTML = `
        <div class="completed-section">
          <span class="badge badge-terminado">CORTE FINALIZADO</span>
          <p>No se pueden asignar más tareas</p>
        </div>
      `;
      return;
    }

    const trabajadores = await db.trabajadores.toArray();
    const tieneTallas = corte.tallas && corte.tallas.length > 0;

    // Info de tallas del corte
    const tallasInfoHTML = tieneTallas
      ? `

    `
      : "";

    content.innerHTML = `
      <div class="assignment-section">
        <h2 class="section-title">Asignar Tareas</h2>
        ${tallasInfoHTML}

        <div class="assignment-form">
          <div class="form-group">
            <label>Trabajador</label>
            <select id="select-trabajador" class="form-control">
              <option value="">Seleccionar...</option>
              ${trabajadores.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join("")}
            </select>
          </div>

           <div class="form-group">
             <label>Tarea</label>
             <select id="select-tarea" class="form-control" disabled>
               <option value="">Seleccione trabajador</option>
             </select>
           </div>

           <div class="form-group" id="nueva-tarea-nombre-group" style="display: none;">
             <label>Nombre de la nueva tarea</label>
             <input type="text" id="nueva-tarea-nombre" class="form-control" placeholder="Ej: Costura especial">
           </div>

          <div class="form-group" id="precio-group" style="display: none;">
            <label>Precio unitario (Centavos)</label>
            <input type="number" id="precio-tarea" class="form-control" min="0" step="1" placeholder="Ej: 5, 10">
          </div>

          <div id="tallas-inputs-container" class="tallas-inputs-container" style="display: none;">
            <label class="tallas-label">Tallas a asignar:</label>
            <div id="tallas-inputs-list" class="tallas-inputs-list">
              <!-- Se llenará dinámicamente -->
            </div>
          </div>

          <div class="form-group" id="cantidad-group" ${tieneTallas ? 'style="display:none;"' : ""}>
            <label>Cantidad</label>
            <input type="number" id="cantidad-asignar" class="form-control" min="1" placeholder="0" disabled>
            <small id="info-cantidad" class="info-message"></small>
          </div>

          <button id="btn-asignar" class="btn-primary" disabled>Asignar Tareas</button>
        </div>

        <div class="assignment-history">
          <h3>Historial</h3>
          <div id="historial-container" class="table-container">
            ${await renderHistorialAsignaciones(corte)}
          </div>
        </div>
      </div>

      <!-- Botón flotante para eliminar -->
      <div id="floating-delete-btn" class="floating-action-btn" style="display: none;">
        <button class="btn-danger-floating" onclick="mostrarModalEliminarAsignacion()">
          🗑️ Eliminar
        </button>
      </div>
    `;

    await inicializarEventosAsignacion(corteId, corte, tieneTallas);
  } catch (error) {
    console.error("Error:", error);
    content.innerHTML = '<p class="error">Error</p>';
  }
}

// Renderizar historial de asignaciones
async function renderHistorialAsignaciones(corte) {
  const trabajadores = await db.trabajadores.toArray();
  const trabajadoresMap = new Map(trabajadores.map((t) => [t.id, t.nombre]));

  // Agrupar asignaciones por trabajador y tarea
  const asignacionesAgrupadas = new Map();

  corte.tareas.forEach((tarea, tIdx) => {
    tarea.asignaciones.forEach((asig, aIdx) => {
      const key = `${asig.trabajadorId}-${tIdx}`;
      if (!asignacionesAgrupadas.has(key)) {
        asignacionesAgrupadas.set(key, {
          tareaNombre: tarea.nombre,
          tareaId: tarea.id,
          trabajadorId: asig.trabajadorId,
          trabajador: trabajadoresMap.get(asig.trabajadorId) || "Desconocido",
          tallas: [],
          tareaIndex: tIdx,
        });
      }
      asignacionesAgrupadas.get(key).tallas.push({
        talla: asig.talla || "-",
        cantidad: asig.cantidad,
      });
    });
  });

  if (asignacionesAgrupadas.size === 0) {
    return '<p class="no-data">Sin asignaciones</p>';
  }

  // Convertir a array y ordenar por trabajador
  const historial = Array.from(asignacionesAgrupadas.values());

  return `
    <table class="history-table">
      <thead><tr><th>Trabajador</th><th>Tarea</th><th>Tallas</th></tr></thead>
      <tbody>
        ${historial
          .map((h) => {
            const tallasStr = h.tallas
              .map((t) => `${t.talla}(${t.cantidad})`)
              .join(", ");
            return `<tr class="history-row clickable"
                      data-trabajador-id="${h.trabajadorId}"
                      data-tarea-index="${h.tareaIndex}"
                      data-tarea-nombre="${h.tareaNombre}"
                      data-trabajador-nombre="${h.trabajador}">
            <td>${h.trabajador}</td>
            <td>${h.tareaNombre}</td>
            <td class="tallas-cell">${tallasStr}</td>
          </tr>`;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

// Inicializar eventos del formulario de asignación
async function inicializarEventosAsignacion(corteId, corte, tieneTallas) {
  const selectTrabajador = document.getElementById("select-trabajador");
  const selectTarea = document.getElementById("select-tarea");
  const btnAsignar = document.getElementById("btn-asignar");
  const tallasInputsContainer = document.getElementById(
    "tallas-inputs-container",
  );
  const tallasInputsList = document.getElementById("tallas-inputs-list");
  const cantidadGroup = document.getElementById("cantidad-group");
  const cantidadInput = document.getElementById("cantidad-asignar");
  const precioGroup = document.getElementById("precio-group");
  const precioInput = document.getElementById("precio-tarea");
  const nuevaTareaNombreGroup = document.getElementById(
    "nueva-tarea-nombre-group",
  );
  const nuevaTareaNombreInput = document.getElementById("nueva-tarea-nombre");
  const floatingDeleteBtn = document.getElementById("floating-delete-btn");

  let tareaSeleccionada = null;
  let asignacionSeleccionada = null;

  // Evento: Clic en fila del historial
  document.querySelectorAll(".history-row.clickable").forEach((row) => {
    row.addEventListener("click", function () {
      // Quitar selección anterior
      document
        .querySelectorAll(".history-row.clickable")
        .forEach((r) => r.classList.remove("selected"));
      // Seleccionar esta fila
      this.classList.add("selected");

      // Guardar datos de la asignación seleccionada
      asignacionSeleccionada = {
        trabajadorId: parseInt(this.dataset.trabajadorId),
        tareaIndex: parseInt(this.dataset.tareaIndex),
        tareaNombre: this.dataset.tareaNombre,
        trabajadorNombre: this.dataset.trabajadorNombre,
      };

      // Mostrar botón flotante
      floatingDeleteBtn.style.display = "flex";
    });
  });

  // Cerrar botón flotante al hacer clic fuera
  document.addEventListener("click", function (e) {
    if (
      !e.target.closest(".history-row.clickable") &&
      !e.target.closest("#floating-delete-btn")
    ) {
      floatingDeleteBtn.style.display = "none";
      document
        .querySelectorAll(".history-row.clickable")
        .forEach((r) => r.classList.remove("selected"));
      asignacionSeleccionada = null;
    }
  });

  // Función global para mostrar modal de eliminación
  window.mostrarModalEliminarAsignacion = function () {
    if (!asignacionSeleccionada) return;

    mostrarModalConfirmacion(
      "⚠️ Confirmar Eliminación",
      `¿Eliminar asignación de <strong>${asignacionSeleccionada.trabajadorNombre}</strong> para <strong>${asignacionSeleccionada.tareaNombre}</strong>?`,
      async () => {
        await eliminarAsignacion(corteId, asignacionSeleccionada);
        floatingDeleteBtn.style.display = "none";
        asignacionSeleccionada = null;
      },
    );
  };

  // Evento: Seleccionar trabajador
  selectTrabajador.addEventListener("change", async function () {
    const trabajadorId = this.value;
    if (!trabajadorId) {
      selectTarea.disabled = true;
      tallasInputsContainer.style.display = "none";
      cantidadGroup.style.display = "none";
      btnAsignar.disabled = true;
      return;
    }

    const corteActual = await db.cortes.get(corteId);
    const tareasDisponibles = getTareasDisponibles(corteActual);

    selectTarea.disabled = false;
    selectTarea.innerHTML =
      `<option value="">Seleccionar...</option>` +
      `<option value="crear">＋ Crear nueva tarea</option>` +
      tareasDisponibles
        .map((t, i) => `<option value="${i}">${t.nombre}</option>`)
        .join("");

    tallasInputsContainer.style.display = "none";
    cantidadGroup.style.display = "none";
    precioGroup.style.display = "none";
    btnAsignar.disabled = true;
  });

  // Evento: Seleccionar tarea
  selectTarea.addEventListener("change", async function () {
    const tareaIdx = this.value;
    if (!tareaIdx) {
      tallasInputsContainer.style.display = "none";
      cantidadGroup.style.display = "none";
      precioGroup.style.display = "none";
      if (nuevaTareaNombreGroup) nuevaTareaNombreGroup.style.display = "none";
      btnAsignar.disabled = true;
      return;
    }

    const corteActual = await db.cortes.get(corteId);

    if (tareaIdx === "crear") {
      // Modo creación de nueva tarea
      tareaSeleccionada = null;
      // Mostrar inputs para nueva tarea
      precioGroup.style.display = "block";
      precioInput.value = "";
      if (nuevaTareaNombreGroup) nuevaTareaNombreGroup.style.display = "block";
      if (nuevaTareaNombreInput) nuevaTareaNombreInput.value = "";

      if (tieneTallas && tallasInputsContainer) {
        // Mostrar inputs por talla (todas disponibles)
        tallasInputsContainer.style.display = "block";
        const tallasDisponibles = corteActual.tallas.map((t) => ({
          talla: t.talla,
          disponible: t.cantidad,
          total: t.cantidad,
        }));

        tallasInputsList.innerHTML = tallasDisponibles
          .map(
            (t) => `
          <div class="talla-input-row">
            <span class="talla-name clickable" data-talla="${t.talla}">${t.talla}</span>
            <input type="number"
                   class="form-control talla-cantidad-input"
                   data-talla="${t.talla}"
                   data-disponible="${t.disponible}"
                   value="${t.disponible}"
                   min="0"
                   max="${t.disponible}">
            <span class="talla-max">/ ${t.disponible}</span>
          </div>
        `,
          )
          .join("");

        // Agregar eventos a los inputs de talla
        document.querySelectorAll(".talla-cantidad-input").forEach((input) => {
          input.addEventListener("input", validarInputsTallas);
        });

        // Agregar eventos a los nombres de talla clickables
        document.querySelectorAll(".talla-name.clickable").forEach((span) => {
          span.addEventListener("click", function () {
            const talla = this.dataset.talla;
            const input = document.querySelector(
              `.talla-cantidad-input[data-talla="${talla}"]`,
            );
            if (!input) return;

            const max = parseInt(input.dataset.disponible) || 0;
            const current = parseInt(input.value) || 0;

            input.value = current === 0 ? max : 0;
            input.dispatchEvent(new Event("input"));
          });
        });

        cantidadGroup.style.display = "none";
        btnAsignar.disabled = false; // Se validará con validarInputsTallas
      } else {
        // Sin tallas: mostrar cantidad total
        tallasInputsContainer.style.display = "none";
        cantidadGroup.style.display = "block";
        const totalDisponible = corteActual.cantidadPrendas;
        cantidadInput.disabled = false;
        cantidadInput.max = totalDisponible;
        cantidadInput.value = totalDisponible;
        document.getElementById("info-cantidad").textContent =
          `${totalDisponible} disponibles`;
        btnAsignar.disabled = false;
      }
      return;
    }

    // Si es una tarea existente
    if (nuevaTareaNombreGroup) nuevaTareaNombreGroup.style.display = "none";
    const tareasDisponibles = getTareasDisponibles(corteActual);
    tareaSeleccionada = tareasDisponibles[parseInt(tareaIdx)];

    // Mostrar y poblar el input de precio
    precioGroup.style.display = "block";
    precioInput.value = tareaSeleccionada.precioUnitario;

    if (tieneTallas && tallasInputsContainer) {
      // Mostrar inputs por talla
      const tallasDisponibles = getTallasDisponiblesParaTarea(
        corteActual,
        tareaSeleccionada,
      );

      if (tallasDisponibles && tallasDisponibles.length > 0) {
        tallasInputsContainer.style.display = "block";
        tallasInputsList.innerHTML = tallasDisponibles
          .map(
            (t) => `
          <div class="talla-input-row">
            <span class="talla-name clickable" data-talla="${t.talla}">${t.talla}</span>
            <input type="number"
                   class="form-control talla-cantidad-input"
                   data-talla="${t.talla}"
                   data-disponible="${t.disponible}"
                   value="${t.disponible}"
                   min="0"
                   max="${t.disponible}">
            <span class="talla-max">/ ${t.disponible}</span>
          </div>
        `,
          )
          .join("");

        // Agregar eventos a los inputs de talla
        document.querySelectorAll(".talla-cantidad-input").forEach((input) => {
          input.addEventListener("input", validarInputsTallas);
        });

        // Agregar eventos a los nombres de talla clickables
        document.querySelectorAll(".talla-name.clickable").forEach((span) => {
          span.addEventListener("click", function () {
            const talla = this.dataset.talla;
            const input = document.querySelector(
              `.talla-cantidad-input[data-talla="${talla}"]`,
            );
            if (!input) return;

            const max = parseInt(input.dataset.disponible) || 0;
            const current = parseInt(input.value) || 0;

            input.value = current === 0 ? max : 0;
            input.dispatchEvent(new Event("input"));
          });
        });

        btnAsignar.disabled = false;
      } else {
        tallasInputsContainer.style.display = "block";
        tallasInputsList.innerHTML =
          '<p class="no-data">Sin tallas disponibles para esta tarea</p>';
        btnAsignar.disabled = true;
      }

      cantidadGroup.style.display = "none";
    } else {
      // Sin tallas: comportamiento original
      tallasInputsContainer.style.display = "none";
      cantidadGroup.style.display = "block";

      const asignadas = tareaSeleccionada.asignaciones.reduce(
        (sum, a) => sum + a.cantidad,
        0,
      );
      const disponibles = tareaSeleccionada.unidadesTotales - asignadas;

      cantidadInput.disabled = false;
      cantidadInput.max = disponibles;
      cantidadInput.value = disponibles;
      document.getElementById("info-cantidad").textContent =
        `${disponibles} disponibles`;
      btnAsignar.disabled = false;
    }
  });

  // Función para validar inputs de tallas
  function validarInputsTallas() {
    let algunaCantidad = false;
    document.querySelectorAll(".talla-cantidad-input").forEach((input) => {
      const valor = parseInt(input.value) || 0;
      const max = parseInt(input.dataset.disponible) || 0;

      // Validar rango
      if (valor < 0) input.value = 0;
      if (valor > max) input.value = max;

      if (valor > 0) algunaCantidad = true;
    });

    btnAsignar.disabled = !algunaCantidad;
  }

  // Evento: Asignar
  btnAsignar.addEventListener("click", async function () {
    const trabajadorId = parseInt(selectTrabajador.value);

    const estaCreandoTarea = selectTarea.value === "crear";

    if (!trabajadorId || (!tareaSeleccionada && !estaCreandoTarea)) {
      mostrarMensaje("❌ Complete todos los campos");
      return;
    }

    try {
      const corteActual = await db.cortes.get(corteId);
      let tarea;

      if (estaCreandoTarea) {
        // Validar nombre y precio para nueva tarea
        const nombreTarea = nuevaTareaNombreInput
          ? nuevaTareaNombreInput.value.trim()
          : "";
        const precioTarea = parseInt(precioInput.value) || 0;

        if (!nombreTarea) {
          mostrarMensaje("❌ Ingrese el nombre de la tarea");
          return;
        }
        if (precioTarea <= 0) {
          mostrarMensaje("❌ Ingrese un precio válido (mayor a 0)");
          return;
        }

        // Crear nueva tarea
        const nuevaTarea = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nombre: nombreTarea,
          precioUnitario: precioTarea,
          unidadesTotales: corteActual.cantidadPrendas,
          asignaciones: [],
        };

        // Agregar al array de tareas del corte
        if (!corteActual.tareas) corteActual.tareas = [];
        corteActual.tareas.push(nuevaTarea);
        tarea = nuevaTarea;

        // Actualizar la tarea seleccionada para el resto del proceso
        tareaSeleccionada = nuevaTarea;
      } else {
        // Tarea existente
        tarea = corteActual.tareas.find((t) => t.id === tareaSeleccionada.id);
      }

      if (!tarea) {
        mostrarMensaje("❌ Tarea no encontrada");
        return;
      }

      // Actualizar el precio de la tarea si fue modificado
      const nuevoPrecio = parseInt(precioInput.value) || 0;
      if (nuevoPrecio !== tarea.precioUnitario) {
        tarea.precioUnitario = nuevoPrecio;
      }

      if (tieneTallas) {
        // Recoger cantidades por talla
        const asignacionesTallas = [];
        document.querySelectorAll(".talla-cantidad-input").forEach((input) => {
          const talla = input.dataset.talla;
          const cantidad = parseInt(input.value) || 0;
          const disponible = parseInt(input.dataset.disponible) || 0;

          if (cantidad > 0 && cantidad <= disponible) {
            asignacionesTallas.push({ talla, cantidad });
          }
        });

        if (asignacionesTallas.length === 0) {
          mostrarMensaje("❌ Ingrese al menos una cantidad válida");
          return;
        }

        // Crear asignaciones por cada talla
        const fecha = new Date().toISOString();
        if (!tarea.asignaciones) tarea.asignaciones = [];

        asignacionesTallas.forEach(({ talla, cantidad }) => {
          tarea.asignaciones.push({
            trabajadorId,
            cantidad,
            talla,
            fecha,
          });
        });
      } else {
        // Sin tallas: comportamiento original
        const cantidad = parseInt(cantidadInput.value);
        if (!cantidad || cantidad < 1) {
          mostrarMensaje("❌ Ingrese una cantidad válida");
          return;
        }

        if (!tarea.asignaciones) tarea.asignaciones = [];
        tarea.asignaciones.push({
          trabajadorId,
          cantidad,
          talla: null,
          fecha: new Date().toISOString(),
        });
      }

      await db.cortes.put(corteActual);
      mostrarMensaje("✅ Asignado correctamente");

      await cargarPestanaAsignar(corteId);
    } catch (e) {
      console.error(e);
      mostrarMensaje("❌ Error al asignar");
    }
  });
}

// Eliminar asignación
async function eliminarAsignacion(corteId, asignacion) {
  try {
    const corte = await db.cortes.get(corteId);
    if (!corte) return;

    const tarea = corte.tareas[asignacion.tareaIndex];
    if (!tarea) return;

    // Filtrar asignaciones que NO sean del trabajador seleccionado
    tarea.asignaciones = tarea.asignaciones.filter(
      (a) => a.trabajadorId !== asignacion.trabajadorId,
    );

    await db.cortes.put(corte);
    mostrarMensaje("✅ Asignación eliminada");

    // Recargar la pestaña
    await cargarPestanaAsignar(corteId);
  } catch (error) {
    console.error("Error al eliminar:", error);
    mostrarMensaje("❌ Error al eliminar asignación");
  }
}

// Función para mostrar modal de confirmación
function mostrarModalConfirmacion(titulo, mensaje, onConfirm) {
  // Crear overlay del modal
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
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
  document.body.style.overflow = "hidden";

  // Eventos
  document.getElementById("modal-cancel").addEventListener("click", () => {
    overlay.remove();
    document.body.style.overflow = "auto";
  });

  document.getElementById("modal-confirm").addEventListener("click", () => {
    overlay.remove();
    document.body.style.overflow = "auto";
    if (onConfirm) onConfirm();
  });

  // Cerrar al hacer clic fuera
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
      document.body.style.overflow = "auto";
    }
  });
}
