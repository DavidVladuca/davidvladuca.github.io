(() => {
    const tabList = document.querySelector(".tipuri-persoane");
    if (tabList) {
        const tabs = [...tabList.querySelectorAll('[role="tab"]')];
        const panels = tabs.map(tab => document.getElementById(tab.getAttribute("aria-controls")));
        if (tabs.length && panels.every(Boolean)) {
            function selectTab(index, moveFocus = false) {
                tabs.forEach((tab, current) => {
                    const selected = current === index;
                    tab.classList.toggle("act", selected);
                    tab.setAttribute("aria-selected", String(selected));
                    tab.tabIndex = selected ? 0 : -1;
                    panels[current].hidden = !selected;
                });
                if (moveFocus) tabs[index].focus({ preventScroll: true });
            }
            tabs.forEach((tab, index) => {
                tab.addEventListener("click", () => selectTab(index));
                tab.addEventListener("keydown", event => {
                    let next;
                    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
                    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
                    else if (event.key === "Home") next = 0;
                    else if (event.key === "End") next = tabs.length - 1;
                    if (next !== undefined) {
                        event.preventDefault();
                        selectTab(next, true);
                    }
                });
            });
            selectTab(0);
        }
    }

    const carousel = document.querySelector(".stabilire-text");
    const slides = carousel ? [...carousel.querySelectorAll(".mySlides")] : [];
    const previous = carousel?.querySelector(".factor-previous");
    const next = carousel?.querySelector(".factor-next");
    const number = document.getElementById("number");
    const status = document.getElementById("fee-factor-status");
    if (!slides.length || !previous || !next || !number || !status) return;

    const mobile = window.matchMedia("(max-width: 700px), (max-width: 950px) and (max-height: 500px) and (orientation: landscape)");
    const mobileHeading = document.querySelector(".fee-mobile-heading");
    const introduction = document.querySelector(".fee-factors-intro");
    const pagination = number.closest(".fee-factor-pagination");
    let active = 0;
    function showSlide(index, announce = true) {
        active = (index + slides.length) % slides.length;
        slides.forEach((slide, current) => {
            slide.classList.toggle("is-current", current === active);
            if (mobile.matches) slide.removeAttribute("aria-hidden");
            else slide.setAttribute("aria-hidden", String(current !== active));
        });
        number.textContent = String(active + 1);
        if (announce && !mobile.matches) {
            const text = slides[active].textContent.trim().replace(/\s+/g, " ");
            status.textContent = `Factorul ${active + 1} din ${slides.length}: ${text}`;
        }
    }
    previous.addEventListener("click", () => showSlide(active - 1));
    next.addEventListener("click", () => showSlide(active + 1));
    carousel.addEventListener("keydown", event => {
        if (!event.target.closest("button")) return;
        let target;
        if (event.key === "ArrowLeft") target = active - 1;
        else if (event.key === "ArrowRight") target = active + 1;
        else if (event.key === "Home") target = 0;
        else if (event.key === "End") target = slides.length - 1;
        if (target !== undefined) {
            event.preventDefault();
            showSlide(target);
        }
    });

    function updatePresentation() {
        const focusOnControls = document.activeElement === previous || document.activeElement === next;
        const focusOnHeading = document.activeElement === mobileHeading;
        previous.hidden = mobile.matches;
        next.hidden = mobile.matches;
        status.hidden = mobile.matches;
        if (pagination) pagination.hidden = mobile.matches;
        if (mobileHeading) mobileHeading.hidden = !mobile.matches;
        if (introduction) {
            if (mobile.matches) {
                introduction.removeAttribute("role");
                introduction.removeAttribute("aria-level");
            } else {
                introduction.setAttribute("role", "heading");
                introduction.setAttribute("aria-level", "2");
            }
        }
        showSlide(active, false);
        if (mobile.matches && focusOnControls) mobileHeading?.focus({ preventScroll: true });
        else if (!mobile.matches && focusOnHeading) previous.focus({ preventScroll: true });
    }
    mobile.addEventListener("change", updatePresentation);
    updatePresentation();
})();
