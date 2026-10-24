import { API } from "./api.js";

const registerForm = document.getElementById("register-form");
const messageDiv = document.getElementById("message");

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData);
    
    if (!data.terms) {
        showMessage("Debes aceptar los Términos y Condiciones", "error");
        return;
    }
    
    if (data.password !== data.confirmPassword) {
        showMessage("Las contraseñas no coinciden", "error");
        return;
    }
    
    const nombre = data.nombre;
    const contacto = data.contacto;
    const password = data.password;
    
    try {
        const res = await API.register(contacto, password, nombre);
        
        if (res.status === 200 && res.data.status === "OK") {
            showMessage("Registro exitoso. Redirigiendo al login...", "success");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } else {
            showMessage(res.data.message || "Error al registrarse", "error");
        }
    } catch (error) {
        if (error.response) {
            showMessage(error.response.data.message || "Error al registrarse", "error");
        } else {
            showMessage("Error de conexión con el servidor", "error");
        }
    }
});
