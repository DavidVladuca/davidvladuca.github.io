(() => {
    const language = document.documentElement.lang.toLowerCase().startsWith("en") ? "en" : "ro";
    const messages = {
        ro: {
            "contact.email": "Introduceți o adresă de email validă, de exemplu nume@exemplu.ro.",
            "contact.length": "Folosiți cel mult {max} de caractere.",
            "contact.phone": "Introduceți un număr de telefon valid, de exemplu 0726 286 228.",
            "contact.invalid": "Mesajul nu a fost trimis. Verificați câmpurile marcate cu roșu și încercați din nou.",
            "contact.disabled": "Formularul este temporar indisponibil. Ne puteți trimite mesajul la infoavocati@yahoo.com sau ne puteți suna la 0726 286 228.",
            "contact.blocked": "Trimiterea nu a putut fi procesată. Contactați-ne prin email sau telefon.",
            "contact.serverField": "Verificați valoarea acestui câmp și încercați din nou.",
            "contact.submit": "SE TRIMITE…",
            "contact.sending": "Mesajul se trimite. Vă rugăm să așteptați.",
            "contact.rateLimit": "Formularul a atins temporar o limită de trimitere. Mesajul a fost păstrat. Încercați mai târziu sau scrieți-ne la infoavocati@yahoo.com.",
            "contact.unavailable": "Mesajul nu a fost trimis. Formularul este temporar indisponibil. Textul a fost păstrat. Vă rugăm să ne scrieți la infoavocati@yahoo.com sau să ne sunați la 0726 286 228.",
            "contact.success": "Mesajul a fost trimis cu succes. Vă mulțumim! Vă vom contacta cât mai curând posibil.",
            "contact.failure": "Nu am putut confirma trimiterea mesajului. Textul a fost păstrat. Verificați conexiunea și încercați din nou sau scrieți-ne la infoavocati@yahoo.com.",
            "fees.factor": "Factorul {current} din {total}: {text}",
            "partners.previous": "Partenerul anterior",
            "partners.next": "Partenerul următor",
            "partners.bullet": "Afișați partenerul {{index}}",
            "partners.position": "{{index}} din {{slidesLength}}",
            "partners.carousel": "carusel",
            "partners.slide": "diapozitiv",
            "film.device": "Dispozitiv",
            "film.unmute": "Porniți sunetul",
            "film.mute": "Opriți sunetul",
            "film.pause": "Puneți filmul pe pauză",
            "film.play": "Porniți filmul",
            "film.start": "Apăsați butonul de redare pentru a porni filmul.",
            "film.failure": "Filmul nu s-a putut încărca. Închideți playerul și încercați din nou.",
            "film.rotate": "Vizionare pe orizontală",
            "film.restoreView": "Revenire la afișarea normală",
        },
        en: {
            "contact.email": "Enter a valid email address, for example name@example.com.",
            "contact.length": "Use no more than {max} characters.",
            "contact.phone": "Enter a valid phone number, for example +40 726 286 228.",
            "contact.invalid": "Your message was not sent. Check the fields marked in red and try again.",
            "contact.disabled": "The form is temporarily unavailable. Email us at infoavocati@yahoo.com or call +40 726 286 228.",
            "contact.blocked": "Your submission could not be processed. Please contact us by email or phone.",
            "contact.serverField": "Check the value of this field and try again.",
            "contact.submit": "SENDING…",
            "contact.sending": "Your message is being sent. Please wait.",
            "contact.rateLimit": "The form has temporarily reached a submission limit. Your message has been kept. Try again later, or email infoavocati@yahoo.com.",
            "contact.unavailable": "Your message was not sent. The form is temporarily unavailable. Your text has been kept. Please email infoavocati@yahoo.com or call +40 726 286 228.",
            "contact.success": "Your message has been sent successfully. Thank you! We will contact you as soon as possible.",
            "contact.failure": "We could not confirm that your message was sent. Your text has been kept. Check your connection and try again, or email infoavocati@yahoo.com.",
            "fees.factor": "Factor {current} of {total}: {text}",
            "partners.previous": "Previous partner",
            "partners.next": "Next partner",
            "partners.bullet": "Show partner {{index}}",
            "partners.position": "{{index}} of {{slidesLength}}",
            "partners.carousel": "carousel",
            "partners.slide": "slide",
            "film.device": "Device",
            "film.unmute": "Unmute",
            "film.mute": "Mute",
            "film.pause": "Pause film",
            "film.play": "Play film",
            "film.start": "Press play to start the film.",
            "film.failure": "The film could not be loaded. Close the player and try again.",
            "film.rotate": "Watch in landscape",
            "film.restoreView": "Return to normal view",
        },
    };

    function text(key, values = {}) {
        const message = messages[language][key] ?? messages.ro[key] ?? key;
        return message.replace(/\{(\w+)\}/g, (placeholder, name) => String(values[name] ?? placeholder));
    }

    window.InfoavocatiI18n = Object.freeze({ language, text });
})();
