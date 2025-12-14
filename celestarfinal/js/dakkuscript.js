const backToTopBtn = document.getElementById("backToTopBtn");

window.onscroll = function () { scrollFunction() };

function scrollFunction() {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
}

backToTopBtn.addEventListener("click", backToTop);

function backToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

}

document.addEventListener("DOMContentLoaded", () => {
    const stickers = document.querySelectorAll(".sticker");
    const journal = document.getElementById("journal");

    if (!journal || stickers.length === 0) return;

    stickers.forEach(sticker => {
        sticker.addEventListener("click", () => {
            const clone = sticker.cloneNode(true);
            clone.classList.add("placed-sticker");

            clone.dataset.x = 0.5;
            clone.dataset.y = 0.5;
            updateStickerPosition(clone);

            journal.appendChild(clone);
            makeDraggable(clone);
        });
    });

    function makeDraggable(el) {
        let offsetX = 0;
        let offsetY = 0;

        el.addEventListener("mousedown", (e) => {
            e.preventDefault();
            offsetX = e.offsetX;
            offsetY = e.offsetY;

            const onMouseMove = (eMove) => {
                const rect = journal.getBoundingClientRect();

                const x = (eMove.clientX - rect.left - offsetX) / rect.width;
                const y = (eMove.clientY - rect.top - offsetY) / rect.height;

                el.dataset.x = x;
                el.dataset.y = y;

                updateStickerPosition(el);
            };


            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }
    function updateStickerPosition(el) {
        const rect = journal.getBoundingClientRect();

        const x = el.dataset.x * rect.width;
        const y = el.dataset.y * rect.height;

        el.style.left = x + "px";
        el.style.top = y + "px";
    }
    window.addEventListener("resize", () => {
        document.querySelectorAll(".placed-sticker").forEach(sticker => {
            updateStickerPosition(sticker);
        });
    });
});
