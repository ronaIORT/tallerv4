// app.js - Enrutador con soporte para rutas dinámicas (VERSIÓN TEMA OSCURO COMPACTO)
import { db } from './db.js';
import { renderNuevoCorte } from './views/nuevo-corte.js';
import { renderGestionTrabajadores } from './views/gestion-trabajadores.js';
import { renderGestionPrendas, renderVerPrenda, renderEditarPrenda } from './views/gestion-prendas.js';
import { renderAdministrarTareas } from './views/administrar-tareas.js';

// Función para cargar una vista
async function cargarVista(ruta) {
    const app = document.getElementById('app');

    // Rutas estáticas
    if (ruta === '#dashboard') {
        app.innerHTML = `
            <div class="mobile-container">
                <div class="header">
                    <h1 class="small-title">Dashboard</h1>
                </div>
                
                <div class="dashboard-content">
                    <!-- Modificar stats-grid para más métricas -->
                    <div class="stats-grid" id="estadisticas">
                        <div class="stat-card">
                            <div class="stat-icon">📊</div>
                            <div class="stat-content">
                                <div class="stat-value" data-prefix="">5</div>
                                <div class="stat-label">Cortes Activos</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💰</div>
                            <div class="stat-content">
                                <div class="stat-value" data-prefix="$">2,540</div>
                                <div class="stat-label">Ganancias Totales</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">👷</div>
                            <div class="stat-content">
                                <div class="stat-value" data-prefix="">8</div>
                                <div class="stat-label">Trabajadores</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">⚡</div>
                            <div class="stat-content">
                                <div class="stat-value" data-prefix="">75%</div>
                                <div class="stat-label">Eficiencia</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Acciones rápidas -->
                    <div class="quick-actions">
                        <button class="action-btn primary" onclick="window.location.hash='#nuevo-corte'">
                            <span class="action-icon">✂️</span>
                            <span class="action-text">Nuevo Corte</span>
                        </button>
                        <button class="action-btn" onclick="window.location.hash='#gestion-trabajadores'">
                            <span class="action-icon">👷</span>
                            <span class="action-text">Trabajadores</span>
                        </button>
                        <button class="action-btn" onclick="window.location.hash='#gestion-prendas'">
                            <span class="action-icon">👕</span>
                            <span class="action-text">Prendas</span>
                        </button>
                    </div>
                    
                    <!-- Cortes recientes -->
                    <div class="recent-section">
                        <div class="section-header">
                            <h2 class="section-title">Cortes</h2>
                            <button class="refresh-btn" onclick="cargarCortesRecientes()">↻</button>
                        </div>                        
                        <!-- 🔍 NUEVA BARRA DE BÚSQUEDA -->
                        <div class="search-filters">
                            <div class="search-container">
                                <input type="text" class="search-input" 
                                    placeholder="🔍 Buscar por nombre, fecha o cantidad...">
                                <button class="search-clear" title="Limpiar búsqueda">✕</button>
                            </div>
                            <div class="filter-buttons">
                                <button class="filter-btn active" data-filter="all">Todos</button>
                                <button class="filter-btn" data-filter="activo">Activos</button>
                                <button class="filter-btn" data-filter="terminado">Terminados</button>
                                <button class="filter-btn" data-filter="reciente">Última semana</button>
                            </div>
                        </div>
                        <div id="lista-cortes" class="cortes-list">
                            <div class="loading-item">
                                <div class="loading-line"></div>
                                <div class="loading-line short"></div>
                            </div>
                            <div class="loading-item">
                                <div class="loading-line"></div>
                                <div class="loading-line short"></div>
                            </div>
                        </div>
                    </div>                    
                    <div class="help-cards">
                        <div class="help-card">
                            <h3>📈 Consejos de Productividad</h3>
                            <p>Mejora la eficiencia de tu taller:</p>
                            <ul>
                                <li>Asigna tareas en lotes</li>
                                <li>Revisa el progreso diario</li>
                                <li>Finaliza cortes a tiempo</li>
                            </ul>
                        </div>
                        
                        <div class="help-card">
                            <h3>💰 Optimiza Ganancias</h3>
                            <p>Maximiza tus beneficios:</p>
                            <ul>
                                <li>Controla costos de mano de obra</li>
                                <li>Monitorea tiempos de producción</li>
                                <li>Analiza ganancias por prenda</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Cargar estadísticas reales
        await cargarEstadisticas();
        cargarCortesRecientes();
        setTimeout(() => inicializarBusqueda(), 100);
        return;
    }

    // Rutas dinámicas (administrar-tareas/ID)
    if (ruta.startsWith('#administrar-tareas/')) {
        const partes = ruta.split('/');
        const corteId = parseInt(partes[1]);
        if (!isNaN(corteId)) {
            renderAdministrarTareas(corteId);
            return;
        }
    }

    // Rutas dinámicas (ver-prenda/ID)
    if (ruta.startsWith('#ver-prenda/')) {
        const partes = ruta.split('/');
        const prendaId = parseInt(partes[1]);
        if (!isNaN(prendaId)) {
            renderVerPrenda(prendaId);
            return;
        }
    }

    // Rutas dinámicas (editar-prenda/ID)
    if (ruta.startsWith('#editar-prenda/')) {
        const partes = ruta.split('/');
        const prendaId = parseInt(partes[1]);
        if (!isNaN(prendaId)) {
            renderEditarPrenda(prendaId);
            return;
        }
    }

    // Otras rutas
    switch (ruta) {
        case '#nuevo-corte':
            renderNuevoCorte();
            break;

        case '#gestion-trabajadores':
            renderGestionTrabajadores();
            break;

        case '#gestion-prendas':
            renderGestionPrendas();
            break;

        default:
            app.innerHTML = `
                <div class="mobile-container">
                    <div class="header">
                        <button class="back-btn" onclick="window.location.hash='#dashboard'">←</button>
                        <h1 class="small-title">Error 404</h1>
                    </div>
                    <div class="error-container">
                        <div class="error-icon">❌</div>
                        <h3>Página no encontrada</h3>
                        <p>La ruta solicitada no existe</p>
                        <button class="action-btn primary" onclick="window.location.hash='#dashboard'">
                            Volver al Dashboard
                        </button>
                    </div>
                </div>
            `;
    }
}

// Cargar estadísticas desde la DB
// Cargar estadísticas desde la DB
async function cargarEstadisticas() {
    try {
        const cortesActivos = await db.cortes.where('estado').equals('activo').count();

        // Obtener todos los cortes terminados
        const cortesTerminados = await db.cortes.where('estado').equals('terminado').toArray();

        // Calcular ganancias REALES totales (solo cortes terminados)
        const gananciasRealesTotales = cortesTerminados.reduce((total, corte) => {
            const totalVenta = corte.cantidadPrendas * corte.precioVentaUnitario;

            // Calcular mano de obra REAL del corte (solo lo asignado)
            const totalManoObraReal = corte.tareas.reduce((sum, tarea) => {
                const cantidadAsignada = tarea.asignaciones.reduce((t, asignacion) => {
                    return t + asignacion.cantidad;
                }, 0);
                return sum + (tarea.precioUnitario * cantidadAsignada);
            }, 0);

            return total + (totalVenta - totalManoObraReal);
        }, 0);

        // Calcular cantidad de trabajadores
        const trabajadoresCount = await db.trabajadores.count();

        // Calcular eficiencia promedio (tareas asignadas / tareas totales)
        let tareasAsignadasTotal = 0;
        let tareasTotalesTotal = 0;

        const cortesActivosArray = await db.cortes.where('estado').equals('activo').toArray();
        cortesActivosArray.forEach(corte => {
            const tareasAsignadas = corte.tareas.reduce((total, tarea) => {
                return total + (tarea.asignaciones ? tarea.asignaciones.length : 0);
            }, 0);
            tareasAsignadasTotal += tareasAsignadas;
            tareasTotalesTotal += corte.tareas.length;
        });

        const eficienciaPromedio = tareasTotalesTotal > 0
            ? Math.round((tareasAsignadasTotal / tareasTotalesTotal) * 100)
            : 0;

        // Actualizar tarjetas de estadísticas
        const statsContainer = document.getElementById('estadisticas');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-value">${cortesActivos}</div>
                        <div class="stat-label">Cortes Activos</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-content">
                        <div class="stat-value">$${gananciasRealesTotales.toFixed(0)}</div>
                        <div class="stat-label">Ganancias Reales</div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error al cargar estadísticas:", error);
        const statsContainer = document.getElementById('estadisticas');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card error">
                    <div class="stat-icon">⚠️</div>
                    <div class="stat-content">
                        <div class="stat-value">Error</div>
                        <div class="stat-label">Cargar de nuevo</div>
                    </div>
                </div>
            `;
        }
    }
}

