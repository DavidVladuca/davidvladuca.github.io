function createLibraryCamera(scene, film, poster) {
    if (typeof scene.animate !== "function") {
        return null;
    }

    const media = scene.parentElement;
    const frame = { x: 0, y: 0, width: 1280, height: 720 };
    const wideCrop = { x: 385, y: 238, width: 411, height: 277 };
    const shelfCrop = { x: 497, y: 346, width: 109, height: 73 };
    // The photo's gold lettering is made from this same text, at this registration point.
    const letteringFrame = { width: 1536, height: 1024, x: 744, y: 485 };
    const cropScaleX = shelfCrop.width / letteringFrame.width;
    const cropScaleY = shelfCrop.height / letteringFrame.height;
    const spineX = shelfCrop.x + letteringFrame.x * cropScaleX;
    const spineY = shelfCrop.y + letteringFrame.y * cropScaleY;
    const originalDuration = 9.72;
    const rotationStart = 5.42;
    const rotationEnd = 8.35;
    let animations = [];
    let movement;
    let openingView;

    function makeLayer(name, area) {
        const image = new Image();
        image.alt = "";
        image.decoding = "async";
        image.fetchPriority = "low";
        image.dataset.src = `images/hero/${name}.webp`;
        Object.assign(image.style, {
            left: `${area.x}px`,
            top: `${area.y}px`,
            width: `${area.width}px`,
            height: `${area.height}px`
        });
        return image;
    }

    const view = document.createElement("div");
    view.className = "library-camera-view";
    const room = document.createElement("div");
    room.className = "library-camera-room";
    const night = makeLayer("biblioteca-noapte", frame);
    const shelves = makeLayer("rafturi-noapte", wideCrop);
    const close = makeLayer("raf-biblioteca", shelfCrop);
    // Lay out the lettering in the crop's native pixels before scaling both to the scene.
    const lettering = document.createElement("div");
    lettering.className = "library-camera-lettering";
    Object.assign(lettering.style, {
        left: `${shelfCrop.x}px`,
        top: `${shelfCrop.y}px`,
        width: `${letteringFrame.width}px`,
        height: `${letteringFrame.height}px`,
        transform: `scale(${cropScaleX}, ${cropScaleY})`
    });
    const title = document.createElement("span");
    title.className = "library-camera-title";
    title.textContent = "Vladuca & Partners";
    title.style.left = `${letteringFrame.x}px`;
    title.style.top = `${letteringFrame.y}px`;
    title.style.transform = "translate(-50%, -50%) rotate(-90deg)";
    room.append(night, shelves, close);
    lettering.append(title);
    view.append(room, lettering);
    scene.append(view);

    function load() {
        for (const image of [night, shelves, close]) {
            if (!image.hasAttribute("src")) {
                image.src = image.dataset.src;
                image.decode().catch(() => {});
            }
        }
        document.fonts.load("500 1em \"Baskervville Title\"", title.textContent).catch(() => {});
    }

    function ease(from, to, seconds) {
        const value = Math.max(0, Math.min(1, (seconds - from) / (to - from)));
        return value * value * (3 - 2 * value);
    }

    // Keep the original camera poses and spend less time getting to the rotation.
    function introOffset(seconds, duration) {
        const stops = [[rotationStart, 3.08], [rotationEnd, 5.70], [originalDuration, duration]];
        let originalStart = 0;
        let newStart = 0;
        for (const [originalEnd, newEnd] of stops) {
            if (seconds <= originalEnd) {
                const progress = (seconds - originalStart) / (originalEnd - originalStart);
                return (newStart + (newEnd - newStart) * progress) / duration;
            }
            originalStart = originalEnd;
            newStart = newEnd;
        }
        return 1;
    }

    function cameraPath(duration) {
        const { top, width, height } = scene.getBoundingClientRect();
        const hero = media.getBoundingClientRect();
        const startScale = Math.max(hero.width / openingView.width, hero.height / frame.height);
        const viewWidth = hero.width / startScale;
        const startX = openingView.left + viewWidth / 2 + (openingView.width - viewWidth) * openingView.position;
        const startY = frame.height / 2 + (top + height / 2 - hero.top - hero.height / 2) / startScale;
        const endScale = Math.max(startScale, Math.min(23, width / 32));
        const uprightScale = Math.max(endScale, Math.min(23, height / 50));

        // Sample the camera path once. The browser interpolates the transform on its compositor.
        return Array.from({ length: 121 }, (_, index) => {
            const seconds = originalDuration * index / 120;
            const approach = ease(0.64, 5.44, seconds);
            const push = ease(0.77, 6.34, seconds);
            const roll = ease(rotationStart, rotationEnd, seconds);
            const targetScale = uprightScale + (endScale - uprightScale) * roll;
            const zoom = startScale * (targetScale / startScale) ** push;
            const scaleX = zoom * (1 + 0.12 * approach * (1 - roll));
            const centerX = startX + (spineX - startX) * approach;
            const centerY = startY + (spineY - startY) * approach;
            return {
                offset: introOffset(seconds, duration),
                transform: `translate(${width / 2}px, ${height / 2}px) rotate(${90 * roll}deg) ` +
                    `scale(${scaleX}, ${zoom}) translate(${-centerX}px, ${-centerY}px)`
            };
        });
    }

    function start(duration) {
        load();
        const playingFrame = film.classList.contains("is-visible");
        if (!playingFrame && poster.currentSrc.includes("hero-poster-mobile")) {
            openingView = { left: 656, width: 480, position: 0.5 };
        } else {
            const position = parseFloat(getComputedStyle(playingFrame ? film : poster).objectPosition) / 100;
            openingView = { left: 0, width: frame.width, position };
        }
        scene.hidden = false;
        const path = cameraPath(duration);
        const startTime = document.timeline.currentTime;
        const timing = { duration: duration * 1000, fill: "both" };
        const offset = seconds => introOffset(seconds, duration);
        const fade = (element, from, to, startAt, endAt) => element.animate([
            { opacity: from, offset: 0 },
            { opacity: from, offset: offset(startAt), easing: "ease-in-out" },
            { opacity: to, offset: offset(endAt) },
            { opacity: to, offset: 1 }
        ], timing);
        movement = view.animate(path, timing);
        animations = [
            movement,
            fade(scene, 0, 1, 0.04, 0.92),
            fade(shelves, 0, 1, 1.35, 3.85),
            fade(close, 0, 1, 2.6, 4.95),
            fade(room, 1, 0, 5.85, 8.32),
            title.animate([
                { opacity: 0, offset: 0 },
                { opacity: 0, offset: offset(6.17), easing: "ease-in-out" },
                { opacity: 1, offset: offset(8.25) },
                { opacity: 1, offset: offset(8.52), easing: "ease-in-out" },
                { opacity: 0, offset: offset(9.55) },
                { opacity: 0, offset: 1 }
            ], timing)
        ];
        if (startTime !== null) {
            animations.forEach(animation => { animation.startTime = startTime; });
        }
    }

    function isFinished() {
        return movement?.playState === "finished";
    }

    function clear() {
        scene.hidden = true;
        animations.forEach(animation => animation.cancel());
        animations = [];
        movement = undefined;
    }

    window.addEventListener("resize", () => {
        if (movement) {
            movement.effect.setKeyframes(cameraPath(movement.effect.getTiming().duration / 1000));
        }
    });

    return { load, start, isFinished, clear };
}
