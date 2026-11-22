const hero = document.querySelector(".hero");
const film = document.querySelector("#hero-film");
const poster = hero.querySelector(".hero-media img");
const controls = document.querySelector(".hero-controls");
const quoteButtons = [...controls.querySelectorAll(".quote-picker button")];
const quotes = [...document.querySelectorAll("#hero-quotes blockquote")];
const quoteAnnouncement = document.querySelector("#quote-announcement");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const trailerTrigger = document.querySelector("#open-trailer");
const trailerDialog = document.querySelector("#firm-trailer");
const isMontage = new URLSearchParams(window.location.search).get("hero") === "montage";
const secondsPerQuote = 9;

let activeQuote = 0;
let nextQuoteTimer;
let seekToSelectedQuote = false;

function canPlayBackground() {
    return !reducedMotion.matches && !navigator.connection?.saveData;
}

function showMontagePoster() {
    const quoteNumber = activeQuote + 1;
    hero.dataset.quote = quoteNumber;
    poster.src = `images/hero/montage-quote-${quoteNumber}.webp`;
}

if (isMontage) {
    hero.classList.add("hero-montage");
    poster.parentElement.querySelector("source").remove();
    film.dataset.src = "images/hero/montage.mp4";
    showMontagePoster();
}

function selectQuote(index) {
    if (index === activeQuote) {
        return;
    }
    quotes[activeQuote].setAttribute("aria-hidden", "true");
    quoteButtons[activeQuote].removeAttribute("aria-current");
    quotes[index].removeAttribute("aria-hidden");
    quoteButtons[index].setAttribute("aria-current", "true");
    activeQuote = index;
    if (isMontage) {
        showMontagePoster();
    }
}

function scheduleQuote() {
    window.clearTimeout(nextQuoteTimer);
    nextQuoteTimer = window.setTimeout(() => {
        selectQuote((activeQuote + 1) % quotes.length);
        scheduleQuote();
    }, secondsPerQuote * 1000);
}

function syncMontage(mediaTime) {
    if (canPlayBackground() && !film.paused && !film.seeking) {
        selectQuote(Math.min(Math.floor(mediaTime / secondsPerQuote), quotes.length - 1));
    }
}

if (isMontage && typeof film.requestVideoFrameCallback === "function") {
    function onVideoFrame(_now, frame) {
        syncMontage(frame.mediaTime);
        film.requestVideoFrameCallback(onVideoFrame);
    }
    film.requestVideoFrameCallback(onVideoFrame);
} else if (isMontage) {
    film.addEventListener("timeupdate", () => syncMontage(film.currentTime));
}

function updatePlayback() {
    window.clearTimeout(nextQuoteTimer);
    if (!canPlayBackground() || document.hidden || trailerDialog.open) {
        film.pause();
        return;
    }

    if (!isMontage || film.error) {
        scheduleQuote();
    }
    if (film.error) {
        return;
    }
    if (!film.hasAttribute("src")) {
        film.src = film.dataset.src;
    }
    if (seekToSelectedQuote) {
        film.currentTime = activeQuote * secondsPerQuote;
        seekToSelectedQuote = false;
    }
    film.play().catch(() => {
        if (isMontage && canPlayBackground() && !document.hidden && film.paused) {
            seekToSelectedQuote = true;
            scheduleQuote();
        }
    });
}

controls.hidden = false;
quoteButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
        selectQuote(index);
        if (isMontage) {
            if (film.paused) {
                film.classList.remove("is-visible");
                seekToSelectedQuote = true;
            } else {
                film.currentTime = index * secondsPerQuote;
            }
        }
        if (canPlayBackground() && !document.hidden && (!isMontage || film.paused)) {
            scheduleQuote();
        }
        quoteAnnouncement.textContent = quotes[index].textContent.trim();
    });
});
film.addEventListener("playing", () => {
    if (!film.seeking) {
        film.classList.add("is-visible");
    }
    if (isMontage) {
        window.clearTimeout(nextQuoteTimer);
    }
});
film.addEventListener("seeked", () => {
    if (isMontage && canPlayBackground() && !film.paused) {
        film.classList.add("is-visible");
    }
});
film.addEventListener("error", () => {
    film.classList.remove("is-visible");
    if (isMontage) {
        updatePlayback();
    }
});
document.addEventListener("visibilitychange", updatePlayback);
reducedMotion.addEventListener("change", updatePlayback);
window.addEventListener("load", updatePlayback, { once: true });

