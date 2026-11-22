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

    let active = 0;
    function showSlide(index, announce = true) {
        active = (index + slides.length) % slides.length;
        slides.forEach((slide, current) => {
            slide.classList.toggle("is-current", current === active);
            slide.setAttribute("aria-hidden", String(current !== active));
        });
        number.textContent = String(active + 1);
        if (announce) {
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
    showSlide(0, false);
})();
