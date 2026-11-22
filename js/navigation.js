(() => {
    const navigation = document.querySelector("header .nav");
    const panel = navigation?.querySelector(".nav-links");
    const openButton = navigation?.querySelector(".nav-open");
    const closeButton = navigation?.querySelector(".nav-close");
    if (!panel || !openButton || !closeButton) return;

    const mobile = window.matchMedia("(max-width: 1200px)");
    const isOpen = () => panel.classList.contains("is-open");

    function setOpen(open, returnFocus = false) {
        open = mobile.matches && open;
        panel.classList.toggle("is-open", open);
        panel.inert = mobile.matches && !open;
        openButton.setAttribute("aria-expanded", String(open));
        if (open) closeButton.focus({ preventScroll: true });
        else if (returnFocus && mobile.matches) openButton.focus({ preventScroll: true });
    }

    openButton.addEventListener("click", () => setOpen(!isOpen(), isOpen()));
    closeButton.addEventListener("click", () => setOpen(false, true));
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && isOpen()) {
            event.preventDefault();
            setOpen(false, true);
        }
    });
    document.addEventListener("click", event => {
        if (isOpen() && !navigation.contains(event.target)) {
            setOpen(false, panel.contains(document.activeElement));
        }
    });
    navigation.addEventListener("focusout", () => {
        window.setTimeout(() => {
            if (isOpen() && !navigation.contains(document.activeElement)) setOpen(false);
        }, 0);
    });
    mobile.addEventListener("change", () => {
        const moveFocus = mobile.matches && panel.contains(document.activeElement);
        const toggleFocused = document.activeElement === openButton || document.activeElement === closeButton;
        setOpen(false, moveFocus);
        if (!mobile.matches && toggleFocused) {
            navigation.querySelector('.nav-link[aria-current="page"], .logo')?.focus({ preventScroll: true });
        }
    });
    setOpen(false);

    // Preserve the existing interior-page header treatment on scroll.
    if (document.body.classList.contains("content-page")) {
        const header = navigation.closest("header");
        const updateHeader = () => header.classList.toggle("scrolling-active", window.scrollY > 0);
        window.addEventListener("scroll", updateHeader, { passive: true });
        updateHeader();
    }
})();
