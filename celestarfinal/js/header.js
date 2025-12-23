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

document.addEventListener("DOMContentLoaded", () => {

    // 搜尋功能
    const searchBtn = document.getElementById("searchBtn");
    const searchBar = document.querySelector(".search-bar");

    if (searchBtn && searchBar) {
        // 點擊搜尋 icon 切換搜尋列顯示/隱藏
        searchBtn.addEventListener("click", (e) => {
            // 阻止冒泡，避免點擊 icon 時觸發 document 的點擊事件
            e.stopPropagation(); 
            searchBar.classList.toggle("active");
        });

        // 點擊搜尋列內部不關閉
        searchBar.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        // 點擊網頁其他任何地方，關閉搜尋列
        document.addEventListener("click", () => {
            searchBar.classList.remove("active");
        });
    }
});
