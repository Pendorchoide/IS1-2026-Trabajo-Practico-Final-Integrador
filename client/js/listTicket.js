import { API } from "./api.js";
import { clearMessage, formatDate, initials, showMessage } from "./ui.js";

const userId = localStorage.getItem("userId");
const userPassword = localStorage.getItem("userPassword");
const userContacto = localStorage.getItem("userContacto");
const userNombre = localStorage.getItem("userNombre");

const userNombreEl = document.getElementById("user-nombre");
const userContactoEl = document.getElementById("user-contacto");
const userAvatarEl = document.getElementById("user-avatar");
const ticketsTbody = document.getElementById("tickets-tbody");
const ticketsTable = ticketsTbody.closest("table");
const emptyState = document.getElementById("empty-state");
const messageDiv = document.getElementById("message");
const logoutBtn = document.getElementById("logout-btn");
const detailPanel = document.getElementById("ticket-detail");
const detailEmpty = document.getElementById("detail-empty");
const detailEmptyMessage = document.getElementById("detail-empty-message");
const detailContent = document.getElementById("detail-content");
const detailEstado = document.getElementById("detail-estado");
const ticketCountText = document.getElementById("ticket-count-text");

const stats = {
    total: document.getElementById("stat-total"),
    abiertos: document.getElementById("stat-abiertos"),
    proceso: document.getElementById("stat-proceso"),
    cerrados: document.getElementById("stat-cerrados")
};

const STATUS = {
    1: { label: "Abierto", className: "status-abierto" },
    2: { label: "En proceso", className: "status-en-proceso" },
    3: { label: "Cerrado", className: "status-cerrado" }
};

const CHEVRON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6"/></svg>`;

let detailRequestId = 0;

function normalizeStatus(estado) {
    if (estado === 1 || estado === "1") return 1;
    if (estado === 2 || estado === "2") return 2;
    if (estado === 3 || estado === "3") return 3;

    const value = String(estado ?? "").trim().toLowerCase();

    if (["abierto", "pendiente", "nuevo"].includes(value)) return 1;
    if (["en proceso", "en-proceso", "proceso"].includes(value)) return 2;
    if (["cerrado", "resuelto", "finalizado"].includes(value)) return 3;

    return null;
}

function createStatusBadge(estado) {
    const key = normalizeStatus(estado);
    const badge = document.createElement("span");
    badge.className = "status-badge";

    if (STATUS[key]) {
        badge.classList.add(STATUS[key].className);
        badge.textContent = STATUS[key].label;
    } else {
        badge.classList.add("status-neutral");
        badge.textContent =
            estado === null || estado === undefined || estado === ""
                ? "Sin estado"
                : String(estado);
    }

    return badge;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function resetStats() {
    Object.values(stats).forEach((element) => {
        if (element) element.textContent = "—";
    });
    ticketCountText.textContent = "Cargando…";
}

function updateStats(tickets) {
    const counts = {
        total: tickets.length,
        abiertos: 0,
        proceso: 0,
        cerrados: 0
    };

    tickets.forEach((ticket) => {
        const status = normalizeStatus(ticket.estado_solucion);
        if (status === 1) counts.abiertos += 1;
        if (status === 2) counts.proceso += 1;
        if (status === 3) counts.cerrados += 1;
    });

    if (stats.total) stats.total.textContent = String(counts.total);
    if (stats.abiertos) stats.abiertos.textContent = String(counts.abiertos);
    if (stats.proceso) stats.proceso.textContent = String(counts.proceso);
    if (stats.cerrados) stats.cerrados.textContent = String(counts.cerrados);

    ticketCountText.textContent = `${counts.total} ${
        counts.total === 1 ? "ticket" : "tickets"
    }`;
}

function renderSkeleton() {
    ticketsTbody.replaceChildren();

    for (let rowIndex = 0; rowIndex < 5; rowIndex += 1) {
        const row = document.createElement("tr");
        row.className = "skeleton-row";
        row.setAttribute("aria-hidden", "true");

        for (let cellIndex = 0; cellIndex < 4; cellIndex += 1) {
            const cell = document.createElement("td");
            const line = document.createElement("span");
            line.className = "skeleton skeleton-line";
            cell.appendChild(line);
            row.appendChild(cell);
        }

        ticketsTbody.appendChild(row);
    }
}

function renderTickets(tickets) {
    ticketsTbody.replaceChildren();

    tickets.forEach((ticket) => {
        const row = document.createElement("tr");
        row.tabIndex = 0;
        row.dataset.ticketId = String(ticket.id);
        row.setAttribute("aria-selected", "false");

        const idCell = document.createElement("td");
        idCell.dataset.label = "Ticket";
        const idValue = document.createElement("span");
        idValue.className = "ticket-id";
        idValue.textContent = `#${ticket.id}`;
        idCell.appendChild(idValue);

        const dateCell = document.createElement("td");
        dateCell.dataset.label = "Fecha";
        const dateValue = document.createElement("span");
        dateValue.className = "ticket-date";
        dateValue.textContent = formatDate(ticket.fecha_apertura);
        dateCell.appendChild(dateValue);

        const statusCell = document.createElement("td");
        statusCell.dataset.label = "Estado";
        statusCell.appendChild(createStatusBadge(ticket.estado_solucion));

        const chevronCell = document.createElement("td");
        chevronCell.className = "td-chevron";
        chevronCell.setAttribute("aria-hidden", "true");
        chevronCell.innerHTML = CHEVRON_SVG;

        row.append(idCell, dateCell, statusCell, chevronCell);

        row.addEventListener("click", () => selectTicket(ticket.id, row));
        row.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectTicket(ticket.id, row);
            }
        });

        ticketsTbody.appendChild(row);
    });
}

