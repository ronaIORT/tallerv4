import { db } from "../db.js";

const MESES_NOMBRES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const CHART_PALETTE = ["#f0a030", "#60a5fa", "#8b5cf6", "#ec4899", "#f97316", "#2dd4a8", "#ef5350", "#f59e0b", "#38bdf8", "#a78bfa"];

let chartInstances = {};

export function renderDashboard() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="mobile-container">
      <div class="dashboard-brand">
        <h1>Taller de <span class="brand-accent">Costura</span></h1>
        <p class="brand-subtitle">Panel de control <span class="version-badge" id="app-version">v9.1</span></p>
      </div>
      <div class="dashboard-content">
        <div class="periodo-selector" id="periodo-selector">
          <button class="periodo-btn active" data-meses="1">1 mes</button>
          <button class="periodo-btn" data-meses="2">2 meses</button>
          <button class="periodo-btn" data-meses="3">3 meses</button>
        </div>
        <div class="kpi-grid" id="kpi-grid"></div>
        <div class="charts-section">
          <div class="chart-card">
            <h3 class="chart-title">Ganancias Mensuales</h3>
            <div class="chart-container"><canvas id="chart-ganancias-mensuales"></canvas></div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">Distribucion por Prenda</h3>
            <div class="chart-container chart-doughnut"><canvas id="chart-prendas"></canvas></div>
          </div>
          <div class="chart-card">
            <h3 class="chart-title">Pagos vs Ganancias</h3>
            <div class="chart-container"><canvas id="chart-pagos-ganancias"></canvas></div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("periodo-selector").addEventListener("click", (e) => {
    const btn = e.target.closest(".periodo-btn");
    if (!btn) return;
    const meses = parseInt(btn.dataset.meses);
    document.querySelectorAll(".periodo-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    cargarTodo(meses);
  });

  cargarTodo(1);
}

async function cargarTodo(meses) {
  const stats = await obtenerEstadisticas(meses);
  renderizarKPIs(stats);
  renderizarGraficos(stats, meses);
}

function obtenerFechaInicio(meses) {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth() - (meses - 1), 1);
}

function generarClavesMeses(meses) {
  const claves = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    claves.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: MESES_NOMBRES[d.getMonth()],
    });
  }
  return claves;
}

function calcularGananciaCorte(corte) {
  const venta = corte.cantidadPrendas * corte.precioVentaUnitario;
  const manoObra = corte.tareas.reduce((sum, tarea) => {
    const asignado = tarea.asignaciones.reduce((t, a) => t + a.cantidad, 0);
    return sum + tarea.precioUnitario * asignado;
  }, 0);
  return { venta, manoObraBs: manoObra / 100, ganancia: venta - (manoObra / 100) };
}

