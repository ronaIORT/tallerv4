export function formatDate(date) {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

export function mostrarMensaje(mensaje) {
    const app = document.getElementById("app");
    const mensajeEl = document.createElement("div");
    mensajeEl.className = "toast-message";
    mensajeEl.innerHTML = mensaje;
    app.appendChild(mensajeEl);
    setTimeout(() => {
        mensajeEl.remove();
    }, 2000);
}

export function renderHeader(title, backRoute = "#dashboard") {
    return `
        <div class="header">
            <button onclick="location.hash='${backRoute}'" class="back-btn">←</button>
            <h1 class="small-title">${title}</h1>
        </div>
    `;
}

export function renderEmptyState(icon, text, subtext = "") {
    return `
        <div class="empty-state">
            <div class="empty-icon">${icon}</div>
            <p class="empty-text">${text}</p>
            ${subtext ? `<p class="empty-subtext">${subtext}</p>` : ""}
        </div>
    `;
}

export function renderLoadingState() {
    return `
        <div class="loading-item">
            <div class="loading-line"></div>
            <div class="loading-line short"></div>
        </div>
    `;
}

export function crearModalConfirmacion({ titulo, mensaje, textoConfirmar = "Confirmar", textoCancelar = "Cancelar", esDanger = false, onConfirmar, onCancelar }) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    const btnClass = esDanger ? 'action-btn danger' : 'action-btn primary';

    modal.innerHTML = `
        <div class="confirm-modal">
            <h3 class="modal-title">${titulo}</h3>
            <p class="modal-text">${mensaje}</p>
            <div class="modal-actions">
                <button class="action-btn" id="modal-cancel-btn">${textoCancelar}</button>
                <button class="${btnClass}" id="modal-confirm-btn">${textoConfirmar}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const cerrar = () => {
        modal.remove();
        if (onCancelar) onCancelar();
    };

    modal.querySelector('#modal-cancel-btn').addEventListener('click', cerrar);
    modal.querySelector('#modal-confirm-btn').addEventListener('click', () => {
        modal.remove();
        if (onConfirmar) onConfirmar();
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrar();
    });

    return { cerrar };
}

export function formatBs(centavos) {
    const bolivianos = centavos / 100;
    return bolivianos.toFixed(2) + "Bs";
}

export function centavosABolivianos(centavos) {
    return centavos / 100;
}
