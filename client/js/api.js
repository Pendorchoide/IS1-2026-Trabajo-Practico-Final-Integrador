const API_URL = "http://localhost:8080";

export class API {
    static health = async () => {
        const response = await axios.get(`${API_URL}/health`);
        return response;
    }

    static login = async (contacto, password) => {
        const body = { contacto, password };
        const response = await axios.post(`${API_URL}/clientes/login`, body);
        return response;
    }

    static register = async (contacto, password, nombre) => {
        const body = { contacto, password, nombre };
        const response = await axios.post(`${API_URL}/clientes/register`, body);
        return response;
    }

    static changePassword = async (contacto, newPassword) => {
        const body = { contacto, newPassword };
        const response = await axios.patch(`${API_URL}/clientes/change-password`, body);
        return response;
    }

    static getTicketsUser = async (userId, userPassword, ticketId = null) => {
        let url = `${API_URL}/tickets/resumenTickets?userId=${encodeURIComponent(userId)}&userPassword=${encodeURIComponent(userPassword)}`;
        if (ticketId) {
            url += `&ticketId=${encodeURIComponent(ticketId)}`;
        }
        const response = await axios.get(url);
        return response;
    }

    static getTicketById = async (userId, userPassword, ticketId) => {
        const response = await API.getTicketsUser(userId, userPassword, ticketId);
        return response;
    }
}