async function obtenerEstadisticas(meses) {
  const fechaInicio = obtenerFechaInicio(meses);
  const todosCortes = await db.cortes.toArray();
  const todosPagos = await db.pagos.toArray();
  const trabajadoresCount = await db.trabajadores.count();
  const prendasCount = await db.prendas.count();

  const cortesActivos = todosCortes.filter(c => c.estado === "activo").length;
  const cortesTerminados = todosCortes.filter(c => c.estado === "terminado" && c.fechaFinalizacion);
  const cortesTerminadosPeriodo = cortesTerminados.filter(c => {
    return new Date(c.fechaFinalizacion) >= fechaInicio;
  });

  let gananciaPeriodo = 0;
  let ventasPeriodo = 0;

  cortesTerminadosPeriodo.forEach(corte => {
    const { venta, ganancia } = calcularGananciaCorte(corte);
    ventasPeriodo += venta;
    gananciaPeriodo += ganancia;
  });

  const margen = ventasPeriodo > 0 ? (gananciaPeriodo / ventasPeriodo) * 100 : 0;

  const totalGanadoCentavos = todosCortes.reduce((sum, corte) => {
    return sum + corte.tareas.reduce((st, tarea) => {
      return st + tarea.asignaciones.reduce((sa, a) => sa + a.cantidad * tarea.precioUnitario, 0);
    }, 0);
  }, 0);

  const totalPagadoCentavos = todosPagos.reduce((sum, p) => sum + p.monto, 0);
  const porPagar = Math.max(0, totalGanadoCentavos - totalPagadoCentavos) / 100;

  const clavesMeses = generarClavesMeses(meses);
  const labels = clavesMeses.map(c => c.label);

  const gananciasPorMes = {};
  const pagosPorMes = {};
  clavesMeses.forEach(c => {
    gananciasPorMes[c.key] = 0;
    pagosPorMes[c.key] = 0;
  });

  const gananciasPorPrenda = {};

  cortesTerminadosPeriodo.forEach(corte => {
    const ff = new Date(corte.fechaFinalizacion);
    const key = `${ff.getFullYear()}-${String(ff.getMonth() + 1).padStart(2, "0")}`;
    if (gananciasPorMes[key] !== undefined) {
      gananciasPorMes[key] += calcularGananciaCorte(corte).ganancia;
    }

    const nombre = corte.nombrePrendaOriginal || "Sin prenda";
    gananciasPorPrenda[nombre] = (gananciasPorPrenda[nombre] || 0) + calcularGananciaCorte(corte).ganancia;
  });

  todosPagos.forEach(pago => {
    const fp = new Date(pago.fecha);
    if (fp >= fechaInicio) {
      const key = `${fp.getFullYear()}-${String(fp.getMonth() + 1).padStart(2, "0")}`;
      if (pagosPorMes[key] !== undefined) {
        pagosPorMes[key] += pago.monto / 100;
      }
    }
  });

  const gananciasArray = clavesMeses.map(c => gananciasPorMes[c.key]);
  const pagosArray = clavesMeses.map(c => pagosPorMes[c.key]);

  const prendasOrdenadas = Object.entries(gananciasPorPrenda)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  return {
    cortesActivos,
    trabajadoresCount,
    prendasCount,
    gananciaPeriodo,
    ventasPeriodo,
    margen,
    porPagar,
    cortesTerminadosPeriodo: cortesTerminadosPeriodo.length,
    labels,
    gananciasArray,
    pagosArray,
    prendasOrdenadas,
  };
}

function renderizarKPIs(stats) {
  const kpiGrid = document.getElementById("kpi-grid");
  if (!kpiGrid) return;

  kpiGrid.innerHTML = `
    <div class="kpi-card kpi-activos" onclick="window.location.hash='#gestion-cortes'">
      <div class="kpi-icon">📊</div>
      <div class="kpi-content">
        <div class="kpi-value">${stats.cortesActivos}</div>
        <div class="kpi-label">CORTES ACTIVOS</div>
      </div>
    </div>
    <div class="kpi-card kpi-ganancias">
      <div class="kpi-icon">💰</div>
      <div class="kpi-content">
        <div class="kpi-value">Bs ${stats.gananciaPeriodo.toFixed(0)}</div>
        <div class="kpi-label">GANANCIAS</div>
        <div class="kpi-sub">${stats.cortesTerminadosPeriodo} cortes</div>
      </div>
    </div>
    <div class="kpi-card kpi-por-pagar" onclick="window.location.hash='#historial-pagos'">
      <div class="kpi-icon">💳</div>
      <div class="kpi-content">
        <div class="kpi-value">Bs ${stats.porPagar.toFixed(2)}</div>
        <div class="kpi-label">POR PAGAR</div>
      </div>
    </div>
    <div class="kpi-card kpi-margen">
      <div class="kpi-icon">📈</div>
      <div class="kpi-content">
        <div class="kpi-value">${stats.margen.toFixed(1)}%</div>
        <div class="kpi-label">MARGEN</div>
        <div class="kpi-sub">Bs ${stats.ventasPeriodo.toFixed(0)} ventas</div>
      </div>
    </div>
  `;
}

function getChartColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    textSecondary: style.getPropertyValue("--text-secondary").trim() || "#9aa5b4",
    textMuted: style.getPropertyValue("--text-muted").trim() || "#5f6b7a",
    bgSurface: style.getPropertyValue("--bg-surface").trim() || "#1a2332",
    borderDefault: style.getPropertyValue("--border-default").trim() || "#2d3748",
  };
}

function baseGridConfig(colors) {
  return {
    color: colors.textMuted,
    lineWidth: 0.5,
    tickColor: colors.textMuted,
  };
}

