import { API } from "./api.js";

const loginForm = document.getElementById("login-form");
const messageDiv = document.getElementById("message");

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData);
    
    if (!data.terms) {
        showMessage("Debes aceptar los Términos y Condiciones", "error");
        return;
    }
    
    const contacto = data.contacto;
    const password = data.password;
    
    try {
        const res = await API.login(contacto, password);
        
        if (res.status === 200 && res.data.status === "OK") {
            localStorage.setItem("userId", res.data.id);
            localStorage.setItem("userPassword", password);
            localStorage.setItem("userContacto", res.data.contacto);
            localStorage.setItem("userNombre", res.data.nombre);
            
            showMessage("Inicio de sesión exitoso", "success");
            setTimeout(() => {
                window.location.href = "listTicket.html";
            }, 500);
        } else {
            showMessage(res.data.message || "Error al iniciar sesión", "error");
        }
    } catch (error) {
        if (error.response) {
            showMessage(error.response.data.message || "Error al iniciar sesión", "error");
        } else {
            showMessage("Error de conexión con el servidor", "error");
        }
    }
});