const trailer = trailerDialog.querySelector(".trailer-video");
const libraryCamera = createLibraryCamera(hero.querySelector(".library-camera"), film, poster);
const trailerClose = trailerDialog.querySelector(".trailer-close");
const playbackButton = trailerDialog.querySelector(".trailer-playback");
const extension = trailerDialog.querySelector(".trailer-extension");
const extensionContext = extension.getContext("2d", { alpha: false });
const extensionLayout = window.matchMedia("(max-aspect-ratio: 4/3), (min-aspect-ratio: 13/6)");
const hasVideoFrameCallback = typeof trailer.requestVideoFrameCallback === "function";
const volumeSlider = trailerDialog.querySelector("#trailer-volume");
const volumeDisplay = trailerDialog.querySelector("output");
const muteButton = trailerDialog.querySelector(".trailer-mute");
const trailerStatus = trailerDialog.querySelector(".trailer-status");
const introEnd = Number(new URL(trailerTrigger.href).hash.slice(3));

let introFrame;
let extensionFrame;
let lastExtensionTime = -1;
let lastAudibleVolume = 100;
let audioContext;
let audioGain;
let volumeChecked = false;

function setTrailerStatus(message) {
    trailerStatus.textContent = message;
    trailerStatus.hidden = !message;
}

function updateVolumeDisplay() {
    if (!audioGain && !volumeSlider.disabled) {
        volumeSlider.value = Math.round(trailer.volume * 100);
    }
    const volume = volumeSlider.valueAsNumber;
    if (volume > 0) {
        lastAudibleVolume = volume;
    }
    const silent = trailer.muted || volume === 0;
    volumeSlider.style.setProperty("--progress", `${volume}%`);
    volumeDisplay.textContent = volumeSlider.disabled ? "Dispozitiv" : `${silent ? 0 : volume}%`;
    muteButton.textContent = silent ? "Porniți sunetul" : "Opriți sunetul";
}

function enableTrailerVolume() {
    if (!volumeChecked) {
        const initialVolume = trailer.volume;
        trailer.volume = 0.5;
        const supportsElementVolume = trailer.volume === 0.5;
        trailer.volume = initialVolume;
        volumeChecked = true;

        if (!supportsElementVolume) {
            // Some mobile browsers only expose device volume on the video element.
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                try {
                    audioContext = new AudioContextClass();
                    audioGain = audioContext.createGain();
                    audioGain.connect(audioContext.destination);
                    audioContext.createMediaElementSource(trailer).connect(audioGain);
                } catch {
                    audioGain = undefined;
                }
            }
            volumeSlider.disabled = !audioGain;
        }
    }

    audioContext?.resume().catch(() => {});
    updateVolumeDisplay();
}

function setTrailerVolume(volume) {
    volumeSlider.value = volume;
    if (audioGain) {
        audioGain.gain.value = volume / 100;
    } else {
        trailer.volume = volume / 100;
    }
    updateVolumeDisplay();
}

function drawTrailerExtension() {
    if (!extensionContext || !extensionLayout.matches || trailerDialog.dataset.phase !== "watching") {
        return;
    }
    if (trailer.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && trailer.currentTime !== lastExtensionTime) {
        extensionContext.drawImage(trailer, 0, 0, extension.width, extension.height);
        lastExtensionTime = trailer.currentTime;
    }
    if (!trailer.paused && !trailer.ended) {
        extensionFrame = hasVideoFrameCallback
            ? trailer.requestVideoFrameCallback(drawTrailerExtension)
            : window.requestAnimationFrame(drawTrailerExtension);
    }
}

function stopTrailerExtension() {
    if (extensionFrame === undefined) {
        return;
    }
    if (hasVideoFrameCallback) {
        trailer.cancelVideoFrameCallback(extensionFrame);
    } else {
        window.cancelAnimationFrame(extensionFrame);
    }
    extensionFrame = undefined;
}

function refreshTrailerExtension() {
    stopTrailerExtension();
    drawTrailerExtension();
}

function updateTrailerPlayback() {
    const playing = !trailer.paused && !trailer.ended;
    playbackButton.classList.toggle("is-playing", playing);
    playbackButton.setAttribute("aria-label", playing ? "Puneți filmul pe pauză" : "Porniți filmul");
    refreshTrailerExtension();
}

function showTrailerPlayer() {
    trailerDialog.dataset.phase = "watching";
    libraryCamera?.clear();
    updateTrailerPlayback();
}

function playTrailer() {
    trailer.play().catch((error) => {
        if (!trailerDialog.open || error.name === "AbortError" || trailer.error) {
            return;
        }
        if (trailerDialog.dataset.phase === "opening") {
            trailer.currentTime = introEnd;
            showTrailerPlayer();
        }
        setTrailerStatus("Apăsați butonul de redare pentru a porni filmul.");
    });
}

