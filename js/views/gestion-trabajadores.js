// gestion-trabajadores.js - Versión tema oscuro compacto
import { db } from '../db.js';

export function renderGestionTrabajadores() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="mobile-container">
      <div class="header">
        <button onclick="location.hash='#dashboard'" class="back-btn">←</button>
        <h1 class="small-title">Gestión de Trabajadores</h1>
      </div>
      
      <div class="form-section">
        <div class="form-card">
          <h2 class="section-title">Agregar Nuevo Trabajador</h2>
          <div class="form-group">
            <label for="nombre-trabajador">Nombre del Trabajador</label>
            <input type="text" id="nombre-trabajador" class="form-control" placeholder="Ingrese nombre completo">
            <small id="error-nombre" class="error-message"></small>
          </div>
          <button id="btn-agregar" class="btn-primary">Agregar Trabajador</button>
        </div>
      </div>
      
      <div class="workers-section">
        <div class="section-header">
          <h2 class="section-title">Trabajadores Registrados</h2>
          <button class="refresh-btn" onclick="cargarTrabajadores()">↻</button>
        </div>
        <div id="lista-trabajadores" class="workers-list">
          <div class="loading-item">
            <div class="loading-line"></div>
            <div class="loading-line short"></div>
          </div>
        </div>
      </div>
    </div>
  `;

    // Cargar trabajadores existentes
    cargarTrabajadores();

    // Eventos
    document.getElementById('btn-agregar').addEventListener('click', agregarTrabajador);
    document.getElementById('nombre-trabajador').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') agregarTrabajador();
    });
}

// Cargar trabajadores existentes y sus ganancias
async function cargarTrabajadores() {
    try {
        const lista = document.getElementById('lista-trabajadores');
        const trabajadores = await db.trabajadores.toArray();

        if (trabajadores.length === 0) {
            lista.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👷</div>
                    <p class="empty-text">No hay trabajadores registrados</p>
                    <p class="empty-subtext">Agrega el primer trabajador usando el formulario</p>
                </div>
            `;
            return;
        }

        // Calcular ganancias para cada trabajador
        const trabajadoresConGanancias = await Promise.all(
            trabajadores.map(async trabajador => {
                const ganancias = await calcularGananciasTrabajador(trabajador.id);
                return { ...trabajador, ganancias };
            })
        );

        // Ordenar por ganancias (mayor a menor)
        trabajadoresConGanancias.sort((a, b) => b.ganancias - a.ganancias);

        // Renderizar lista
        lista.innerHTML = trabajadoresConGanancias.map(trabajador => `
      <div class="worker-card" data-id="${trabajador.id}">
        <div class="worker-card-main">
          <div class="worker-info">
            <h3 class="worker-name" id="nombre-${trabajador.id}">${trabajador.nombre}</h3>
            <div class="worker-meta">
              <span class="worker-id">ID: ${trabajador.id}</span>
              <span class="worker-status active">Activo</span>
            </div>
          </div>
          <div class="worker-earnings">
            <span class="earnings-label">Ganancias Activas</span>
            <span class="earnings-value positive">$${trabajador.ganancias.toFixed(2)}</span>
          </div>
        </div>
        <div class="worker-actions">
          <button class="action-btn edit" onclick="editarTrabajador(${trabajador.id})">
            <span class="action-icon">✏️</span>
            <span class="action-text">Editar</span>
          </button>
          <button class="action-btn delete" onclick="eliminarTrabajador(${trabajador.id})">
            <span class="action-icon">🗑️</span>
            <span class="action-text">Eliminar</span>
          </button>
        </div>
      </div>
    `).join('');
    } catch (error) {
        console.error("Error al cargar trabajadores:", error);
        document.getElementById('lista-trabajadores').innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p class="error-text">Error al cargar trabajadores</p>
                <button class="action-btn" onclick="cargarTrabajadores()">Reintentar</button>
            </div>
        `;
    }
}

// Agregar nuevo trabajador
async function agregarTrabajador() {
    const input = document.getElementById('nombre-trabajador');
    const nombre = input.value.trim();
    const errorEl = document.getElementById('error-nombre');

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
        // Verificar si ya existe un trabajador con ese nombre
        const trabajadorExistente = await db.trabajadores
            .where('nombre')
            .equalsIgnoreCase(nombre)
            .first();

        if (trabajadorExistente) {
            errorEl.textContent = 'Ya existe un trabajador con este nombre';
            input.classList.add('error');
            return;
        }

        // Guardar nuevo trabajador
        await db.trabajadores.add({ nombre });

        // Feedback visual
        input.value = '';
        mostrarMensaje('✅ Trabajador agregado correctamente');

        // Recargar lista
        cargarTrabajadores();
    } catch (error) {
        console.error("Error al agregar trabajador:", error);
        errorEl.textContent = 'Error al guardar. Intente nuevamente.';
        input.classList.add('error');
    }
}

// Editar trabajador existente
window.editarTrabajador = async function (id) {
    const workerCard = document.querySelector(`.worker-card[data-id="${id}"]`);
    const nombreActual = workerCard.querySelector('.worker-name').textContent;

    const nuevoNombre = prompt('Editar nombre del trabajador:', nombreActual);

    if (nuevoNombre === null || nuevoNombre.trim() === '' || nuevoNombre.trim() === nombreActual) {
        return;
    }

    const nombreLimpiado = nuevoNombre.trim();

    try {
        // Verificar si ya existe un trabajador con el nuevo nombre
        const trabajadorExistente = await db.trabajadores
            .where('nombre')
            .equalsIgnoreCase(nombreLimpiado)
            .first();

        if (trabajadorExistente && trabajadorExistente.id !== id) {
            mostrarMensaje('❌ Ya existe un trabajador con este nombre');
            return;
        }

        // Actualizar trabajador
        await db.trabajadores.update(id, { nombre: nombreLimpiado });

        // Actualizar visualmente
        workerCard.querySelector('.worker-name').textContent = nombreLimpiado;
        mostrarMensaje('✅ Nombre actualizado correctamente');
    } catch (error) {
        console.error("Error al editar trabajador:", error);
        mostrarMensaje('❌ Error al actualizar. Intente nuevamente.');
    }
};

// Eliminar trabajador
window.eliminarTrabajador = async function (id) {
    const workerCard = document.querySelector(`.worker-card[data-id="${id}"]`);
    const nombre = workerCard.querySelector('.worker-name').textContent;

    const modalHTML = `
        <div class="modal-overlay" onclick="cerrarModal(event)">
            <div class="modal-container">
                <h3 class="modal-title">⚠️ Confirmar Eliminación</h3>
                <p class="modal-message">
                    ¿Está seguro de eliminar al trabajador <strong>"${nombre}"</strong>?
                </p>
                <p class="warning-message">
                    ⚠️ Esta acción no se puede deshacer.
                </p>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="cerrarModal()">Cancelar</button>
                    <button class="btn-danger" onclick="confirmarEliminarTrabajador(${id})">Eliminar</button>
                </div>
            </div>
        </div>
    `;

    mostrarModal(modalHTML);
};

// Función auxiliar para mostrar modal
function mostrarModal(contenidoHTML) {
    const modalExistente = document.querySelector('.modal-overlay');
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.innerHTML = contenidoHTML;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

// Función auxiliar para cerrar modal
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

// Confirmar eliminación de trabajador
window.confirmarEliminarTrabajador = async function (id) {
    try {
        // Verificar si tiene tareas asignadas en cortes activos
        const tieneTareas = await db.cortes
            .where('estado')
            .equals('activo')
            .toArray()
            .then(cortes => {
                return cortes.some(corte =>
                    corte.tareas.some(tarea =>
                        tarea.asignaciones.some(asignacion => asignacion.trabajadorId === id)
                    )
                );
            });

        if (tieneTareas) {
            mostrarMensaje('❌ No se puede eliminar: tiene tareas en cortes activos');
            cerrarModal();
            return;
        }

        // Eliminar trabajador
        await db.trabajadores.delete(id);

        cerrarModal();
        mostrarMensaje('✅ Trabajador eliminado correctamente');

        // Recargar lista
        cargarTrabajadores();
    } catch (error) {
        console.error("Error al eliminar trabajador:", error);
        mostrarMensaje('❌ Error al eliminar. Intente nuevamente.');
        cerrarModal();
    }
};

// Calcular ganancias de un trabajador en cortes activos
async function calcularGananciasTrabajador(trabajadorId) {
    try {
        const cortesActivos = await db.cortes.where('estado').equals('activo').toArray();

        return cortesActivos.reduce((total, corte) => {
            return total + corte.tareas.reduce((sumTareas, tarea) => {
                const asignaciones = tarea.asignaciones.filter(a => a.trabajadorId === trabajadorId);
                return sumTareas + asignaciones.reduce((sum, a) => {
                    return sum + (a.cantidad * tarea.precioUnitario);
                }, 0);
            }, 0);
        }, 0);
    } catch (error) {
        console.error("Error al calcular ganancias:", error);
        return 0;
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
window.cargarTrabajadores = cargarTrabajadores;
window.cerrarModal = cerrarModal;