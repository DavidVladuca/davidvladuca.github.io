const contactForm = document.querySelector("#contact-form");
const contactFields = [...contactForm.querySelectorAll("[data-contact-field]")];
const contactFieldset = contactForm.querySelector("fieldset");
const contactSubmit = contactForm.querySelector("button[type='submit']");
const contactStatus = document.querySelector("#contact-form-status");
const deliveryNotice = document.querySelector("#contact-delivery-notice");
const submitLabel = contactSubmit.textContent;
let submitting = false;

function fieldError(field) {
    const value = field.value.trim();
    if (!value) {
        return field.dataset.requiredMessage;
    }
    if (field.validity.typeMismatch) {
        return "Introduceți o adresă de email validă, de exemplu nume@exemplu.ro.";
    }
    if (field.maxLength > 0 && value.length > field.maxLength) {
        return `Folosiți cel mult ${field.maxLength} de caractere.`;
    }
    if (field.type === "tel") {
        const digits = value.replace(/\D/g, "");
        if (!/^\+?[\d\s().-]+$/.test(value) || digits.length < 7 || digits.length > 15) {
            return "Introduceți un număr de telefon valid, de exemplu 0726 286 228.";
        }
    }
    return "";
}

function validateField(field) {
    const message = fieldError(field);
    document.querySelector(`#${field.id}-error`).textContent = message;
    field.setAttribute("aria-invalid", String(Boolean(message)));
    field.closest(".form-field").classList.toggle("has-error", Boolean(message));
    return !message;
}

function showContactStatus(message, state) {
    contactStatus.textContent = message;
    contactStatus.dataset.state = state;
}

contactFields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") {
            validateField(field);
        }
        if (contactStatus.dataset.state === "success") {
            showContactStatus("", "idle");
        }
    });
});

contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) {
        return;
    }

    const valid = contactFields.map(validateField).every(Boolean);
    if (!valid) {
        showContactStatus("Verificați câmpurile marcate înainte de a trimite mesajul.", "error");
        contactFields.find((field) => field.getAttribute("aria-invalid") === "true").focus();
        return;
    }

    // Enable delivery only after the inbox owner has activated FormSubmit.
    if (contactForm.dataset.deliveryEnabled !== "true") {
        showContactStatus("Formularul nu este încă activ. Ne puteți trimite mesajul la infoavocati@yahoo.com sau ne puteți suna la 0726 286 228.", "unavailable");
        contactStatus.focus();
        return;
    }

    const payload = Object.fromEntries(new FormData(contactForm));
    if (payload._honey) {
        showContactStatus("Trimiterea nu a putut fi procesată. Contactați-ne prin email sau telefon.", "error");
        contactStatus.focus();
        return;
    }
    contactFields.forEach((field) => {
        payload[field.name] = field.value.trim();
    });
    payload._subject = `Mesaj de pe infoavocati.ro: ${payload.subject}`;
    payload._replyto = payload.email;
    payload._template = "table";

    submitting = true;
    contactFieldset.disabled = true;
    contactForm.setAttribute("aria-busy", "true");
    contactSubmit.textContent = "SE TRIMITE…";
    showContactStatus("Mesajul se trimite. Vă rugăm să așteptați.", "sending");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
        const response = await fetch(contactForm.action, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
            credentials: "omit",
        });
        const result = await response.json();
        const accepted = result.success === true || result.success === "true";
        const needsActivation = /activat/i.test(String(result.message || ""));
        if (!response.ok || !accepted || needsActivation) {
            throw new Error("Submission was not confirmed by the delivery service.");
        }
        contactForm.reset();
        showContactStatus("Mesajul a fost preluat pentru trimitere. Vă mulțumim! Vă vom contacta cât mai curând posibil.", "success");
    } catch {
        showContactStatus("Nu am putut confirma trimiterea mesajului. Textul a fost păstrat. Verificați conexiunea și încercați din nou sau scrieți-ne la infoavocati@yahoo.com.", "error");
    } finally {
        window.clearTimeout(timeout);
        submitting = false;
        contactFieldset.disabled = false;
        contactForm.removeAttribute("aria-busy");
        contactSubmit.textContent = submitLabel;
        contactStatus.focus();
    }
});

deliveryNotice.hidden = contactForm.dataset.deliveryEnabled === "true";
contactFieldset.disabled = false;