function toggleTrailerPlayback() {
    if (trailer.paused) {
        audioContext?.resume().catch(() => {});
        playTrailer();
    } else {
        trailer.pause();
    }
}

function advanceTrailerIntro() {
    if (!trailerDialog.open || trailerDialog.dataset.phase !== "opening") {
        return;
    }
    if (libraryCamera.isFinished() && !trailer.seeking) {
        // Skip any silent lead-in left over from the browser's initial buffering.
        if (trailer.currentTime < introEnd) {
            trailer.currentTime = introEnd;
        } else if (trailer.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            showTrailerPlayer();
            return;
        }
    }
    introFrame = window.requestAnimationFrame(advanceTrailerIntro);
}

function closeTrailer() {
    if (trailerDialog.open) {
        trailerDialog.close();
    }
}

function useBookTransition() {
    return libraryCamera && !isMontage && canPlayBackground();
}

window.addEventListener("load", () => {
    if (useBookTransition()) {
        libraryCamera.load();
    }
}, { once: true });

trailerTrigger.addEventListener("click", (event) => {
    if (typeof trailerDialog.showModal !== "function" || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
    }
    event.preventDefault();
    if (trailerDialog.open) {
        return;
    }

    const skipIntro = !useBookTransition();
    setTrailerStatus("");
    trailerDialog.dataset.phase = "opening";
    trailerDialog.showModal();
    if (!skipIntro) {
        libraryCamera.start(introEnd);
    }
    updatePlayback();

    if (!trailer.hasAttribute("src")) {
        trailer.src = trailerTrigger.href.split("#")[0];
    }
    trailer.currentTime = skipIntro ? introEnd : 0;
    if (skipIntro) {
        showTrailerPlayer();
    } else {
        advanceTrailerIntro();
    }
    enableTrailerVolume();
    playTrailer();
});

playbackButton.addEventListener("click", toggleTrailerPlayback);
trailer.addEventListener("click", toggleTrailerPlayback);
trailer.addEventListener("seeked", refreshTrailerExtension);
trailer.addEventListener("play", updateTrailerPlayback);
trailer.addEventListener("pause", updateTrailerPlayback);
extensionLayout.addEventListener("change", refreshTrailerExtension);
trailer.addEventListener("playing", () => {
    setTrailerStatus("");
    refreshTrailerExtension();
});
trailer.addEventListener("timeupdate", () => {
    trailerDialog.classList.toggle("trailer-ending", trailerDialog.dataset.phase === "watching"
        && trailer.duration - trailer.currentTime < 0.85);
});
trailer.addEventListener("error", () => {
    if (trailerDialog.open) {
        showTrailerPlayer();
        setTrailerStatus("Filmul nu s-a putut încărca. Închideți playerul și încercați din nou.");
    }
});
trailer.addEventListener("ended", () => {
    if (!trailerDialog.open) {
        return;
    }
    if (reducedMotion.matches) {
        closeTrailer();
        return;
    }

    trailerDialog.dataset.phase = "returning";
});
trailerDialog.addEventListener("animationend", (event) => {
    if (event.target === trailerDialog && event.animationName === "reveal-library") {
        closeTrailer();
    }
});
trailerClose.addEventListener("click", closeTrailer);
trailerDialog.addEventListener("close", () => {
    trailer.pause();
    window.cancelAnimationFrame(introFrame);
    stopTrailerExtension();
    extensionContext?.clearRect(0, 0, extension.width, extension.height);
    lastExtensionTime = -1;
    libraryCamera?.clear();
    trailerDialog.classList.remove("trailer-ending");
    delete trailerDialog.dataset.phase;
    if (trailer.error) {
        trailer.removeAttribute("src");
        trailer.load();
    }
    trailerTrigger.focus({ preventScroll: true });
    updatePlayback();
});
volumeSlider.addEventListener("input", () => {
    trailer.muted = false;
    setTrailerVolume(volumeSlider.valueAsNumber);
});
muteButton.addEventListener("click", () => {
    if (volumeSlider.valueAsNumber === 0) {
        setTrailerVolume(lastAudibleVolume);
        trailer.muted = false;
    } else {
        trailer.muted = !trailer.muted;
    }
    updateVolumeDisplay();
});
trailer.addEventListener("volumechange", updateVolumeDisplay);
reducedMotion.addEventListener("change", (event) => {
    if (!event.matches || !trailerDialog.open) {
        return;
    }
    if (trailerDialog.dataset.phase === "opening") {
        trailer.currentTime = introEnd;
        showTrailerPlayer();
    } else if (trailerDialog.dataset.phase === "returning") {
        closeTrailer();
    }
});
