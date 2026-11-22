(() => {
    const container = document.querySelector(".slide-content");
    if (!container || typeof Swiper !== "function") return;
    const totalSlides = container.querySelectorAll(".swiper-slide").length;
    const currentPosition = document.querySelector(".partner-current");
    const totalPositions = document.querySelector(".partner-total");

    function updateCounter(swiper) {
        if (currentPosition) currentPosition.textContent = String(swiper.realIndex + 1);
        if (totalPositions) totalPositions.textContent = String(totalSlides);
    }

    function updateSlides(swiper) {
        swiper.slides.forEach(slide => {
            const visible = slide.classList.contains("swiper-slide-visible");
            slide.setAttribute("aria-hidden", String(!visible));
            slide.inert = !visible;
        });
        updateCounter(swiper);
    }

    const carousel = new Swiper(container, {
        slidesPerView: 3,
        spaceBetween: 25,
        loop: true,
        grabCursor: true,
        watchSlidesProgress: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
            dynamicBullets: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        a11y: {
            prevSlideMessage: "Partenerul anterior",
            nextSlideMessage: "Partenerul următor",
            paginationBulletMessage: "Afișați partenerul {{index}}",
            slideLabelMessage: "{{index}} din {{slidesLength}}",
            containerRoleDescriptionMessage: "carusel",
            itemRoleDescriptionMessage: "diapozitiv",
        },
        breakpoints: {
            0: { slidesPerView: 1 },
            520: { slidesPerView: 2 },
            950: { slidesPerView: 3 },
        },
        on: {
            afterInit: updateSlides,
            realIndexChange: updateCounter,
            slideChangeTransitionEnd: updateSlides,
            resize: updateSlides,
        },
    });

    const controls = container.closest(".slide-container") || container;
    controls.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        if (event.key === "ArrowLeft") carousel.slidePrev();
        else if (event.key === "ArrowRight") carousel.slideNext();
        else carousel.slideToLoop(event.key === "Home" ? 0 : totalSlides - 1);
    });
})();
