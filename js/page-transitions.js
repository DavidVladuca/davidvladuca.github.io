(() => {
    const root = document.documentElement;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const nativeTransitions = "onpagereveal" in window && "onpageswap" in window;
    const historyEntry = performance.getEntriesByType("navigation")[0]?.type === "back_forward";
    const internalEntrance = nativeTransitions && document.referrer
        && new URL(document.referrer).origin === location.origin;
    const storageKey = "vp-home-entrance";
    const animations = new Map();
    const seen = new WeakSet();
    let observer;
    let nativeEntrance = false;
    let leaving = false;
    let navigationTimer;
    let recoveryTimer;
    let restorePending = false;

    function saveReadingPosition() {
        try {
            const state = history.state;
            if (state !== null && typeof state !== "object") return;
            history.replaceState({ ...state, vpReadingPosition: { x: scrollX, y: scrollY } }, "");
        } catch { /* Native history remains available when state cannot be saved. */ }
    }

    function restoreReadingPosition() {
        const point = history.state?.vpReadingPosition;
        if (!Number.isFinite(point?.x) || !Number.isFinite(point?.y)) return;
        restorePending = true;
        // A reloaded history entry can settle at a different scroll anchor than it left.
        const fonts = document.fonts?.ready || Promise.resolve();
        Promise.race([fonts, new Promise(resolve => setTimeout(resolve, 800))]).then(() => {
            requestAnimationFrame(() => {
                if (!restorePending || document.hidden) return;
                restorePending = false;
                window.scrollTo({ left: point.x, top: point.y, behavior: "instant" });
            });
        });
    }

    function skipPageTransition(transition) {
        if (!transition) return;
        // Skipping a native transition deliberately rejects its ready promise.
        transition.ready.catch(() => {});
        transition.finished.catch(() => {});
        transition.skipTransition();
    }

    // Different documents get distinct snapshot names, avoiding stretched text or panels.
    const pageKey = location.pathname.split("/").pop().replace(/[^a-z0-9]/gi, "-") || "home";
    root.style.setProperty("--page-heading-name", `heading-${pageKey}`);
    root.style.setProperty("--page-intro-name", `intro-${pageKey}`);

    function canonicalPath(url) {
        return url.pathname.replace(/indexRO\.html$/, "index.html").replace(/\/index\.html$/, "/");
    }

    function isHome(url) {
        return /\/(?:index(?:RO|EN)?\.html)?$/.test(url.pathname);
    }

    try {
        const entrance = JSON.parse(sessionStorage.getItem(storageKey) || "null");
        sessionStorage.removeItem(storageKey);
        if (!nativeTransitions && !historyEntry && !reducedMotion.matches && entrance
            && Date.now() - entrance.time < 10000 && entrance.path === canonicalPath(new URL(location.href))) {
            root.dataset.pageFade = "covered";
        }
    } catch { /* Navigation also works when browser storage is unavailable. */ }

    function finish(element) {
        element.removeAttribute("data-page-reveal");
        observer?.unobserve(element);
        animations.get(element)?.cancel();
        animations.delete(element);
        seen.add(element);
    }

    function reveal(element, delay = 0) {
        if (seen.has(element)) return;
        seen.add(element);
        element.removeAttribute("data-page-reveal");
        observer?.unobserve(element);
        if (reducedMotion.matches || typeof element.animate !== "function") return;
        const distance = matchMedia("(max-width: 700px)").matches ? 10 : 16;
        const animation = element.animate([
            { opacity: 0, transform: `translateY(${distance}px)` },
            { opacity: 1, transform: "translateY(0)" }
        ], { duration: 400, delay, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
        animations.set(element, animation);
        animation.finished.then(() => {
            if (animations.get(element) === animation) animations.delete(element);
        }).catch(() => {});
    }

    function reset() {
        clearTimeout(navigationTimer);
        clearTimeout(recoveryTimer);
        leaving = false;
        restorePending = false;
        delete root.dataset.pageFade;
        delete root.dataset.pageNavigating;
        observer?.disconnect();
        document.querySelectorAll("[data-page-reveal]").forEach(finish);
        animations.forEach(animation => animation.cancel());
        animations.clear();
    }

    function prepareReveals() {
        if (historyEntry || !document.body.classList.contains("content-page") || reducedMotion.matches) return;
        const groups = [...document.querySelectorAll([
            ".sub-header .title", ".sub-header-box", ".dc-noi", ".dc-noi-box",
            ".mai-multe .mm-noi", ".mai-multe-box", ".rezolv-prob > h2", ".rezolv-prob-box",
            ".serviciile-noastre", ".servicii-boxes-list", ".consiliere > h2", ".button-box",
            ".atestarea-curea > h2", ".rezolv-list", ".onorarii-percepute", ".fee-introduction", ".tipuri-persoane",
            ".stabilire > .border", ".parteneri > h2", ".slide-container", ".harta > h2",
            ".contact-map", ".contact-content .content-col", ".submit", ".arii-de-practica", ".civil-box"
        ].join(","))];

        // Wait one frame so pagereveal can identify a browser-managed navigation.
        requestAnimationFrame(() => {
            if (reducedMotion.matches) return;
            let initialIndex = 0;
            if ("IntersectionObserver" in window) {
                observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
                }, { rootMargin: "0px 0px 24px 0px", threshold: 0 });
            }
            groups.forEach(element => {
                const bounds = element.getBoundingClientRect();
                if (!bounds.height || !bounds.width) return;
                if (bounds.bottom > 0 && bounds.top < innerHeight) {
                    if (historyEntry || nativeEntrance || internalEntrance || location.hash) seen.add(element);
                    else reveal(element, Math.min(initialIndex++ * 45, 100));
                } else if (bounds.top >= innerHeight && observer) {
                    element.dataset.pageReveal = "pending";
                    observer.observe(element);
                }
            });
        });
    }

    function revealHome() {
        if (root.dataset.pageFade !== "covered") return;
        const poster = document.querySelector(".hero-media picture img");
        const ready = poster?.decode ? poster.decode().catch(() => {}) : Promise.resolve();
        // Never wait for the loop, footer, map, or a slow image indefinitely.
        Promise.race([ready, new Promise(resolve => setTimeout(resolve, 800))]).then(() => {
            if (root.dataset.pageFade !== "covered") return;
            root.dataset.pageFade = "revealing";
            recoveryTimer = setTimeout(() => { delete root.dataset.pageFade; }, 460);
        });
    }

    window.addEventListener("pagereveal", event => {
        nativeEntrance = Boolean(event.viewTransition);
        if (reducedMotion.matches || historyEntry || window.navigation?.activation?.navigationType === "traverse") {
            skipPageTransition(event.viewTransition);
        }
    });
    window.addEventListener("pageswap", event => {
        saveReadingPosition();
        // Capture the page behind an open phone menu, rather than dissolving its gold panel.
        const panel = document.querySelector(".nav-links.is-open");
        if (panel) {
            root.dataset.pageNavigating = "true";
            panel.classList.remove("is-open");
            panel.inert = true;
            document.querySelector(".nav-open")?.setAttribute("aria-expanded", "false");
        }
        if (reducedMotion.matches || event.activation?.navigationType === "traverse") {
            skipPageTransition(event.viewTransition);
        }
    });
    window.addEventListener("pagehide", () => { saveReadingPosition(); reset(); });
    window.addEventListener("beforeprint", reset);
    window.addEventListener("pageshow", event => {
        if (event.persisted) reset();
        if (event.persisted || historyEntry) restoreReadingPosition();
    });
    for (const type of ["pointerdown", "keydown", "wheel", "touchmove"]) {
        document.addEventListener(type, () => { restorePending = false; }, { passive: true });
    }
    reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) reset(); });

    // Fallback only for the home fade. Ordinary links retain native navigation/history.
    document.addEventListener("click", event => {
        if (event.defaultPrevented || event.button !== 0
            || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const link = event.target.closest?.("a[href]");
        if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
        const url = new URL(link.href);
        if (url.origin !== location.origin || !/(?:\.html|\/)$/.test(url.pathname)
            || canonicalPath(url) === canonicalPath(new URL(location.href))) return;
        saveReadingPosition();
        if (nativeTransitions || reducedMotion.matches || !isHome(url)) return;
        event.preventDefault();
        if (leaving) return;
        leaving = true;
        try {
            sessionStorage.setItem(storageKey, JSON.stringify({ path: canonicalPath(url), time: Date.now() }));
        } catch { /* The outgoing fade still works without session storage. */ }
        root.dataset.pageFade = "leaving";
        navigationTimer = setTimeout(() => location.assign(url.href), 180);
        recoveryTimer = setTimeout(() => {
            leaving = false;
            delete root.dataset.pageFade;
        }, 1800);
    });

    // Keyboard users can reach a section immediately, even during its first entrance.
    document.addEventListener("focusin", event => {
        for (let element = event.target; element && element !== root; element = element.parentElement) {
            if (element.hasAttribute("data-page-reveal") || animations.has(element)) finish(element);
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        prepareReveals();
        revealHome();
    }, { once: true });
})();
