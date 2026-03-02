// index.js - Archivo principal de Administrar Tareas
import { cargarPestanaResumen } from './tab-resumen.js';
import { cargarPestanaCorte } from './tab-corte.js';
import { cargarPestanaTrabajador } from './tab-trabajador.js';
import { cargarPestanaEditar } from './tab-editar.js';
import { cargarPestanaAsignar } from './tab-asignar.js';

// Orden de las pestañas para navegación por swipe
const ORDEN_PESTANAS = ['resumen', 'corte', 'trabajador', 'editar', 'asignar'];

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
  inicializarSwipeNavigation(corteId);
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

// Inicializar navegación por swipe (deslizar) en móvil
function inicializarSwipeNavigation(corteId) {
  const tabContent = document.getElementById('tab-content');
  if (!tabContent) return;

  let startX = 0;
  let startY = 0;
  const threshold = 50; // Mínimo 50px para activar el swipe

  tabContent.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  tabContent.addEventListener('touchend', async (e) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;

    // Solo activar si el swipe es más horizontal que vertical y supera el umbral
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
      const currentTabBtn = document.querySelector('.tab-item.active');
      if (!currentTabBtn) return;
      
      const currentTab = currentTabBtn.dataset.tab;
      const currentIndex = ORDEN_PESTANAS.indexOf(currentTab);

      let newIndex;
      if (diffX < 0) {
        // Swipe izquierda → siguiente pestaña
        newIndex = currentIndex + 1;
      } else {
        // Swipe derecha → pestaña anterior
        newIndex = currentIndex - 1;
      }

      // Verificar límites
      if (newIndex >= 0 && newIndex < ORDEN_PESTANAS.length) {
        const nextTab = ORDEN_PESTANAS[newIndex];
        const nextBtn = document.querySelector(`.tab-item[data-tab="${nextTab}"]`);
        if (nextBtn) {
          nextBtn.click(); // Simular clic para activar la pestaña
        }
      }
    }
  }, { passive: true });
}