// Cargar cortes recientes en el dashboard
async function cargarCortesRecientes() {
    const listaCortes = document.getElementById('lista-cortes');
    if (!listaCortes) return;

    try {
        // Mostrar estado de carga
        listaCortes.innerHTML = `
            <div class="loading-item">
                <div class="loading-line"></div>
                <div class="loading-line short"></div>
            </div>
        `;

        // Obtener todos los cortes ordenados por fecha (más reciente primero)
        const cortes = await db.cortes
            .orderBy('fechaCreacion')
            .reverse()
            .limit(10)
            .toArray();

        await renderizarCortes(cortes);

    } catch (error) {
        console.error("Error al cargar cortes recientes:", error);
        listaCortes.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p class="error-text">Error al cargar cortes</p>
                <button class="action-btn" onclick="cargarCortesRecientes()">
                    Reintentar
                </button>
            </div>
        `;
    }
}

// ===========================================================================
// 🔍 NUEVO CÓDIGO A AÑADIR AQUÍ (después de cargarCortesRecientes)
// ===========================================================================

// Función para inicializar la búsqueda en el dashboard
function inicializarBusqueda() {
    const searchInput = document.querySelector('.search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Configurar búsqueda por texto
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const term = e.target.value.toLowerCase();
            await filtrarCortes(term);
        });

        // Limpiar búsqueda con botón (opcional)
        const clearBtn = document.querySelector('.search-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                filtrarCortes('');
            });
        }
    }

    // Configurar filtros por botones
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                // Quitar active de todos
                filterButtons.forEach(b => b.classList.remove('active'));
                // Añadir active al clickeado
                btn.classList.add('active');

                const filterType = btn.dataset.filter;
                await aplicarFiltro(filterType);
            });
        });
    }
}

// Filtrar cortes por texto de búsqueda
async function filtrarCortes(termino) {
    try {
        // Obtener todos los cortes ordenados por fecha
        const cortes = await db.cortes
            .orderBy('fechaCreacion')
            .reverse()
            .limit(50)  // Aumentar límite para búsqueda
            .toArray();

        // Aplicar filtro de texto
        const filtrados = cortes.filter(corte => {
            const nombre = (corte.nombreCorte || corte.nombrePrendaOriginal || corte.nombrePrenda || '').toLowerCase();
            const fecha = formatDate(corte.fechaCreacion).toLowerCase();

            return nombre.includes(termino) ||
                fecha.includes(termino) ||
                corte.cantidadPrendas.toString().includes(termino);
        });

        // Renderizar resultados filtrados
        await renderizarCortes(filtrados);

    } catch (error) {
        console.error("Error al filtrar cortes:", error);
        mostrarMensaje('❌ Error al buscar cortes');
    }
}

// Aplicar filtro por tipo (activo, terminado, etc.)
async function aplicarFiltro(tipo) {
    try {
        let cortes;

        switch (tipo) {
            case 'activo':
                cortes = await db.cortes
                    .where('estado').equals('activo')
                    .reverse()
                    .sortBy('fechaCreacion');
                break;

            case 'terminado':
                cortes = await db.cortes
                    .where('estado').equals('terminado')
                    .reverse()
                    .sortBy('fechaCreacion');
                break;

            case 'reciente':
                // Últimos 7 días
                const fechaLimite = new Date();
                fechaLimite.setDate(fechaLimite.getDate() - 7);

                cortes = await db.cortes
                    .filter(corte => new Date(corte.fechaCreacion) > fechaLimite)
                    .reverse()
                    .sortBy('fechaCreacion');
                break;

            default: // 'all' o cualquier otro
                cortes = await db.cortes
                    .orderBy('fechaCreacion')
                    .reverse()
                    .limit(50)
                    .toArray();
        }

        await renderizarCortes(cortes);

    } catch (error) {
        console.error("Error al aplicar filtro:", error);
        mostrarMensaje('❌ Error al filtrar cortes');
    }
}

// Renderizar cortes en la lista (versión mejorada)
async function renderizarCortes(cortes) {
    const listaCortes = document.getElementById('lista-cortes');
    if (!listaCortes) return;

    if (cortes.length === 0) {
        listaCortes.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p class="empty-text">No se encontraron cortes</p>
                <button class="action-btn" onclick="limpiarBusqueda()">
                    Limpiar búsqueda
                </button>
            </div>
        `;
        return;
    }

    // Renderizar cada corte (mismo código que cargarCortesRecientes pero adaptado)
    const cortesHTML = cortes.map(corte => {
        // Usar el nombre personalizado del corte (si existe) o el nombre original
        const nombreMostrar = corte.nombreCorte || corte.nombrePrendaOriginal || corte.nombrePrenda;
        const estadoClass = corte.estado === 'activo' ? 'estado-activo' : 'estado-terminado';
        const estadoText = corte.estado === 'activo' ? 'Activo' : 'Terminado';
        const tareasAsignadas = corte.tareas.reduce((total, tarea) =>
            total + (tarea.asignaciones ? tarea.asignaciones.length : 0), 0);
        const totalTareas = corte.tareas.length;
        const progreso = totalTareas > 0 ? Math.round((tareasAsignadas / totalTareas) * 100) : 0;

        return `
            <div class="corte-card" data-id="${corte.id}">
                <div class="corte-card-main">
                    <div class="corte-info">
                        <h3 class="corte-nombre">${nombreMostrar}</h3>                            
                        <div class="corte-meta">
                            <span class="corte-unidades">${corte.cantidadPrendas} und</span>
                            <span class="corte-fecha">${formatDate(corte.fechaCreacion)}</span>
                        </div>
                    </div>
                    <div class="corte-status">
                        <span class="corte-estado ${estadoClass}">${estadoText}</span>
                        <div class="corte-progreso">
                            <div class="progreso-bar">
                                <div class="progreso-fill" style="width: ${progreso}%"></div>
                            </div>
                            <span class="progreso-text">${progreso}%</span>
                        </div>
                    </div>
                </div>
                <div class="corte-actions">
                    <button class="action-btn small" onclick="window.location.hash='#administrar-tareas/${corte.id}'">
                        Administrar
                    </button>
                </div>
            </div>
        `;
    }).join('');

    listaCortes.innerHTML = cortesHTML;
}

// Limpiar búsqueda y filtros
function limpiarBusqueda() {
    const searchInput = document.querySelector('.search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');

    if (searchInput) searchInput.value = '';
    filterButtons.forEach(btn => {
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    cargarCortesRecientes(); // Volver a cargar lista completa
}

// ===========================================================================
// Formatear fecha a DD/MM/YYYY
function formatDate(date) {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
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

// Escuchar cambios en el hash (URL)
window.addEventListener('hashchange', () => {
    cargarVista(location.hash);
});

// Cargar la vista inicial
document.addEventListener('DOMContentLoaded', () => {
    cargarVista(location.hash || '#dashboard');
});

// Exponer funciones globales para botones
window.cargarCortesRecientes = cargarCortesRecientes;
window.mostrarMensaje = mostrarMensaje;

// ===========================================================================
// 🔧 NUEVAS FUNCIONES GLOBALES A EXPONER
// ===========================================================================
window.limpiarBusqueda = limpiarBusqueda;
window.aplicarFiltro = aplicarFiltro;

// Inicializar búsqueda cuando se carga el dashboard
window.inicializarBusquedaDashboard = function () {
    // Pequeño delay para asegurar que el DOM está listo
    setTimeout(() => {
        inicializarBusqueda();
    }, 100);
};