function selectTicket(ticketId, row) {
    ticketsTbody.querySelectorAll('tr[aria-selected="true"]').forEach((item) => {
        item.setAttribute("aria-selected", "false");
        item.classList.remove("is-selected");
    });

    row.setAttribute("aria-selected", "true");
    row.classList.add("is-selected");

    loadTicketDetail(ticketId);
}

function showDetailLoading() {
    detailEmpty.classList.add("hidden");
    detailContent.classList.remove("hidden");
    detailEstado.replaceChildren();

    setText("detail-id", "…");
    setText("detail-cliente", "…");
    setText("detail-fecha-apertura", "…");
    setText("detail-ultimo-contacto", "…");
    setText("detail-descripcion", "Cargando detalle…");
    setText("detail-solucion", "Cargando detalle…");
}

function showDetailEmpty(message) {
    detailContent.classList.add("hidden");
    detailEmpty.classList.remove("hidden");
    detailEmptyMessage.textContent =
        message ||
        "Seleccioná un ticket del listado para ver su información.";
}

function renderDetail(ticket) {
    detailEmpty.classList.add("hidden");
    detailContent.classList.remove("hidden");

    setText("detail-id", `#${ticket.id ?? "—"}`);
    setText("detail-cliente", ticket.clienteID ?? userId ?? "—");
    setText("detail-fecha-apertura", formatDate(ticket.fecha_apertura));
    setText("detail-ultimo-contacto", formatDate(ticket.ultimo_contacto));
    setText("detail-descripcion", ticket.descripcion || "Sin descripción");
    setText("detail-solucion", ticket.solucion || "Sin solución aún");
    detailEstado.replaceChildren(createStatusBadge(ticket.estado_solucion));
}

function loadTicketDetail(ticketId) {
    const requestId = (detailRequestId += 1);
    detailPanel.setAttribute("aria-busy", "true");
    showDetailLoading();

    API.getTicketById(userId, userPassword, ticketId)
        .then((response) => {
            if (requestId !== detailRequestId) return;

            const payload = response.data?.data ?? response.data;
            const ticket = payload?.ticket ?? payload;

            if (response.data.status === "OK" && ticket?.id) {
                renderDetail(ticket);

                if (window.matchMedia("(max-width: 1024px)").matches) {
                    detailPanel.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            } else {
                showDetailEmpty(
                    "No pudimos cargar el detalle de este ticket."
                );
                showMessage(
                    messageDiv,
                    response.data.message ||
                        "Error al cargar el detalle del ticket",
                    "error"
                );
            }
        })
        .catch((error) => {
            if (requestId !== detailRequestId) return;

            const message = error.response
                ? error.response.data.message ||
                  "Error al cargar el detalle del ticket"
                : "Error de conexión con el servidor";

            showDetailEmpty("No pudimos cargar el detalle de este ticket.");
            showMessage(messageDiv, message, "error");
        })
        .finally(() => {
            if (requestId === detailRequestId) {
                detailPanel.removeAttribute("aria-busy");
            }
        });
}

function loadTickets() {
    if (!userId || !userPassword) {
        window.location.href = "login.html";
        return;
    }

    userNombreEl.textContent = userNombre || "Usuario";
    userContactoEl.textContent = userContacto || "Sin contacto";
    userAvatarEl.textContent = initials(userNombre || userContacto);

    resetStats();
    renderSkeleton();
    clearMessage(messageDiv);
    ticketsTable.setAttribute("aria-busy", "true");

    API.getTicketsUser(userId, userPassword)
        .then((response) => {
            if (response.data.status !== "OK") {
                ticketsTbody.replaceChildren();
                emptyState.classList.add("hidden");
                ticketCountText.textContent = "Sin datos";
                showMessage(
                    messageDiv,
                    response.data.message || "Error al cargar tickets",
                    "error"
                );
                return;
            }

            const payload = response.data?.data ?? response.data;
            const tickets = Array.isArray(payload?.tickets)
                ? payload.tickets
                : Array.isArray(response.data?.tickets?.data)
                  ? response.data.tickets.data
                  : [];

            if (payload?.cliente) {
                userNombreEl.textContent = payload.cliente.nombre || "Usuario";
                userContactoEl.textContent =
                    payload.cliente.contacto || "Sin contacto";
                userAvatarEl.textContent = initials(
                    payload.cliente.nombre || payload.cliente.contacto
                );

                if (payload.cliente.nombre) {
                    localStorage.setItem("userNombre", payload.cliente.nombre);
                }
                if (payload.cliente.contacto) {
                    localStorage.setItem(
                        "userContacto",
                        payload.cliente.contacto
                    );
                }
            }

            if (tickets.length === 0) {
                ticketsTbody.replaceChildren();
                emptyState.classList.remove("hidden");
            } else {
                emptyState.classList.add("hidden");
                renderTickets(tickets);
            }

            updateStats(tickets);
        })
        .catch((error) => {
            ticketsTbody.replaceChildren();
            emptyState.classList.add("hidden");
            ticketCountText.textContent = "Sin datos";

            const message = error.response
                ? error.response.data.message || "Error al cargar tickets"
                : "Error de conexión con el servidor";

            showMessage(messageDiv, message, "error");

            if (error.response?.status === 404) {
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            }
        })
        .finally(() => {
            ticketsTable.removeAttribute("aria-busy");
        });
}

logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});

loadTickets();
