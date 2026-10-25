import { API } from "./api.js";
import {
    clearMessage,
    initPasswordToggles,
    setButtonLoading,
    showMessage
} from "./ui.js";

const registerForm = document.getElementById("register-form");
const messageDiv = document.getElementById("message");
const submitButton = registerForm.querySelector('button[type="submit"]');
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmPassword");

initPasswordToggles();

[passwordInput, confirmInput].forEach((input) => {
    input.addEventListener("input", () => {
        input.removeAttribute("aria-invalid");
        clearMessage(messageDiv);
    });
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(messageDiv);

    const data = Object.fromEntries(new FormData(registerForm));
    const nombre = String(data.nombre || "").trim();
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

    if (password !== data.confirmPassword) {
        confirmInput.setAttribute("aria-invalid", "true");
        confirmInput.focus();
        showMessage(messageDiv, "Las contraseñas no coinciden", "error");
        return;
    }

    setButtonLoading(submitButton, true);

    try {
        const response = await API.register(contacto, password, nombre);

        if (response.status === 200 && response.data.status === "OK") {
            showMessage(
                messageDiv,
                "Registro exitoso. Redirigiendo al login...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);
        } else {
            showMessage(
                messageDiv,
                response.data.message || "Error al registrarse",
                "error"
            );
            setButtonLoading(submitButton, false);
        }
    } catch (error) {
        const message = error.response
            ? error.response.data.message || "Error al registrarse"
            : "Error de conexión con el servidor";

        showMessage(messageDiv, message, "error");
        setButtonLoading(submitButton, false);
    }
});
