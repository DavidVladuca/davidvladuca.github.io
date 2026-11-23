function createMobileTrailerView(dialog, translate) {
    const screen = dialog.querySelector(".trailer-screen");
    // Keep the homepage in the fullscreen tree so returning never exposes an empty player.
    const fullscreenTarget = document.documentElement;
    const button = dialog.querySelector(".trailer-rotate");
    const mobile = window.matchMedia("(max-width: 700px), (max-width: 1100px) and (max-height: 500px) and (orientation: landscape)");
    let session;
    let cleanups = 0;

    const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
    const ownsFullscreen = () => fullscreenElement() === fullscreenTarget;

    function settleWithin(operation, milliseconds = 650) {
        return new Promise(resolve => {
            const timeout = setTimeout(resolve, milliseconds);
            Promise.resolve(operation).then(() => {
                clearTimeout(timeout);
                resolve();
            }, () => {
                clearTimeout(timeout);
                resolve();
            });
        });
    }

    function updateControls() {
        const { width, height } = screen.getBoundingClientRect();
        const previous = dialog.hasAttribute("data-landscape-controls");
        const active = Boolean(dialog.open && mobile.matches && (session?.wanted || width > height));
        dialog.toggleAttribute("data-landscape-controls", active);
        if (previous !== active) dialog.dispatchEvent(new Event("trailerviewchange"));
    }

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
        updateControls();
        updateButton();
        dialog.dispatchEvent(new Event("trailerviewchange"));
    }

    function updateLayout() {
        updateControls();
        if (!session?.wanted || !dialog.open) return;
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
            if (document.exitFullscreen) await settleWithin(document.exitFullscreen());
            else await settleWithin(document.webkitExitFullscreen?.());
        } catch {
            // Browser-owned fullscreen can already have ended through Back or Escape.
        }
    }

    function releaseOrientation(target) {
        if (!target.lockOwned && !target.lockPending) return;
        target.lockOwned = false;
        target.lockPending = false;
        try { window.screen.orientation?.unlock(); } catch { /* Already released. */ }
    }

    function releaseLateRequest(target) {
        if (target === session && target.wanted && dialog.open) return;
        // An older request must not undo a newer, deliberately entered landscape view.
        if (session?.wanted && dialog.open) return;
        releaseOrientation(target);
        exitOwnedFullscreen();
    }

    function restore(target = session) {
        if (!target) return null;
        if (target.cleanup) return target.cleanup;
        if (!target.wanted && !target.entering && !target.lockOwned && !target.lockPending && !ownsFullscreen()) return null;
        target.wanted = false;
        cleanups += 1;
        button.disabled = true;
        if (target === session) {
            dialog.dataset.restoringView = "true";
            clearLayout();
        }
        // Unlock first. Waiting for another orientation lock can deadlock a mobile exit.
        releaseOrientation(target);
        target.cleanup = (async () => {
            try {
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
            lockPending: false,
            pending: null,
            cleanup: null,
        };
        delete dialog.dataset.restoringView;
        clearLayout();
        button.disabled = cleanups > 0;
        requestAnimationFrame(updateLayout);
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
        updateLayout();
        target.pending = (async () => {
            try {
                let request;
                if (fullscreenTarget.requestFullscreen) request = fullscreenTarget.requestFullscreen({ navigationUI: "hide" });
                else if (fullscreenTarget.webkitRequestFullscreen) request = fullscreenTarget.webkitRequestFullscreen();
                // Settle the UI even if the native request never settles. Release late results.
                const operation = Promise.resolve(request);
                operation.then(() => releaseLateRequest(target), () => {});
                await settleWithin(operation);
            } catch {
                // iPhone and restricted browsers retain custom controls through the CSS fallback.
            }
            if (!target.wanted || target !== session || !dialog.open) return;
            target.nativeEntered = ownsFullscreen();
            if (ownsFullscreen() && window.screen.orientation?.lock) {
                try {
                    target.lockPending = true;
                    const operation = Promise.resolve(window.screen.orientation.lock("landscape"));
                    operation.then(() => {
                        target.lockPending = false;
                        target.lockOwned = true;
                        releaseLateRequest(target);
                    }, () => { target.lockPending = false; });
                    await settleWithin(operation);
                } catch {
                    target.lockPending = false;
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
    dialog.addEventListener("close", () => { restore(); clearLayout(); });
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