function renderizarGraficos(stats, meses) {
  const colors = getChartColors();

  Object.values(chartInstances).forEach(inst => {
    if (inst) inst.destroy();
  });
  chartInstances = {};

  const hasData = stats.gananciasArray.some(v => v > 0) ||
    stats.prendasOrdenadas.length > 0 ||
    stats.pagosArray.some(v => v > 0);

  if (!hasData && stats.cortesTerminadosPeriodo === 0) {
    document.querySelectorAll(".chart-card").forEach(card => {
      card.querySelector(".chart-container").innerHTML =
        '<div class="chart-empty">Sin datos en este periodo</div>';
    });
    return;
  }

  const canvas1 = document.getElementById("chart-ganancias-mensuales");
  if (canvas1) {
    const ctx1 = canvas1.getContext("2d");
    chartInstances.ganancias = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: stats.labels,
        datasets: [{
          label: "Ganancia (Bs)",
          data: stats.gananciasArray,
          backgroundColor: stats.gananciasArray.map(v => v >= 0 ? "rgba(45, 212, 168, 0.6)" : "rgba(239, 83, 80, 0.6)"),
          borderColor: stats.gananciasArray.map(v => v >= 0 ? "#2dd4a8" : "#ef5350"),
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.8,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: colors.bgSurface,
            titleColor: colors.textSecondary,
            bodyColor: colors.textSecondary,
            borderColor: colors.borderDefault,
            borderWidth: 1,
            callbacks: {
              label: (ctx) => `Bs ${ctx.raw.toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            grid: baseGridConfig(colors),
            ticks: { color: colors.textMuted, font: { size: 11 } },
          },
          y: {
            grid: baseGridConfig(colors),
            ticks: {
              color: colors.textMuted,
              font: { size: 10 },
              callback: (v) => "Bs " + v,
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  const canvas2 = document.getElementById("chart-prendas");
  if (canvas2) {
    if (stats.prendasOrdenadas.length === 0) {
      canvas2.parentElement.innerHTML = '<div class="chart-empty">Sin prendas en este periodo</div>';
    } else {
      const ctx2 = canvas2.getContext("2d");
      const topPrendas = stats.prendasOrdenadas.slice(0, 6);
      const otrasGanancia = stats.prendasOrdenadas.slice(6).reduce((s, [, v]) => s + v, 0);
      const datasets = [...topPrendas];
      if (otrasGanancia > 0) datasets.push(["Otros", otrasGanancia]);

      chartInstances.prendas = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: datasets.map(d => d[0]),
          datasets: [{
            data: datasets.map(d => d[1]),
            backgroundColor: CHART_PALETTE.slice(0, datasets.length),
            borderColor: colors.bgSurface,
            borderWidth: 3,
            hoverBorderColor: colors.bgSurface,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: colors.textSecondary,
                padding: 16,
                font: { size: 11 },
                usePointStyle: true,
                pointStyleWidth: 8,
              },
            },
            tooltip: {
              backgroundColor: colors.bgSurface,
              titleColor: colors.textSecondary,
              bodyColor: colors.textSecondary,
              borderColor: colors.borderDefault,
              borderWidth: 1,
              callbacks: {
                label: (ctx) => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                  return ` ${ctx.label}: Bs ${ctx.raw.toFixed(0)} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }
  }

  const canvas3 = document.getElementById("chart-pagos-ganancias");
  if (canvas3) {
    const ctx3 = canvas3.getContext("2d");
    chartInstances.pagosGanancias = new Chart(ctx3, {
      type: "line",
      data: {
        labels: stats.labels,
        datasets: [
          {
            label: "Ganancias",
            data: stats.gananciasArray,
            borderColor: "#2dd4a8",
            backgroundColor: "rgba(45, 212, 168, 0.1)",
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: "#2dd4a8",
            borderWidth: 2,
          },
          {
            label: "Pagos",
            data: stats.pagosArray,
            borderColor: "#f97316",
            backgroundColor: "rgba(249, 115, 22, 0.1)",
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: "#f97316",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.8,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: colors.textSecondary,
              padding: 16,
              font: { size: 11 },
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            backgroundColor: colors.bgSurface,
            titleColor: colors.textSecondary,
            bodyColor: colors.textSecondary,
            borderColor: colors.borderDefault,
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: Bs ${ctx.raw.toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            grid: baseGridConfig(colors),
            ticks: { color: colors.textMuted, font: { size: 11 } },
          },
          y: {
            grid: baseGridConfig(colors),
            ticks: {
              color: colors.textMuted,
              font: { size: 10 },
              callback: (v) => "Bs " + v,
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
}

window.cambiarPeriodoDashboard = function (meses) {
  document.querySelectorAll(".periodo-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.meses) === meses);
  });
  cargarTodo(meses);
};
