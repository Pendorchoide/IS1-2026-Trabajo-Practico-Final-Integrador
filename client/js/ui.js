const MESSAGE_ICONS = {
    error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
    success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`
};

export function showMessage(element, text, type = "error") {
    if (!element) return;

    const icon = document.createElement("span");
    icon.className = "message-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = MESSAGE_ICONS[type] || MESSAGE_ICONS.error;

    const content = document.createElement("span");
    content.textContent = text;

    element.replaceChildren(icon, content);
    element.className = `message ${type}`;
    element.setAttribute("role", type === "error" ? "alert" : "status");
}

export function clearMessage(element) {
    if (!element) return;
    element.replaceChildren();
    element.className = "message";
    element.removeAttribute("role");
}

export function setButtonLoading(button, loading) {
    if (!button) return;
    button.classList.toggle("is-loading", loading);
    button.disabled = loading;

    if (loading) {
        button.setAttribute("aria-busy", "true");
    } else {
        button.removeAttribute("aria-busy");
    }
}

export function formatDate(value) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    const hasTime =
        typeof value === "string" && /[T\s]\d{2}:\d{2}/.test(value);

    try {
        return new Intl.DateTimeFormat("es-AR", {
            dateStyle: "medium",
            ...(hasTime ? { timeStyle: "short" } : {})
        }).format(date);
    } catch {
        return date.toLocaleString("es-AR");
    }
}

export function initials(value) {
    if (!value) return "?";

    const parts = String(value).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";

    const first = parts[0].charAt(0);
    const second = parts.length > 1 ? parts[1].charAt(0) : "";
    return `${first}${second}`.toLocaleUpperCase("es-AR");
}

export function initPasswordToggles(root = document) {
    root.querySelectorAll("[data-password-toggle]").forEach((button) => {
        if (button.dataset.bound === "true") return;
        button.dataset.bound = "true";

        const input = root.getElementById(
            button.getAttribute("data-password-toggle")
        );
        if (!input) return;

        button.addEventListener("click", () => {
            const shouldShow = input.type === "password";
            input.type = shouldShow ? "text" : "password";
            button.setAttribute("aria-pressed", String(shouldShow));
            button.setAttribute(
                "aria-label",
                shouldShow ? "Ocultar contraseña" : "Mostrar contraseña"
            );
            input.focus();
        });
    });
}
