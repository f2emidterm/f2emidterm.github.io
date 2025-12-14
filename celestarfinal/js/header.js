document.addEventListener("DOMContentLoaded", () => {
    // 選取元素
    const menuBtn = document.querySelector(".menu-btn");
    const mobileMenu = document.querySelector(".mobile-menu");
    const overlay = document.querySelector(".menu-overlay");

    // 確保元素存在才執行，避免在沒有 header 的頁面報錯
    if (menuBtn && mobileMenu && overlay) {

        // 點擊漢堡按鈕：切換選單與遮罩
        menuBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("active");
            overlay.classList.toggle("active");

            if (mobileMenu.classList.contains("active")) {
                menuBtn.textContent = "close";
            } else {
                menuBtn.textContent = "menu";
            }
        });

        // 點擊遮罩：關閉選單
        overlay.addEventListener("click", () => {
            mobileMenu.classList.remove("active");
            overlay.classList.remove("active");
            // menuBtn.textContent = "menu";
            if (mobileMenu.classList.contains("active")) {
                menuBtn.textContent = "close";
            } else {
                menuBtn.textContent = "menu";
            }
        });

        // 點擊選單內的連結：關閉選單 (優化體驗)
        const menuLinks = mobileMenu.querySelectorAll("a");
        menuLinks.forEach(link => {
            link.addEventListener("click", () => {
                mobileMenu.classList.remove("active");
                overlay.classList.remove("active");
            });
        });
    }
});
