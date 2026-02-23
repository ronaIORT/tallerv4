// historial-pagos.js - Skill: Historial de Pagos a Trabajadores
import { db } from '../db.js';

// Estado del módulo: trabajador preseleccionado desde el resumen
let trabajadorPreseleccionado = null;

// ==========================================================================
// RENDER PRINCIPAL
// ==========================================================================
export function renderHistorialPagos() {
    const app = document.getElementById('app');
    trabajadorPreseleccionado = null;

    app.innerHTML = `
        <div class="mobile-container">
            <div class="header">
                <button class="back-btn" onclick="window.location.hash='#dashboard'">←</button>
                <h1 class="small-title">Historial de Pagos</h1>
            </div>

            <div class="tab-menu">
                <div class="tab-container">
                    <button class="tab-item active" data-tab="resumen">💼 Resumen</button>
                    <button class="tab-item" data-tab="registrar">➕ Registrar</button>
                    <button class="tab-item" data-tab="historial">📋 Historial</button>
                </div>
            </div>

            <div id="tab-content-pagos" class="tab-content">
                <div class="loading-item">
                    <div class="loading-line"></div>
                    <div class="loading-line short"></div>
                </div>
            </div>
        </div>
    `;

    inicializarTabsPagos();
    cargarTabResumen();
}

// ==========================================================================
// INICIALIZAR TABS
// ==========================================================================
function inicializarTabsPagos() {
    document.querySelectorAll('.tab-item').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.dataset.tab;
            switch (tab) {
                case 'resumen':
                    await cargarTabResumen();
                    break;
                case 'registrar':
                    await cargarTabRegistrar();
                    break;
                case 'historial':
                    await cargarTabHistorial();
                    break;
            }
        });
    });
}

