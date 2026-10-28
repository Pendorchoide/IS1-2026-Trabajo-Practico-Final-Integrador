import { API } from "./api.js";
import {
    clearMessage,
    initPasswordToggles,
    setButtonLoading,
    showMessage
} from "./ui.js";

const forgotForm = document.getElementById("forgot-form");
const messageDiv = document.getElementById("message");
const submitButton = forgotForm.querySelector('button[type="submit"]');
const newPasswordInput = document.getElementById("newPassword");
const confirmInput = document.getElementById("confirmPassword");

initPasswordToggles();

[newPasswordInput, confirmInput].forEach((input) => {
    input.addEventListener("input", () => {
        input.removeAttribute("aria-invalid");
        clearMessage(messageDiv);
    });
});

forgotForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(messageDiv);

    const data = Object.fromEntries(new FormData(forgotForm));
    const contacto = String(data.contacto || "").trim();
    const newPassword = String(data.newPassword || "");

    if (newPassword !== data.confirmPassword) {
        confirmInput.setAttribute("aria-invalid", "true");
        confirmInput.focus();
        showMessage(messageDiv, "Las contraseñas no coinciden", "error");
        return;
    }

    setButtonLoading(submitButton, true);

    try {
        const response = await API.changePassword(contacto, newPassword);

        if (response.status === 200 && response.data.status === "OK") {
            showMessage(
                messageDiv,
                "Contraseña cambiada exitosamente. Redirigiendo al login...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);
        } else {
            showMessage(
                messageDiv,
                response.data.message || "Error al cambiar contraseña",
                "error"
            );
            setButtonLoading(submitButton, false);
        }
    } catch (error) {
        const message = error.response
            ? error.response.data.message || "Error al cambiar contraseña"
            : "Error de conexión con el servidor";

        showMessage(messageDiv, message, "error");
        setButtonLoading(submitButton, false);
    }
});
