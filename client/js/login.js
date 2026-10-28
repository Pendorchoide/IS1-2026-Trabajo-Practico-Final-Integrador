import { API } from "./api.js";
import {
    clearMessage,
    initPasswordToggles,
    setButtonLoading,
    showMessage
} from "./ui.js";

const loginForm = document.getElementById("login-form");
const messageDiv = document.getElementById("message");
const submitButton = loginForm.querySelector('button[type="submit"]');

initPasswordToggles();

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(messageDiv);

    const data = Object.fromEntries(new FormData(loginForm));
    const contacto = String(data.contacto || "").trim();
    const password = String(data.password || "");

    if (!data.terms) {
        showMessage(
            messageDiv,
            "Debés aceptar los Términos y Condiciones",
            "error"
        );
        return;
    }

    setButtonLoading(submitButton, true);

    try {
        const response = await API.login(contacto, password);

        const payload = response.data?.data ?? response.data;
        const cliente = payload?.cliente ?? payload;

        if (response.status === 200 && response.data.status === "OK" && cliente?.id) {
            localStorage.setItem("userId", cliente.id);
            localStorage.setItem("userPassword", password);
            localStorage.setItem("userContacto", cliente.contacto);
            localStorage.setItem("userNombre", cliente.nombre);
            if (cliente.fecha_ultimo_ingreso) {
                localStorage.setItem(
                    "userLastLogin",
                    cliente.fecha_ultimo_ingreso
                );
            }

            showMessage(
                messageDiv,
                "Inicio de sesión exitoso. Redirigiendo...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "listTicket.html";
            }, 600);
        } else {
            showMessage(
                messageDiv,
                response.data.message || "Error al iniciar sesión",
                "error"
            );
            setButtonLoading(submitButton, false);
        }
    } catch (error) {
        const message = error.response
            ? error.response.data.message || "Error al iniciar sesión"
            : "Error de conexión con el servidor";

        showMessage(messageDiv, message, "error");
        setButtonLoading(submitButton, false);
    }
});
