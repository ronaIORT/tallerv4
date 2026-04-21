// ganancias.js - Vista de estadísticas de ganancias (en construcción)
import { db } from '../db.js';

export function renderGanancias() {
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="mobile-container">
      <div class="header">
        <button onclick="location.hash='#dashboard'" class="back-btn">←</button>
        <h1 class="small-title">📈 Ganancias</h1>
      </div>
      
      <div class="dashboard-content">
        <div class="empty-state">
          <div class="empty-icon">🚧</div>
          <h3 class="empty-text">Página en construcción</h3>
          <p>Estamos trabajando en las estadísticas de ganancias.</p>
          <button class="action-btn primary" onclick="window.location.hash='#dashboard'">
            ← Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  `;
}