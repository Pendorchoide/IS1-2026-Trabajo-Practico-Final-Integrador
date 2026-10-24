import { API } from "./api.js";

const userId = localStorage.getItem("userId");
const userPassword = localStorage.getItem("userPassword");
const userContacto = localStorage.getItem("userContacto");
const userNombre = localStorage.getItem("userNombre");

const userNombreEl = document.getElementById("user-nombre");
const userContactoEl = document.getElementById("user-contacto");
const userIdEl = document.getElementById("user-id");
const ticketsTbody = document.getElementById("tickets-tbody");
const emptyState = document.getElementById("empty-state");
const messageDiv = document.getElementById("message");
const logoutBtn = document.getElementById("logout-btn");
const ticketDetail = document.getElementById("ticket-detail");

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}

function getEstadoBadge(estado) {
    if (estado === 1 || estado === "1") {
        return '<span class="status-badge status-abierto">Abierto</span>';
    } else if (estado === 2 || estado === "2") {
        return '<span class="status-badge status-en-proceso">En Proceso</span>';
    } else if (estado === 3 || estado === "3" || estado === "Cerrado") {
        return '<span class="status-badge status-cerrado">Cerrado</span>';
    }
    return `<span class="status-badge">${estado}</span>`;
}

function loadTickets() {
    if (!userId || !userPassword) {
        window.location.href = "login.html";
        return;
    }
    
    userNombreEl.textContent = userNombre || "No disponible";
    userContactoEl.textContent = userContacto || "No disponible";
    userIdEl.textContent = userId;
    
    API.getTicketsUser(userId, userPassword)
        .then(res => {
            if (res.data.status === "OK") {
                const tickets = res.data.tickets?.data || [];
                
                if (tickets.length === 0) {
                    emptyState.style.display = "block";
                    ticketsTbody.innerHTML = "";
                } else {
                    emptyState.style.display = "none";
                    ticketsTbody.innerHTML = "";
                    
                    tickets.forEach(ticket => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td>${ticket.id}</td>
                            <td>${ticket.fecha_apertura}</td>
                            <td>${getEstadoBadge(ticket.estado_solucion)}</td>
                        `;
                        tr.addEventListener("click", () => {
                            loadTicketDetail(ticket.id);
                        });
                        ticketsTbody.appendChild(tr);
                    });
                }
            } else {
                showMessage(res.data.message || "Error al cargar tickets", "error");
            }
        })
        .catch(error => {
            if (error.response) {
                showMessage(error.response.data.message || "Error al cargar tickets", "error");
                if (error.response.status === 404) {
                    setTimeout(() => {
                        window.location.href = "login.html";
                    }, 2000);
                }
            } else {
                showMessage("Error de conexión con el servidor", "error");
            }
        });
}

function loadTicketDetail(ticketId) {
    API.getTicketById(userId, userPassword, ticketId)
        .then(res => {
            if (res.data.status === "OK" && res.data.ticket) {
                const ticket = res.data.ticket;
                
                document.getElementById("detail-id").textContent = ticket.id || "N/A";
                document.getElementById("detail-cliente").textContent = ticket.clienteID || userId;
                document.getElementById("detail-estado").innerHTML = getEstadoBadge(ticket.estado_solucion);
                document.getElementById("detail-fecha-apertura").textContent = ticket.fecha_apertura || "N/A";
                document.getElementById("detail-ultimo-contacto").textContent = ticket.ultimo_contacto || "N/A";
                document.getElementById("detail-descripcion").textContent = ticket.descripcion || "Sin descripción";
                document.getElementById("detail-solucion").textContent = ticket.solucion || "Sin solución aún";
                
                ticketDetail.classList.add("active");
                ticketDetail.scrollIntoView({ behavior: "smooth", block: "nearest" });
            } else {
                showMessage(res.data.message || "Error al cargar detalle del ticket", "error");
            }
        })
        .catch(error => {
            if (error.response) {
                showMessage(error.response.data.message || "Error al cargar detalle del ticket", "error");
            } else {
                showMessage("Error de conexión con el servidor", "error");
            }
        });
}

logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});

loadTickets();
