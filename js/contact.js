(() => {
    const contactForm = document.querySelector("#contact-form");
    if (!contactForm) return;
    const text = window.InfoavocatiI18n.text;
    const config = window.InfoavocatiContactConfig || {};
    let endpoint = "";
    try {
        const url = new URL(config.endpoint);
        if (url.protocol === "https:" && url.hostname === "formspree.io"
            && /^\/f\/[a-z0-9]+$/i.test(url.pathname)
            && !url.search && !url.hash && !url.username && !url.password) {
            endpoint = url.href;
            contactForm.action = endpoint;
        }
    } catch {
        // An unconfigured form keeps its direct email/phone fallback without making a request.
    }
    const contactFields = [...contactForm.querySelectorAll("[data-contact-field]")];
    const contactFieldset = contactForm.querySelector("fieldset");
    const contactSubmit = contactForm.querySelector("button[type='submit']");
    const contactStatus = document.querySelector("#contact-form-status");
    const contactNotification = document.querySelector("#contact-notification");
    const notificationClose = document.querySelector("#contact-notification-close");
    const submitLabel = contactSubmit.textContent;
    const serverErrors = new Map();
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
            return text("contact.email");
        }
        if (field.maxLength > 0 && value.length > field.maxLength) {
            return text("contact.length", { max: field.maxLength });
        }
        if (field.type === "tel") {
            const digits = value.replace(/\D/g, "");
            if (!/^\+?[\d\s().-]+$/.test(value) || digits.length < 7 || digits.length > 15) {
                return text("contact.phone");
            }
        }
        return serverErrors.get(field.name) || "";
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
            serverErrors.delete(field.name);
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
            showContactStatus(text("contact.invalid"), "error", firstInvalid);
            return;
        }

        // Both languages share the same verified Formspree endpoint and delivery switch.
        if (config.enabled !== true || !endpoint) {
            showContactStatus(text("contact.disabled"), "unavailable");
            return;
        }

        const payload = Object.fromEntries(new FormData(contactForm));
        if (payload._gotcha) {
            showContactStatus(text("contact.blocked"), "error");
            return;
        }
        contactFields.forEach((field) => {
            payload[field.name] = field.value.trim();
        });
        // Formspree uses the existing subject field and the visitor's email as Reply-To.

        submitting = true;
        contactFieldset.disabled = true;
        contactForm.setAttribute("aria-busy", "true");
        contactSubmit.textContent = text("contact.submit");
        showContactStatus(text("contact.sending"), "sending");

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 20000);
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal,
                credentials: "omit",
            });
            if (response.status === 429) {
                showContactStatus(text("contact.rateLimit"), "error");
                return;
            }
            const result = await response.json();
            const errors = Array.isArray(result?.errors) ? result.errors : [];
            const unavailableCodes = ["INACTIVE", "BLOCKED", "FORM_NOT_FOUND", "PROJECT_NOT_FOUND"];
            if ([401, 403, 404].includes(response.status)
                || errors.some(error => unavailableCodes.includes(error?.code))) {
                showContactStatus(text("contact.unavailable"), "unavailable");
                return;
            }
            let firstRejected;
            errors.forEach(error => {
                const field = contactFields.find(input => input.name === error?.field);
                if (!field) return;
                const message = ["REQUIRED_FIELD_EMPTY", "REQUIRED_FIELD_MISSING"].includes(error.code)
                    ? field.dataset.requiredMessage
                    : text(error.code === "TYPE_EMAIL" ? "contact.email" : "contact.serverField");
                serverErrors.set(field.name, message);
                validateField(field);
                firstRejected ||= field;
            });
            if (firstRejected) {
                showContactStatus(text("contact.invalid"), "error", firstRejected);
                return;
            }
            if (!response.ok || result?.ok !== true || result?.error || errors.length) {
                throw new Error("Submission was not confirmed by the delivery service.");
            }
            contactForm.reset();
            serverErrors.clear();
            validationAttempted = false;
            contactFields.forEach((field) => {
                field.setAttribute("aria-invalid", "false");
                document.querySelector(`#${field.id}-error`).textContent = "";
                field.closest(".form-field").classList.remove("has-error", "show-field-help");
            });
            showContactStatus(text("contact.success"), "success");
        } catch {
            showContactStatus(text("contact.failure"), "error");
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
