// index.js - Archivo principal de Administrar Tareas
import { cargarPestanaResumen } from './tab-resumen.js';
import { cargarPestanaCorte } from './tab-corte.js';
import { cargarPestanaTrabajador } from './tab-trabajador.js';
import { cargarPestanaEditar } from './tab-editar.js';
import { cargarPestanaAsignar } from './tab-asignar.js';

// Función principal que renderiza la vista de administrar tareas
export function renderAdministrarTareas(corteId) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="mobile-container">
      <div class="header">
        <button onclick="location.hash='#dashboard'" class="back-btn">←</button>        
        <h1 class="small-title">Administración de Tareas</h1>
      </div>
      
      <div class="tab-menu">
        <div class="tab-container">
          <button class="tab-item active" data-tab="resumen">
            <span>Info</span>
          </button>
          <button class="tab-item" data-tab="corte">
            <span>Corte</span>
          </button>
          <button class="tab-item" data-tab="trabajador">
            <span>Trabajador</span>
          </button>
          <button class="tab-item" data-tab="editar">
            <span>Editar</span>
          </button>
          <button class="tab-item" data-tab="asignar">
            <span>Asignar</span>
          </button>
        </div>
      </div>
      
      <div id="tab-content" class="tab-content">
        <h2 class="section-title">Cargando información del corte...</h2>
      </div>
    </div>
  `;

  inicializarPestanas(corteId);
  cargarPestanaResumen(corteId);
}

// Inicializar eventos de las pestañas
function inicializarPestanas(corteId) {
  document.querySelectorAll('.tab-item').forEach(btn => {
    btn.addEventListener('click', async () => {
      // Actualizar estado visual
      document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Cargar contenido de la pestaña
      const tab = btn.dataset.tab;
      
      switch (tab) {
        case 'resumen':
          await cargarPestanaResumen(corteId);
          break;
        case 'corte':
          await cargarPestanaCorte(corteId);
          break;
        case 'trabajador':
          await cargarPestanaTrabajador(corteId);
          break;
        case 'editar':
          await cargarPestanaEditar(corteId);
          break;
        case 'asignar':
          await cargarPestanaAsignar(corteId);
          break;
      }
    });
  });
}