// ==========================================================================
// TAB 1: RESUMEN
// ==========================================================================
async function cargarTabResumen() {
    const content = document.getElementById('tab-content-pagos');
    content.innerHTML = `
        <div class="loading-item"><div class="loading-line"></div><div class="loading-line short"></div></div>
        <div class="loading-item"><div class="loading-line"></div><div class="loading-line short"></div></div>
    `;

    try {
        const trabajadores = await db.trabajadores.toArray();

        if (trabajadores.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👷</div>
                    <p class="empty-text">No hay trabajadores registrados</p>
                    <p class="empty-subtext">Agrega trabajadores en la sección de Trabajadores</p>
                </div>
            `;
            return;
        }

        // Calcular datos financieros para cada trabajador
        const datos = await Promise.all(trabajadores.map(async t => {
            const ganado    = await calcularGananciasTotal(t.id);
            const pagado    = await calcularTotalPagado(t.id);
            const pendiente = Math.max(0, ganado - pagado);
            return { ...t, ganado, pagado, pendiente };
        }));

        // Ordenar: primero los que tienen saldo pendiente
        datos.sort((a, b) => b.pendiente - a.pendiente);

        const totalPendienteGlobal = datos.reduce((s, d) => s + d.pendiente, 0);
        const totalPagadoGlobal    = datos.reduce((s, d) => s + d.pagado,    0);

        content.innerHTML = `
            <div class="pagos-resumen-global">
                <div class="global-stat-card pendiente-card">
                    <div class="global-stat-icon">⏳</div>
                    <div class="global-stat-info">
                        <span class="global-stat-value">$${totalPendienteGlobal.toFixed(2)}</span>
                        <span class="global-stat-label">Total Pendiente</span>
                    </div>
                </div>
                <div class="global-stat-card pagado-card">
                    <div class="global-stat-icon">✅</div>
                    <div class="global-stat-info">
                        <span class="global-stat-value">$${totalPagadoGlobal.toFixed(2)}</span>
                        <span class="global-stat-label">Total Pagado</span>
                    </div>
                </div>
            </div>

            <div class="pagos-trabajadores-list">
                ${datos.map(t => `
                    <div class="pago-worker-card ${t.pendiente > 0 ? 'tiene-pendiente' : 'al-dia'}">
                        <div class="pago-worker-header">
                            <div class="pago-worker-info">
                                <h3 class="pago-worker-name">${t.nombre}</h3>
                                <span class="pago-worker-badge ${t.pendiente > 0 ? 'badge-pendiente' : 'badge-al-dia'}">
                                    ${t.pendiente > 0 ? '⚠️ Pendiente' : '✅ Al día'}
                                </span>
                            </div>
                            ${t.pendiente > 0 ? `
                                <button class="btn-pagar" onclick="irARegistrarPago(${t.id})">
                                    💳 Pagar
                                </button>
                            ` : ''}
                        </div>
                        <div class="pago-worker-stats">
                            <div class="pago-stat">
                                <span class="pago-stat-label">Total Ganado</span>
                                <span class="pago-stat-value valor-ganado">$${t.ganado.toFixed(2)}</span>
                            </div>
                            <div class="pago-stat">
                                <span class="pago-stat-label">Total Pagado</span>
                                <span class="pago-stat-value valor-pagado">$${t.pagado.toFixed(2)}</span>
                            </div>
                            <div class="pago-stat destacado">
                                <span class="pago-stat-label">Pendiente</span>
                                <span class="pago-stat-value ${t.pendiente > 0 ? 'valor-pendiente' : 'valor-cero'}">
                                    $${t.pendiente.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Exponer función global para ir a registrar con trabajador preseleccionado
        window.irARegistrarPago = (trabajadorId) => {
            trabajadorPreseleccionado = trabajadorId;
            document.querySelector('[data-tab="registrar"]').click();
        };

    } catch (error) {
        console.error('Error al cargar resumen de pagos:', error);
        content.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p class="error-text">Error al cargar los datos</p>
                <button class="action-btn" onclick="cargarTabResumen()">Reintentar</button>
            </div>
        `;
    }
}

// ==========================================================================
// TAB 2: REGISTRAR PAGO
// ==========================================================================
async function cargarTabRegistrar() {
    const content = document.getElementById('tab-content-pagos');
    content.innerHTML = `
        <div class="loading-item"><div class="loading-line"></div><div class="loading-line short"></div></div>
    `;

    try {
        const trabajadores = await db.trabajadores.toArray();

        if (trabajadores.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👷</div>
                    <p class="empty-text">No hay trabajadores registrados</p>
                    <p class="empty-subtext">Agrega trabajadores primero</p>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="registrar-pago-form">
                <div class="form-card">
                    <h2 class="section-title">Registrar Nuevo Pago</h2>

                    <div class="form-group">
                        <label for="select-trabajador-pago">Trabajador</label>
                        <select id="select-trabajador-pago" class="form-control" onchange="actualizarInfoTrabajador()">
                            <option value="">Seleccionar trabajador...</option>
                            ${trabajadores.map(t => `
                                <option value="${t.id}" ${trabajadorPreseleccionado === t.id ? 'selected' : ''}>
                                    ${t.nombre}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div id="info-trabajador-pago" class="info-trabajador-pago" style="display:none;">
                        <div class="info-pago-row">
                            <span>💰 Total Ganado:</span>
                            <span id="info-ganado" class="info-value valor-ganado">$0.00</span>
                        </div>
                        <div class="info-pago-row">
                            <span>✅ Total Pagado:</span>
                            <span id="info-pagado" class="info-value valor-pagado">$0.00</span>
                        </div>
                        <div class="info-pago-row info-pago-row-destacada">
                            <span>⏳ Saldo Pendiente:</span>
                            <span id="info-pendiente" class="info-value valor-pendiente">$0.00</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="monto-pago">Monto a Pagar ($)</label>
                        <input type="number" id="monto-pago" class="form-control"
                               placeholder="0.00" min="0.01" step="0.01">
                        <small id="error-monto" class="error-message"></small>
                    </div>

                    <div class="form-group">
                        <label for="notas-pago">Notas <span class="label-opcional">(opcional)</span></label>
                        <textarea id="notas-pago" class="form-control textarea-pago"
                                  placeholder="Ej: Semana del 01/06, Pago parcial..."></textarea>
                    </div>

                    <button class="btn-primary btn-registrar-pago" id="btn-guardar-pago" onclick="guardarPago()">
                        💳 Registrar Pago
                    </button>
                </div>
            </div>
        `;

        // Exponer funciones globales
        window.actualizarInfoTrabajador = async () => {
            const select      = document.getElementById('select-trabajador-pago');
            const trabajadorId = parseInt(select.value);
            const infoDiv     = document.getElementById('info-trabajador-pago');

            if (!trabajadorId) {
                infoDiv.style.display = 'none';
                document.getElementById('monto-pago').value = '';
                return;
            }

            const ganado    = await calcularGananciasTotal(trabajadorId);
            const pagado    = await calcularTotalPagado(trabajadorId);
            const pendiente = Math.max(0, ganado - pagado);

            document.getElementById('info-ganado').textContent    = `$${ganado.toFixed(2)}`;
            document.getElementById('info-pagado').textContent    = `$${pagado.toFixed(2)}`;
            document.getElementById('info-pendiente').textContent = `$${pendiente.toFixed(2)}`;
            document.getElementById('info-pendiente').className   =
                `info-value ${pendiente > 0 ? 'valor-pendiente' : 'valor-cero'}`;

            // Pre-llenar con el saldo pendiente
            document.getElementById('monto-pago').value = pendiente > 0 ? pendiente.toFixed(2) : '';
            infoDiv.style.display = 'flex';
        };

        window.guardarPago = async () => {
            const select      = document.getElementById('select-trabajador-pago');
            const trabajadorId = parseInt(select.value);
            const montoInput  = document.getElementById('monto-pago');
            const notas       = document.getElementById('notas-pago').value.trim();
            const errorEl     = document.getElementById('error-monto');
            const btn         = document.getElementById('btn-guardar-pago');

            // Limpiar errores previos
            errorEl.textContent = '';
            montoInput.classList.remove('error');

            // Validar trabajador
            if (!trabajadorId) {
                mostrarToast('⚠️ Selecciona un trabajador');
                return;
            }

            // Validar monto
            const monto = parseFloat(montoInput.value);
            if (!monto || isNaN(monto) || monto <= 0) {
                errorEl.textContent = 'Ingresa un monto válido mayor a $0';
                montoInput.classList.add('error');
                return;
            }

            // Validar que no supere el pendiente
            const ganado    = await calcularGananciasTotal(trabajadorId);
            const pagado    = await calcularTotalPagado(trabajadorId);
            const pendiente = Math.max(0, ganado - pagado);

            if (monto > pendiente + 0.001) {
                errorEl.textContent = `El monto ($${monto.toFixed(2)}) supera el saldo pendiente ($${pendiente.toFixed(2)})`;
                montoInput.classList.add('error');
                return;
            }

            // Guardar
            try {
                btn.disabled    = true;
                btn.textContent = 'Guardando...';

                const trabajador = await db.trabajadores.get(trabajadorId);
                await db.pagos.add({
                    trabajadorId,
                    trabajadorNombre: trabajador.nombre,
                    fecha:  new Date().toISOString(),
                    monto,
                    notas: notas || ''
                });

                trabajadorPreseleccionado = null;
                mostrarToast('✅ Pago registrado correctamente');

                // Volver al resumen después de un momento
                setTimeout(() => {
                    document.querySelector('[data-tab="resumen"]').click();
                }, 600);

            } catch (error) {
                console.error('Error al guardar pago:', error);
                mostrarToast('❌ Error al guardar el pago');
                btn.disabled    = false;
                btn.textContent = '💳 Registrar Pago';
            }
        };

        // Si hay trabajador preseleccionado, cargar su info automáticamente
        if (trabajadorPreseleccionado) {
            await window.actualizarInfoTrabajador();
        }

    } catch (error) {
        console.error('Error al cargar formulario de registro:', error);
        content.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p class="error-text">Error al cargar el formulario</p>
            </div>
        `;
    }
}

// ==========================================================================
// TAB 3: HISTORIAL
// ==========================================================================
async function cargarTabHistorial(filtroTrabajadorId = null) {
    const content = document.getElementById('tab-content-pagos');
    content.innerHTML = `
        <div class="loading-item"><div class="loading-line"></div><div class="loading-line short"></div></div>
        <div class="loading-item"><div class="loading-line"></div><div class="loading-line short"></div></div>
    `;

    try {
        const trabajadores = await db.trabajadores.toArray();
        let pagos;

        if (filtroTrabajadorId) {
            pagos = await db.pagos
                .where('trabajadorId').equals(filtroTrabajadorId)
                .reverse()
                .sortBy('fecha');
        } else {
            pagos = await db.pagos.orderBy('fecha').reverse().toArray();
        }

        const totalFiltrado = pagos.reduce((s, p) => s + p.monto, 0);

        content.innerHTML = `
            <div class="historial-container">

                <div class="historial-filtros">
                    <select id="filtro-trabajador-historial" class="form-control" onchange="filtrarHistorial()">
                        <option value="">Todos los trabajadores</option>
                        ${trabajadores.map(t => `
                            <option value="${t.id}" ${filtroTrabajadorId === t.id ? 'selected' : ''}>
                                ${t.nombre}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="historial-summary">
                    <span class="historial-count">
                        ${pagos.length} pago${pagos.length !== 1 ? 's' : ''}
                    </span>
                    <span class="historial-total">Total: $${totalFiltrado.toFixed(2)}</span>
                </div>

                ${pagos.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <p class="empty-text">No hay pagos registrados</p>
                        <p class="empty-subtext">Los pagos que registres aparecerán aquí</p>
                    </div>
                ` : `
                    <div class="pagos-list">
                        ${pagos.map(pago => `
                            <div class="pago-item" data-id="${pago.id}">
                                <div class="pago-item-header">
                                    <div class="pago-item-info">
                                        <span class="pago-item-nombre">👤 ${pago.trabajadorNombre}</span>
                                        <span class="pago-item-fecha">📅 ${formatFecha(pago.fecha)}</span>
                                    </div>
                                    <div class="pago-item-right">
                                        <span class="pago-item-monto">$${pago.monto.toFixed(2)}</span>
                                        <button class="btn-eliminar-pago"
                                                onclick="confirmarEliminarPago(${pago.id})"
                                                title="Eliminar pago">🗑️</button>
                                    </div>
                                </div>
                                ${pago.notas ? `
                                    <p class="pago-item-notas">"${pago.notas}"</p>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;

        // Exponer funciones globales
        window.filtrarHistorial = async () => {
            const select      = document.getElementById('filtro-trabajador-historial');
            const trabajadorId = select.value ? parseInt(select.value) : null;
            await cargarTabHistorial(trabajadorId);
        };

        window.confirmarEliminarPago = (pagoId) => {
            mostrarModalEliminar(pagoId);
        };

    } catch (error) {
        console.error('Error al cargar historial:', error);
        content.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p class="error-text">Error al cargar el historial</p>
            </div>
        `;
    }
}

// ==========================================================================
// MODAL CONFIRMAR ELIMINACIÓN
// ==========================================================================
function mostrarModalEliminar(pagoId) {
    const anterior = document.querySelector('.modal-overlay');
    if (anterior) anterior.remove();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="modal-overlay" onclick="cerrarModalPago(event)">
            <div class="modal-container">
                <h3 class="modal-title">🗑️ Eliminar Pago</h3>
                <p class="modal-message">
                    ¿Estás seguro de eliminar este pago?<br>
                    Esta acción <strong>no se puede deshacer</strong>.
                </p>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="cerrarModalPago()">Cancelar</button>
                    <button class="btn-danger"    onclick="ejecutarEliminarPago(${pagoId})">Eliminar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(wrapper);
    document.body.style.overflow = 'hidden';

    window.cerrarModalPago = (event) => {
        const overlay = document.querySelector('.modal-overlay');
        if (!overlay) return;
        if (event && !event.target.classList.contains('modal-overlay')) return;
        document.body.style.overflow = 'auto';
        overlay.remove();
    };

    window.ejecutarEliminarPago = async (id) => {
        try {
            await db.pagos.delete(id);
            document.body.style.overflow = 'auto';
            document.querySelector('.modal-overlay')?.remove();
            mostrarToast('✅ Pago eliminado');
            // Recargar historial conservando filtro activo
            const select       = document.getElementById('filtro-trabajador-historial');
            const trabajadorId = select?.value ? parseInt(select.value) : null;
            await cargarTabHistorial(trabajadorId);
        } catch (error) {
            console.error('Error al eliminar pago:', error);
            mostrarToast('❌ Error al eliminar el pago');
        }
    };
}

// ==========================================================================
// CÁLCULOS
// ==========================================================================

// Total ganado en TODOS los cortes (activos + terminados)
async function calcularGananciasTotal(trabajadorId) {
    try {
        const cortes = await db.cortes.toArray();
        return cortes.reduce((total, corte) => {
            return total + corte.tareas.reduce((sumTareas, tarea) => {
                const asignaciones = tarea.asignaciones.filter(a => a.trabajadorId === trabajadorId);
                return sumTareas + asignaciones.reduce((sum, a) => sum + (a.cantidad * tarea.precioUnitario), 0);
            }, 0);
        }, 0);
    } catch (error) {
        console.error('Error al calcular ganancias totales:', error);
        return 0;
    }
}

// Total de pagos ya registrados para el trabajador
async function calcularTotalPagado(trabajadorId) {
    try {
        const pagos = await db.pagos.where('trabajadorId').equals(trabajadorId).toArray();
        return pagos.reduce((total, pago) => total + pago.monto, 0);
    } catch (error) {
        console.error('Error al calcular total pagado:', error);
        return 0;
    }
}

// ==========================================================================
// UTILIDADES
// ==========================================================================

function formatFecha(fechaISO) {
    const d   = new Date(fechaISO);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    const hora = d.getHours().toString().padStart(2, '0');
    const min  = d.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${anio} ${hora}:${min}`;
}

function mostrarToast(mensaje) {
    const anterior = document.querySelector('.toast-message');
    if (anterior) anterior.remove();

    const app   = document.getElementById('app');
    const toast = document.createElement('div');
    toast.className   = 'toast-message';
    toast.textContent = mensaje;
    app.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}
