function createMobileTrailerView(dialog, translate) {
    const screen = dialog.querySelector(".trailer-screen");
    const button = dialog.querySelector(".trailer-rotate");
    const mobile = window.matchMedia("(max-width: 700px), (max-width: 1100px) and (max-height: 500px) and (orientation: landscape)");
    let session;
    let cleanups = 0;

    const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
    const ownsFullscreen = () => fullscreenElement() === screen;

    function updateButton() {
        const active = Boolean(session?.wanted);
        const label = translate(active ? "film.restoreView" : "film.rotate");
        button.setAttribute("aria-pressed", String(active));
        button.setAttribute("aria-label", label);
        button.title = label;
    }

    function clearLayout() {
        delete dialog.dataset.playerRotated;
        delete dialog.dataset.mobileLandscape;
        dialog.style.removeProperty("--trailer-landscape-width");
        dialog.style.removeProperty("--trailer-landscape-height");
        updateButton();
        dialog.dispatchEvent(new Event("trailerviewchange"));
    }

    function updateLayout() {
        if (!session?.wanted || session.entering || !dialog.open) return;
        const { width, height } = screen.getBoundingClientRect();
        dialog.dataset.mobileLandscape = "true";
        // The fallback rotates only the player, never the homepage or navbar.
        dialog.toggleAttribute("data-player-rotated", height > width);
        dialog.style.setProperty("--trailer-landscape-width", `${height}px`);
        dialog.style.setProperty("--trailer-landscape-height", `${width}px`);
        updateButton();
        dialog.dispatchEvent(new Event("trailerviewchange"));
    }

    async function exitOwnedFullscreen() {
        if (!ownsFullscreen()) return;
        try {
            if (document.exitFullscreen) await document.exitFullscreen();
            else await document.webkitExitFullscreen?.();
        } catch {
            // Browser-owned fullscreen can already have ended through Back or Escape.
        }
    }

    function restore(target = session) {
        if (!target) return null;
        if (target.cleanup) return target.cleanup;
        if (!target.wanted && !target.entering && !target.lockOwned && !ownsFullscreen()) return null;
        target.wanted = false;
        cleanups += 1;
        button.disabled = true;
        if (target === session) {
            dialog.dataset.restoringView = "true";
            clearLayout();
        }
        target.cleanup = (async () => {
            try {
                // A close during an in-flight fullscreen/rotation request must clean up its result.
                await target.pending;
                if (target.lockOwned) {
                    try {
                        if (ownsFullscreen()) {
                            await window.screen.orientation.lock("portrait");
                        }
                    } catch {
                        // Some browsers only allow restoring the device's natural orientation.
                    } finally {
                        try { window.screen.orientation.unlock(); } catch { /* Already released. */ }
                        target.lockOwned = false;
                    }
                }
                await exitOwnedFullscreen();
            } finally {
                cleanups -= 1;
                if (target === session) {
                    clearLayout();
                    delete dialog.dataset.restoringView;
                }
                button.disabled = cleanups > 0 || Boolean(session?.entering);
            }
        })();
        return target.cleanup;
    }

    function begin() {
        if (session) restore(session);
        session = {
            wanted: false,
            entering: false,
            nativeEntered: false,
            lockOwned: false,
            pending: null,
            cleanup: null,
        };
        delete dialog.dataset.restoringView;
        clearLayout();
        button.disabled = cleanups > 0;
    }

    function enter() {
        if (!mobile.matches || !dialog.open || dialog.dataset.phase !== "watching" || !session || cleanups) return;
        const target = session;
        // A previous manual exit is complete before another tap can start a new view.
        target.cleanup = null;
        target.wanted = true;
        target.entering = true;
        target.nativeEntered = false;
        button.disabled = true;
        updateButton();
        target.pending = (async () => {
            try {
                if (screen.requestFullscreen) await screen.requestFullscreen({ navigationUI: "hide" });
                else if (screen.webkitRequestFullscreen) await screen.webkitRequestFullscreen();
            } catch {
                // iPhone and restricted browsers retain custom controls through the CSS fallback.
            }
            if (!target.wanted || target !== session || !dialog.open) return;
            target.nativeEntered = ownsFullscreen();
            if (ownsFullscreen() && window.screen.orientation?.lock) {
                try {
                    await window.screen.orientation.lock("landscape");
                    target.lockOwned = true;
                } catch {
                    // A supported fullscreen API does not guarantee orientation locking.
                }
            }
        })().finally(() => {
            target.entering = false;
            if (target === session && target.wanted && dialog.open) {
                button.disabled = false;
                updateLayout();
            }
        });
    }

    button.addEventListener("click", () => {
        if (session?.wanted) restore();
        else enter();
    });
    function fullscreenChanged() {
        if (ownsFullscreen() && (!session?.wanted || !dialog.open)) {
            exitOwnedFullscreen();
        } else if (session?.wanted && session.nativeEntered && !ownsFullscreen()) {
            restore();
        } else {
            if (ownsFullscreen() && session) session.nativeEntered = true;
            updateLayout();
        }
    }
    document.addEventListener("fullscreenchange", fullscreenChanged);
    document.addEventListener("webkitfullscreenchange", fullscreenChanged);
    dialog.addEventListener("close", () => restore());
    window.addEventListener("resize", updateLayout, { passive: true });
    window.visualViewport?.addEventListener("resize", updateLayout, { passive: true });
    window.addEventListener("pagehide", () => restore());
    mobile.addEventListener("change", () => {
        if (!mobile.matches) restore();
    });
    if (typeof ResizeObserver === "function") new ResizeObserver(updateLayout).observe(screen);
    updateButton();
    return { begin, restore };
}
