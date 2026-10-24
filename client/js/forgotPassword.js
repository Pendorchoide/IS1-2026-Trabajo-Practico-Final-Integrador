import { API } from "./api.js";

const forgotForm = document.getElementById("forgot-form");
const messageDiv = document.getElementById("message");

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}

forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const formData = new FormData(forgotForm);
    const data = Object.fromEntries(formData);
    
    if (data.newPassword !== data.confirmPassword) {
        showMessage("Las contraseñas no coinciden", "error");
        return;
    }
    
    const contacto = data.contacto;
    const newPassword = data.newPassword;
    
    try {
        const res = await API.changePassword(contacto, newPassword);
        
        if (res.status === 200 && res.data.status === "OK") {
            showMessage("Contraseña cambiada exitosamente. Redirigiendo al login...", "success");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } else {
            showMessage(res.data.message || "Error al cambiar contraseña", "error");
        }
    } catch (error) {
        if (error.response) {
            showMessage(error.response.data.message || "Error al cambiar contraseña", "error");
        } else {
            showMessage("Error de conexión con el servidor", "error");
        }
    }
});
