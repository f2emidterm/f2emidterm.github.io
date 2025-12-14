
// ---- �ӫ~��� ----
const products = [
    { id: 1, name: "BLUE OCEAN HOUR STICKER", price: "$20", category: "sticker", img: "images/stk1.jpg" },
    { id: 2, name: "SUNDAY BLUSH STICKER", price: "$20", category: "sticker", img: "images/stk2.jpg" },
    { id: 3, name: "LUCKY GREEN STICKER", price: "$20", category: "sticker", img: "images/stk3.jpg" },
    { id: 4, name: "LEMON MOOD STICKER", price: "$20", category: "sticker", img: "images/stk4.jpg" },
    { id: 5, name: "STRAWBERRY VIBES STICKER", price: "$20", category: "sticker", img: "images/stk5.jpg" },
    { id: 6, name: "MONOTONE DIARY STICKER", price: "$20", category: "sticker", img: "images/stk6.jpg" },
    { id: 7, name: "APPLE FLAVOR HAIRPIN", price: "$120", category: "accessory", img: "images/acc1.png" },
    { id: 8, name: "STARFISH RING", price: "$200", category: "accessory", img: "images/acc2.png" }
];

const perPage = 8;
let currentPage = 1;
let currentCategory = "all";

function renderProducts() {
    const grid = document.querySelector(".products");
    grid.innerHTML = "";

    const filtered =
        currentCategory === "all"
            ? products
            : products.filter((p) => p.category === currentCategory);

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageItems = filtered.slice(start, end);

    // �p�G�S���ӫ~�A��� no products
    if (pageItems.length === 0) {
        const noDiv = document.createElement("div");
        noDiv.className = "no-products";
        noDiv.textContent = "No products found.";
        grid.appendChild(noDiv);
        return;
    }

    // ��V�ӫ~
    pageItems.forEach((p) => {
        const card = document.createElement("div");
        card.className = "product-card";
        const imgSrc = p.img ? p.img : "https://via.placeholder.com/200/cccccc/808080?text=No+Image";
        card.innerHTML = `
          <a href="product.html?id=${p.id}">
            <div class="product-img">
              <img src="${imgSrc}" alt="${p.name}">
            </div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price}</div>
          </a>
        `;
        grid.appendChild(card);
    });

    // �ɺ��Ѿl��l���Ǧ���
    const fillCount = perPage - pageItems.length;
    for (let i = 0; i < fillCount; i++) {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <div class="product-img" style="background-color:#f0f0f0;"></div>
          <div class="product-name">PRODUCT NAME</div>
          <div class="product-price">$0</div>
        `;
        grid.appendChild(card);
    }
}

const slides = document.querySelectorAll('.banner-imgs img');
const dots = document.querySelectorAll('.banner-dots span');
let current = 0;
let timer;

function showSlide(index) {
    slides.forEach((img, i) => {
        img.classList.toggle('active', i === index);
        dots[i].classList.toggle('active', i === index);
    });
    current = index;
}

function nextSlide() {
    let next = (current + 1) % slides.length;
    showSlide(next);
}

dots.forEach(dot => {
    dot.addEventListener('click', () => {
        clearInterval(timer);
        showSlide(Number(dot.dataset.index));
        startAutoSlide();
    });
});

function startAutoSlide() {
    timer = setInterval(nextSlide, 3000); // �C 3 ������
}

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

startAutoSlide();
renderProducts();

// ===========================================
// 商品輪播分頁邏輯 (修正為輔助滾動)
// ===========================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. 選取關鍵元素
    const productsContainer = document.querySelector(".products");
    const leftArrow = document.querySelector(".left-arrow");
    const rightArrow = document.querySelector(".right-arrow");

    // 如果找不到容器，直接結束
    if (!productsContainer) return;

    // 2. 狀態變數
    let isMobileCarouselActive = false; // 標記目前是否為手機輪播模式
    let currentPage = 0;                // 當前頁碼
    let totalPages = 0;                 // 總頁數

    // 3. 更新輪播位置的函式
    //function updateSlide() {
    //    // 只在手機模式下執行位移
    //    if (!isMobileCarouselActive) {
    //        productsContainer.style.transform = "";
    //        productsContainer.style.transition = "";
    //        return;
    //    }

    //    // 移動邏輯：頁碼 * -100%
    //    // 注意：這裡假設 .products 寬度設為 100% * 頁數 (在 CSS 中設定 display: flex; width: 200% 等)
    //    // 或者使用我們之前的 CSS 設定 (width: max-content 或 200%)
    //    productsContainer.style.transition = "transform 0.4s ease-in-out";
    //    productsContainer.style.transform = `translateX(-${currentPage * 100}%)`;
    //}
    function updateSlide() {
        if (!isMobileCarouselActive) return;

        const wrapper =
            document.querySelector(".product-carousel-wrapper");

        const pageWidth = wrapper.clientWidth;

        productsContainer.style.transition = "transform 0.4s ease";
        productsContainer.style.transform =
            `translateX(-${currentPage * pageWidth}px)`;
    }


    // 4. 初始化手機版輪播 (打包卡片)
    function initMobileCarousel() {
        // 如果已經是啟用狀態，或者沒有卡片，就不重複執行
        if (isMobileCarouselActive) return;

        // 獲取所有原始卡片
        const originalCards = Array.from(productsContainer.children);

        // 如果卡片少於等於4張，不需要輪播
        if (originalCards.length <= 4) return;

        // --- 開始打包結構 ---
        const pages = [];
        for (let i = 0; i < originalCards.length; i += 4) {
            // 建立分頁容器
            const page = document.createElement("div");
            page.className = "product-page"; // 注意：需要在 CSS 定義這個 class 的樣式

            // 這裡為了配合之前的 Flex 結構，我們給 page 設定寬度樣式 (或是寫在 CSS 裡)
            // 建議 CSS: .product-page { width: 50vw; flex-shrink: 0; ...grid settings... }

            // 將 4 張卡片放入分頁
            originalCards.slice(i, i + 4).forEach(card => page.appendChild(card));
            pages.push(page);
        }

        // 清空容器並放入分頁
        productsContainer.innerHTML = "";
        pages.forEach(page => productsContainer.appendChild(page));

        // 更新狀態
        isMobileCarouselActive = true;
        totalPages = pages.length;
        currentPage = 0; // 重置回第一頁

        // 初始化位置
        updateSlide();
    }

    // 5. 銷毀手機版輪播 (拆包卡片 -> 恢復 PC 狀態)
    function destroyMobileCarousel() {
        // 如果本來就不是啟用狀態，就不執行
        if (!isMobileCarouselActive) return;

        // 獲取所有分頁
        const pages = productsContainer.querySelectorAll(".product-page");

        // 準備一個文檔片段來暫存卡片 (效能優化)
        const fragment = document.createDocumentFragment();

        // 把卡片從分頁拿出來
        pages.forEach(page => {
            Array.from(page.children).forEach(card => {
                fragment.appendChild(card);
            });
        });

        // 清空容器並把卡片放回去
        productsContainer.innerHTML = "";
        productsContainer.appendChild(fragment);

        // 清除樣式
        productsContainer.style.transform = "";
        productsContainer.style.transition = "";

        // 更新狀態
        isMobileCarouselActive = false;
        currentPage = 0;
    }

    // 6. 檢查視窗大小並切換模式
    function checkMode() {
        // 判斷是否為手機版 (小於等於 600px)
        if (window.matchMedia("(max-width: 600px)").matches) {
            initMobileCarousel();
        } else {
            destroyMobileCarousel();
        }
    }

    // 7. 綁定箭頭事件 (點擊事件一直監聽，但內部判斷是否執行)
    if (rightArrow) {
        rightArrow.addEventListener("click", () => {
            if (!isMobileCarouselActive) return; // PC 版點擊無效
            currentPage = (currentPage + 1) % totalPages; // 循環下一頁
            updateSlide();
        });
    }

    if (leftArrow) {
        leftArrow.addEventListener("click", () => {
            if (!isMobileCarouselActive) return; // PC 版點擊無效
            // 循環上一頁邏輯
            currentPage = (currentPage - 1 + totalPages) % totalPages;
            updateSlide();
        });
    }

    // 8. 啟動監聽
    checkMode(); // 載入時先檢查一次
    window.addEventListener("resize", checkMode); // 視窗縮放時檢查
});
