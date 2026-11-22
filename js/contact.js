(() => {
    const contactForm = document.querySelector("#contact-form");
    if (!contactForm) return;
    const contactFields = [...contactForm.querySelectorAll("[data-contact-field]")];
    const contactFieldset = contactForm.querySelector("fieldset");
    const contactSubmit = contactForm.querySelector("button[type='submit']");
    const contactStatus = document.querySelector("#contact-form-status");
    const contactNotification = document.querySelector("#contact-notification");
    const notificationClose = document.querySelector("#contact-notification-close");
    const submitLabel = contactSubmit.textContent;
    let submitting = false;
    let validationAttempted = false;
    let notificationReturnFocus = contactSubmit;
    let notificationTimer;

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
        if (!message) {
            field.closest(".form-field").classList.remove("show-field-help");
        }
        return !message;
    }

    function showContactStatus(message, state, returnFocus = contactSubmit) {
        contactStatus.textContent = message;
        contactStatus.dataset.state = state;
        contactNotification.dataset.state = state;
        contactNotification.hidden = !message;
        notificationReturnFocus = returnFocus;
        scheduleNotificationDismiss();
    }

    function scheduleNotificationDismiss() {
        window.clearTimeout(notificationTimer);
        if (contactNotification.hidden || contactStatus.dataset.state === "sending"
            || contactNotification.matches(":hover") || contactNotification.contains(document.activeElement)) {
            return;
        }
        notificationTimer = window.setTimeout(dismissContactNotification, 6000);
    }

    function dismissContactNotification() {
        window.clearTimeout(notificationTimer);
        const restoreFocus = contactNotification.contains(document.activeElement);
        contactNotification.hidden = true;
        if (restoreFocus) {
            notificationReturnFocus.focus({ preventScroll: true });
        }
    }

    notificationClose.addEventListener("click", dismissContactNotification);
    contactNotification.addEventListener("mouseenter", () => window.clearTimeout(notificationTimer));
    contactNotification.addEventListener("mouseleave", scheduleNotificationDismiss);
    contactNotification.addEventListener("focusin", () => window.clearTimeout(notificationTimer));
    contactNotification.addEventListener("focusout", () => window.setTimeout(scheduleNotificationDismiss, 0));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !contactNotification.hidden) {
            dismissContactNotification();
        }
    });

    contactFields.forEach((field) => {
        field.addEventListener("focus", () => {
            if (validationAttempted && !validateField(field)) {
                field.closest(".form-field").classList.add("show-field-help");
            }
        });
        field.addEventListener("blur", () => {
            field.closest(".form-field").classList.remove("show-field-help");
            if (validationAttempted) {
                validateField(field);
            }
        });
        field.addEventListener("input", () => {
            if (validationAttempted) {
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

        validationAttempted = true;
        const valid = contactFields.map(validateField).every(Boolean);
        if (!valid) {
            const firstInvalid = contactFields.find((field) => field.getAttribute("aria-invalid") === "true");
            showContactStatus("Mesajul nu a fost trimis. Verificați câmpurile marcate cu roșu și încercați din nou.", "error", firstInvalid);
            return;
        }

        // Delivery can be disabled here without changing the approved form design.
        if (contactForm.dataset.deliveryEnabled !== "true") {
            showContactStatus("Formularul nu este încă activ. Ne puteți trimite mesajul la infoavocati@yahoo.com sau ne puteți suna la 0726 286 228.", "unavailable");
            return;
        }

        const payload = Object.fromEntries(new FormData(contactForm));
        if (payload._honey) {
            showContactStatus("Trimiterea nu a putut fi procesată. Contactați-ne prin email sau telefon.", "error");
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
            if (response.status === 429) {
                showContactStatus("Au fost prea multe încercări de trimitere. Mesajul a fost păstrat. Așteptați câteva minute și încercați din nou sau scrieți-ne la infoavocati@yahoo.com.", "error");
                return;
            }
            const result = await response.json();
            const accepted = result?.success === true || result?.success === "true";
            const needsActivation = /activat/i.test(String(result?.message || ""));
            if (needsActivation) {
                showContactStatus("Mesajul nu a fost trimis. Formularul este temporar indisponibil. Textul a fost păstrat. Vă rugăm să ne scrieți la infoavocati@yahoo.com sau să ne sunați la 0726 286 228.", "unavailable");
                return;
            }
            if (!response.ok || !accepted) {
                throw new Error("Submission was not confirmed by the delivery service.");
            }
            contactForm.reset();
            validationAttempted = false;
            contactFields.forEach((field) => {
                field.setAttribute("aria-invalid", "false");
                document.querySelector(`#${field.id}-error`).textContent = "";
                field.closest(".form-field").classList.remove("has-error", "show-field-help");
            });
            showContactStatus("Mesajul a fost trimis cu succes. Vă mulțumim! Vă vom contacta cât mai curând posibil.", "success");
        } catch {
            showContactStatus("Nu am putut confirma trimiterea mesajului. Textul a fost păstrat. Verificați conexiunea și încercați din nou sau scrieți-ne la infoavocati@yahoo.com.", "error");
        } finally {
            window.clearTimeout(timeout);
            submitting = false;
            contactFieldset.disabled = false;
            contactForm.removeAttribute("aria-busy");
            contactSubmit.textContent = submitLabel;
        }
    });

    contactFieldset.disabled = false;

})();
